"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  CalendarPlus,
  Clock,
  CheckCircle2,
  Truck,
  WashingMachine,
  Sparkles,
  Search,
  Filter,
  Eye,
  X,
  FileText,
  Zap,
  ShoppingBag,
  DollarSign,
  Tag,
  Layers,
  ChevronRight,
  MapPin,
  Calendar,
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

interface PaymentAllocation {
  id: string;
  amount: number | string;
  payment?: {
    amount: number | string;
    method: string;
  } | null;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  status: string;
  subtotal: number | string;
  grandTotal: number | string;
  allocations?: PaymentAllocation[];
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  subtotal?: number | string;
  additionalCharges?: number | string;
  tax?: number | string;
  discount?: number | string;
  grandTotal?: number | string;
  total?: number | string;
  balance?: number | string;
  notes?: string | null;
  createdAt: string;
  requestedPickupDate?: string | null;
  items: OrderItem[];
  invoice?: Invoice | null;
  payments?: Array<{ amount: number | string; method: string }>;
  statusHistory: Array<{
    id: string;
    toStatus: string;
    status?: string;
    note?: string | null;
    createdAt: string;
  }>;
}

interface CustomerOrdersClientProps {
  companyCode: string;
  initialOrders: Order[];
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

export default function CustomerOrdersClient({
  companyCode,
  initialOrders,
}: CustomerOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filterStatuses = [
    { label: "All Orders", value: "ALL" },
    { label: "Pending Pickup", value: "PENDING_APPROVAL" },
    { label: "In Washing / Care", value: "PROCESSING" },
    { label: "Out for Delivery", value: "READY" },
    { label: "Delivered", value: "DELIVERED" },
  ];

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

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedStatus === "ALL") return true;

