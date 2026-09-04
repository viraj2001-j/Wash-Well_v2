import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getUserRoleType } from "@/lib/services/security";
import PnlClient from "./PnlClient";
import { serializeData } from "@/lib/utils/serialize";

export default async function PnlPage({
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

  const [invoices, orders, routes, users, products] = await Promise.all([
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
      },
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
    prisma.product.findMany({
      where: { companyId: company.id },
    }),
  ]);

  return (
    <PnlClient
      companyCode={code}
      companyId={company.id}
      companyName={company.name}
      initialInvoices={serializeData(invoices)}
      initialOrders={serializeData(orders)}
      initialRoutes={serializeData(routes)}
      initialUsers={serializeData(users)}
      initialProducts={serializeData(products)}
    />
  );
}
