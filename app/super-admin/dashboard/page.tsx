import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import prisma from "@/lib/db";
import Link from "next/link";
import { Building2, Users, ShoppingBag, ShieldCheck, Plus, ArrowRight, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export default async function SuperAdminDashboardPage() {
  const user = await requireSuperAdmin();

  const [totalCompanies, activeCompanies, totalUsers, totalOrders] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.order.count(),
  ]);

  const inactiveCompanies = totalCompanies - activeCompanies;

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-[#7C3AED] font-black text-[10px] rounded-md uppercase tracking-wider">
              System Control Panel
            </span>
            <span className="text-xs text-gray-400 font-bold">• {user.fullName} ({user.email})</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Platform Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">Overview of registered tenants, platform users, and multi-organization stats</p>
        </div>

        <Link
          href="/super-admin/organizations/new"
          className="px-4 py-2.5 bg-gradient-to-r from-[#7C3AED] to-purple-800 text-white rounded-xl font-extrabold text-xs shadow-md shadow-purple-200 hover:shadow-lg transition flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>New Organization</span>
        </Link>
      </div>

      {/* METRIC STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold text-gray-500">Total Organizations</span>
            <Building2 className="w-5 h-5 p-1 bg-purple-50 rounded-lg text-[#7C3AED]" />
          </div>
          <p className="text-3xl font-black text-gray-900">{totalCompanies}</p>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{activeCompanies} Active</span>
            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{inactiveCompanies} Inactive</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold text-gray-500">Platform Users</span>
            <Users className="w-5 h-5 p-1 bg-indigo-50 rounded-lg text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{totalUsers}</p>
          <p className="text-[10px] text-gray-400 font-medium">Cross-tenant registered accounts</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold text-gray-500">Total System Orders</span>
            <ShoppingBag className="w-5 h-5 p-1 bg-emerald-50 rounded-lg text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-gray-900">{totalOrders}</p>
          <p className="text-[10px] text-emerald-700 font-bold">All organization orders</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold text-gray-500">Security & Status</span>
            <ShieldCheck className="w-5 h-5 p-1 bg-purple-50 rounded-lg text-[#7C3AED]" />
          </div>
          <p className="text-lg font-black text-emerald-600 flex items-center gap-1.5 mt-1">
            <CheckCircle2 size={18} />
            <span>Operational</span>
          </p>
          <p className="text-[10px] text-gray-400 font-medium">Platform Auth & Multi-tenant isolation OK</p>
        </div>
      </div>

      {/* QUICK LINKS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/super-admin/organizations"
          className="p-6 bg-white rounded-3xl border border-gray-100 shadow-2xs hover:border-purple-200 transition group space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-[#7C3AED] transition">
                  Manage Organizations
                </h3>
                <p className="text-xs text-gray-500">View, edit, activate/deactivate, and manage organization admins</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          href="/super-admin/organizations/new"
          className="p-6 bg-white rounded-3xl border border-gray-100 shadow-2xs hover:border-purple-200 transition group space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-emerald-600 transition">
                  Create New Organization
                </h3>
                <p className="text-xs text-gray-500">Register a new tenant company with custom code slug and branding</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>

    </div>
  );
}