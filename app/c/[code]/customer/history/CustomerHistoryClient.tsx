"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Package,
  CalendarPlus,
  Clock,
  CheckCircle2,
  Truck,
  WashingMachine,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  ShoppingBag,
  MapPin,
  Calendar,
  User,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface OrderItem {
  id: string;
  description?: string | null;
  pricingType?: string | null;
  quantity?: number | null;
  pieces?: number | null;
  weightKg?: number | null;
  unitPrice: number | string;
  total: number | string;
  service?: { name: string } | null;
}

interface StatusHistoryItem {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  createdAt: string;
  changedBy?: { fullName: string } | null;
}

interface OrderHistory {
  id: string;
  orderNo: string;
  status: string;
  subtotal?: number | string;
  additionalCharges?: number | string;
  discount?: number | string;
  grandTotal?: number | string;
  total?: number | string;
  balance?: number | string;
  notes?: string | null;
  createdAt: string;
  requestedPickupDate?: string | null;
  items: OrderItem[];
  pickup?: {
    actualKg?: number | null;
    kgRate?: number | null;
    notes?: string | null;
    collectedAt?: string | null;
    collectedBy?: { fullName: string; phone?: string | null } | null;
  } | null;
  processing?: {
    status?: string;
    notes?: string | null;
    completedAt?: string | null;
  } | null;
  delivery?: {
    scheduledDate?: string | null;
    completedAt?: string | null;
    completedBy?: { fullName: string; phone?: string | null } | null;
  } | null;
  payments?: Array<{ amount: number | string; method: string; createdAt: string }>;
  invoice?: {
    invoiceNo: string;
    status: string;
    allocations?: Array<{ amount: number | string; payment?: { method: string } }>;
  } | null;
  statusHistory: StatusHistoryItem[];
}

interface CustomerHistoryClientProps {
  companyCode: string;
  companyName?: string;
  customerInfo?: any;
  initialOrders: OrderHistory[];
}

