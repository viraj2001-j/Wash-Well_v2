import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getCompanyByCode } from "@/lib/services/company";
import RefHistoryClient from "./RefHistoryClient";

import { serializeData } from "@/lib/utils/serialize";

export default async function RefHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  // Find assigned routes for this sales rep
  const repAssignments = await prisma.dailyRouteAssignment.findMany({
    where: { companyId: company.id, refId: user.id },
    select: { routeId: true },
  });
  const assignedRouteIds = repAssignments.map((a) => a.routeId);

  const [visits, orders, pickups, assignments, activities] = await Promise.all([
    prisma.customerVisit.findMany({
      where: { companyId: company.id, refId: user.id },
      include: { customer: true, route: true },
      orderBy: { visitDate: "desc" },
      take: 150,
    }),
    prisma.order.findMany({
      where: {
        companyId: company.id,
        OR: [
          { createdById: user.id },
          ...(assignedRouteIds.length > 0
            ? [
                {
                  customer: {
                    addresses: {
                      some: { routeId: { in: assignedRouteIds } },
                    },
                  },
                },
                {
                  customer: {
                    routeLinks: {
                      some: { routeId: { in: assignedRouteIds } },
                    },
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        customer: true,
        items: { include: { service: true } },
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.pickup.findMany({
      where: {
        order: {
          companyId: company.id,
          OR: [
            { createdById: user.id },
            ...(assignedRouteIds.length > 0
              ? [
                  {
                    customer: {
                      addresses: {
                        some: { routeId: { in: assignedRouteIds } },
                      },
                    },
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        order: { include: { customer: true } },
        collectedBy: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.dailyRouteAssignment.findMany({
      where: { companyId: company.id, refId: user.id },
      include: { route: true },
      orderBy: { workDate: "desc" },
      take: 100,
    }),
    prisma.activityLog.findMany({
      where: { companyId: company.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
  ]);

  return (
    <RefHistoryClient
      companyCode={code}
      userName={user.fullName}
      userRole="Route Rep"
      initialVisits={serializeData(visits)}
      initialOrders={serializeData(orders)}
      initialPickups={serializeData(pickups)}
      initialAssignments={serializeData(assignments)}
      initialActivities={serializeData(activities)}
    />
  );
}
