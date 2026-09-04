import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import DriverPickupsClient from "./DriverPickupsClient";

export default async function DriverPickupsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  const isSuperAdminOrOrgAdmin = user.roles.some((r) =>
    ["SUPERADMIN", "ORG_ADMIN", "ADMIN", "MANAGER", "COMPANY ADMIN"].includes(
      r.role.name.toUpperCase()
    ) && r.role.isActive
  );

  let assignedRouteIds: string[] | undefined = undefined;
  let assignedRoutes: any[] = [];

  if (!isSuperAdminOrOrgAdmin) {
    const myAssignments = await prisma.dailyRouteAssignment.findMany({
      where: {
        companyId: company.id,
        driverId: user.id,
      },
      include: { route: true },
      orderBy: { workDate: "desc" },
    });

    assignedRoutes = myAssignments.map((a) => a.route).filter(Boolean);
    assignedRouteIds = Array.from(new Set(myAssignments.map((a) => a.routeId)));
  }

  // Build resilient route filter condition
  let routeWhereCondition = {};
  if (assignedRouteIds !== undefined && assignedRouteIds.length > 0) {
    routeWhereCondition = {
      OR: [
        {
          customer: {
            routeLinks: {
              some: {
                routeId: { in: assignedRouteIds },
                isActive: true,
              },
            },
          },
        },
        {
          customer: {
            addresses: {
              some: {
                routeId: { in: assignedRouteIds },
              },
            },
          },
        },
      ],
    };
  }

  const pendingPickups = await prisma.order.findMany({
    where: {
      companyId: company.id,
      status: { in: ["APPROVED", "ASSIGNED", "READY_FOR_PICKUP", "PICKUP_STARTED"] },
      ...routeWhereCondition,
    },
    include: {
      customer: {
        include: {
          addresses: { include: { route: true } },
          routeLinks: { include: { route: true } },
        },
      },
      pickup: true,
      createdBy: true,
      approvedBy: true,
      items: { include: { service: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DriverPickupsClient
      companyCode={code}
      companyId={company.id}
      driverName={user.fullName}
      assignedRoutes={JSON.parse(JSON.stringify(assignedRoutes))}
      initialPickups={JSON.parse(JSON.stringify(pendingPickups))}
    />
  );
}
