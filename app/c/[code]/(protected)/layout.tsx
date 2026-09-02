import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function ProtectedCompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  // 1. Resolve the company by code
  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  // 2. Verify base access to this company
  const user = await requireCompanyAccess(company.id);

  return (
    <div className="flex min-h-screen bg-[#F6F8FD] font-sans antialiased text-gray-900">
      {/* Sidebar (Includes dark dock + main menu) */}
      <Sidebar companyCode={code} />

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          companyName={company.name}
          companyCode={code}
          userName={user.fullName || user.email}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
