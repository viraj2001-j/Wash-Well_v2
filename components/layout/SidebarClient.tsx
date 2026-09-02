// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useState } from "react";
// import {
//   Activity, BarChart3, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
//   CircleDollarSign, CreditCard, Grid2X2, History, MapPinned, PackageCheck,
//   Receipt, Route, Scale, ShieldCheck, ShoppingBag, ShoppingCart, Truck,
//   UserCog, UserRound, Users, WalletCards, WashingMachine, Clock3, Navigation,
//   Bell, Settings, HelpCircle, Moon, LogOut, LayoutDashboard, Layers, Box, DollarSign, Store, UserCheck
// } from "lucide-react";
// import { logout } from "@/lib/auth/logout";

// type NavItem = { name: string; path: string; permission?: string; icon: React.ElementType };
// type NavGroup = { title: string; items: NavItem[] };

// interface SidebarClientProps {
//   companyCode: string;
//   userName: string;
//   userRole: string;
//   roleCategory: "ADMIN_MANAGER" | "REF" | "DRIVER";
//   allowedPermissions: string[];
// }

// const ADMIN_NAV: NavGroup[] = [
//   {
//     title: "MAIN MENU",
//     items: [
//       { name: "Dashboard", path: "/dashboard", permission: "*", icon: LayoutDashboard },
//       { name: "Sales Operations", path: "/orders", permission: "orders:view", icon: ShoppingBag },
//       { name: "Inventory & Receivings", path: "/processing", permission: "processing:view", icon: Box },
//       { name: "Billing & Finance", path: "/invoices", permission: "invoices:view", icon: Receipt },
//     ],
//   },
//   {
//     title: "MANAGE & TRACKINGS",
//     items: [
//       { name: "Customer Dashboard", path: "/customers", permission: "customers:view", icon: Users },
//       { name: "Reps & Users", path: "/users", permission: "users:view", icon: UserCheck },
//       { name: "Drivers", path: "/deliveries", permission: "deliveries:view", icon: Truck },
//       { name: "Routes", path: "/routes", permission: "routes:view", icon: Route },
//       { name: "Daily Assignments", path: "/routes/assignments", permission: "assignments:view", icon: CalendarDays },
//       { name: "Collections", path: "/collections", permission: "collections:view", icon: PackageCheck },
//     ],
//   },
//   {
//     title: "MANAGEMENT",
//     items: [
//       { name: "Services & Pricing", path: "/services", permission: "services:view", icon: WashingMachine },
//       { name: "Roles & Permissions", path: "/roles", permission: "roles:view", icon: ShieldCheck },
//       { name: "Operations History", path: "/history", permission: "history:view", icon: History },
//       { name: "Reports & Analytics", path: "/reports/sales", permission: "reports:sales", icon: BarChart3 },
//       { name: "Activity Logs", path: "/history/activity", permission: "history:view", icon: Activity },
//     ],
//   },
// ];

// const REF_NAV: NavGroup[] = [
//   {
//     title: "MY WORK",
//     items: [
//       { name: "Today's Route", path: "/ref/route", icon: Navigation },
//       { name: "Customer Dashboard", path: "/ref/customers", icon: Users },
//       { name: "Customer Visits", path: "/ref/visits", icon: UserRound },
//       { name: "Orders", path: "/ref/orders", icon: ShoppingBag },
//       // { name: "Work History", path: "/ref/history", icon: History },
//     ],
//   },
//   {
//     title: "COLLECTIONS & BILLING",
//     items: [
//       { name: "Ready for Collection", path: "/ref/collections/ready", icon: Clock3 },
//       { name: "Collections", path: "/ref/collections", icon: PackageCheck },
//       { name: "My Invoices", path: "/ref/invoices", icon: Receipt },
//       { name: "My Payments", path: "/ref/payments", icon: CreditCard },
//     ],
//   },
// ];

