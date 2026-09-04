"use client";

import { useState } from "react";
import Link from "next/link";
import {
  WashingMachine,
  Package,
  CalendarPlus,
  MapPin,
  FileText,
  User,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  Zap,
  ShoppingBag,
} from "lucide-react";

interface CustomerDashboardProps {
  companyCode: string;
  companyName: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  customer: any;
  initialOrders: any[];
  initialInvoices: any[];
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

export default function CustomerDashboardClient({
  companyCode,
  companyName,
  user,
  customer,
  initialOrders,
  initialInvoices,
}: CustomerDashboardProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const activeOrders = initialOrders.filter((o) =>
    ["PENDING", "PENDING_APPROVAL", "DRAFT", "PROCESSING", "WASHING", "IRONING", "READY", "OUT_FOR_DELIVERY"].includes(o.status.toUpperCase())
  );

  const completedOrdersCount = initialOrders.filter((o) =>
    ["DELIVERED", "COMPLETED"].includes(o.status.toUpperCase())
  ).length;

  const totalSpent = initialOrders.reduce((sum, o) => sum + (o.grandTotal ?? o.total ?? 0), 0);
  const addressesCount = customer?.addresses?.length || 0;

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
      case "WASHING":
      case "COLLECTED":
      case "RECEIVED_AT_LAUNDRY":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
            <WashingMachine className="w-3 h-3 animate-spin-slow" /> In Laundry Wash
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

  const getTimelineSteps = (currentStatus: string) => {
    const steps = [
      { id: "PENDING", label: "Pickup Scheduled", desc: "Order submitted for driver collection" },
      { id: "COLLECTED", label: "Picked Up", desc: "Linen collected by driver team" },
      { id: "PROCESSING", label: "Washing & Care", desc: "Washing, stain treatment & pressing" },
      { id: "READY", label: "Out for Delivery", desc: "Packed & assigned to delivery lorry" },
      { id: "DELIVERED", label: "Delivered", desc: "Successfully delivered to customer" },
    ];

    const statusOrder = ["PENDING", "PENDING_APPROVAL", "COLLECTED", "PROCESSING", "READY", "READY_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
    const currentIndex = statusOrder.indexOf((currentStatus || "").toUpperCase());

    return steps.map((step, idx) => {
      const isCompleted = currentIndex >= idx * 2 || currentIndex >= idx;
      const isCurrent = (currentStatus || "").toUpperCase().includes(step.id) || ((currentStatus || "").toUpperCase() === "COMPLETED" && step.id === "DELIVERED");

      return {
        ...step,
        isCompleted,
        isCurrent,
      };
    });
  };

  const getOrderFinancials = (order: any) => {
    const subtotal = Number(order.subtotal || 0);
    const expressCharges = Number(order.additionalCharges || 0);
    const discountVal = Number(order.discount || 0);
    const grandTotal = Number(order.grandTotal ?? order.total ?? 0);

    const directPayments = (order.payments || []).reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );

    const invoiceAllocations = (order.invoice?.allocations || []).reduce(
      (sum: number, a: any) => sum + Number(a.amount || a.payment?.amount || 0),
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
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* HERO BANNER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Customer Account Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hello, {customer?.name || user.fullName}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Customer No: <strong className="font-mono text-emerald-400">{customer?.customerNo || "CUST-00001"}</strong> • Manage your doorstep laundry pickups, view live order tracking, and save delivery addresses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/c/${companyCode}/customer/pickup`}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Schedule New Pickup</span>
            </Link>

            <Link
              href={`/c/${companyCode}/customer/history`}
              className="px-4 py-3 rounded-2xl bg-purple-500/30 hover:bg-purple-500/40 text-white text-xs font-bold border border-purple-400/30 flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>Process History & Timelines</span>
            </Link>

            <Link
              href={`/c/${companyCode}/customer/addresses`}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition"
            >
              <MapPin className="w-4 h-4 text-emerald-300" />
              <span>Add Address</span>
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <WashingMachine className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{activeOrders.length}</p>
          <p className="text-[11px] text-slate-500">Currently in progress</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{completedOrdersCount}</p>
          <p className="text-[11px] text-slate-500">Delivered successfully</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saved Addresses</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{addressesCount}</p>
          <p className="text-[11px] text-slate-500">Pickup & delivery locations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Lifetime Care</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            LKR {totalSpent.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500">Across {initialOrders.length} orders</p>
        </div>
      </div>

      {/* QUICK ACTION TILES */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/c/${companyCode}/customer/pickup`}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Schedule Pickup</h3>
              <p className="text-[11px] text-slate-500">Doorstep laundry collection</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href={`/c/${companyCode}/customer/orders`}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Track Orders</h3>
              <p className="text-[11px] text-slate-500">Live order status history</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href={`/c/${companyCode}/customer/addresses`}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">My Addresses</h3>
              <p className="text-[11px] text-slate-500">Manage saved locations</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          href={`/c/${companyCode}/customer/billing`}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Invoices & Billing</h3>
              <p className="text-[11px] text-slate-500">Digital receipts & totals</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <p className="text-xs text-slate-500">Your latest laundry orders and pickup status</p>
          </div>

          <Link
            href={`/c/${companyCode}/customer/orders`}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {initialOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No orders placed yet. Click "Schedule New Pickup" above to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {initialOrders.slice(0, 5).map((ord) => {
                  const fin = getOrderFinancials(ord);

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-bold text-purple-700">{ord.orderNo}</td>
                      <td className="py-3 px-4" suppressHydrationWarning>{formatDate(ord.createdAt)}</td>
                      <td className="py-3 px-4">{getStatusBadge(ord.status)}</td>
                      <td className="py-3 px-4 font-bold">LKR {fin.grandTotal.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Added Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                            {selectedOrder.items.map((item: any, idx: number) => {
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
