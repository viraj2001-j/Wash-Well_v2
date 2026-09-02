import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { getUserRoleType } from "@/lib/services/security";
import {
  ShoppingBag, Clock3, PackageCheck, WashingMachine, Truck, CheckCircle2,
  Users, UserPlus, Scale, WalletCards, ArrowUpRight, TrendingUp, AlertCircle
} from "lucide-react";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  const roleType = getUserRoleType(user);
  if (roleType.isRef && !roleType.isAdminOrManager) {
    redirect(`/c/${code}/ref/route`);
  }
  if (roleType.isDriver && !roleType.isAdminOrManager) {
    redirect(`/c/${code}/driver/assignment`);
  }

  // Fetch real database metrics using efficient single groupBy query
  const [
    orderCountsGroup,
    totalCustomers,
    recentOrders,
    todayAssignments,
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: { companyId: company.id },
      _count: { _all: true },
    }),
    prisma.customer.count({ where: { companyId: company.id } }),
    prisma.order.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        orderNo: true,
        grandTotal: true,
        status: true,
        customer: { select: { name: true } },
        createdBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.dailyRouteAssignment.findMany({
      where: { companyId: company.id },
      include: { route: true, ref: true, driver: true },
      orderBy: { workDate: "desc" },
      take: 4,
    }),
  ]);

  const countMap = new Map(orderCountsGroup.map((g) => [g.status, g._count._all]));
  const totalOrdersToday = Array.from(countMap.values()).reduce((a, b) => a + b, 0);
  const pendingApprovalCount = countMap.get("PENDING_APPROVAL") || 0;
  const approvedCount = countMap.get("APPROVED") || 0;
  const collectedCount = countMap.get("COLLECTED") || 0;
  const processingCount = countMap.get("PROCESSING") || 0;
  const readyCount = countMap.get("READY_FOR_DELIVERY") || 0;
  const deliveredCount = countMap.get("DELIVERED") || 0;

  const dateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Good Morning, {user.fullName} 👋</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {company.name} Command Center • {dateFormatted}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/c/${code}/orders`}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            Manage Orders
          </Link>
          <Link
            href={`/c/${code}/routes/assignments`}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            Daily Assignments
          </Link>
        </div>
      </div>

      {/* KPI SECTION: ORDERS PIPELINE */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Operational Order Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Orders */}
          <div className="bg-[#4f46e5] p-3 px-3.5 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/80">TOTAL ORDERS</span>
              <div className="w-6 h-6 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <ShoppingBag size={13} />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">{totalOrdersToday}</p>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-[#fffbeb] border border-amber-200/60 p-3 px-3.5 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#b45309]">PENDING</span>
              <div className="w-6 h-6 rounded-md bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
                <Clock3 size={13} />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">{pendingApprovalCount}</p>
            </div>
          </div>

          {/* Approved */}
          <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3 px-3.5 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#047857]">APPROVED</span>
              <div className="w-6 h-6 rounded-md bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
                <CheckCircle2 size={13} />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">{approvedCount}</p>
            </div>
          </div>

          {/* Collected */}
          <div className="bg-[#f3e8ff] border border-purple-200/50 p-3 px-3.5 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#6d28d9]">COLLECTED</span>
              <div className="w-6 h-6 rounded-md bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
                <PackageCheck size={13} />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">{collectedCount}</p>
            </div>
          </div>

          {/* Processing */}
          <div className="bg-[#eff6ff] border border-blue-200/50 p-3 px-3.5 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#1d4ed8]">PROCESSING</span>
              <div className="w-6 h-6 rounded-md bg-[#dbeafe] text-[#2563eb] flex items-center justify-center font-bold">
                <WashingMachine size={13} />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">{processingCount}</p>
            </div>
          </div>

          {/* Ready */}
          <div className="bg-[#f0fdf4] border border-teal-200/50 p-3 px-3.5 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#0f766e]">READY</span>
              <div className="w-6 h-6 rounded-md bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center font-bold">
                <Truck size={13} />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">{readyCount}</p>
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-[#ffe4e6] border border-rose-200/50 p-3 px-3.5 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#be123c]">DELIVERED</span>
              <div className="w-6 h-6 rounded-md bg-[#fecdd3] text-[#e11d48] flex items-center justify-center font-bold">
                <CheckCircle2 size={13} />
              </div>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">{deliveredCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: ORDERS & ASSIGNMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* RECENT ORDERS TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Orders Pipeline</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Live order updates from field officers & drivers</p>
            </div>
            <Link
              href={`/c/${code}/orders`}
              className="text-xs font-bold text-[#6346f6] hover:text-[#5235e5] flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Order No</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Created By</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      No orders created yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-bold text-purple-900">{ord.orderNo}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{ord.customer?.name}</td>
                      <td className="py-3 px-3 text-slate-500">{ord.createdBy?.fullName}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        LKR {Number(ord.grandTotal).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TODAY'S ROUTE ASSIGNMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Route Workers Today</h3>
              <Link href={`/c/${code}/routes/assignments`} className="text-xs font-bold text-[#6346f6] hover:text-[#5235e5]">
                Manage
              </Link>
            </div>

            <div className="space-y-2.5">
              {todayAssignments.length === 0 ? (
                <div className="text-xs text-slate-400 font-medium text-center py-6">
                  No active route assignments set for today.
                </div>
              ) : (
                todayAssignments.map((asg) => (
                  <div key={asg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">{asg.route.name} ({asg.route.code})</span>
                      <span className="text-[10px] font-extrabold text-purple-700 uppercase bg-purple-100 px-2 py-0.5 rounded-md">
                        {asg.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>REF: <strong>{asg.ref?.fullName || "Unassigned"}</strong></span>
                      <span>Driver: <strong>{asg.driver?.fullName || "Unassigned"}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <Link
              href={`/c/${code}/orders`}
              className="w-full py-2 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              <PackageCheck size={14} />
              Collected Laundry Queue ({collectedCount})
            </Link>
            <Link
              href={`/c/${code}/orders/pending`}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-200 transition cursor-pointer"
            >
              <AlertCircle size={14} />
              Review Pending Approvals ({pendingApprovalCount})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}