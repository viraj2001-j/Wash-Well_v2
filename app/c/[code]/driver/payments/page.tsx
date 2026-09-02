import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getCompanyByCode } from "@/lib/services/company";
import PaymentsClient from "../../payments/PaymentsClient";
import { serializeData } from "@/lib/utils/serialize";

export default async function DriverPaymentsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  // Find assigned routes for this driver
  const driverAssignments = await prisma.dailyRouteAssignment.findMany({
    where: { companyId: company.id, driverId: user.id },
    select: { routeId: true },
  });
  const assignedRouteIds = driverAssignments.map((a) => a.routeId);

  const driverFilter = {
    OR: [
      { pickup: { collectedById: user.id } },
      { delivery: { completedById: user.id } },
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

  const [payments, pendingInvoices, creditCustomers] = await Promise.all([
    prisma.payment.findMany({
      where: {
        companyId: company.id,
        OR: [
          { createdById: user.id },
          { order: driverFilter },
          {
            allocations: {
              some: {
                invoice: {
                  order: driverFilter,
                },
              },
            },
          },
        ],
      },
      include: {
        order: {
          include: {
            customer: true,
            invoice: true,
          },
        },
        createdBy: true,
        allocations: {
          include: {
            invoice: {
              include: {
                order: {
                  include: { customer: true },
                },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        order: {
          companyId: company.id,
          ...driverFilter,
        },
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      include: {
        order: {
          include: { customer: true },
        },
        allocations: {
          include: { payment: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: {
        companyId: company.id,
        OR: [
          {
            orders: {
              some: driverFilter,
            },
          },
          ...(assignedRouteIds.length > 0
            ? [
                {
                  addresses: {
                    some: { routeId: { in: assignedRouteIds } },
                  },
                },
                {
                  routeLinks: {
                    some: {
                      routeId: { in: assignedRouteIds },
                      isActive: true,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        orders: {
          where: {
            invoice: {
              status: { in: ["UNPAID", "PARTIALLY_PAID"] },
            },
          },
          include: {
            invoice: {
              include: { allocations: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PaymentsClient
      companyCode={code}
      companyId={company.id}
      initialPayments={serializeData(payments)}
      initialPendingInvoices={serializeData(pendingInvoices)}
      initialCreditCustomers={serializeData(creditCustomers)}
    />
  );
}

