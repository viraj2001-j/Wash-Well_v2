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
  Sparkles,
  ChevronDown,
  Bell,
  Layers,
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

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    OVERVIEW: true,
    "TENANT MANAGEMENT": true,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Hide sidebar on login page
  if (pathname === "/super-admin/login") {
    return null;
  }

  return (
    <>
      {/* MOBILE HAMBURGER BAR */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#241042] text-white border-b border-purple-400/20 px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/super-admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-[#1a0a33] rounded-[14px] flex items-center justify-center text-white">
              <ShieldCheck size={18} className="text-emerald-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-xs">Wash & Well</span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-extrabold uppercase rounded-md shadow-xs">
                Super Admin
              </span>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-purple-200 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition cursor-pointer"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* DESKTOP STICKY SIDEBAR WRAPPER */}
      <div
        className={`fixed top-0 left-0 z-50 flex h-screen shrink-0 font-sans transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* =====================================================
            1. DEEP ROYAL VIOLET DOCK RAIL (LITTLE SIDEBAR)
        ===================================================== */}
        <aside
          className="
            flex
            w-[52px]
            shrink-0
            flex-col
            items-center
            justify-between
            border-r
            border-purple-400/20
            bg-[#241042]
            py-4
            text-white
            shadow-lg
          "
        >
          {/* TOP LOGO & SHORTCUTS */}
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/super-admin/dashboard"
              title="Wash & Well Super Admin"
              className="
                group
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-tr
                from-purple-500
                via-indigo-500
                to-pink-500
                p-0.5
                shadow-lg
                shadow-purple-600/30
                transition-all
                duration-200
                hover:scale-105
              "
            >
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#1a0a33]">
                <ShieldCheck className="h-5 w-5 text-emerald-300 transition-transform group-hover:rotate-12" />
              </div>
            </Link>

            {/* Divider */}
            <div className="h-px w-6 bg-purple-400/20" />

            {/* Icon Utilities */}
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/super-admin/dashboard"
                title="Dashboard Overview"
                className="
                  relative
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-purple-200/80
                  transition
                  hover:bg-purple-500/25
                  hover:text-white
                "
              >
                <LayoutDashboard className="h-4.5 w-4.5" strokeWidth={1.8} />
              </Link>

              <Link
                href="/super-admin/organizations"
                title="Organizations"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-purple-200/80
                  transition
                  hover:bg-purple-500/25
                  hover:text-white
                "
              >
                <Building2 className="h-4.5 w-4.5" strokeWidth={1.8} />
              </Link>

              <Link
                href="/super-admin/organizations/new"
                title="New Organization"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  text-purple-200/80
                  transition
                  hover:bg-purple-500/25
                  hover:text-white
                "
              >
                <Plus className="h-4.5 w-4.5" strokeWidth={1.8} />
              </Link>
            </div>
          </div>

          {/* BOTTOM PROFILE & LOGOUT */}
          <div className="flex flex-col items-center gap-2.5">
            <div
              title="Super Admin Profile"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-tr
                from-purple-500
                to-indigo-500
                text-white
                font-bold
                text-xs
                shadow-md
              "
            >
              SA
            </div>

            <LogoutButton />
          </div>
        </aside>

        {/* =====================================================
            2. MAIN VIBRANT ROYAL PURPLE NAVIGATION PANEL
        ===================================================== */}
        <aside
          className={`
            relative
            flex
            h-full
            flex-col
            bg-gradient-to-b
            from-[#3a1b70]
            via-[#331663]
            to-[#290e54]
            text-white
            transition-all
            duration-300
            border-r
            border-purple-400/20
            shadow-2xl
            ${collapsed ? "w-[54px]" : "w-[240px]"}
          `}
        >
          {/* Header Bar */}
          <div
            className={`
              flex
              h-[72px]
              items-center
              border-b
              border-purple-400/20
              bg-purple-950/30
              shrink-0
              ${collapsed ? "justify-center px-2" : "justify-between px-5"}
            `}
          >
            {!collapsed ? (
              <>
                <div className="min-w-0">
                  <h1 className="font-extrabold text-base text-white tracking-tight truncate flex items-center gap-1.5">
                    <span>Wash & Well</span>
                  </h1>
                  <p className="text-[10px] font-bold text-purple-200/80 tracking-wider uppercase truncate flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    Platform Super Admin
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-lg
                    bg-white/10
                    border
                    border-white/15
                    text-purple-100
                    hover:bg-white/20
                    hover:text-white
                    transition
                    cursor-pointer
                  "
                  title="Minimize Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/15
                  border
                  border-white/20
                  text-white
                  hover:bg-white/25
                  transition
                  shadow-md
                  cursor-pointer
                "
                title="Expand Sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Section Items */}
          <div className={`flex-1 overflow-y-auto py-5 space-y-6 ${collapsed ? "px-2" : "px-4"}`}>
            {SUPER_ADMIN_NAV.map((group, groupIdx) => {
              const isOpen = openGroups[group.title] ?? true;

              return (
                <div key={group.title} className="space-y-1.5">
                  {/* Group Title Header */}
                  {!collapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      className="
                        w-full
                        flex
                        items-center
                        justify-between
                        px-2
                        py-1
                        text-[10px]
                        font-extrabold
                        tracking-widest
                        text-purple-200/70
                        uppercase
                        hover:text-white
                        transition
                        cursor-pointer
                      "
                    >
                      <span>{group.title}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          isOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>
                  ) : (
                    groupIdx > 0 && <div className="border-t border-purple-400/20 my-2 w-full" />
                  )}

                  {/* Group Links */}
                  {(isOpen || collapsed) && (
                    <div className={`space-y-1 pt-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active =
                          pathname === item.path ||
                          (item.path !== "/super-admin/dashboard" && pathname.startsWith(item.path));

                        if (collapsed) {
                          return (
                            <Link
                              key={item.path}
                              href={item.path}
                              onClick={() => setMobileOpen(false)}
                              title={item.name}
                              className={`
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl
                                transition-all
                                duration-200
                                ${
                                  active
                                    ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 text-white font-extrabold shadow-md shadow-purple-600/30 border border-white/20"
                                    : "text-purple-100/80 hover:bg-white/10 hover:text-white"
                                }
                              `}
                            >
                              <Icon
                                className={`h-5 w-5 stroke-[2] ${
                                  active ? "text-white" : "text-purple-200"
                                }`}
                              />
                            </Link>
                          );
                        }

                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`
                              group
                              flex
                              w-full
                              items-center
                              justify-between
                              px-3.5
                              py-2.5
                              rounded-xl
                              text-xs
                              font-bold
                              transition-all
                              duration-200
                              ${
                                active
                                  ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 text-white font-extrabold shadow-lg shadow-purple-600/35 border border-white/20"
                                  : "text-purple-100/90 hover:bg-white/12 hover:text-white"
                              }
                            `}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon
                                className={`h-4.5 h-4.5 shrink-0 stroke-[2] transition ${
                                  active
                                    ? "text-white"
                                    : "text-purple-200/80 group-hover:text-white"
                                }`}
                              />
                              <span className="truncate">{item.name}</span>
                            </div>

                            {active && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </>
  );
}


