import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans antialiased text-slate-900">
      <Sidebar companyCode={code} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header companyCode={code} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
