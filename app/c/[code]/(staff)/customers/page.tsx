import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import CustomersClient from "./CustomersClient";

import { getCompanyByCode } from "@/lib/services/company";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const [customers, routes, businessTypes] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: company.id },
      include: {
        contacts: true,
        addresses: true,
        businessTypeRef: true,
        routeLinks: { include: { route: true } },
        orders: {
          include: { invoice: { include: { allocations: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.route.findMany({
      where: { companyId: company.id },
    }),
    prisma.businessTypeRecord.findMany({
      where: { companyId: company.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CustomersClient
      companyCode={code}
      companyId={company.id}
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      routes={JSON.parse(JSON.stringify(routes))}
      initialBusinessTypes={JSON.parse(JSON.stringify(businessTypes))}
    />
  );
}