    const s = o.status.toUpperCase();
    if (selectedStatus === "PENDING_APPROVAL") {
      return ["PENDING", "PENDING_APPROVAL", "DRAFT", "APPROVED"].includes(s);
    }
    if (selectedStatus === "PROCESSING") {
      return ["PROCESSING", "IN_WASHING", "COLLECTED", "RECEIVED_AT_LAUNDRY"].includes(s);
    }
    if (selectedStatus === "READY") {
      return ["READY", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"].includes(s);
    }
    if (selectedStatus === "DELIVERED") {
      return ["DELIVERED", "COMPLETED"].includes(s);
    }
    return s.includes(selectedStatus);
  });

  const getTimelineSteps = (currentStatus: string) => {
    const steps = [
      { id: "PENDING", label: "Pickup Scheduled", desc: "Order submitted for driver collection" },
      { id: "COLLECTED", label: "Picked Up", desc: "Linen collected by driver team" },
      { id: "PROCESSING", label: "Washing & Care", desc: "Washing, stain treatment & pressing" },
      { id: "READY", label: "Out for Delivery", desc: "Packed & assigned to delivery lorry" },
      { id: "DELIVERED", label: "Delivered", desc: "Successfully delivered to customer" },
    ];

    const statusOrder = ["PENDING", "PENDING_APPROVAL", "COLLECTED", "PROCESSING", "READY", "READY_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
    const currentIndex = statusOrder.indexOf(currentStatus.toUpperCase());

    return steps.map((step, idx) => {
      const isCompleted = currentIndex >= idx * 2 || currentIndex >= idx;
      const isCurrent = currentStatus.toUpperCase().includes(step.id) || (currentStatus.toUpperCase() === "COMPLETED" && step.id === "DELIVERED");

      return {
        ...step,
        isCompleted,
        isCurrent,
      };
    });
  };

  // Compute Order Financials for Detail View
  const getOrderFinancials = (order: Order) => {
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span>My Orders & Live Tracking</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time progress of your laundry orders and view full added details.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/c/${companyCode}/customer/history`}
            className="h-10 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Process History</span>
          </Link>

          <Link
            href={`/c/${companyCode}/customer/pickup`}
            className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Schedule New Pickup</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {filterStatuses.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedStatus(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedStatus === f.value
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search order no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-600 transition"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You don't have any orders matching your selected filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const fin = getOrderFinancials(order);

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition space-y-4 cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition">
                        {order.orderNo}
                      </span>
                      {getStatusBadge(order.status)}
                      {fin.isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1" suppressHydrationWarning>
                      Order Date: {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-purple-900">
                      LKR {fin.grandTotal.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="h-9 px-3.5 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Added Details
                    </button>
                  </div>
                </div>

                {/* Progress Bar Timeline Snapshot */}
                <div className="pt-1">
                  <div className="grid grid-cols-5 gap-2 relative">
                    {getTimelineSteps(order.status).map((step, idx) => (
                      <div key={step.id} className="text-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1 transition ${
                            step.isCompleted
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {step.isCompleted ? "✓" : idx + 1}
                        </div>
                        <p
                          className={`text-[11px] font-bold leading-tight ${
                            step.isCurrent
                              ? "text-purple-700"
                              : step.isCompleted
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SLIDE-OVER ORDER DETAILS DRAWER */}
      {selectedOrder && (() => {
        const fin = getOrderFinancials(selectedOrder);

        return (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedOrder(null)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col transform transition ease-in-out duration-300">
                
                {/* Drawer Header */}
                <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-lg text-xs border border-white/20">
                        {selectedOrder.orderNo}
                      </span>
                      {getStatusBadge(selectedOrder.status)}
                      {fin.isUrgent && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 inline-flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-amber-950" /> URGENT
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white mt-2">
                      Customer Order Details
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5" suppressHydrationWarning>
                      Placed on {formatDateTime(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* 1. ORDERED ITEMS & PROCESS TREATMENTS TABLE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                        <span>Added Services & Garment Items</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-bold">
                        {selectedOrder.items?.length || 0} Items
                      </span>
                    </div>

                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-4">Description</th>
                              <th className="py-2.5 px-3 text-center">Qty / Weight</th>
                              <th className="py-2.5 px-3 text-right">Unit Price</th>
                              <th className="py-2.5 px-4 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {selectedOrder.items.map((item, idx) => {
                              const desc = item.description || item.service?.name || "Laundry Service";
                              const qty = item.quantity || item.pieces || item.weightKg || 1;
                              const uPrice = Number(item.unitPrice || 0);
                              const total = Number(item.total || uPrice * qty);

                              return (
                                <tr key={item.id || idx} className="hover:bg-slate-50/60">
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
                        No specific garment items listed for this order.
                      </div>
                    )}
                  </div>

                  {/* 2. ORDER NOTES & CARE INSTRUCTIONS */}
                  {selectedOrder.notes && (
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs space-y-1">
                      <span className="font-extrabold text-purple-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" /> Customer Notes & Care Instructions:
                      </span>
                      <p className="text-slate-700 leading-relaxed pl-5">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  {/* 3. FINANCIAL BREAKDOWN SUMMARY */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2">
                      Financial Bill Breakdown
                    </h4>

                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-900">LKR {fin.subtotal.toLocaleString()}</span>
                    </div>

                    {fin.expressCharges > 0 && (
                      <div className="flex justify-between text-amber-800">
                        <span>Express / Urgent Surcharge:</span>
                        <span className="font-bold">+ LKR {fin.expressCharges.toLocaleString()}</span>
                      </div>
                    )}

                    {fin.discountVal > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount:</span>
                        <span className="font-bold">- LKR {fin.discountVal.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                      <span>Grand Total Bill:</span>
                      <span className="text-purple-700 font-extrabold">LKR {fin.grandTotal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-emerald-800 font-bold pt-1">
                      <span>Amount Paid:</span>
                      <span>LKR {fin.paidVal.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-rose-700 font-black text-sm pt-1 border-t border-slate-200">
                      <span>Pending Balance Amount:</span>
                      <span>LKR {fin.balanceVal.toLocaleString()}</span>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</span>
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
                  </div>

                  {/* 4. LIVE ORDER PROGRESS TIMELINE */}
                  <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100 space-y-4">
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                      Full Live Order Timeline
                    </h4>

                    <div className="space-y-4 relative pl-4 border-l-2 border-purple-200">
                      {getTimelineSteps(selectedOrder.status).map((step) => (
                        <div key={step.id} className="relative">
                          <div
                            className={`absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              step.isCompleted ? "bg-purple-600 ring-2 ring-purple-600/30" : "bg-slate-300"
                            }`}
                          />
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-bold ${step.isCompleted ? "text-purple-900" : "text-slate-400"}`}>
                              {step.label}
                            </p>
                            {step.isCurrent && (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                CURRENT STAGE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <Link
                    href={`/c/${companyCode}/customer/pickup`}
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition"
                  >
                    <CalendarPlus className="w-4 h-4" /> Schedule New Pickup
                  </Link>

                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close Drawer
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
