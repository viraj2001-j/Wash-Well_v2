import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getCompanyByCode } from "@/lib/services/company";
import CustomersClient from "@/app/c/[code]/customers/CustomersClient";

export default async function RefCustomersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  // Fetch active route assignments for this Sales Rep
  const myAssignments = await prisma.dailyRouteAssignment.findMany({
    where: {
      companyId: company.id,
      refId: user.id,
    },
    select: { routeId: true },
  });

  const assignedRouteIds = Array.from(new Set(myAssignments.map((a) => a.routeId)));

  // Fetch routes assigned to this Sales Rep
  const routes = await prisma.route.findMany({
    where: {
      companyId: company.id,
      ...(assignedRouteIds.length > 0 ? { id: { in: assignedRouteIds } } : {}),
    },
  });

  // Fetch customers created by or linked to the Rep's assigned routes
  const customers = await prisma.customer.findMany({
    where: {
      companyId: company.id,
      OR: [
        { createdById: user.id },
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
      contacts: true,
      addresses: true,
      businessTypeRef: true,
      routeLinks: { include: { route: true } },
      orders: { include: { invoice: true }, take: 10 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CustomersClient
      companyCode={code}
      companyId={company.id}
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      routes={JSON.parse(JSON.stringify(routes))}
    />
  );
}
