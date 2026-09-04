import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import CustomerDashboardClient from "./CustomerDashboardClient";

export default async function CustomerDashboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/c/${code}/customer/login`);
  }

  let company = await prisma.company.findUnique({
    where: { code },
  });

  if (!company) {
    company = await prisma.company.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: (code || "Company").toUpperCase(),
        code: code || "default",
        isActive: true,
      },
    });
  }

  // Multi-Tenant Isolation Check: Redirect customer to their registered company dashboard if trying to access another company
  const isSuperAdmin = user.roles?.some(
    ({ role }: any) =>
      role?.name?.toUpperCase() === "SUPERADMIN" &&
      role?.scope === "PLATFORM"
  );

  if (!isSuperAdmin && user.companyId && user.companyId !== company.id) {
    const userCompany = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { code: true },
    });

    if (userCompany?.code) {
      redirect(`/c/${userCompany.code}/customer/dashboard`);
    }
  }

  // Find customer record matching logged in user for THIS company strictly by user.id or user.email
  let customer = await prisma.customer.findFirst({
    where: {
      companyId: company.id,
      OR: [
        { createdById: user.id },
        user.email && user.email.includes("@") && !user.email.endsWith("@washwell.local")
          ? { email: user.email }
          : undefined,
      ].filter(Boolean) as any,
    },
    include: {
      addresses: true,
      contacts: true,
    },
  });

  // Auto-link createdById if matched by email
  if (customer && customer.createdById !== user.id) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { createdById: user.id },
    }).catch(() => {});
  }

  if (!customer && !isSuperAdmin) {
    redirect(`/c/${code}/customer/login`);
  }

  // Fetch Customer-specific Orders
  const orders = customer
    ? await prisma.order.findMany({
        where: {
          companyId: company.id,
          customerId: customer.id,
        },
        include: {
          items: {
            include: { service: true },
          },
          payments: true,
          invoice: {
            include: { allocations: { include: { payment: true } } },
          },
          delivery: true,
          pickup: true,
          processing: true,
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Fetch Customer-specific Invoices
  const invoices = customer
    ? await prisma.invoice.findMany({
        where: {
          companyId: company.id,
          order: { customerId: customer.id },
        },
        include: {
          allocations: { include: { payment: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <CustomerDashboardClient
      companyCode={company.code || code}
      companyName={company.name}
      user={{
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      }}
      customer={customer ? JSON.parse(JSON.stringify(customer)) : null}
      initialOrders={JSON.parse(JSON.stringify(orders))}
      initialInvoices={JSON.parse(JSON.stringify(invoices))}
    />
  );
}
