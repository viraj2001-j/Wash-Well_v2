"use client";

import { useState } from "react";
import {
  ShoppingBag, Search, Plus, Filter, Clock3, CheckCircle2, PackageCheck,
  WashingMachine, Truck, XCircle, FileText, ChevronRight, X, AlertCircle,
  Phone, Mail, MapPin, ExternalLink, Camera, Building2, CreditCard,
  Calendar, User, Navigation, Scale, Image as ImageIcon, History, ShieldCheck
} from "lucide-react";

interface OrdersClientProps {
  companyCode: string;
  companyId: string;
  initialOrders: any[];
  customers: any[];
  services: any[];
  routes: any[];
}

const ALL_ORDER_STATUSES = [
  { value: "DRAFT", label: "DRAFT" },
  { value: "PENDING_APPROVAL", label: "PENDING APPROVAL" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "ASSIGNED", label: "ASSIGNED" },
  { value: "READY_FOR_PICKUP", label: "READY FOR PICKUP" },
  { value: "PICKUP_STARTED", label: "PICKUP STARTED" },
  { value: "COLLECTED", label: "COLLECTED (DRIVER)" },
  { value: "RECEIVED_AT_LAUNDRY", label: "RECEIVED AT LAUNDRY" },
  { value: "PROCESSING", label: "PROCESSING" },
  { value: "READY_FOR_DELIVERY", label: "READY FOR DELIVERY" },
  { value: "OUT_FOR_DELIVERY", label: "OUT FOR DELIVERY" },
  { value: "DELIVERED", label: "DELIVERED" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "CANCELLED", label: "CANCELLED" },
];

