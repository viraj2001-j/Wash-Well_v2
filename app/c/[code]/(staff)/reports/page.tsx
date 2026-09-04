import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getUserRoleType } from "@/lib/services/security";
import ReportsClient from "./ReportsClient";
import { serializeData } from "@/lib/utils/serialize";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);
  const roleType = getUserRoleType(user);

  // Admin & Manager access protection
  if (!roleType.isAdminOrManager) {
    if (roleType.isRef) redirect(`/c/${code}/ref/route`);
    if (roleType.isDriver) redirect(`/c/${code}/driver/assignment`);
    redirect(`/c/${code}/dashboard`);
  }

  const [invoices, orders, customers, products, routes, users] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId: company.id },
      include: {
        order: {
          include: {
            customer: {
              include: {
                routeLinks: { include: { route: true } },
                addresses: true,
              },
            },
            createdBy: true,
          },
        },
        items: true,
        allocations: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { companyId: company.id },
      include: {
        customer: {
          include: {
            routeLinks: { include: { route: true } },
          },
        },
        createdBy: true,
        pickup: { include: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { companyId: company.id },
      include: {
        routeLinks: { include: { route: true } },
        addresses: true,
        orders: true,
      },
    }),
    prisma.product.findMany({
      where: { companyId: company.id },
    }),
    prisma.route.findMany({
      where: { companyId: company.id },
      include: {
        customers: {
          include: { customer: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { companyId: company.id },
    }),
  ]);

  return (
    <ReportsClient
      companyCode={code}
      companyId={company.id}
      companyName={company.name}
      initialInvoices={serializeData(invoices)}
      initialOrders={serializeData(orders)}
      initialCustomers={serializeData(customers)}
      initialProducts={serializeData(products)}
      initialRoutes={serializeData(routes)}
      initialUsers={serializeData(users)}
    />
  );
}
