import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";

export default async function RefVisitsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  const visits = await prisma.customerVisit.findMany({
    where: { companyId: company.id, refId: user.id },
    include: { customer: true, route: true },
    orderBy: { visitDate: "desc" },
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Field Customer Visits</h1>
        <p className="text-xs text-gray-500 mt-1">Logged field visits and customer outcomes</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Visit Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Visit Type</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                    No field visits logged yet.
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-purple-900">
                      {new Date(v.visitDate).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{v.customer?.name}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-600">{v.visitType}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {v.outcome}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{v.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