export default function OrdersClient({
  companyCode,
  companyId,
  initialOrders,
  customers,
  services,
  routes,
}: OrdersClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  // New order form state
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newPickupDate, setNewPickupDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateStatus = async (orderId: string, toStatus: string, note?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, note: note || `Status updated to ${toStatus} by Admin` }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: toStatus, ...data.data } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev: any) => (prev ? { ...prev, status: toStatus, ...data.data } : null));
        }
        showToast(`Order status updated to ${toStatus}`, "success");
      } else {
        showToast(data.error || "Failed to update order status", "error");
      }
    } catch {
      showToast("Failed to update order status due to network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesTab = activeTab === "ALL" || ord.status === activeTab;
    const matchesSearch =
      ord.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.customer?.phone || "").includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const handleApprove = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "APPROVED" } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: "APPROVED" });
        }
        showToast("Order approved successfully!", "success");
      } else {
        showToast(data.error || "Approval failed", "error");
      }
    } catch (err) {
      showToast("Failed to approve order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal || !rejectReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/orders/${showRejectModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === showRejectModal.id ? { ...o, status: "REJECTED" } : o))
        );
        setShowRejectModal(null);
        setRejectReason("");
        showToast("Order rejected.", "success");
      } else {
        showToast(data.error || "Rejection failed", "error");
      }
    } catch (err) {
      showToast("Failed to reject order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      showToast("Please select a customer.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: newCustomerId,
          requestedPickupDate: newPickupDate,
          notes: newNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders([data.data, ...orders]);
        setShowCreateModal(false);
        setNewCustomerId("");
        setNewPickupDate("");
        setNewNotes("");
        showToast("Order created successfully!", "success");
      } else {
        showToast(data.error || "Failed to create order", "error");
      }
    } catch (err) {
      showToast("Failed to create order", "error");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Order KPIs
  const orderKpis = {
    total: orders.length,
    pendingApproval: orders.filter((o) => o.status === "PENDING_APPROVAL").length,
    processing: orders.filter((o) => o.status === "PROCESSING" || o.status === "COLLECTED" || o.status === "RECEIVED_AT_LAUNDRY").length,
    completed: orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED").length,
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Orders & Sales Operations</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Central control for all laundry orders & status pipeline
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus size={14} /> New Order
        </button>
      </div>

      {/* 4 DISTINCTLY STYLED COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL ORDERS</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <ShoppingBag size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{orderKpis.total}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Active customer orders
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">PENDING APPROVAL</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <Clock3 size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{orderKpis.pendingApproval}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              Awaiting admin review
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Processing & Laundry */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">PROCESSING & LAUNDRY</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <WashingMachine size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{orderKpis.processing}</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              In laundry pipeline
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Delivered & Completed */}
        <div className="bg-[#f3e8ff] border border-purple-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">DELIVERED & COMPLETED</span>
            <div className="w-7 h-7 rounded-lg bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{orderKpis.completed}</p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Settled customer orders
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#7c3aed] fill-none stroke-[2]">
              <path d="M 0,12 Q 20,11 40,9 T 60,10 T 80,8 L 100,9" />
            </svg>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="bg-slate-200/50 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto text-xs font-bold shadow-2xs max-w-fit">
        {[
          { key: "ALL", label: "All Orders" },
          { key: "PENDING_APPROVAL", label: "Pending Approval" },
          { key: "APPROVED", label: "Approved" },
          { key: "COLLECTED", label: "Collected" },
          { key: "PROCESSING", label: "Processing" },
          { key: "READY_FOR_DELIVERY", label: "Ready" },
          { key: "DELIVERED", label: "Delivered" },
          { key: "CANCELLED", label: "Cancelled" },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                active
                  ? "bg-white text-[#4f46e5] shadow-sm font-extrabold border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order #, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* ORDERS TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Created By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-purple-900">{ord.orderNo}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {ord.customer?.name}
                      <span className="block text-[10px] font-normal text-gray-400">{ord.customer?.phone}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">{ord.createdBy?.fullName}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.status === "PENDING_APPROVAL"
                            ? "bg-amber-100 text-amber-800"
                            : ord.status === "APPROVED"
                            ? "bg-blue-100 text-blue-800"
                            : ord.status === "COLLECTED"
                            ? "bg-indigo-100 text-indigo-800"
                            : ord.status === "PROCESSING"
                            ? "bg-purple-100 text-purple-800"
                            : ord.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900" suppressHydrationWarning>
                      Rs.{Number(ord.grandTotal).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400 text-[11px]" suppressHydrationWarning>
                      {new Date(ord.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 flex items-center justify-end gap-1.5">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        disabled={loading}
                        className="px-2.5 py-1 bg-white border border-purple-200 hover:border-purple-400 font-extrabold text-[11px] rounded-lg text-purple-950 shadow-2xs focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        {ALL_ORDER_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold rounded-lg text-[11px] transition"
                      >
                        View
                      </button>
                      {ord.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            onClick={() => handleApprove(ord.id)}
                            disabled={loading}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setShowRejectModal(ord)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER PROFILE & LOGISTICS DETAIL SLIDE-OVER DRAWER */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#7C3AED] text-[11px] bg-purple-100/80 px-2.5 py-0.5 rounded-md border border-purple-200">
                      {selectedOrder.orderNo}
                    </span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      {ALL_ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight mt-1">
                    {selectedOrder.customer?.name}
                  </h2>
                  {selectedOrder.customer?.placeName && (
                    <p className="text-xs font-bold text-gray-600 flex items-center gap-1 mt-0.5">
                      <span>🏪</span> {selectedOrder.customer.placeName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              
              {/* Order Key Summary Banner */}
              <div className="grid grid-cols-2 gap-3 bg-gradient-to-br from-purple-50/70 to-purple-50/20 p-4 rounded-2xl border border-purple-100">
                <div className="space-y-1">
                  <span className="text-[11px] text-gray-500 font-bold block">Grand Total</span>
                  <span className="text-base font-black text-purple-900 block">
                    LKR {Number(selectedOrder.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[11px] text-gray-500 font-bold block">Pickup Date</span>
                  <span className="font-extrabold text-gray-900 block">
                    {selectedOrder.requestedPickupDate
                      ? new Date(selectedOrder.requestedPickupDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Not specified"}
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-purple-100/60 flex items-center justify-between text-[11px]">
                  <span className="text-gray-600 font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" /> Created By:
                  </span>
                  <span className="font-extrabold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-100">
                    {selectedOrder.createdBy?.fullName || "Sales Rep"}
                  </span>
                </div>

                {selectedOrder.approvedBy && (
                  <div className="col-span-2 flex items-center justify-between text-[11px]">
                    <span className="text-gray-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Approved By:
                    </span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedOrder.approvedBy.fullName}
                    </span>
                  </div>
                )}
              </div>

              {/* Customer Profile & Address Card */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" /> Customer Profile Details
                  </h4>
                  {selectedOrder.customer?.customerNo && (
                    <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      #{selectedOrder.customer.customerNo}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 font-medium text-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-purple-500" /> Phone:
                    </span>
                    {selectedOrder.customer?.phone ? (
                      <a
                        href={`tel:${selectedOrder.customer.phone}`}
                        className="font-extrabold text-[#7C3AED] hover:underline flex items-center gap-1"
                      >
                        {selectedOrder.customer.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </div>

                  {selectedOrder.customer?.email && (
                    <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" /> Email:
                      </span>
                      <a href={`mailto:${selectedOrder.customer.email}`} className="font-bold text-gray-800 hover:underline">
                        {selectedOrder.customer.email}
                      </a>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <span className="text-gray-500 flex items-center gap-2 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> Address:
                    </span>
                    <span className="font-bold text-gray-900 text-right">
                      {selectedOrder.customer?.address || selectedOrder.customer?.addresses?.[0]?.address || "No address specified"}
                      {selectedOrder.customer?.city && `, ${selectedOrder.customer.city}`}
                    </span>
                  </div>

                  {selectedOrder.customer?.customerType && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-500">Payment Terms:</span>
                      <span className="font-extrabold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                        {selectedOrder.customer.customerType}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Live GPS Map Card */}
              {selectedOrder.customer?.gpsLatitude && selectedOrder.customer?.gpsLongitude && (
                <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sky-900 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-sky-600" /> Live GPS Coordinates
                    </h4>
                    <a
                      href={`https://www.google.com/maps?q=${selectedOrder.customer.gpsLatitude},${selectedOrder.customer.gpsLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs transition"
                    >
                      <ExternalLink size={11} /> Open Map
                    </a>
                  </div>
                  <p className="text-sky-800 font-mono font-bold text-xs bg-white px-3 py-2 rounded-xl border border-sky-200">
                    📍 {selectedOrder.customer.gpsLatitude}, {selectedOrder.customer.gpsLongitude}
                  </p>
                </div>
              )}

              {/* Customer Shop Photos Showcase */}
              {selectedOrder.customer?.shopPhotos && selectedOrder.customer.shopPhotos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-500" /> Shop Gallery ({selectedOrder.customer.shopPhotos.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedOrder.customer.shopPhotos.map((photoUrl: string, idx: number) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 shadow-2xs">
                        {/* eslint-disable-next-html-extension/no-img-element */}
                        <img
                          src={photoUrl}
                          alt={`Shop photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition font-bold text-[10px] gap-1"
                        >
                          <ExternalLink size={12} /> View Image
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Notes & Special Instructions */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2">
                <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" /> Order Notes & Special Instructions
                </h4>
                <p className="text-gray-800 italic bg-white p-3 rounded-xl border border-gray-200/70 font-medium">
                  {selectedOrder.notes || "No special instructions added for this order."}
                </p>

                {selectedOrder.notesHistory && selectedOrder.notesHistory.length > 0 && (
                  <div className="pt-2 space-y-1.5 border-t border-gray-200/60">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Notes History</span>
                    <div className="space-y-1">
                      {selectedOrder.notesHistory.map((nh: any) => (
                        <div key={nh.id} className="text-[11px] bg-white p-2 rounded-lg border text-gray-700">
                          <p>{nh.note}</p>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(nh.createdAt).toLocaleString()} by {nh.createdBy?.fullName || "User"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Itemized Line Items */}
              <div className="space-y-2">
                <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                  <WashingMachine className="w-3.5 h-3.5 text-[#7C3AED]" /> Itemized Order Breakdown ({selectedOrder.items?.length || 0})
                </h4>

                {!selectedOrder.items || selectedOrder.items.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 italic bg-gray-50 rounded-xl border">
                    No line items specified.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="p-3 bg-white hover:bg-purple-50/20 rounded-2xl border border-gray-200/80 flex items-center justify-between transition shadow-2xs">
                        <div>
                          <span className="font-black text-gray-900 block">{item.service?.name || "Service Item"}</span>
                          <span className="text-[10px] text-gray-500 font-bold">
                            Qty: {item.quantity} × LKR {Number(item.unitPrice || 0).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-extrabold text-[#7C3AED]">
                          LKR {Number(item.totalPrice || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Collection Logistics (If Picked Up) */}
              {selectedOrder.pickup && (
                <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 space-y-2">
                  <h4 className="font-black text-sky-900 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-sky-600" /> Collection Pickup Data
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sky-900 font-bold">
                    <div>
                      <span className="text-[10px] text-sky-600 block">Actual KG Collected</span>
                      <span>{selectedOrder.pickup.actualKgCollected || 0} KG</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-600 block">Collected By Driver</span>
                      <span>{selectedOrder.pickup.collectedBy?.fullName || "Driver"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Status History Timeline */}
              <div className="space-y-3">
                <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-[#7C3AED]" /> Order Status Audit History
                </h4>
                <div className="space-y-2">
                  {selectedOrder.statusHistory?.map((st: any) => (
                    <div key={st.id} className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] mt-1 shrink-0" />
                      <div className="space-y-0.5">
                        <span className="font-black text-gray-900 block">{st.toStatus}</span>
                        {st.note && <p className="text-gray-600 text-[11px] italic">"{st.note}"</p>}
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {new Date(st.createdAt).toLocaleString()} by {st.changedBy?.fullName || "System"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/90 shrink-0 flex items-center justify-between gap-3">
              {selectedOrder.customer?.phone ? (
                <a
                  href={`tel:${selectedOrder.customer.phone}`}
                  className="flex-1 py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition"
                >
                  <Phone size={14} /> Call Customer
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-400 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  No Phone Number
                </button>
              )}

              {selectedOrder.status === "PENDING_APPROVAL" && (
                <button
                  type="button"
                  onClick={() => handleApprove(selectedOrder.id)}
                  disabled={loading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-200 transition"
                >
                  Approve Order
                </button>
              )}

              {selectedOrder.status === "COLLECTED" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, "RECEIVED_AT_LAUNDRY")}
                  disabled={loading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-200 transition"
                >
                  Mark Received at Laundry
                </button>
              )}

              {selectedOrder.status === "RECEIVED_AT_LAUNDRY" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, "PROCESSING")}
                  disabled={loading}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-purple-200 transition"
                >
                  Start Laundry Processing
                </button>
              )}

              {selectedOrder.status === "PROCESSING" && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, "READY_FOR_DELIVERY")}
                  disabled={loading}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-200 transition"
                >
                  Mark Ready for Delivery
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900">Create New Laundry Order</h3>
              <button onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Customer *</label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded-xl"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerNo}) - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Requested Pickup Date</label>
                <input
                  type="date"
                  value={newPickupDate}
                  onChange={(e) => setNewPickupDate(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Special washing/ironing instructions..."
                  className="w-full p-2.5 border rounded-xl"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#6C4ED8] text-white font-bold rounded-xl shadow"
                >
                  {loading ? "Creating..." : "Submit Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-rose-900">Reject Order {showRejectModal.orderNo}</h3>
            <p className="text-xs text-gray-500">Provide a mandatory reason for rejecting this order:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g. Address out of coverage, incomplete customer information..."
              className="w-full p-2.5 border rounded-xl text-xs"
              rows={3}
              required
            />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST POPUP NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-4.5 py-3 rounded-2xl shadow-xl text-white text-xs font-bold ${
            toast.type === "success" ? "bg-emerald-600 border border-emerald-500" : "bg-rose-600 border border-rose-500"
          }`}>
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
