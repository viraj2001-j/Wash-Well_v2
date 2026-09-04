import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import CustomerBillingClient from "./CustomerBillingClient";

export default async function CustomerBillingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/c/${code}/customer/login`);
  }

  let company = await prisma.company.findUnique({ where: { code } });
  if (!company) {
    company = await prisma.company.findFirst({ where: { isActive: true } });
  }

  if (!company) {
    redirect(`/c/${code}/customer/login`);
  }

  // Multi-Tenant Isolation Check
  const isSuperAdmin = user.roles?.some(
    ({ role }: any) =>
      role?.name?.toUpperCase() === "SUPERADMIN" &&
      role?.scope === "PLATFORM"
  );

  if (!isSuperAdmin && user.companyId && user.companyId !== company.id) {
    const userCompany = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { code: true },
    });
    if (userCompany?.code) {
      redirect(`/c/${userCompany.code}/customer/billing`);
    }
  }

  let customer = await prisma.customer.findFirst({
    where: {
      companyId: company.id,
      OR: [
        { createdById: user.id },
        user.email && user.email.includes("@") && !user.email.endsWith("@washwell.local")
          ? { email: user.email }
          : undefined,
      ].filter(Boolean) as any,
    },
    include: {
      addresses: true,
    },
  });

  const [invoices, ordersWithoutInvoice] = await Promise.all([
    customer
      ? prisma.invoice.findMany({
          where: {
            companyId: company.id,
            order: { customerId: customer.id },
          },
          include: {
            order: {
              include: {
                items: { include: { service: true } },
                customer: { include: { addresses: true } },
                payments: true,
              },
            },
            allocations: { include: { payment: true } },
            items: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [],

    customer
      ? prisma.order.findMany({
          where: {
            companyId: company.id,
            customerId: customer.id,
            invoice: { is: null },
          },
          include: {
            items: { include: { service: true } },
            customer: { include: { addresses: true } },
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  // Virtual invoice objects for orders without an explicit invoice DB row
  const virtualInvoices = ordersWithoutInvoice.map((ord) => {
    const paidVal = (ord.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const gTotal = Number(ord.grandTotal ?? (ord as any).total ?? 0);
    const balance = Math.max(0, gTotal - paidVal);

    let status = "UNPAID";
    if (paidVal >= gTotal && gTotal > 0) status = "PAID";
    else if (paidVal > 0) status = "PARTIALLY_PAID";

    return {
      id: `virtual-inv-${ord.id}`,
      invoiceNo: `INV-${ord.orderNo}`,
      subtotal: Number(ord.subtotal || 0),
      tax: Number((ord as any).tax || 0),
      discount: Number(ord.discount || 0),
      additionalCharges: Number(ord.additionalCharges || 0),
      total: gTotal,
      balance,
      paidAmount: paidVal,
      status,
      createdAt: ord.createdAt,
      dueDate: ord.createdAt,
      order: ord,
      customer: ord.customer || customer,
      items: ord.items,
      allocations: (ord.payments || []).map((p) => ({
        id: p.id,
        amount: p.amount,
        payment: p,
      })),
      isVirtual: true,
    };
  });

  const combinedInvoices = [...invoices, ...virtualInvoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <CustomerBillingClient
      companyCode={company.code || code}
      companyName={company.name}
      initialInvoices={JSON.parse(JSON.stringify(combinedInvoices))}
      customerInfo={customer ? JSON.parse(JSON.stringify(customer)) : null}
    />
  );
}
