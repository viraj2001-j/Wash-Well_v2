import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import prisma from "@/lib/db";
import Link from "next/link";
import { Building2, Users, ShoppingBag, ShieldCheck, Plus, ArrowRight, CheckCircle2, AlertTriangle, Layers, Sparkles } from "lucide-react";

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
      
      {/* HEADER BANNER */}
      <div className="bg-white rounded-[28px] border border-[#ebe7fe] p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.08)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-[#f5f4fe] border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                SYSTEM CONTROL PANEL
              </span>
            </div>
            <span className="text-xs text-gray-400 font-semibold">• {user.fullName} ({user.email})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
            Platform <span className="text-[#6052ff] italic font-black">Dashboard</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-xl">
            Overview of registered tenants, platform users, and multi-organization operational statistics.
          </p>
        </div>

        <Link
          href="/super-admin/organizations/new"
          className="inline-flex items-center justify-center gap-2 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-xs px-6 py-3.5 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(96,82,255,0.4)] shrink-0"
        >
          <Plus size={16} />
          <span>New Organization</span>
        </Link>
      </div>

      {/* METRIC STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[28px] border border-[#ebe7fe] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Organizations</span>
            <div className="w-10 h-10 rounded-2xl bg-[#e6e2fe]/70 text-[#6052ff] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#0f172a]">{totalCompanies}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold pt-1">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {activeCompanies} Active
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              {inactiveCompanies} Inactive
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[28px] border border-[#ebe7fe] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform Users</span>
            <div className="w-10 h-10 rounded-2xl bg-[#e6e2fe]/70 text-[#6052ff] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#0f172a]">{totalUsers}</p>
          </div>
          <p className="text-xs text-gray-400 font-semibold pt-1">Cross-tenant registered accounts</p>
        </div>

        <div className="bg-white rounded-[28px] border border-[#ebe7fe] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total System Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-[#e6e2fe]/70 text-[#6052ff] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-[#0f172a]">{totalOrders}</p>
          </div>
          <p className="text-xs text-[#6052ff] font-bold pt-1">All organization laundry orders</p>
        </div>

        <div className="bg-white rounded-[28px] border border-[#ebe7fe] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Security &amp; Status</span>
            <div className="w-10 h-10 rounded-2xl bg-[#e6e2fe]/70 text-[#6052ff] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={20} />
              <span>Operational</span>
            </p>
          </div>
          <p className="text-xs text-gray-400 font-semibold pt-1">Platform Auth &amp; Multi-tenant isolation OK</p>
        </div>
      </div>

      {/* QUICK LINKS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/super-admin/organizations"
          className="bg-white rounded-[28px] border border-[#ebe7fe] p-6.5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:border-[#6052ff]/40 hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e6e2fe]/70 text-[#6052ff] flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#6052ff] group-hover:text-white transition-colors duration-300">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="font-black text-[#0f172a] text-base group-hover:text-[#6052ff] transition-colors">
                  Manage Organizations
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  View, edit, activate/deactivate, and manage organization admins
                </p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-[#6052ff] group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          href="/super-admin/organizations/new"
          className="bg-white rounded-[28px] border border-[#ebe7fe] p-6.5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:border-[#6052ff]/40 hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e6e2fe]/70 text-[#6052ff] flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#6052ff] group-hover:text-white transition-colors duration-300">
                <Plus size={22} />
              </div>
              <div>
                <h3 className="font-black text-[#0f172a] text-base group-hover:text-[#6052ff] transition-colors">
                  Create New Organization
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Register a new tenant company with custom code slug and branding
                </p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-[#6052ff] group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

    </div>
  );
}