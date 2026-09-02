import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getUserRoleType } from "@/lib/services/security";
import InvoicedPaymentsClient from "./InvoicedPaymentsClient";
import { serializeData } from "@/lib/utils/serialize";

export default async function InvoicedPaymentsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);
  const roleType = getUserRoleType(user);

  // Admin & Manager access protection
  if (!roleType.isAdminOrManager) {
    if (roleType.isRef) redirect(`/c/${code}/ref/route`);
    if (roleType.isDriver) redirect(`/c/${code}/driver/assignment`);
    redirect(`/c/${code}/dashboard`);
  }

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId: company.id },
      include: {
        order: {
          include: {
            customer: {
              include: {
                addresses: true,
                routeLinks: { include: { route: true } },
              },
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
    }),
    prisma.payment.findMany({
      where: { companyId: company.id },
      include: {
        order: {
          include: { customer: true },
        },
        allocations: {
          include: { invoice: true },
        },
        createdBy: true,
      },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  return (
    <InvoicedPaymentsClient
      companyCode={code}
      companyId={company.id}
      companyName={company.name}
      initialInvoices={serializeData(invoices)}
      initialPayments={serializeData(payments)}
    />
  );
}
