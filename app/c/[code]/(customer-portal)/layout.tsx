import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCompanyByCode } from "@/lib/services/company";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import CustomerHeader from "@/components/layout/CustomerHeader";

export default async function CustomerPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await getCompanyByCode(code);
  const user = await getCurrentUser();

  const safeCompanyCode = company?.code || code || "default";
  const safeCompanyName = company?.name || (code || "Company").toUpperCase();

  let customer =
    company?.id && user
      ? await prisma.customer.findFirst({
          where: {
            companyId: company.id,
            OR: [
              { createdById: user.id },
              user.email &&
              user.email.includes("@") &&
              !user.email.endsWith("@washwell.local")
                ? { email: user.email }
                : undefined,
            ].filter(Boolean) as any,
          },
          select: { customerNo: true, name: true },
        })
      : null;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <CustomerSidebar
        companyCode={safeCompanyCode}
        companyName={safeCompanyName}
        customerName={customer?.name || user?.fullName || "Valued Customer"}
        customerNo={customer?.customerNo || "CUST-00001"}
        customerEmail={user?.email}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <CustomerHeader
          companyCode={safeCompanyCode}
          companyName={safeCompanyName}
          customerName={customer?.name || user?.fullName || "Valued Customer"}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
