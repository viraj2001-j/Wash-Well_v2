import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import OutstandingClient from "./OutstandingClient";

export default async function OutstandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      companyId: company.id,
      status: { in: ["UNPAID", "PARTIALLY_PAID"] },
    },
    include: {
      order: { include: { customer: true } },
      allocations: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return <OutstandingClient companyCode={code} companyId={company.id} initialInvoices={unpaidInvoices} />;
}