// const DRIVER_NAV: NavGroup[] = [
//   {
//     title: "MY WORK",
//     items: [
//       { name: "Dashboard", path: "/driver/dashboard", icon: LayoutDashboard },
//       { name: "Today's Assignment", path: "/driver/assignment", icon: CalendarDays },
//       { name: "Pickup Orders", path: "/driver/pickups", icon: PackageCheck },
//       { name: "Delivery Orders", path: "/driver/deliveries", icon: Truck },
//       // { name: "Work History", path: "/driver/history", icon: History },
//     ],
//   },
//   {
//     title: "DELIVERY & BILLING",
//     items: [
//       { name: "Out for Delivery", path: "/driver/deliveries/out", icon: Truck },
//       { name: "Delivery History", path: "/driver/history", icon: History },
//       { name: "My Invoices", path: "/driver/invoices", icon: Receipt },
//     ],
//   },
// ];

// export default function SidebarClient({
//   companyCode,
//   userName,
//   userRole,
//   roleCategory,
//   allowedPermissions,
// }: SidebarClientProps) {
//   const pathname = usePathname();

//   let currentNavConfig = ADMIN_NAV;
//   if (roleCategory === "REF") currentNavConfig = REF_NAV;
//   if (roleCategory === "DRIVER") currentNavConfig = DRIVER_NAV;

//   const [collapsed, setCollapsed] = useState(false);
//   const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
//     "MAIN MENU": true,
//     "MANAGE & TRACKINGS": true,
//     MANAGEMENT: true,
//     "MY WORK": true,
//     "COLLECTIONS & BILLING": true,
//     "DELIVERY & BILLING": true,
//   });

//   const toggleGroup = (title: string) => {
//     setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
//   };

//   return (
//     <div className="flex h-screen sticky top-0 z-50 shrink-0">
//       {/* 1. DARK FAR-LEFT ICON DOCK STRIP */}
//       <aside className="w-16 bg-[#2c155a] flex flex-col items-center justify-between py-5 shrink-0 text-gray-400">
//         {/* Top Logo Icon */}
//         <div className="flex flex-col items-center gap-6">
//           <Link
//             href={`/c/${companyCode}/dashboard`}
//             className="w-10 h-10 rounded-xl bg-[#4c00b0] text-white flex items-center justify-center shadow-lg shadow-purple-900/40 hover:bg-[#6D28D9] transition"
//             title="Dashboard Home"
//           >
//             <Truck className="w-5 h-5 stroke-[2.2]" />
//           </Link>

//           {/* Top Actions */}
//           <div className="flex flex-col items-center gap-4 mt-2">
//             <button
//               type="button"
//               className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition"
//               title="Notifications"
//             >
//               <Bell className="w-5 h-5 stroke-[1.8]" />
//             </button>
//             <button
//               type="button"
//               className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition"
//               title="Settings"
//             >
//               <Settings className="w-5 h-5 stroke-[1.8]" />
//             </button>
//             <button
//               type="button"
//               className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition"
//               title="Help & Support"
//             >
//               <HelpCircle className="w-5 h-5 stroke-[1.8]" />
//             </button>
//             <button
//               type="button"
//               className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition"
//               title="Toggle Dark Mode"
//             >
//               <Moon className="w-5 h-5 stroke-[1.8]" />
//             </button>
//           </div>
//         </div>

//         {/* Bottom Actions */}
//         <div className="flex flex-col items-center gap-4">
//           <Link
//             href={`/c/${companyCode}/users`}
//             className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition"
//             title="Profile"
//           >
//             <UserCheck className="w-5 h-5 stroke-[1.8]" />
//           </Link>
//           <form action={logout}>
//             <button
//               type="submit"
//               className="p-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition"
//               title="Logout"
//             >
//               <LogOut className="w-5 h-5 stroke-[1.8]" />
//             </button>
//           </form>
//         </div>
//       </aside>

