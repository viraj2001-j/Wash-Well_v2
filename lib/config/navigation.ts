import {
  LayoutDashboard,
  ShoppingBag,
  Clock3,
  PackageCheck,
  WashingMachine,
  Truck,
  Users,
  UserRound,
  History,
  Route,
  MapPinned,
  CalendarDays,
  Receipt,
  CreditCard,
  CircleDollarSign,
  ClipboardList,
  Settings2,
  UserCog,
  ShieldCheck,
  BarChart3,
  ShoppingCart,
  Scale,
  UserCheck,
  RouteIcon,
  WalletCards,
  Activity,
} from "lucide-react";

export type NavItem = {
  name: string;
  path: string;
  permission: string;
  icon: React.ElementType;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const SIDEBAR_NAV: NavGroup[] = [
  {
    title: "OPERATIONS",
    items: [
      {
        name: "Orders",
        path: "/orders",
        permission: "orders:view",
        icon: ShoppingBag,
      },
      {
        name: "Pending Approval",
        path: "/orders/pending",
        permission: "orders:approve",
        icon: Clock3,
      },
      {
        name: "Collections",
        path: "/collections",
        permission: "collections:view",
        icon: PackageCheck,
      },
      {
        name: "Laundry Processing",
        path: "/processing",
        permission: "processing:view",
        icon: WashingMachine,
      },
      {
        name: "Deliveries",
        path: "/deliveries",
        permission: "deliveries:view",
        icon: Truck,
      },
    ],
  },

  {
    title: "CUSTOMERS",
    items: [
      {
        name: "Customers",
        path: "/customers",
        permission: "customers:view",
        icon: Users,
      },
      {
        name: "Customer Visits",
        path: "/customers/visits",
        permission: "customers:visits:view",
        icon: UserRound,
      },
      {
        name: "Customer History",
        path: "/customers/history",
        permission: "customers:history:view",
        icon: History,
      },
    ],
  },

  {
    title: "ROUTES",
    items: [
      {
        name: "Routes",
        path: "/routes",
        permission: "routes:view",
        icon: Route,
      },
      {
        name: "Route Customers",
        path: "/routes/customers",
        permission: "routes:manage",
        icon: MapPinned,
      },
      {
        name: "Daily Assignments",
        path: "/routes/assignments",
        permission: "assignments:view",
        icon: CalendarDays,
      },
    ],
  },

  {
    title: "BILLING",
    items: [
      {
        name: "Invoices",
        path: "/invoices",
        permission: "invoices:view",
        icon: Receipt,
      },
      {
        name: "Payments",
        path: "/payments",
        permission: "payments:view",
        icon: CreditCard,
      },
      {
        name: "Outstanding",
        path: "/billing/outstanding",
        permission: "billing:outstanding:view",
        icon: CircleDollarSign,
      },
      {
        name: "Payment History",
        path: "/billing/history",
        permission: "billing:history:view",
        icon: History,
      },
    ],
  },

  {
    title: "MANAGEMENT",
    items: [
      {
        name: "Services",
        path: "/services",
        permission: "services:view",
        icon: WashingMachine,
      },
      {
        name: "Pricing",
        path: "/pricing",
        permission: "pricing:view",
        icon: WalletCards,
      },
      {
        name: "Users",
        path: "/users",
        permission: "users:view",
        icon: UserCog,
      },
      {
        name: "Roles & Permissions",
        path: "/roles",
        permission: "roles:view",
        icon: ShieldCheck,
      },
    ],
  },

  {
    title: "REPORTS",
    items: [
      {
        name: "Sales",
        path: "/reports/sales",
        permission: "reports:sales",
        icon: BarChart3,
      },
      {
        name: "Orders",
        path: "/reports/orders",
        permission: "reports:orders",
        icon: ShoppingCart,
      },
      {
        name: "KG",
        path: "/reports/kg",
        permission: "reports:kg",
        icon: Scale,
      },
      {
        name: "REF Performance",
        path: "/reports/ref",
        permission: "reports:performance",
        icon: UserCheck,
      },
      {
        name: "Driver Performance",
        path: "/reports/driver",
        permission: "reports:performance",
        icon: Truck,
      },
      {
        name: "Route Performance",
        path: "/reports/route",
        permission: "reports:performance",
        icon: RouteIcon,
      },
      {
        name: "Financial Reports",
        path: "/reports/financial",
        permission: "reports:financial",
        icon: WalletCards,
      },
    ],
  },

  {
    title: "HISTORY",
    items: [
      {
        name: "Activity History",
        path: "/history/activity",
        permission: "history:view",
        icon: Activity,
      },
    ],
  },
];