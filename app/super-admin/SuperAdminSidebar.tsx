"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  LayoutDashboard,
  Plus,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  Users,
  Settings
} from "lucide-react";
import LogoutButton from "@/components/logout-button";

type NavItem = {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const SUPER_ADMIN_NAV: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        path: "/super-admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "TENANT MANAGEMENT",
    items: [
      {
        name: "Organizations",
        path: "/super-admin/organizations",
        icon: Building2,
      },
      {
        name: "New Organization",
        path: "/super-admin/organizations/new",
        icon: Plus,
        badge: "Create",
      },
    ],
  },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide sidebar on login page
  if (pathname === "/super-admin/login") {
    return null;
  }

  return (
    <>
      {/* MOBILE HAMBURGER BAR */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/super-admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-purple-800 text-white flex items-center justify-center shadow-md shadow-purple-200">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="font-black text-gray-900 text-xs">Wash & Well</span>
            <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 text-[#7C3AED] text-[9px] font-black uppercase rounded">
              Super Admin
            </span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-100 shadow-2xs flex flex-col justify-between transition-all duration-300 font-sans ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* BRAND HEADER */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <Link href="/super-admin" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-purple-800 text-white flex items-center justify-center shadow-md shadow-purple-300 shrink-0">
              <ShieldCheck size={22} />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-gray-900 text-sm tracking-tight truncate">Wash & Well</span>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 text-[#7C3AED] text-[9px] font-black uppercase rounded-md tracking-wider">
                  Platform Admin
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-7 h-7 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl items-center justify-center transition shrink-0"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* NAVIGATION GROUPS */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-none">
          {SUPER_ADMIN_NAV.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              {!collapsed && (
                <p className="px-3 text-[10px] font-black text-gray-400 tracking-wider uppercase">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || (item.path !== "/super-admin/dashboard" && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-extrabold transition group relative ${
                        isActive
                          ? "bg-[#7C3AED] text-white shadow-md shadow-purple-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-purple-50/60"
                      }`}
                    >
                      <Icon size={18} className={`shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-[#7C3AED]"}`} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                      {!collapsed && item.badge && (
                        <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${isActive ? "bg-white/20 text-white" : "bg-purple-100 text-[#7C3AED]"}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER USER PROFILE CARD */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70 shrink-0">
          <div className="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-gray-100 shadow-2xs">
            {!collapsed && (
              <div className="truncate space-y-0.5">
                <p className="text-xs font-black text-gray-900 truncate">Platform Admin</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">System Administrator</p>
              </div>
            )}
            <div className={collapsed ? "mx-auto" : ""}>
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