//       {/* 2. MAIN NAVIGATION PANEL (WHITE) */}
//       <aside
//         className={`relative bg-[#51398e]  flex flex-col h-full transition-all duration-300 ${
//           collapsed ? "w-16" : "w-60"
//         }`}
//       >
//         {/* Header */}
//         <div className={`h-[72px] flex items-center border-b border-gray-100 shrink-0 ${
//           collapsed ? "justify-center px-2" : "justify-between px-5"
//         }`}>
//           {!collapsed ? (
//             <>
//               <div className="text-white">
//                 <h1 className="font-extrabold text-base text-white tracking-tight">
//                   Wash & Well
//                 </h1>
//                 <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
//                   {userName} - 
//                   {userRole}
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setCollapsed(true)}
//                 className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition"
//                 title="Minimize Sidebar"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//             </>
//           ) : (
//             <button
//               type="button"
//               onClick={() => setCollapsed(false)}
//               className="w-9 h-9 rounded-xl bg-purple-50 text-[#7C3AED] hover:bg-purple-100 flex items-center justify-center transition shadow-2xs"
//               title="Expand Sidebar"
//             >
//               <ChevronRight className="w-5 h-5" />
//             </button>
//           )}
//         </div>

//         {/* Scrollable Navigation Items */}
//         <div className={`flex-1 text-white overflow-y-auto py-5 space-y-6 ${collapsed ? "px-2" : "px-4"}`}>
//           {currentNavConfig.map((group, groupIdx) => {
//             const visibleItems = group.items.filter((item) => {
//               if (!item.permission || item.permission === "*") return true;
//               return (
//                 allowedPermissions.includes("*") ||
//                 allowedPermissions.includes(item.permission)
//               );
//             });

//             if (visibleItems.length === 0) return null;
//             const isOpen = openGroups[group.title] ?? true;

//             return (
//               <div key={group.title} className="space-y-1.5">
//                 {/* Section Header */}
//                 {!collapsed ? (
//                   <button
//                     type="button"
//                     onClick={() => toggleGroup(group.title)}
//                     className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold tracking-wider text-white uppercase hover:text-gray-600 transition"
//                   >
//                     <span>{group.title}</span>
//                     <ChevronDown
//                       className={`w-3.5 h-3.5 transition-transform ${
//                         isOpen ? "rotate-0" : "-rotate-90"
//                       }`}
//                     />
//                   </button>
//                 ) : (
//                   groupIdx > 0 && <div className="border-t border-gray-100 my-2 w-full" />
//                 )}

//                 {/* Items */}
//                 {(isOpen || collapsed) && (
//                   <div className={`space-y-1 pt-1 ${collapsed ? "flex flex-col items-center" : ""}`}>
//                     {visibleItems.map((item) => {
//                       const Icon = item.icon;
//                       const itemPath = `/c/${companyCode}${item.path}`;
//                       const active =
//                         pathname === itemPath ||
//                         (item.path !== "/dashboard" &&
//                           pathname.startsWith(`${itemPath}/`));

//                       if (collapsed) {
//                         return (
//                           <Link
//                             key={item.path}
//                             href={itemPath}
//                             title={item.name}
//                             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
//                               active
//                                 ? "bg-[#F0EBFF] text-white shadow-2xs font-bold"
//                                 : "text-gray-500 hover:bg-gray-100 hover:text-white"
//                             }`}
//                           >
//                             <Icon
//                               className={`w-5 h-5 stroke-[2] ${
//                                 active ? "text-white" : "text-gray-400"
//                               }`}
//                             />
//                           </Link>
//                         );
//                       }

//                       return (
//                         <Link
//                           key={item.path}
//                           href={itemPath}
//                           className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
//                             active
//                               ? "bg-[#F0EBFF] text-[#7C3AED] shadow-2xs font-bold"
//                               : "text-white hover:bg-gray-50 hover:text-gray-900"
//                           }`}
//                         >
//                           <Icon
//                             className={`w-4 h-4 shrink-0 stroke-[2] ${
//                               active ? "text-[#7C3AED]" : "text-white"
//                             }`}
//                           />
//                           <span className="truncate">{item.name}</span>
//                         </Link>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </aside>
//     </div>
//   );
// }


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  CircleDollarSign,
  HelpCircle,
  History,
  LayoutDashboard,
  Layers,
  LogOut,
  Moon,
  Navigation,
  PackageCheck,
  Receipt,
  Route,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserCheck,
  UserRound,
  Users,
  WashingMachine,
  Box,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TYPES
========================================================= */

