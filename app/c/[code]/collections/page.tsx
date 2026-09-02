import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getUserRoleType } from "@/lib/services/security";
import CollectionsClient from "@/app/c/[code]/collections/CollectionsClient";

import { serializeData } from "@/lib/utils/serialize";

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);
  const roleType = getUserRoleType(user);

  if (!roleType.isAdminOrManager) {
    if (roleType.isRef) redirect(`/c/${code}/ref/route`);
    if (roleType.isDriver) redirect(`/c/${code}/driver/assignment`);
    redirect(`/c/${code}/dashboard`);
  }

  const [collections, ordersPendingCollection, services] = await Promise.all([
    prisma.pickup.findMany({
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
            invoice: { include: { allocations: true } },
            statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
          },
        },
        collectedBy: true,
        createdBy: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        companyId: company.id,
        status: { in: ["APPROVED", "ASSIGNED", "READY_FOR_PICKUP", "PICKUP_STARTED"] },
      },
      include: {
        customer: {
          include: {
            addresses: true,
            routeLinks: { include: { route: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.findMany({
      where: { companyId: company.id },
      include: { prices: { take: 1, orderBy: { effectiveFrom: "desc" } } },
    }),
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
