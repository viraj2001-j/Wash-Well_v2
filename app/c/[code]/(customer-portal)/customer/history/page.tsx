import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import CustomerHistoryClient from "./CustomerHistoryClient";

export default async function CustomerHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/c/${code}/customer/login`);
  }

  let company = await prisma.company.findUnique({ where: { code } });
  if (!company) {
    company = await prisma.company.findFirst({ where: { isActive: true } });
  }

  if (!company) {
    redirect(`/c/${code}/customer/login`);
  }

  // Multi-Tenant Isolation Check
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
      redirect(`/c/${userCompany.code}/customer/history`);
    }
  }

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
    },
  });

  const orders = customer
    ? await prisma.order.findMany({
        where: {
          companyId: company.id,
          customerId: customer.id,
        },
        include: {
          customer: { include: { addresses: true } },
          items: { include: { service: true } },
          pickup: { include: { items: true, collectedBy: true } },
          processing: true,
          delivery: { include: { completedBy: true } },
          payments: true,
          invoice: { include: { allocations: { include: { payment: true } } } },
          statusHistory: {
            include: { changedBy: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <CustomerHistoryClient
      companyCode={company.code || code}
      companyName={company.name}
      customerInfo={customer ? JSON.parse(JSON.stringify(customer)) : null}
      initialOrders={JSON.parse(JSON.stringify(orders))}
    />
  );
}