function formatDate(dateInput: string | Date) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(dateInput: string | Date) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} at ${hours}:${minutes}`;
}

export default function CustomerHistoryClient({
  companyCode,
  companyName = "Wash & Well",
  customerInfo,
  initialOrders,
}: CustomerHistoryClientProps) {
  const [orders, setOrders] = useState<OrderHistory[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PROCESSING" | "DELIVERED" | "URGENT">("ALL");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(() => {
    // Default expand the latest order
    const initialMap: Record<string, boolean> = {};
    if (initialOrders.length > 0) {
      initialMap[initialOrders[0].id] = true;
    }
    return initialMap;
  });

  const toggleExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const expandAll = () => {
    const map: Record<string, boolean> = {};
    orders.forEach((o) => (map[o.id] = true));
    setExpandedOrders(map);
  };

  const collapseAll = () => {
    setExpandedOrders({});
  };

  // Compute Order Financials
  const getOrderFinancials = (order: OrderHistory) => {
    const subtotal = Number(order.subtotal || 0);
    const expressCharges = Number(order.additionalCharges || 0);
    const discountVal = Number(order.discount || 0);
    const grandTotal = Number(order.grandTotal ?? order.total ?? 0);

    const directPayments = (order.payments || []).reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    const invoiceAllocations = (order.invoice?.allocations || []).reduce(
      (sum, a: any) => sum + Number(a.amount || a.payment?.amount || 0),
      0
    );

    const paidVal = Math.max(directPayments, invoiceAllocations);
    const balanceVal = Math.max(0, grandTotal - paidVal);

    let paymentStatus = "UNPAID";
    if (paidVal >= grandTotal && grandTotal > 0) {
      paymentStatus = "PAID";
    } else if (paidVal > 0 && paidVal < grandTotal) {
      paymentStatus = "PARTIALLY_PAID";
    }

    const isUrgent = Boolean(
      (order.notes && (order.notes.includes("URGENT") || order.notes.includes("PRIORITY"))) ||
      expressCharges > 0
    );

    return { subtotal, expressCharges, discountVal, grandTotal, paidVal, balanceVal, paymentStatus, isUrgent };
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "PENDING_APPROVAL":
      case "DRAFT":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pickup Scheduled
          </span>
        );
      case "PROCESSING":
      case "IN_WASHING":
      case "COLLECTED":
      case "RECEIVED_AT_LAUNDRY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
            <WashingMachine className="w-3 h-3 animate-spin-slow" /> In Washing & Care
          </span>
        );
      case "READY":
      case "OUT_FOR_DELIVERY":
      case "READY_FOR_DELIVERY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case "DELIVERED":
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNo.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q)) ||
        o.items.some((i) => (i.description || i.service?.name || "").toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const s = o.status.toUpperCase();
      const fin = getOrderFinancials(o);

      if (activeTab === "PROCESSING") {
        return ["PENDING", "PENDING_APPROVAL", "DRAFT", "COLLECTED", "PROCESSING", "IN_WASHING", "READY", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"].includes(s);
      }
      if (activeTab === "DELIVERED") {
        return ["DELIVERED", "COMPLETED"].includes(s);
      }
      if (activeTab === "URGENT") {
        return fin.isUrgent;
      }

      return true;
    });
  }, [orders, searchQuery, activeTab]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalOrdersCount = orders.length;
    const completedCount = orders.filter((o) => ["DELIVERED", "COMPLETED"].includes(o.status.toUpperCase())).length;
    const totalGarmentItems = orders.reduce((sum, o) => {
      const itemQty = (o.items || []).reduce((iSum, item) => iSum + Number(item.quantity || item.pieces || item.weightKg || 1), 0);
      return sum + itemQty;
    }, 0);
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.grandTotal ?? o.total ?? 0), 0);

    return { totalOrdersCount, completedCount, totalGarmentItems, totalSpent };
  }, [orders]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold border border-purple-200 mb-2">
              <History className="w-3.5 h-3.5" /> Order Process History & Timeline Audit
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              My Complete Order Process History
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View step-by-step process timelines, sub-processes, garment breakdowns, pickup weights, and logistics for every laundry order.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/c/${companyCode}/customer/pickup`}
              className="h-10 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Schedule New Pickup</span>
            </Link>
          </div>
        </div>

        {/* Lifetime Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Orders Placed</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{stats.totalOrdersCount}</p>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Delivered & Completed</p>
            <p className="text-xl font-extrabold text-emerald-950 mt-1">{stats.completedCount}</p>
          </div>

          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
            <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Total Garments / KG Cared</p>
            <p className="text-xl font-extrabold text-purple-950 mt-1">{stats.totalGarmentItems} Items</p>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Total Lifetime Care</p>
            <p className="text-xl font-extrabold text-amber-950 mt-1">LKR {stats.totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "ALL"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("PROCESSING")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "PROCESSING"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveTab("DELIVERED")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "DELIVERED"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setActiveTab("URGENT")}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === "URGENT"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            ⚡ Urgent Express
          </button>
        </div>

        {/* Right Search & Expand All */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order no, garment item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-purple-600 transition"
            />
          </div>

          <button
            onClick={expandedOrders && Object.keys(expandedOrders).length > 0 ? collapseAll : expandAll}
            className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap transition shrink-0 cursor-pointer"
          >
            {expandedOrders && Object.keys(expandedOrders).length > 0 ? "Collapse All" : "Expand All"}
          </button>
        </div>
      </div>

      {/* Orders Process History List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No process history found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You don't have any order history matching your selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isExpanded = Boolean(expandedOrders[order.id]);
            const fin = getOrderFinancials(order);
            const primaryAddr = customerInfo?.addresses?.find((a: any) => a.isPrimary) || customerInfo?.addresses?.[0];
            const addrText = primaryAddr
              ? `${primaryAddr.label ? `[${primaryAddr.label}] ` : ""}${primaryAddr.address}${primaryAddr.city ? `, ${primaryAddr.city}` : ""}`
              : customerInfo?.address1 || "Primary Delivery Address";

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition space-y-0"
              >
                {/* Order Summary Bar Header */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-5 sm:p-6 bg-slate-50/70 hover:bg-purple-50/40 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg font-black text-slate-900">
                        {order.orderNo}
                      </span>
                      {getStatusBadge(order.status)}
                      {fin.isUrgent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> URGENT EXPRESS
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500" suppressHydrationWarning>
                      Placed on <strong>{formatDateTime(order.createdAt)}</strong> • Total Items: <strong>{order.items?.length || 0}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 justify-between md:justify-end">
                    <div className="text-left md:text-right">
                      <span className="text-base font-black text-purple-900 block">
                        LKR {fin.grandTotal.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          fin.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : fin.paymentStatus === "PARTIALLY_PAID"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {fin.paymentStatus.replace("_", " ")}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-purple-600 transition shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE PROCESS SUB-DETAILS CONTENT */}
                {isExpanded && (
                  <div className="p-6 sm:p-8 space-y-8 bg-white border-t border-slate-100">
                    
                    {/* 1. VISUAL STEP-BY-STEP PROCESS TIMELINE STREAM */}
                    <div className="bg-purple-50/50 rounded-3xl p-6 border border-purple-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span>Complete Step-by-Step Audit Timeline</span>
                        </h4>
                        <span className="text-[11px] text-purple-700 font-bold">
                          {order.statusHistory?.length || 0} Status Log Entries
                        </span>
                      </div>

                      {order.statusHistory && order.statusHistory.length > 0 ? (
                        <div className="relative pl-6 space-y-6 border-l-2 border-purple-200 pt-1">
                          {order.statusHistory.map((step, sIdx) => {
                            const isLatest = sIdx === order.statusHistory.length - 1;

                            return (
                              <div key={step.id || sIdx} className="relative space-y-1">
                                {/* Dot indicator */}
                                <div
                                  className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                                    isLatest
                                      ? "bg-purple-600 ring-4 ring-purple-600/20"
                                      : "bg-purple-400"
                                  }`}
                                />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                    {step.toStatus.replace("_", " ")}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500" suppressHydrationWarning>
                                    {formatDateTime(step.createdAt)}
                                  </span>
                                </div>

                                {step.note && (
                                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/80 p-2.5 rounded-xl border border-purple-100/60">
                                    {step.note}
                                  </p>
                                )}

                                {step.changedBy?.fullName && (
                                  <p className="text-[10px] text-purple-700 font-bold">
                                    Logged by: {step.changedBy.fullName}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No detailed timeline logs recorded for this order.</p>
                      )}
                    </div>

                    {/* 2. SUB-SECTION: DOORSTEP PICKUP & LOGISTICS */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        <span>Doorstep Pickup & Collection Sub-Details</span>
                      </h4>

                      <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Requested Date & Pickup Location:
                          </span>
                          <p className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span suppressHydrationWarning>
                              {order.requestedPickupDate ? formatDate(order.requestedPickupDate) : formatDate(order.createdAt)}
                            </span>
                          </p>
                          <p className="text-slate-700 font-medium leading-relaxed flex items-start gap-1.5 pt-1">
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <span>{addrText}</span>
                          </p>
                        </div>

                        <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Collection Weight & Driver Logistics:
                          </span>
                          {order.pickup ? (
                            <>
                              <p className="text-slate-800 font-extrabold">
                                Weight Collected: {order.pickup.actualKg || 0} KG (Rate: LKR {order.pickup.kgRate || 250}/KG)
                              </p>
                              {order.pickup.collectedBy?.fullName && (
                                <p className="text-slate-600 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-slate-400" /> Collected Driver: {order.pickup.collectedBy.fullName}
                                </p>
                              )}
                              {order.pickup.collectedAt && (
                                <p className="text-slate-500 font-mono text-[11px]" suppressHydrationWarning>
                                  Collected At: {formatDateTime(order.pickup.collectedAt)}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-slate-500 italic">Pickup collection pending driver arrival.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. SUB-SECTION: ADDED GARMENT SERVICES & PROCESS TREATMENTS */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-purple-600" />
                          <span>Garment Services & Process Treatments Sub-Details</span>
                        </h4>
                        <span className="text-xs font-bold text-slate-400">
                          {order.items?.length || 0} Added Sub-Items
                        </span>
                      </div>

                      {order.items && order.items.length > 0 ? (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-4">#</th>
                                <th className="py-2.5 px-4">Description / Treatment</th>
                                <th className="py-2.5 px-3 text-center">Qty / Weight</th>
                                <th className="py-2.5 px-3 text-right">Unit Rate (LKR)</th>
                                <th className="py-2.5 px-4 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                              {order.items.map((item, idx) => {
                                const desc = item.description || item.service?.name || "Laundry Service";
                                const qty = item.quantity || item.pieces || item.weightKg || 1;
                                const uPrice = Number(item.unitPrice || 0);
                                const total = Number(item.total || uPrice * qty);

                                return (
                                  <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                    <td className="py-2.5 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                                    <td className="py-2.5 px-4 font-bold text-slate-900">{desc}</td>
                                    <td className="py-2.5 px-3 text-center font-semibold">
                                      {qty} {item.pricingType === "PER_KG" ? "KG" : "Item(s)"}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                                      LKR {uPrice.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-extrabold text-purple-900">
                                      LKR {total.toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic text-center">
                          No itemized garments recorded.
                        </div>
                      )}
                    </div>

                    {/* 4. SUB-SECTION: LAUNDRY HUB PROCESSING & DELIVERY LOGISTICS */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Facility Care Sub-Details */}
                      <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-100 space-y-2 text-xs">
                        <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                          <WashingMachine className="w-4 h-4 text-purple-600" />
                          <span>Facility Wash & Iron Care:</span>
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          Status: <strong>{order.processing?.status || (order.status.includes("PROCESSING") ? "IN_CARE" : "PENDING")}</strong>
                        </p>
                        {order.processing?.notes && (
                          <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-purple-100 text-[11px]">
                            {order.processing.notes}
                          </p>
                        )}
                        {order.processing?.completedAt && (
                          <p className="text-slate-500 font-mono text-[11px]" suppressHydrationWarning>
                            Care Completed: {formatDateTime(order.processing.completedAt)}
                          </p>
                        )}
                      </div>

                      {/* Delivery Logistics Sub-Details */}
                      <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 space-y-2 text-xs">
                        <span className="font-extrabold text-blue-950 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span>Delivery & Dispatch Logistics:</span>
                        </span>
                        {order.delivery ? (
                          <>
                            {order.delivery.completedBy?.fullName && (
                              <p className="text-slate-700">
                                Delivery Driver: <strong>{order.delivery.completedBy.fullName}</strong>
                              </p>
                            )}
                            {order.delivery.completedAt && (
                              <p className="text-emerald-700 font-bold flex items-center gap-1 pt-1" suppressHydrationWarning>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Handover Confirmed at {formatDateTime(order.delivery.completedAt)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-slate-500 italic">Delivery dispatch pending completion of wash care.</p>
                        )}
                      </div>
                    </div>

                    {/* 5. SUB-SECTION: FINANCIAL BREAKDOWN & AUDIT */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-purple-600" />
                          <span>Financial Bill & Payments Audit</span>
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            fin.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : fin.paymentStatus === "PARTIALLY_PAID"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {fin.paymentStatus.replace("_", " ")}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Subtotal Amount</span>
                          <p className="text-sm font-extrabold text-slate-900 mt-0.5">LKR {fin.subtotal.toLocaleString()}</p>
                        </div>

                        {fin.expressCharges > 0 && (
                          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                            <span className="text-[10px] text-amber-800 font-bold uppercase">Express Surcharge</span>
                            <p className="text-sm font-extrabold text-amber-950 mt-0.5">+ LKR {fin.expressCharges.toLocaleString()}</p>
                          </div>
                        )}

                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                          <span className="text-[10px] text-purple-700 font-bold uppercase">Grand Total Bill</span>
                          <p className="text-sm font-extrabold text-purple-950 mt-0.5">LKR {fin.grandTotal.toLocaleString()}</p>
                        </div>

                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase">Total Paid</span>
                          <p className="text-sm font-extrabold text-emerald-950 mt-0.5">LKR {fin.paidVal.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-black">
                        <span className="text-slate-700">Pending Balance Due:</span>
                        <span className="text-sm text-rose-700">LKR {fin.balanceVal.toLocaleString()}</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

