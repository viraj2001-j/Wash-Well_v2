"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  CalendarPlus,
  MapPin,
  FileText,
  User,
  LogOut,
  Sparkles,
  WashingMachine,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CustomerSidebarProps {
  companyCode: string;
  companyName?: string;
  customerName: string;
  customerNo?: string;
  customerEmail?: string;
}

export default function CustomerSidebar({
  companyCode,
  companyName = "Wash & Well",
  customerName,
  customerNo = "CUST-00001",
}: CustomerSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Check if current customer is a REP OTP customer (no logout button for REP customers)
  const [isRepOtpCustomer, setIsRepOtpCustomer] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/customer_auth_type=([^;]+)/);
      if (match && match[1] === "REP_OTP") {
        setIsRepOtpCustomer(true);
      }
    }
  }, []);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "CUSTOMER AREA": true,
    "ACCOUNT & CARE": true,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "customer_auth_type=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = `/c/${companyCode}/customer/login`;
  };

  const navGroups = [
    {
      title: "CUSTOMER AREA",
      items: [
        {
          name: "Dashboard",
          path: `/c/${companyCode}/customer/dashboard`,
          icon: LayoutDashboard,
        },
        {
          name: "My Orders & Tracking",
          path: `/c/${companyCode}/customer/orders`,
          icon: Package,
        },
        {
          name: "Order Process History",
          path: `/c/${companyCode}/customer/history`,
          icon: History,
        },
        {
          name: "Schedule Pickup",
          path: `/c/${companyCode}/customer/pickup`,
          icon: CalendarPlus,
        },
      ],
    },
    {
      title: "ACCOUNT & CARE",
      items: [
        {
          name: "Delivery Addresses",
          path: `/c/${companyCode}/customer/addresses`,
          icon: MapPin,
        },
        {
          name: "Billing & Invoices",
          path: `/c/${companyCode}/customer/billing`,
          icon: FileText,
        },
        {
          name: "Account Profile",
          path: `/c/${companyCode}/customer/profile`,
          icon: User,
        },
      ],
    },
  ];

  const userInitial = customerName?.trim()?.charAt(0)?.toUpperCase() || "C";

  return (
    <div className="sticky top-0 z-50 flex h-screen shrink-0 font-sans">
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
          {/* Vibrant Logo Badge */}
          <Link
            href={`/c/${companyCode}/customer/dashboard`}
            title={`${companyName} Customer Portal`}
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
              <WashingMachine className="h-5 w-5 text-emerald-300 transition-transform group-hover:rotate-12" />
            </div>
          </Link>

          {/* Divider */}
          <div className="h-px w-6 bg-purple-400/20" />

          {/* Icon Utilities */}
          <div className="flex flex-col items-center gap-2">
            <Link
              href={`/c/${companyCode}/customer/orders`}
              title="Track Orders"
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
              <Bell className="h-4.5 w-4.5" strokeWidth={1.8} />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm" />
            </Link>

            <Link
              href={`/c/${companyCode}/customer/history`}
              title="Order Process History"
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
              <History className="h-4.5 w-4.5" strokeWidth={1.8} />
            </Link>

            <Link
              href={`/c/${companyCode}/customer/addresses`}
              title="Saved Addresses"
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
              <MapPin className="h-4.5 w-4.5" strokeWidth={1.8} />
            </Link>

            <Link
              href={`/c/${companyCode}/customer/pickup`}
              title="Schedule Pickup"
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
              <CalendarPlus className="h-4.5 w-4.5" strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        {/* BOTTOM AREA: PROFILE & LOGOUT (LOGOUT HIDDEN FOR REP OTP CUSTOMERS) */}
        <div className="flex flex-col items-center gap-2.5">
          <Link
            href={`/c/${companyCode}/customer/profile`}
            title="My Profile"
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
              hover:scale-105
              transition
            "
          >
            {userInitial}
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-purple-200/60
              transition
              hover:bg-rose-500/20
              hover:text-rose-300
              cursor-pointer
            "
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={1.8} />
          </button>
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
                  <span>{companyName}</span>
                </h1>
                <p className="text-[10px] font-bold text-purple-200/80 tracking-wider uppercase truncate flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  {customerName} • {customerNo}
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
              "
              title="Expand Sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section Items */}
        <div className={`flex-1 overflow-y-auto py-5 space-y-6 ${collapsed ? "px-2" : "px-4"}`}>
          {navGroups.map((group, groupIdx) => {
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
                        (item.path !== `/c/${companyCode}/customer/dashboard` &&
                          pathname.startsWith(`${item.path}/`));

                      if (collapsed) {
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
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
  );
}
