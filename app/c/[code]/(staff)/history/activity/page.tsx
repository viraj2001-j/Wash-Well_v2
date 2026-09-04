import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { Activity, Clock, User, Shield } from "lucide-react";

export default async function ActivityHistoryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const activities = await prisma.activityLog.findMany({
    where: { companyId: company.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Organization Activity Audit History</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Audit log of all critical business & operational events</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                activities.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                      {new Date(act.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {act.user?.fullName || "System"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {act.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-medium">{act.entityType}</td>
                    <td className="py-3.5 px-4 text-gray-700">{act.description || "-"}</td>
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
