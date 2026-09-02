import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireAdminRole } from "@/lib/auth/require-company-access";
import RoutesClient from "@/app/c/[code]/routes/RoutesClient";

export default async function RoutesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireAdminRole(company.id);

  const routes = await prisma.route.findMany({
    where: { companyId: company.id },
    include: {
      customers: { where: { isActive: true }, include: { customer: true } },
      assignments: { take: 1, orderBy: { workDate: "desc" }, include: { ref: true, driver: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <RoutesClient
      companyCode={code}
      companyId={company.id}
      initialRoutes={JSON.parse(JSON.stringify(routes))}
    />
  );
}
