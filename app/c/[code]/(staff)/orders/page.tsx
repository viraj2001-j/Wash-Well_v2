import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getCompanyByCode } from "@/lib/services/company";
import OrdersClient from "./OrdersClient";

import { serializeData } from "@/lib/utils/serialize";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const [orders, customers, services, routes] = await Promise.all([
    prisma.order.findMany({
      where: { companyId: company.id },
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
        delivery: { include: { completedBy: true } },
        statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
        notesHistory: { include: { createdBy: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { companyId: company.id },
      select: { id: true, name: true, customerNo: true, phone: true },
    }),
    prisma.service.findMany({
      where: { companyId: company.id },
      include: { prices: { take: 1, orderBy: { effectiveFrom: "desc" } } },
    }),
    prisma.route.findMany({
      where: { companyId: company.id },
      select: { id: true, code: true, name: true },
    }),
  ]);

  return (
    <OrdersClient
      companyCode={code}
      companyId={company.id}
      initialOrders={serializeData(orders)}
      customers={serializeData(customers)}
      services={serializeData(services)}
      routes={serializeData(routes)}
    />
  );
}