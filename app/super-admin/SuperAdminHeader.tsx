"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Building2, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import LogoutButton from "@/components/logout-button";

export default function SuperAdminHeader() {
  const pathname = usePathname();

  // Do not render top header on the login page
  if (pathname === "/super-admin/login") {
    return null;
  }

  const isOrgsActive = pathname.startsWith("/super-admin/organizations");
  const isDashboardActive = pathname === "/super-admin" || pathname === "/super-admin/dashboard";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Badge */}
        <div className="flex items-center gap-6">
          <Link href="/super-admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-purple-800 text-white flex items-center justify-center shadow-md shadow-purple-200 group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-900 text-sm tracking-tight">Wash & Well</span>
                <span className="px-2 py-0.5 bg-purple-100 text-[#7C3AED] text-[10px] font-black uppercase rounded-md tracking-wider">
                  Platform Admin
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold hidden sm:block">Global Tenant & System Control</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 ml-4">
            <Link
              href="/super-admin/organizations"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                isOrgsActive
                  ? "bg-purple-50 text-[#7C3AED] border border-purple-100"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <Building2 size={15} />
              <span>Organizations</span>
            </Link>

            <Link
              href="/super-admin/dashboard"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                isDashboardActive
                  ? "bg-purple-50 text-[#7C3AED] border border-purple-100"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <LayoutDashboard size={15} />
              <span>Overview</span>
            </Link>
          </nav>
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-gray-700">Super Admin Active</span>
          </div>

          <div className="pl-2 border-l border-gray-100 flex items-center">
            <LogoutButton />
          </div>
        </div>

      </div>
    </header>
  );
}

