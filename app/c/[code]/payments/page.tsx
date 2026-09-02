import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getUserRoleType } from "@/lib/services/security";
import PaymentsClient from "./PaymentsClient";
import { serializeData } from "@/lib/utils/serialize";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);
  const roleType = getUserRoleType(user);

  if (!roleType.isAdminOrManager) {
    if (roleType.isRef) redirect(`/c/${code}/ref/route`);
    if (roleType.isDriver) redirect(`/c/${code}/driver/assignment`);
    redirect(`/c/${code}/dashboard`);
  }

  const [payments, pendingInvoices, creditCustomers] = await Promise.all([
    prisma.payment.findMany({
      where: { companyId: company.id },
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
        order: { companyId: company.id },
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
      where: { companyId: company.id },
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
