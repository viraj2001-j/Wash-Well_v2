import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import AdminHistoryClient from "./AdminHistoryClient";

export default async function AdminHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const [orders, pickups, deliveries, activities] = await Promise.all([
    prisma.order.findMany({
      where: { companyId: company.id },
      include: {
        customer: {
          include: {
            addresses: true,
            routeLinks: { include: { route: true } },
          },
        },
        items: { include: { service: true } },
        pickup: { include: { items: true, collectedBy: true } },
        invoice: { include: { allocations: { include: { payment: true } } } },
        delivery: { include: { completedBy: true, createdBy: true } },
        createdBy: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pickup.findMany({
      where: { order: { companyId: company.id } },
      include: {
        order: { include: { customer: true } },
        collectedBy: true,
        items: true,
      },
      orderBy: { collectedAt: "desc" },
    }),
    prisma.delivery.findMany({
      where: { order: { companyId: company.id } },
      include: {
        order: { include: { customer: true } },
        completedBy: true,
        createdBy: true,
      },
      orderBy: { scheduledDate: "desc" },
    }),
    prisma.activityLog.findMany({
      where: { companyId: company.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <AdminHistoryClient
      companyCode={code}
      companyId={company.id}
      orders={JSON.parse(JSON.stringify(orders))}
      pickups={JSON.parse(JSON.stringify(pickups))}
      deliveries={JSON.parse(JSON.stringify(deliveries))}
      activities={JSON.parse(JSON.stringify(activities))}
    />
  );
}
