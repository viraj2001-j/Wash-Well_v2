import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import DeliveriesClient from "../../deliveries/DeliveriesClient";
import { serializeData } from "@/lib/utils/serialize";

export default async function DriverDeliveriesPage({
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

  if (!isSuperAdminOrOrgAdmin) {
    const myAssignments = await prisma.dailyRouteAssignment.findMany({
      where: {
        companyId: company.id,
        driverId: user.id,
      },
      select: { routeId: true },
      orderBy: { workDate: "desc" },
    });
    assignedRouteIds = Array.from(new Set(myAssignments.map((a) => a.routeId)));
  }

  // Resilient route condition: check routeLinks OR customer addresses
  let routeFilterCondition = {};
  if (assignedRouteIds !== undefined && assignedRouteIds.length > 0) {
    routeFilterCondition = {
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

  const [deliveries, drivers, readyOrders] = await Promise.all([
    prisma.delivery.findMany({
      where: {
        order: {
          companyId: company.id,
          ...routeFilterCondition,
        },
      },
      include: {
        order: {
          include: {
            customer: {
              include: {
                addresses: { include: { route: true } },
                routeLinks: { include: { route: true } },
              },
            },
            items: { include: { service: true } },
            pickup: { include: { items: true } },
            invoice: { include: { allocations: true } },
            laundryLoadOrders: { include: { load: true } },
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
        roles: { some: { role: { name: "DRIVER", isActive: true } } },
      },
      select: { id: true, fullName: true, phone: true },
    }),
    prisma.order.findMany({
      where: {
        companyId: company.id,
        status: { in: ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"] },
        ...routeFilterCondition,
      },
      include: {
        customer: {
          include: {
            addresses: { include: { route: true } },
            routeLinks: { include: { route: true } },
          },
        },
        items: { include: { service: true } },
        pickup: { include: { items: true } },
        invoice: { include: { allocations: true } },
        delivery: true,
        laundryLoadOrders: { include: { load: true } },
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