type NavItem = {
  name: string;
  path: string;
  permission?: string;
  icon: React.ElementType;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

interface SidebarClientProps {
  companyCode: string;
  companyName?: string;
  companyLogoUrl?: string;
  userName: string;
  userRole: string;
  roleCategory: "ADMIN_MANAGER" | "REF" | "DRIVER";
  allowedPermissions: string[];
}

/* =========================================================
   ADMIN NAVIGATION
========================================================= */

const ADMIN_NAV: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        permission: "*",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "SALES & OPERATIONS",
    items: [
      {
        name: "Sales Operations",
        path: "/orders",
        permission: "orders:view",
        icon: ShoppingBag,
      },
      {
        name: "Factory Processing",
        path: "/processing",
        permission: "processing:view",
        icon: WashingMachine,
      },
      {
        name: "Collections",
        path: "/collections",
        permission: "collections:view",
        icon: PackageCheck,
      },
    ],
  },

  {
    title: "FINANCE & BILLING",
    items: [
      {
        name: "Invoices & Billing",
        path: "/invoices",
        permission: "invoices:view",
        icon: Receipt,
      },
      {
        name: "Payments & Ledger",
        path: "/payments",
        permission: "*",
        icon: CreditCard,
      },
      {
        name: "Invoiced Payments",
        path: "/invoiced-payments",
        permission: "*",
        icon: CircleDollarSign,
      },
      {
        name: "Profit & Loss",
        path: "/pnl",
        permission: "*",
        icon: BarChart3,
      },
      {
        name: "Reports & Analytics",
        path: "/reports",
        permission: "*",
        icon: Layers,
      },
    ],
  },

  {
    title: "FLEET & LOGISTICS",
    items: [
      {
        name: "Routes & Beats",
        path: "/routes",
        permission: "routes:view",
        icon: Route,
      },
      {
        name: "Daily Assignments",
        path: "/routes/assignments",
        permission: "assignments:view",
        icon: CalendarDays,
      },
      {
        name: "Laundry Vehicle Loading",
        path: "/laundry-loading",
        permission: "deliveries:view",
        icon: PackageCheck,
      },
      {
        name: "Lorries Fleet",
        path: "/lorries",
        permission: "deliveries:view",
        icon: Truck,
      },
      {
        name: "Driver Management",
        path: "/deliveries",
        permission: "deliveries:view",
        icon: UserCheck,
      },
    ],
  },

  {
    title: "INVENTORY & CATALOG",
    items: [
      {
        name: "Products Catalog",
        path: "/products",
        permission: "products:view",
        icon: Box,
      },
      {
        name: "Goods Receiving (GRN)",
        path: "/grn",
        permission: "grn:view",
        icon: PackageCheck,
      },
      {
        name: "Lorry Loading Manifest",
        path: "/lorry-loading",
        permission: "deliveries:view",
        icon: Route,
      },
    ],
  },

  {
    title: "ADMIN & SYSTEM",
    items: [
      {
        name: "Customer Directory",
        path: "/customers",
        permission: "customers:view",
        icon: Users,
      },
      {
        name: "Reps & Staff Users",
        path: "/users",
        permission: "users:view",
        icon: UserCheck,
      },
      {
        name: "Services & Pricing",
        path: "/services",
        permission: "services:view",
        icon: WashingMachine,
      },
      {
        name: "Roles & Permissions",
        path: "/roles",
        permission: "roles:view",
        icon: ShieldCheck,
      },
      {
        name: "Operations History",
        path: "/history",
        permission: "history:view",
        icon: History,
      },
      {
        name: "Activity Logs",
        path: "/history/activity",
        permission: "history:view",
        icon: Activity,
      },
    ],
  },
];

/* =========================================================
   REF / REPRESENTATIVE NAVIGATION
========================================================= */

const REF_NAV: NavGroup[] = [
  {
    title: "MY WORK",
    items: [
      {
        name: "Today's Route",
        path: "/ref/route",
        icon: Navigation,
      },
      {
        name: "Customer Dashboard",
        path: "/ref/customers",
        icon: Users,
      },
      {
        name: "Customer Visits",
        path: "/ref/visits",
        icon: UserRound,
      },
      {
        name: "Orders",
        path: "/ref/orders",
        icon: ShoppingBag,
      },
      {
        name: "Work History",
        path: "/ref/history",
        icon: History,
      },
    ],
  },

  {
    title: "COLLECTIONS & BILLING",
    items: [
      {
        name: "Ready for Collection",
        path: "/ref/collections/ready",
        icon: Clock3,
      },
      {
        name: "Collections",
        path: "/ref/collections",
        icon: PackageCheck,
      },
      {
        name: "My Invoices",
        path: "/ref/invoices",
        icon: Receipt,
      },
      {
        name: "My Payments",
        path: "/ref/payments",
        icon: CreditCard,
      },
    ],
  },
];

