import SuperAdminSidebar from "./SuperAdminSidebar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased text-gray-900 selection:bg-purple-100 selection:text-purple-900">
      <SuperAdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
