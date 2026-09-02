import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import OrdersClient from "@/app/c/[code]/orders/OrdersClient";

export default async function PendingOrdersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const [pendingOrders, customers, services, routes] = await Promise.all([
    prisma.order.findMany({
      where: { companyId: company.id, status: "PENDING_APPROVAL" },
      include: {
        customer: true,
        createdBy: true,
        approvedBy: true,
        items: { include: { service: true } },
        statusHistory: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ where: { companyId: company.id } }),
    prisma.service.findMany({ where: { companyId: company.id } }),
    prisma.route.findMany({ where: { companyId: company.id } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mx-6 mt-6 flex items-center justify-between text-amber-900 text-xs">
        <div>
          <h2 className="font-bold text-sm">Pending Orders Approval Queue</h2>
          <p className="text-amber-700 mt-0.5">Orders submitted by REF field officers awaiting operational approval</p>
        </div>
        <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded-xl text-xs">
          {pendingOrders.length} Pending
        </span>
      </div>

      <OrdersClient
        companyCode={code}
        companyId={company.id}
        initialOrders={JSON.parse(JSON.stringify(pendingOrders))}
        customers={JSON.parse(JSON.stringify(customers))}
        services={JSON.parse(JSON.stringify(services))}
        routes={JSON.parse(JSON.stringify(routes))}
      />
    </div>
  );
}