/* =========================================================
   DRIVER NAVIGATION
========================================================= */

const DRIVER_NAV: NavGroup[] = [
  {
    title: "MY WORK",
    items: [
      {
        name: "Dashboard",
        path: "/driver/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Today's Assignment",
        path: "/driver/assignment",
        icon: CalendarDays,
      },
      {
        name: "Pickup Orders",
        path: "/driver/pickups",
        icon: PackageCheck,
      },
      {
        name: "Delivery Orders",
        path: "/driver/deliveries",
        icon: Truck,
      },
    ],
  },

  {
    title: "DELIVERY & BILLING",
    items: [
      {
        name: "Out for Delivery",
        path: "/driver/deliveries/out",
        icon: Truck,
      },
      {
        name: "Delivery History",
        path: "/driver/history",
        icon: History,
      },
      {
        name: "My Invoices",
        path: "/driver/invoices",
        icon: Receipt,
      },
      {
        name: "My Payments",
        path: "/driver/payments",
        icon: CreditCard,
      },
    ],
  },
];

/* =========================================================
   SIDEBAR
========================================================= */

export default function SidebarClient({
  companyCode,
  companyName,
  companyLogoUrl,
  userName,
  userRole,
  roleCategory,
  allowedPermissions,
}: SidebarClientProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Logout error", e);
    }
    window.location.href = companyCode ? `/c/${companyCode}/login` : "/login";
  };

  const [collapsed, setCollapsed] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "MAIN MENU": true,
    "MANAGE & TRACK": true,
    MANAGEMENT: true,
    "MY WORK": true,
    "COLLECTIONS & BILLING": true,
    "DELIVERY & BILLING": true,
  });

  /* =========================================================
     SELECT NAVIGATION
  ========================================================= */

  let currentNavConfig = ADMIN_NAV;

  if (roleCategory === "REF") {
    currentNavConfig = REF_NAV;
  }

  if (roleCategory === "DRIVER") {
    currentNavConfig = DRIVER_NAV;
  }

  /* =========================================================
     GROUP TOGGLE
  ========================================================= */

  const toggleGroup = (title: string) => {
    setOpenGroups((previous) => ({
      ...previous,
      [title]: !previous[title],
    }));
  };

  /* =========================================================
     ROLE LABEL
  ========================================================= */

  const roleLabel =
    roleCategory === "ADMIN_MANAGER"
      ? userRole
      : roleCategory === "REF"
        ? "Representative"
        : "Driver";

  /* =========================================================
     PERMISSION CHECK
  ========================================================= */

  const hasPermission = (item: NavItem) => {
    if (!item.permission || item.permission === "*") {
      return true;
    }

    return (
      allowedPermissions.includes("*") ||
      allowedPermissions.includes(item.permission)
    );
  };

  /* =========================================================
     INITIALS
  ========================================================= */

  const userInitial =
    userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="sticky top-0 z-50 flex h-screen shrink-0">

      {/* =====================================================
          LEFT DARK PURPLE ICON RAIL
      ===================================================== */}

      <aside
        className="
          flex
          w-[50px]
          shrink-0
          flex-col
          items-center
          justify-between
          border-r
          border-purple-400/20
          bg-[#241042]
          py-5
          text-white
        "
      >

        {/* ---------------------------------------------------
            TOP AREA
        --------------------------------------------------- */}

        <div className="flex flex-col items-center">

          {/* LOGO */}
          <Link
            href={`/c/${companyCode}/dashboard`}
            title={companyName || "Wash & Well Dashboard"}
            className="
              group
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-[#A78BFA]
              via-[#8B5CF6]
              to-[#6D28D9]
              text-white
              shadow-lg
              shadow-purple-950/50
              transition-all
              duration-200
              hover:scale-105
              hover:shadow-purple-900/70
              overflow-hidden
            "
          >
            {companyLogoUrl ? (
              // eslint-disable-next-html-extension/no-img-element
              <img
                src={companyLogoUrl}
                alt={companyName || "Company Logo"}
                className="
                  h-full
                  w-full
                  object-cover
                  rounded-2xl
                  transition-transform
                  duration-200
                  group-hover:scale-110
                "
              />
            ) : (
              <Truck
                className="
                  h-5
                  w-5
                  transition-transform
                  duration-200
                  group-hover:scale-110
                "
                strokeWidth={2.2}
              />
            )}
          </Link>

          {/* DIVIDER */}
          <div className="my-6 h-px w-7 bg-white/10" />

          {/* UTILITY BUTTONS */}
          <div className="flex flex-col items-center gap-2">

            {/* Notifications */}
            <button
              type="button"
              title="Notifications"
              className="
                group
                relative
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-violet-200/45
                transition-all
                duration-200
                hover:bg-violet-500/15
                hover:text-violet-100
              "
            >
              <Bell
                className="h-[18px] w-[18px]"
                strokeWidth={1.8}
              />

              {/* Notification Dot */}
              <span
                className="
                  absolute
                  right-[9px]
                  top-[8px]
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-violet-400
                  shadow-sm
                  shadow-violet-400
                "
              />
            </button>

            {/* Settings */}
            <button
              type="button"
              title="Settings"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-violet-200/45
                transition-all
                duration-200
                hover:bg-violet-500/15
                hover:text-violet-100
              "
            >
              <Settings
                className="h-[18px] w-[18px]"
                strokeWidth={1.8}
              />
            </button>

            {/* Help */}
            <button
              type="button"
              title="Help & Support"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-violet-200/45
                transition-all
                duration-200
                hover:bg-violet-500/15
                hover:text-violet-100
              "
            >
              <HelpCircle
                className="h-[18px] w-[18px]"
                strokeWidth={1.8}
              />
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              title="Toggle Dark Mode"
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-violet-200/45
                transition-all
                duration-200
                hover:bg-violet-500/15
                hover:text-violet-100
              "
            >
              <Moon
                className="h-[18px] w-[18px]"
                strokeWidth={1.8}
              />
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------
            BOTTOM AREA
        --------------------------------------------------- */}

        <div className="flex flex-col items-center gap-2">

          {/* Profile */}
          <Link
            href={`/c/${companyCode}/users`}
            title="Profile"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-violet-200/45
              transition-all
              duration-200
              hover:bg-violet-500/15
              hover:text-violet-100
            "
          >
            <UserCheck
              className="h-[18px] w-[18px]"
              strokeWidth={1.8}
            />
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-violet-200/45
              transition-all
              duration-200
              hover:bg-red-500/10
              hover:text-red-400
              cursor-pointer
            "
          >
            <LogOut
              className="h-[18px] w-[18px]"
              strokeWidth={1.8}
            />
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN PURPLE SIDEBAR
      ===================================================== */}

      <aside
        className={`
          relative
          flex
          h-full
          flex-col
          border-r
          border-purple-400/20
          bg-gradient-to-b
          from-[#3a1b70]
          via-[#331663]
          to-[#290e54]
          transition-all
          duration-300
          ease-in-out
          ${collapsed ? "w-[50px]" : "w-[238px]"}
        `}
      >

        {/* ===================================================
            HEADER
        =================================================== */}

        <div
          className={`
            flex
            h-[76px]
            shrink-0
            items-center
            border-b
            border-white/10
            ${
              collapsed
                ? "justify-center px-2"
                : "justify-between px-5"
            }
          `}
        >

          {!collapsed ? (
            <>
              {/* BRAND */}
              <div className="min-w-0">

                <div className="flex items-center gap-2.5">

                  {/* Brand Icon */}
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-white/10
                      text-violet-200
                      shadow-inner
                    "
                  >
                    <WashingMachine
                      className="h-[18px] w-[18px]"
                      strokeWidth={2}
                    />
                  </div>

                  {/* Brand Text */}
                  <div className="min-w-0">

                    <h1
                      className="
                        truncate
                        text-[15px]
                        font-bold
                        tracking-tight
                        text-white
                      "
                    >
                      Wash & Well
                    </h1>

                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.12em]
                        text-violet-200/60
                      "
                    >
                      {roleLabel}
                    </p>

                  </div>
                </div>
              </div>

              {/* COLLAPSE BUTTON */}
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                className="
                  ml-3
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/10
                  bg-white/5
                  text-violet-200/60
                  transition-all
                  duration-200
                  hover:bg-white/10
                  hover:text-white
                "
              >
                <ChevronLeft
                  className="h-4 w-4"
                  strokeWidth={2}
                />
              </button>
            </>
          ) : (
            /* EXPAND */
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-white/10
                text-violet-200
                transition-all
                duration-200
                hover:bg-white/15
                hover:text-white
                hover:scale-105
              "
            >
              <ChevronRight
                className="h-4 w-4"
                strokeWidth={2}
              />
            </button>
          )}
        </div>

        {/* ===================================================
            USER PROFILE CARD
        =================================================== */}

        {!collapsed && (
          <div className="px-4 pt-4">

            <div
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                border
                border-white/10
                bg-white/[0.06]
                px-3
                py-3
                shadow-inner
                backdrop-blur-sm
              "
            >

              {/* Avatar */}
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-[#C4B5FD]
                  via-[#A78BFA]
                  to-[#7C3AED]
                  text-xs
                  font-bold
                  text-white
                  shadow-lg
                  shadow-purple-950/30
                "
              >
                {userInitial}
              </div>

              {/* User Details */}
              <div className="min-w-0 flex-1">

                <p
                  className="
                    truncate
                    text-xs
                    font-bold
                    text-white
                  "
                >
                  {userName}
                </p>

                <p
                  className="
                    mt-0.5
                    truncate
                    text-[10px]
                    font-medium
                    text-violet-200/55
                  "
                >
                  {roleLabel}
                </p>
              </div>

              {/* Online */}
              <div
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-400
                  shadow-sm
                  shadow-emerald-400
                  ring-4
                  ring-emerald-400/10
                "
              />
            </div>
          </div>
        )}

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <div
          className={`
            flex-1
            overflow-y-auto
            py-5
            scrollbar-thin
            scrollbar-thumb-violet-300/20
            scrollbar-track-transparent
            ${
              collapsed
                ? "px-3"
                : "px-4"
            }
          `}
        >

          {currentNavConfig.map((group, groupIdx) => {

            /* -----------------------------------------------
               FILTER PERMISSIONS
            ----------------------------------------------- */

            const visibleItems =
              group.items.filter(hasPermission);

            if (visibleItems.length === 0) {
              return null;
            }

            const isOpen =
              openGroups[group.title] ?? true;

            return (
              <div
                key={group.title}
                className={`
                  ${groupIdx > 0 ? "mt-6" : ""}
                `}
              >

                {/* =================================================
                    GROUP HEADER
                ================================================= */}

                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="
                      mb-2
                      flex
                      w-full
                      items-center
                      justify-between
                      px-2
                      text-left
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-violet-200/45
                      transition-colors
                      hover:text-violet-100
                    "
                  >
                    <span>
                      {group.title}
                    </span>

                    <ChevronDown
                      className={`
                        h-3.5
                        w-3.5
                        transition-transform
                        duration-200
                        ${
                          isOpen
                            ? "rotate-0"
                            : "-rotate-90"
                        }
                      `}
                      strokeWidth={2}
                    />
                  </button>
                ) : (
                  <div className="mb-3 px-2">
                    <div className="h-px w-full bg-white/10" />
                  </div>
                )}

                {/* =================================================
                    ITEMS
                ================================================= */}

                {(isOpen || collapsed) && (
                  <div className="space-y-1">

                    {visibleItems.map((item) => {

                      const Icon = item.icon;

                      const itemPath =
                        `/c/${companyCode}${item.path}`;

                      const active =
                        pathname === itemPath ||
                        (
                          item.path !== "/dashboard" &&
                          pathname.startsWith(
                            `${itemPath}/`
                          )
                        );

                      /* =============================================
                         COLLAPSED ITEM
                      ============================================= */

                      if (collapsed) {
                        return (
                          <Link
                            key={item.path}
                            href={itemPath}
                            title={item.name}
                            className={`
                              group
                              relative
                              flex
                              h-11
                              w-full
                              items-center
                              justify-center
                              rounded-xl
                              transition-all
                              duration-200
                              ${
                                active
                                  ? `
                                    bg-gradient-to-br
                                    from-[#A78BFA]
                                    to-[#7C3AED]
                                    text-white
                                    shadow-lg
                                    shadow-purple-950/30
                                  `
                                  : `
                                    text-violet-200/50
                                    hover:bg-white/[0.08]
                                    hover:text-white
                                  `
                              }
                            `}
                          >
                            <Icon
                              className="h-[18px] w-[18px]"
                              strokeWidth={
                                active ? 2.2 : 1.9
                              }
                            />

                            {/* Active Side Indicator */}
                            {active && (
                              <span
                                className="
                                  absolute
                                  -right-[13px]
                                  h-5
                                  w-1
                                  rounded-l-full
                                  bg-[#A78BFA]
                                  shadow-sm
                                  shadow-violet-400
                                "
                              />
                            )}
                          </Link>
                        );
                      }

                      /* =============================================
                         EXPANDED ITEM
                      ============================================= */

                      return (
                        <Link
                          key={item.path}
                          href={itemPath}
                          className={`
                            group
                            relative
                            flex
                            w-full
                            items-center
                            gap-3
                            rounded-xl
                            px-3
                            py-2.5
                            text-xs
                            transition-all
                            duration-200
                            ${
                              active
                                ? `
                                  bg-gradient-to-r
                                  from-[#8B5CF6]
                                  to-[#7C3AED]
                                  font-bold
                                  text-white
                                  shadow-lg
                                  shadow-purple-950/20
                                `
                                : `
                                  font-medium
                                  text-violet-100/65
                                  hover:bg-white/[0.08]
                                  hover:text-white
                                `
                            }
                          `}
                        >

                          {/* ICON */}
                          <span
                            className={`
                              flex
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              transition-all
                              ${
                                active
                                  ? `
                                    bg-white/15
                                    text-white
                                  `
                                  : `
                                    bg-transparent
                                    text-violet-200/50
                                    group-hover:text-violet-100
                                  `
                              }
                            `}
                          >
                            <Icon
                              className="h-[17px] w-[17px]"
                              strokeWidth={
                                active ? 2.2 : 1.9
                              }
                            />
                          </span>

                          {/* LABEL */}
                          <span className="truncate">
                            {item.name}
                          </span>

                          {/* ACTIVE DOT */}
                          {active && (
                            <span
                              className="
                                absolute
                                right-3
                                h-1.5
                                w-1.5
                                rounded-full
                                bg-white
                                shadow-sm
                              "
                            />
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

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div
          className={`
            shrink-0
            border-t
            border-white/10
            ${
              collapsed
                ? "p-3"
                : "p-4"
            }
          `}
        >

          {!collapsed ? (
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.05]
                px-3
                py-3
              "
            >
              <div className="flex items-center gap-2">

                {/* Icon */}
                <div
                  className="
                    flex
                    h-7
                    w-7
                    items-center
                    justify-center
                    rounded-lg
                    bg-violet-500/15
                    text-violet-300
                  "
                >
                  <ShieldCheck
                    className="h-3.5 w-3.5"
                  />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">

                  <p
                    className="
                      text-[10px]
                      font-bold
                      text-violet-100
                    "
                  >
                    Secure Workspace
                  </p>

                  <p
                    className="
                      mt-0.5
                      truncate
                      text-[9px]
                      text-violet-200/40
                    "
                  >
                    Protected by Wash & Well
                  </p>
                </div>

                {/* Status */}
                <div
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-emerald-400
                  "
                />
              </div>
            </div>
          ) : (
            <div
              className="
                flex
                justify-center
                rounded-xl
                border
                border-white/10
                bg-white/[0.05]
                py-2.5
              "
            >
              <ShieldCheck
                className="
                  h-4
                  w-4
                  text-violet-300/60
                "
              />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}