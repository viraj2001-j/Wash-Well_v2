import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import CustomerOrdersClient from "./CustomerOrdersClient";

export default async function CustomerOrdersPage({
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
      redirect(`/c/${userCompany.code}/customer/orders`);
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
  });

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
          statusHistory: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <CustomerOrdersClient
      companyCode={company.code || code}
      initialOrders={JSON.parse(JSON.stringify(orders))}
    />
  );
}
