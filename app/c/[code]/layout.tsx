import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCompanyByCode } from "@/lib/services/company";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CustomerSidebar from "@/components/layout/CustomerSidebar";
import CustomerHeader from "@/components/layout/CustomerHeader";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const headersList = await headers();
  const rawPathname =
    headersList.get("x-[#pathname]") ||
    headersList.get("x-pathname") ||
    headersList.get("next-url") ||
    headersList.get("referer") ||
    "";

  // Check if current route is an auth page (login, signup, set-password)
  const isAuthPage =
    rawPathname.includes("/customer/login") ||
    rawPathname.includes("/customer/signup") ||
    rawPathname.endsWith("/login") ||
    rawPathname.endsWith("/set-password");

  // 1. Resolve the company by code or fallback to default
  let company: any = null;

  try {
    if (code) {
      company = await getCompanyByCode(code);
    }
  } catch (e) {
    console.error("Error resolving company by code:", e);
  }

  if (!company) {
    try {
      company = await prisma.company.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    } catch (e) {
      console.error("Error resolving fallback company:", e);
    }
  }

  if (!company) {
    company = {
      id: "default",
      code: code || "default",
      name: (code || "Company").toUpperCase(),
    } as any;
  }

  const safeCompanyCode = company?.code || code || "default";
  const safeCompanyName = company?.name || (code || "Company").toUpperCase();

  // 2. Fetch current logged in user (if any)
  const user = await getCurrentUser();

  // Check if current route is public homepage or auth page
  const cleanPath = rawPathname.split("?")[0].replace(/\/$/, "");
  const isHomepage =
    cleanPath === `/c/${code}` ||
    cleanPath === `/c/${safeCompanyCode}` ||
    cleanPath.endsWith(`/c/${code}`) ||
    cleanPath.endsWith(`/c/${safeCompanyCode}`);

  // If on an auth page or public company homepage, render standalone children without layout shell
  if (isAuthPage || isHomepage) {
    return <>{children}</>;
  }

  // Check if current user is a customer or accessing a customer route
  const isCustomerUser =
    user?.roles?.some(
      (r: any) =>
        r.role?.code === "CUSTOMER" ||
        r.role?.name?.toUpperCase() === "CUSTOMER"
    ) || false;

  const isCustomerRoute =
    rawPathname.includes("/customer") || isCustomerUser;

  // If no user logged in, let child pages handle redirection to login
  if (!user) {
    return <>{children}</>;
  }

  // 3. Render Customer Layout for Customer Portal routes or Customer role users
  if (isCustomerRoute) {
    let customer = company?.id && user
      ? await prisma.customer.findFirst({
          where: {
            companyId: company.id,
            OR: [
              { createdById: user.id },
              user.email && user.email.includes("@") && !user.email.endsWith("@washwell.local")
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
          customerName={customer?.name || user.fullName || "Valued Customer"}
          customerNo={customer?.customerNo || "CUST-00001"}
          customerEmail={user.email}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <CustomerHeader
            companyCode={safeCompanyCode}
            companyName={safeCompanyName}
            customerName={customer?.name || user.fullName || "Valued Customer"}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // 4. Default Staff / Rep / Admin Layout
  return (
    <div className="flex min-h-screen bg-slate-100 font-sans antialiased text-slate-900">
      <Sidebar companyCode={safeCompanyCode} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header companyCode={safeCompanyCode} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}