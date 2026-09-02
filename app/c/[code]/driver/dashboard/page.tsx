import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import DriverDashboardClient from "@/app/c/[code]/driver/dashboard/DriverDashboardClient";

export default async function DriverDashboardPage({
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let assignedRouteIds: string[] | undefined = undefined;

  if (!isSuperAdminOrOrgAdmin) {
    const myAssignmentsRaw = await prisma.dailyRouteAssignment.findMany({
      where: {
        companyId: company.id,
        driverId: user.id,
        status: { in: ["ACTIVE", "PLANNED"] },
      },
      include: { route: true },
    });

    const activeAssignments = myAssignmentsRaw.filter((asg) => {
      const checkDate = asg.endDate || asg.route?.endDate || asg.workDate;
      if (!checkDate) return true;
      const d = new Date(checkDate);
      d.setHours(23, 59, 59, 999);
      return d >= today;
    });

    assignedRouteIds = Array.from(new Set(activeAssignments.map((a) => a.routeId)));
  }

  const routeFilterCondition = assignedRouteIds !== undefined ? {
    customer: {
      routeLinks: {
        some: {
          routeId: { in: assignedRouteIds },
          isActive: true,
        },
      },
    },
  } : {};

  const activeDriverAssignments = await prisma.dailyRouteAssignment.findMany({
    where: {
      companyId: company.id,
      driverId: user.id,
      status: { in: ["ACTIVE", "PLANNED"] },
    },
    include: {
      route: {
        include: {
          customers: { where: { isActive: true }, include: { customer: true } },
        },
      },
    },
    orderBy: { workDate: "desc" },
  });

  const todayAssignment = activeDriverAssignments.find((asg) => {
    const checkDate = asg.endDate || asg.route?.endDate || asg.workDate;
    if (!checkDate) return true;
    const d = new Date(checkDate);
    d.setHours(23, 59, 59, 999);
    return d >= today;
  }) || null;

  const [
    pickupsPending,
    deliveriesPending,
    pickupsHistory,
    deliveriesHistory,
    activityLogs,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        companyId: company.id,
        status: { in: ["APPROVED", "ASSIGNED", "READY_FOR_PICKUP", "PICKUP_STARTED"] },
        ...routeFilterCondition,
      },
    }),
    prisma.order.count({
      where: {
        companyId: company.id,
        status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"] },
        ...routeFilterCondition,
      },
    }),
    // Driver Pickups Work History
    prisma.pickup.findMany({
      where: {
        order: { companyId: company.id },
        collectedById: user.id,
      },
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
        items: true,
        collectedBy: true,
      },
      orderBy: { collectedAt: "desc" },
      take: 50,
    }),
    // Driver Deliveries Work History
    prisma.delivery.findMany({
      where: {
        order: { companyId: company.id },
        completedById: user.id,
      },
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
        items: true,
        completedBy: true,
      },
      orderBy: { deliveredAt: "desc" },
      take: 50,
    }),
    // Driver Operational Activity Logs
    prisma.activityLog.findMany({
      where: {
        companyId: company.id,
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <DriverDashboardClient
      companyCode={code}
      driverName={user.fullName}
      todayRouteName={todayAssignment?.route?.name}
      todayRouteCode={todayAssignment?.route?.code}
      todayStops={JSON.parse(JSON.stringify(todayAssignment?.route?.customers || []))}
      pickupsPending={pickupsPending}
      deliveriesPending={deliveriesPending}
      pickupsHistory={JSON.parse(JSON.stringify(pickupsHistory))}
      deliveriesHistory={JSON.parse(JSON.stringify(deliveriesHistory))}
      activityLogs={JSON.parse(JSON.stringify(activityLogs))}
    />
  );
}
