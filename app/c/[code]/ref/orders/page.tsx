import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import OrdersClient from "@/app/c/[code]/orders/OrdersClient";

import { serializeData } from "@/lib/utils/serialize";

export default async function RefOrdersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  const [myOrders, customers, services, routes] = await Promise.all([
    prisma.order.findMany({
      where: { companyId: company.id, createdById: user.id },
      include: {
        customer: {
          include: {
            addresses: true,
            routeLinks: { include: { route: true } },
          },
        },
        createdBy: true,
        approvedBy: true,
        items: { include: { service: true } },
        pickup: { include: { collectedBy: true } },
        invoice: { include: { allocations: true } },
        statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
        notesHistory: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ where: { companyId: company.id } }),
    prisma.service.findMany({ where: { companyId: company.id } }),
    prisma.route.findMany({ where: { companyId: company.id } }),
  ]);

  return (
    <OrdersClient
      companyCode={code}
      companyId={company.id}
      initialOrders={serializeData(myOrders)}
      customers={serializeData(customers)}
      services={serializeData(services)}
      routes={serializeData(routes)}
    />
  );
}
