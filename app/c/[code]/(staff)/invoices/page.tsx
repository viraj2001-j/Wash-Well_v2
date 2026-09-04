import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getCompanyByCode } from "@/lib/services/company";
import { getUserRoleType } from "@/lib/services/security";
import InvoicesClient from "./InvoicesClient";
import { serializeData } from "@/lib/utils/serialize";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);
  const roleType = getUserRoleType(user);

  // Strictly enforce Admin/Manager access only
  if (!roleType.isAdminOrManager) {
    if (roleType.isRef) redirect(`/c/${code}/ref/route`);
    if (roleType.isDriver) redirect(`/c/${code}/driver/assignment`);
    redirect(`/c/${code}/dashboard`);
  }

  const invoices = await prisma.invoice.findMany({
    where: { companyId: company.id },
    include: {
      order: {
        include: {
          customer: {
            include: {
              addresses: true,
              routeLinks: {
                include: { route: true },
              },
            },
          },
          createdBy: true,
          pickup: {
            include: { items: true },
          },
        },
      },
      items: true,
      allocations: {
        include: {
          payment: {
            include: { createdBy: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <InvoicesClient
      companyCode={code}
      companyId={company.id}
      companyName={company.name}
      initialInvoices={serializeData(invoices)}
    />
  );
}
