import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getCompanyByCode } from "@/lib/services/company";
import InvoicesClient from "../../invoices/InvoicesClient";

export default async function RefInvoicesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  // Find routes assigned to this rep today or historically
  const repAssignments = await prisma.dailyRouteAssignment.findMany({
    where: { companyId: company.id, refId: user.id },
    select: { routeId: true },
  });
  const assignedRouteIds = repAssignments.map((a) => a.routeId);

  const invoices = await prisma.invoice.findMany({
    where: {
      companyId: company.id,
      OR: [
        { order: { createdById: user.id } },
        ...(assignedRouteIds.length > 0
          ? [
              {
                order: {
                  customer: {
                    addresses: {
                      some: { routeId: { in: assignedRouteIds } },
                    },
                  },
                },
              },
              {
                order: {
                  customer: {
                    routeLinks: {
                      some: { routeId: { in: assignedRouteIds } },
                    },
                  },
                },
              },
            ]
          : []),
      ],
    },
    include: {
      order: { include: { customer: true, createdBy: true } },
      items: true,
      allocations: { include: { payment: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <InvoicesClient
      companyCode={code}
      companyId={company.id}
      companyName={company.name}
      initialInvoices={JSON.parse(JSON.stringify(invoices))}
    />
  );
}
