import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import DeliveriesClient from "./DeliveriesClient";

import { serializeData } from "@/lib/utils/serialize";

export default async function DeliveriesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const [deliveries, drivers, readyOrders] = await Promise.all([
    prisma.delivery.findMany({
      where: { order: { companyId: company.id } },
      include: {
        order: {
          include: {
            customer: {
              include: {
                addresses: true,
                routeLinks: { include: { route: true } },
              },
            },
            items: { include: { service: true } },
            pickup: { include: { items: true } },
            invoice: { include: { allocations: { include: { payment: true } } } },
          },
        },
        createdBy: true,
        completedBy: true,
      },
      orderBy: { scheduledDate: "desc" },
    }),
    prisma.user.findMany({
      where: {
        companyId: company.id,
        roles: {
          some: { role: { name: "DRIVER", isActive: true } },
        },
      },
      select: { id: true, fullName: true, phone: true },
    }),
    prisma.order.findMany({
      where: {
        companyId: company.id,
        status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"] },
      },
      include: {
        customer: {
          include: {
            addresses: true,
            routeLinks: { include: { route: true } },
          },
        },
        items: { include: { service: true } },
        pickup: { include: { items: true } },
        invoice: { include: { allocations: { include: { payment: true } } } },
        delivery: { include: { completedBy: true, createdBy: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <DeliveriesClient
      companyCode={code}
      companyId={company.id}
      initialDeliveries={serializeData(deliveries)}
      drivers={serializeData(drivers)}
      readyOrders={serializeData(readyOrders)}
    />
  );
}
