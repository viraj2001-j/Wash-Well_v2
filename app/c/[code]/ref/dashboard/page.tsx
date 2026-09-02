import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import { Navigation, Users, UserCheck, ShoppingBag, Plus, Clock, CheckCircle2 } from "lucide-react";

export default async function RefDashboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  const user = await requireCompanyAccess(company.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeRefAssignments = await prisma.dailyRouteAssignment.findMany({
    where: {
      companyId: company.id,
      refId: user.id,
      status: { in: ["ACTIVE", "PLANNED"] },
    },
    include: {
      route: {
        include: {
          customers: { where: { isActive: true }, include: { customer: true } },
        },
      },
    },
    orderBy: { workDate: "desc" },
  });

  const todayAssignment = activeRefAssignments.find((asg) => {
    const checkDate = asg.endDate || asg.route?.endDate || asg.workDate;
    if (!checkDate) return true;
    const d = new Date(checkDate);
    d.setHours(23, 59, 59, 999);
    return d >= today;
  }) || null;

  const [totalCustomers, myVisitsToday, myOrdersToday] = await Promise.all([
    prisma.customer.count({ where: { companyId: company.id } }),
    prisma.customerVisit.count({
      where: { companyId: company.id, refId: user.id },
    }),
    prisma.order.count({
      where: { companyId: company.id, createdById: user.id },
    }),
  ]);

  const assignedRouteCustomers = todayAssignment?.route?.customers || [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#503B91] to-[#6C4ED8] p-6 rounded-3xl text-white shadow-xl space-y-3">
        <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Field Executive Workspace</span>
        <h1 className="text-2xl md:text-3xl font-bold">Good Morning, {user.fullName} 👋</h1>
        <p className="text-xs text-purple-100 flex items-center gap-1.5">
          <Navigation size={14} /> Assigned Route Today: <strong>{todayAssignment?.route?.name || "No Route Assigned"} ({todayAssignment?.route?.code || "-"})</strong>
        </p>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-400">Route Customers</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{assignedRouteCustomers.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-xs font-semibold text-purple-700">Visits Completed</span>
          <p className="text-2xl font-bold text-purple-900 mt-1">{myVisitsToday}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700">Orders Placed</span>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{myOrdersToday}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
          <span className="text-xs font-semibold text-blue-700">Total System Customers</span>
          <p className="text-2xl font-bold text-blue-900 mt-1">{totalCustomers}</p>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-3">
        <Link
          href={`/c/${code}/ref/route`}
          className="px-4 py-2.5 bg-[#6C4ED8] hover:bg-[#503B91] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
        >
          <Navigation size={15} /> Start Today's Route
        </Link>
        <Link
          href={`/c/${code}/ref/customers`}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-2"
        >
          <Users size={15} /> My Customers
        </Link>
        <Link
          href={`/c/${code}/ref/visits`}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-2"
        >
          <UserCheck size={15} /> Record Visit Outcome
        </Link>
        <Link
          href={`/c/${code}/ref/history`}
          className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-bold rounded-xl flex items-center gap-2 border border-purple-200"
        >
          <Clock size={15} /> My Work History
        </Link>
      </div>
    </div>
  );
}
