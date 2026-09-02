import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import DriverHistoryClient from "./DriverHistoryClient";

export default async function DriverHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  const [pickupsHistory, deliveriesHistory, activityLogs] = await Promise.all([
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
    }),
    // Driver Activity Logs
    prisma.activityLog.findMany({
      where: {
        companyId: company.id,
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <DriverHistoryClient
      companyCode={code}
      driverName={user.fullName}
      pickupsHistory={JSON.parse(JSON.stringify(pickupsHistory))}
      deliveriesHistory={JSON.parse(JSON.stringify(deliveriesHistory))}
      activityLogs={JSON.parse(JSON.stringify(activityLogs))}
    />
  );
}
