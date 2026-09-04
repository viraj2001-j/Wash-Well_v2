import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getCompanyByCode } from "@/lib/services/company";
import CollectionsClient from "../../collections/CollectionsClient";

import { serializeData } from "@/lib/utils/serialize";

export default async function RefCollectionsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  // Find assigned routes for this rep
  const repAssignments = await prisma.dailyRouteAssignment.findMany({
    where: { companyId: company.id, refId: user.id },
    select: { routeId: true },
  });
  const assignedRouteIds = repAssignments.map((a) => a.routeId);

  const repFilter = {
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
  };

  const [collections, ordersPendingCollection, services] = await Promise.all([
    prisma.pickup.findMany({
      where: {
        order: {
          companyId: company.id,
          ...repFilter,
        },
      },
      include: {
        order: {
          include: {
            customer: true,
            invoice: { include: { allocations: true } },
          },
        },
        collectedBy: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        companyId: company.id,
        status: { in: ["APPROVED", "ASSIGNED", "READY_FOR_PICKUP", "PICKUP_STARTED"] },
        ...repFilter,
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.findMany({ where: { companyId: company.id } }),
  ]);

  return (
    <CollectionsClient
      companyCode={code}
      companyId={company.id}
      initialCollections={serializeData(collections)}
      ordersPendingCollection={serializeData(ordersPendingCollection)}
      services={serializeData(services)}
    />
  );
}
