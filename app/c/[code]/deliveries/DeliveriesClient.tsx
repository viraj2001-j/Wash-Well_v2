"use client";

import { useState, useMemo } from "react";
import {
  Truck, CheckCircle2, Navigation, Phone, CreditCard, X, AlertCircle,
  Printer, Download, Building2, MapPin, ExternalLink, Camera, Tag,
  DollarSign, ShieldCheck, User, Calendar, Sparkles, Check, Search,
  Filter, ChevronRight, Layers, History, PackageCheck
} from "lucide-react";

interface DeliveriesClientProps {
  companyCode: string;
  companyId: string;
  initialDeliveries: any[];
  drivers: any[];
  readyOrders: any[];
}

export default function DeliveriesClient({
  companyCode,
  companyId,
  initialDeliveries = [],
  drivers = [],
  readyOrders = [],
}: DeliveriesClientProps) {
  const [readyOrdersList, setReadyOrdersList] = useState<any[]>(readyOrders);
  const [activeTab, setActiveTab] = useState<"ALL" | "READY" | "OUT" | "DELIVERED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Slide-over detail drawer state
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<any | null>(null);

  // Delivery confirmation modal state for drivers
  const [showCompleteModal, setShowCompleteModal] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Split orders into Active Cards (Ready, Out, Delivered) & Completed History Table
  const activeCardsList = useMemo(() => {
    let list = readyOrdersList.filter((o) => o.status !== "COMPLETED");

    if (activeTab === "READY") {
      list = list.filter((o) => o.status === "READY_FOR_DELIVERY");
    } else if (activeTab === "OUT") {
      list = list.filter((o) => o.status === "OUT_FOR_DELIVERY");
    } else if (activeTab === "DELIVERED") {
      list = list.filter((o) => o.status === "DELIVERED");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNo?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.delivery?.completedBy?.fullName?.toLowerCase().includes(q) ||
          (o.invoice?.invoiceNo && o.invoice.invoiceNo.toLowerCase().includes(q))
      );
    }

    return list;
  }, [readyOrdersList, activeTab, searchQuery]);

  const completedTableList = useMemo(() => {
    let list = readyOrdersList.filter((o) => o.status === "COMPLETED");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNo?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.delivery?.completedBy?.fullName?.toLowerCase().includes(q) ||
          (o.invoice?.invoiceNo && o.invoice.invoiceNo.toLowerCase().includes(q))
      );
    }

    return list;
  }, [readyOrdersList, searchQuery]);

  // KPI Calculations
  const kpiMetrics = useMemo(() => {
    const readyCount = readyOrdersList.filter((o) => o.status === "READY_FOR_DELIVERY").length;
    const outCount = readyOrdersList.filter((o) => o.status === "OUT_FOR_DELIVERY").length;
    const deliveredCount = readyOrdersList.filter((o) => o.status === "DELIVERED").length;
    const completedCount = readyOrdersList.filter((o) => o.status === "COMPLETED").length;

    const totalCollected = readyOrdersList.reduce((sum, o) => {
      const allocations = o.invoice?.allocations || [];
      const paid = allocations.reduce((aSum: number, a: any) => aSum + Number(a.amount || 0), 0);
      return sum + paid;
    }, 0);

    return { readyCount, outCount, deliveredCount, completedCount, totalCollected };
  }, [readyOrdersList]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStartDelivery = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action: "START_DELIVERY",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReadyOrdersList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "OUT_FOR_DELIVERY" } : o))
        );
        showToast("🚚 Delivery started! Order status updated to OUT_FOR_DELIVERY.", "success");
      } else {
        showToast(data.error || "Failed to start delivery", "error");
      }
    } catch {
      showToast("Failed to start delivery", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCompleteModal = (ord: any) => {
    const invoiceTotal = Number(ord.invoice?.total || ord.grandTotal || 0);
    const paidSum = (ord.invoice?.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const balance = Math.max(0, invoiceTotal - paidSum);

    setShowCompleteModal(ord);
    setPaymentAmount(balance > 0 ? balance.toString() : "");
    setPaymentMethod("CASH");
    setPaymentReference("");
    setDeliveryNotes("");
  };

  const handleCompleteDelivery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!showCompleteModal) return;

    setLoading(true);
    const targetOrder = showCompleteModal;
    try {
      const res = await fetch(`/api/c/${companyCode}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: targetOrder.id,
          action: "COMPLETE_DELIVERY",
          notes: deliveryNotes,
          payment: paymentAmount && Number(paymentAmount) > 0 ? {
            amount: Number(paymentAmount),
            method: paymentMethod,
            reference: paymentReference,
          } : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReadyOrdersList((prev) =>
          prev.map((o) => (o.id === targetOrder.id ? { ...o, status: "COMPLETED" } : o))
        );
        setShowCompleteModal(null);
        setSelectedDrawerOrder({ ...targetOrder, status: "COMPLETED" });
        showToast("✅ Delivery completed successfully! Invoice generated.", "success");
      } else {
        showToast(data.error || "Failed to complete delivery", "error");
      }
    } catch {
      showToast("Failed to complete delivery", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOrderCompleted = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: "COMPLETED",
          note: "Order workflow officially completed by Admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReadyOrdersList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "COMPLETED" } : o))
        );
        if (selectedDrawerOrder?.id === orderId) {
          setSelectedDrawerOrder((prev: any) => ({ ...prev, status: "COMPLETED" }));
        }
        if (showCompleteModal?.id === orderId) {
          setShowCompleteModal(null);
        }
        showToast("🎉 Order marked as COMPLETED! Moved to Completed History Table.", "success");
      } else {
        showToast(data.error || "Failed to complete order", "error");
      }
    } catch {
      showToast("Failed to complete order", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadPdf = (receiptData?: any) => {
    const data = receiptData || selectedDrawerOrder || showCompleteModal;
    if (!data) return;

    const ordNo = data.orderNo || data.order?.orderNo;
    const invNo = data.invoiceNo || data.invoice?.invoiceNo || `INV-${ordNo}`;
    const cust = data.customer;
    const items = data.items || [];
    const pk = data.pickup;

    const kgVal = pk?.actualKgCollected || pk?.items?.find((i: any) => i.pricingType === "PER_KG")?.quantity;
    const kgRateVal = pk?.kgRate || 250;

    const grandTotalVal = data.grandTotal || Number(data.invoice?.total || data.grandTotal || 0);
    const totalPaidVal = data.totalPaid !== undefined ? data.totalPaid : (data.invoice?.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const balanceVal = data.balanceRemaining !== undefined ? data.balanceRemaining : Math.max(0, grandTotalVal - totalPaidVal);
    const statusVal = data.paymentStatus || (totalPaidVal >= grandTotalVal ? "PAID" : totalPaidVal > 0 ? "PARTIALLY PAID" : "UNPAID");

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invNo}_${cust?.name || "Customer"}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; padding: 24px; line-height: 1.5; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #7C3AED; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 900; color: #5b21b6; }
            .brand-sub { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-top: 2px; }
            .invoice-no { font-size: 18px; font-weight: 900; color: #7C3AED; text-align: right; }
            .date { font-size: 11px; color: #6b7280; font-weight: 600; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; margin-bottom: 24px; }
            .customer-name { font-size: 18px; font-weight: 900; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
            .totals { width: 300px; margin-left: auto; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-weight: 600; }
            .grand-total { border-top: 2px solid #e5e7eb; padding-top: 10px; font-size: 15px; font-weight: 900; color: #111827; }
            .status-badge { display: inline-block; background: #ede9fe; color: #5b21b6; font-weight: 900; font-size: 10px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
            .kg-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 12px; margin-bottom: 16px; font-size: 12px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Wash & Well Laundry</div>
              <div class="brand-sub">Official Customer Delivery Receipt & Invoice</div>
            </div>
            <div>
              <div class="invoice-no">${invNo}</div>
              <div class="date">Delivered: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="card">
            <div class="customer-name">${cust?.name}</div>
            ${cust?.placeName ? `<div style="font-weight:bold; color:#4b5563; margin-top:2px;">🏪 ${cust.placeName}</div>` : ""}
            <div style="margin-top:4px; font-weight:600;">Phone: ${cust?.phone || "N/A"}</div>
            ${cust?.addresses?.[0]?.address ? `<div style="color:#6b7280;">Address: ${cust.addresses[0].address}</div>` : ""}
          </div>

          ${kgVal && Number(kgVal) > 0 ? `
            <div class="kg-box">
              <strong>⚖️ Bulk Washing & Cleaning (By Weight):</strong> ${kgVal} KG × LKR ${Number(kgRateVal).toLocaleString()} per KG = <strong>LKR ${(Number(kgVal) * Number(kgRateVal)).toLocaleString()}</strong>
            </div>
          ` : ""}

          <table>
            <thead>
              <tr>
                <th>Service / Garment Type / Process Treatment</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((i: any) => `
                <tr>
                  <td><strong>${i.service?.name || i.description || "Laundry Item"}</strong></td>
                  <td style="text-align:center;">${i.quantity}</td>
                  <td style="text-align:right;">LKR ${Number(i.unitPrice || 0).toLocaleString()}</td>
                  <td style="text-align:right;"><strong>LKR ${Number(i.totalPrice || i.total || 0).toLocaleString()}</strong></td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row grand-total"><span>Grand Total Bill:</span> <span>LKR ${grandTotalVal.toLocaleString()}</span></div>
            <div class="total-row" style="color:#047857; font-weight:bold;"><span>Amount Paid:</span> <span>LKR ${totalPaidVal.toLocaleString()}</span></div>
            <div class="total-row" style="color:#b91c1c; font-weight:bold;"><span>Pending Balance:</span> <span>LKR ${balanceVal.toLocaleString()}</span></div>
            <div class="total-row" style="margin-top:8px;"><span>Payment Status:</span> <span class="status-badge">${statusVal.replace("_", " ")}</span></div>
          </div>

          <div class="footer">Thank you for choosing Wash & Well Laundry! For any inquiries, please contact our support team.</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;

    const blob = new Blob([invoiceContent], { type: "text/html" });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
    } else {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${invNo}_Delivery_Invoice.html`;
      link.click();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Delivery Management & History</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Admin oversight of dispatch queues, delivered orders cards, driver logs, and completed delivery history
          </p>
        </div>
      </div>

      {/* 4 COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Ready for Delivery */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">READY FOR DELIVERY</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <PackageCheck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{kpiMetrics.readyCount}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Ready in dispatch queue
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Out for Delivery */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">OUT FOR DELIVERY</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <Truck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpiMetrics.outCount}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              En route with drivers
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Active Delivered Cards */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">ACTIVE DELIVERED CARDS</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpiMetrics.deliveredCount}</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Delivered order cards
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Completed History */}
        <div className="bg-[#f3e8ff] border border-purple-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">COMPLETED HISTORY</span>
            <div className="w-7 h-7 rounded-lg bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
              <History size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpiMetrics.completedCount}</p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Archived delivery records
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
          { id: "ALL", label: `Active Queue (${activeCardsList.length})` },
          { id: "READY", label: `Ready (${kpiMetrics.readyCount})` },
          { id: "OUT", label: `Out for Delivery (${kpiMetrics.outCount})` },
          { id: "DELIVERED", label: `Delivered Cards (${kpiMetrics.deliveredCount})` },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
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
            placeholder="Search Order #, Customer, Driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* SECTION 1: ACTIVE DELIVERED & DISPATCH ORDERS (CARDS GRID) */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-gray-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Truck size={18} className="text-[#7C3AED]" />
            Active Delivery Cards Queue ({activeCardsList.length})
          </span>
          <span className="text-[11px] text-gray-400 font-bold">
            Delivered orders require Admin completion to move to Completed Table below
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCardsList.length === 0 ? (
            <div className="col-span-full bg-white p-10 rounded-3xl border border-gray-100 text-center shadow-2xs space-y-2">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-extrabold text-gray-900">No Active Delivery Cards Pending!</h3>
              <p className="text-xs text-gray-400">
                All delivered orders have been completed by Admin and moved to the Completed History Table below.
              </p>
            </div>
          ) : (
            activeCardsList.map((ord) => {
              const invoiceTotal = Number(ord.invoice?.total || ord.grandTotal || 0);
              const paidSum = (ord.invoice?.allocations || []).reduce(
                (sum: number, a: any) => sum + Number(a.amount || 0),
                0
              );
              const balance = Math.max(0, invoiceTotal - paidSum);

              let statusColor = "bg-purple-100 text-purple-800";
              if (ord.status === "OUT_FOR_DELIVERY") statusColor = "bg-amber-100 text-amber-800";
              else if (ord.status === "DELIVERED") statusColor = "bg-emerald-100 text-emerald-800";

              const driverName = ord.delivery?.completedBy?.fullName || ord.delivery?.createdBy?.fullName;

              return (
                <div
                  key={ord.id}
                  className="bg-white border border-gray-200 p-5 rounded-3xl space-y-3.5 shadow-2xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <span className="font-black text-[#7C3AED] text-xs bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
                        {ord.orderNo}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${statusColor}`}>
                        {ord.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm">{ord.customer?.name}</h3>
                      {ord.customer?.placeName && (
                        <p className="text-xs font-bold text-gray-600">🏪 Shop: {ord.customer.placeName}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                        <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                        {ord.customer?.addresses?.[0]?.address || ord.customer?.address || "No address specified"}
                      </p>
                    </div>

                    {driverName && (
                      <div className="pt-0.5">
                        <span className="text-[10px] font-extrabold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-flex items-center gap-1">
                          <User size={11} /> Driver: {driverName}
                        </span>
                      </div>
                    )}

                    {/* LORRY LOADING MANIFEST BADGE */}
                    {(() => {
                      const loadLink = ord.laundryLoadOrders?.[0]?.load;
                      if (!loadLink) return null;
                      return (
                        <div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200/80 text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between font-black text-indigo-950">
                            <span className="flex items-center gap-1">
                              <Truck size={12} className="text-indigo-600" /> LORRY LOADING
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {loadLink.status || "LOADED"}
                              </span>
                              <span className="font-mono text-[10px] bg-indigo-200/70 px-1.5 py-0.5 rounded">
                                {loadLink.loadNumber}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-700 font-semibold space-y-0.5 pt-0.5">
                            <div><strong>Vehicle:</strong> {loadLink.vehicleNumber || "N/A"}</div>
                            <div><strong>Driver:</strong> {loadLink.driverName || driverName || "Assigned Driver"}</div>
                            {loadLink.routeName && <div><strong>Route:</strong> {loadLink.routeName}</div>}
                            <div><strong>Loaded Date:</strong> {loadLink.loadingDate ? new Date(loadLink.loadingDate).toLocaleDateString() : "Loaded"}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* FINANCIAL SUMMARY CARD */}
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs space-y-1">
                    <div className="flex justify-between text-gray-600 font-medium">
                      <span>Total Bill:</span>
                      <span className="font-bold text-gray-900">LKR {invoiceTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Paid:</span>
                      <span className="font-bold">LKR {paidSum.toLocaleString()}</span>
                    </div>
                    {balance > 0 && (
                      <div className="flex justify-between font-bold text-rose-600 pt-0.5 border-t border-gray-200">
                        <span>Balance:</span>
                        <span>LKR {balance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="space-y-2 pt-1 border-t border-gray-100">
                    {ord.status === "DELIVERED" ? (
                      <button
                        onClick={() => handleMarkOrderCompleted(ord.id)}
                        disabled={loading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} /> Mark as COMPLETED & Move to Table
                      </button>
                    ) : ord.status === "READY_FOR_DELIVERY" ? (
                      <button
                        onClick={() => handleStartDelivery(ord.id)}
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 transition"
                      >
                        Start Delivery (Out for Delivery)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openCompleteModal(ord)}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={15} /> Confirm Driver Delivery
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedDrawerOrder(ord)}
                      className="w-full py-1.5 text-gray-500 hover:text-purple-700 font-extrabold text-[11px] text-center transition"
                    >
                      View Details & Invoice →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: COMPLETED DELIVERY HISTORY TABLE (AUTOMATICALLY MOVED HERE WHEN COMPLETED) */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden space-y-2 pt-2">
        <div className="p-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
          <div>
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-[#7C3AED]" /> Completed Delivery History Table ({completedTableList.length})
            </h3>
            <p className="text-[11px] text-gray-400 font-bold mt-0.5">
              Completed orders archived here. Click any row to view full drawer details, print or download invoice.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl">
            {completedTableList.length} Archived
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-black text-[10px] uppercase border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Order No</th>
                <th className="py-3.5 px-4">Customer & Shop</th>
                <th className="py-3.5 px-4">Delivered By Driver</th>
                <th className="py-3.5 px-4">Completed Date</th>
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4 text-right">Invoice Total</th>
                <th className="py-3.5 px-4 text-right">Paid Amount</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {completedTableList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 font-bold">
                    No completed delivery history records yet. Complete orders above to move them here.
                  </td>
                </tr>
              ) : (
                completedTableList.map((ord) => {
                  const invTotal = Number(ord.invoice?.total || ord.grandTotal || 0);
                  const allocations = ord.invoice?.allocations || [];
                  const paidAmount = allocations.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
                  const balanceAmount = Math.max(0, invTotal - paidAmount);

                  const driverName = ord.delivery?.completedBy?.fullName || ord.delivery?.createdBy?.fullName || "Staff";

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedDrawerOrder(ord)}
                      className="hover:bg-purple-50/30 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-black text-[#7C3AED] bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                          {ord.orderNo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-gray-900 block">{ord.customer?.name}</span>
                        {ord.customer?.placeName && (
                          <span className="text-[10px] text-gray-500 font-bold block">🏪 {ord.customer.placeName}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-purple-900 bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200 inline-flex items-center gap-1">
                          <User size={12} /> {driverName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-[11px] font-bold" suppressHydrationWarning>
                        {new Date(ord.updatedAt || ord.createdAt).toLocaleString("en-US")}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-indigo-900">
                        {ord.invoice?.invoiceNo || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900" suppressHydrationWarning>
                        LKR {invTotal.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 font-extrabold" suppressHydrationWarning>
                        LKR {paidAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right" suppressHydrationWarning>
                        {balanceAmount > 0 ? (
                          <span className="font-extrabold text-rose-600">LKR {balanceAmount.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400 font-bold">LKR 0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800">
                          COMPLETED
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-3 py-1 bg-purple-50 text-[#7C3AED] hover:bg-purple-100 font-extrabold rounded-lg text-[11px] border border-purple-200 transition inline-flex items-center gap-1">
                          View Details <ChevronRight size={12} />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OVER DETAIL DRAWER FOR CLICKED RECORD */}
      {selectedDrawerOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedDrawerOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 text-xs font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <Truck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#7C3AED] text-[11px] bg-purple-100 px-2 py-0.5 rounded-md">
                      {selectedDrawerOrder.orderNo}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {selectedDrawerOrder.status}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-gray-900 leading-tight mt-0.5">
                    {selectedDrawerOrder.customer?.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDrawerOrder(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              
              {/* DRIVER DELIVERY METADATA BANNER */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-4 rounded-2xl text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Logistics Delivery Record</span>
                  <span className="text-[10px] font-bold text-purple-300">
                    {new Date(selectedDrawerOrder.updatedAt || selectedDrawerOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedDrawerOrder.delivery?.completedBy?.fullName && (
                  <div className="flex items-center gap-2 pt-1">
                    <User size={14} className="text-purple-300" />
                    <span className="font-extrabold text-white text-xs">
                      Delivered By Driver: {selectedDrawerOrder.delivery.completedBy.fullName}
                    </span>
                  </div>
                )}
              </div>

              {/* LORRY LOADING MANIFEST DETAILS CARD */}
              {(() => {
                const loadLink = selectedDrawerOrder.laundryLoadOrders?.[0]?.load;
                if (!loadLink) return null;
                return (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                        <Truck size={15} className="text-indigo-600" /> LORRY LOADING MANIFEST
                      </span>
                      <span className="px-2.5 py-0.5 rounded font-mono font-black text-[10px] bg-indigo-200 text-indigo-900">
                        {loadLink.loadNumber}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-800 pt-1">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Vehicle / Lorry</span>
                        <span className="font-extrabold text-gray-900">{loadLink.vehicleNumber || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Assigned Driver</span>
                        <span className="font-extrabold text-gray-900">{loadLink.driverName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Delivery Route</span>
                        <span className="font-bold text-indigo-900">{loadLink.routeName || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block uppercase">Loaded Date</span>
                        <span className="font-bold text-gray-900">
                          {loadLink.loadingDate ? new Date(loadLink.loadingDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                    {loadLink.remark && (
                      <div className="text-[11px] text-gray-600 bg-white/80 p-2 rounded-xl border border-indigo-100 mt-1">
                        <strong>Remark:</strong> {loadLink.remark}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ADMIN ACTION: MARK COMPLETED BUTTON IF STILL DELIVERED */}
              {selectedDrawerOrder.status !== "COMPLETED" && (
                <div className="bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-950 text-xs">Admin Order Completion Control</span>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Action Required</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMarkOrderCompleted(selectedDrawerOrder.id)}
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    {loading ? "Completing..." : "Mark as COMPLETED & Move to Table"}
                  </button>
                </div>
              )}

              {/* CUSTOMER PROFILE & ADDRESS */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" /> Customer Profile Details
                  </h4>
                </div>

                <div className="space-y-2 font-medium text-gray-800">
                  <p className="font-extrabold text-gray-900 text-sm">{selectedDrawerOrder.customer?.name}</p>
                  {selectedDrawerOrder.customer?.placeName && (
                    <p className="text-xs font-bold text-gray-600">🏪 Shop: {selectedDrawerOrder.customer.placeName}</p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                    <span className="text-gray-500">Phone:</span>
                    {selectedDrawerOrder.customer?.phone ? (
                      <a
                        href={`tel:${selectedDrawerOrder.customer.phone}`}
                        className="font-extrabold text-[#7C3AED] hover:underline"
                      >
                        {selectedDrawerOrder.customer.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-gray-500 shrink-0">Address:</span>
                    <span className="font-bold text-gray-900 text-right">
                      {selectedDrawerOrder.customer?.address || selectedDrawerOrder.customer?.addresses?.[0]?.address || "No address"}
                    </span>
                  </div>
                </div>

                {/* LIVE GPS LINK */}
                {selectedDrawerOrder.customer?.gpsLatitude && selectedDrawerOrder.customer?.gpsLongitude && (
                  <div className="pt-2">
                    <a
                      href={`https://www.google.com/maps?q=${selectedDrawerOrder.customer.gpsLatitude},${selectedDrawerOrder.customer.gpsLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-[11px] shadow-2xs transition"
                    >
                      <Navigation size={12} /> Open GPS Navigation Map
                    </a>
                  </div>
                )}
              </div>

              {/* Separate Bulk KG Weight Box if Laundry was collected by weight */}
              {(() => {
                const pk = selectedDrawerOrder.pickup;
                const kgVal = pk?.actualKgCollected || pk?.items?.find((i: any) => i.pricingType === "PER_KG")?.quantity;
                const kgRateVal = pk?.kgRate || 250;
                if (kgVal && Number(kgVal) > 0) {
                  return (
                    <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-between">
                      <div>
                        <span className="font-black text-sky-950 block text-xs">⚖️ Bulk Washing & Cleaning (By Weight)</span>
                        <span className="text-[10px] text-sky-700 font-bold">
                          Weight: {kgVal} KG × LKR {Number(kgRateVal).toLocaleString()} per KG
                        </span>
                      </div>
                      <span className="font-black text-sky-900 text-sm">
                        LKR {(Number(kgVal) * Number(kgRateVal)).toLocaleString()}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Itemized Services Table */}
              {selectedDrawerOrder.items && selectedDrawerOrder.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#7C3AED]" /> Itemized Services Breakdown ({selectedDrawerOrder.items.length})
                  </h4>

                  <div className="space-y-2">
                    {selectedDrawerOrder.items.map((item: any) => (
                      <div key={item.id} className="p-3 bg-white rounded-2xl border border-gray-200/80 flex items-center justify-between">
                        <div>
                          <span className="font-black text-gray-900 block">{item.service?.name || item.description || "Laundry Item"}</span>
                          <span className="text-[10px] text-gray-500 font-bold">
                            Qty: {item.quantity} × LKR {Number(item.unitPrice || 0).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-extrabold text-[#7C3AED]">
                          LKR {Number(item.totalPrice || item.total || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              {selectedDrawerOrder.invoice && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-wider">Financial Breakdown</h4>
                  <div className="flex justify-between font-bold text-gray-600">
                    <span>Invoice Number:</span>
                    <span className="text-purple-900">{selectedDrawerOrder.invoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t">
                    <span>Grand Total Bill:</span>
                    <span>LKR {Number(selectedDrawerOrder.invoice.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedDrawerOrder)}
                className="flex-1 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 transition"
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer size={15} /> Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedDrawerOrder(null)}
                className="py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DRIVER DELIVERY MODAL */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-gray-100 text-xs font-sans animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Confirm Driver Delivery</h3>
                  <p className="text-[10px] text-gray-400 font-bold">Order #{showCompleteModal.orderNo} • Customer Delivery & Payment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompleteModal(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCompleteDelivery} className="space-y-4">
              {/* Customer Details Banner */}
              <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-black text-purple-800 uppercase tracking-wider block">Customer Profile</span>
                <p className="font-black text-gray-900 text-xs">{showCompleteModal.customer?.name}</p>
                {showCompleteModal.customer?.placeName && (
                  <p className="text-[11px] font-bold text-gray-600">🏪 {showCompleteModal.customer.placeName}</p>
                )}
                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-rose-500" />
                  {showCompleteModal.customer?.addresses?.[0]?.address || showCompleteModal.customer?.address || "No address specified"}
                </p>
              </div>

              {/* Financial Calculation Summary */}
              {(() => {
                const totalBill = Number(showCompleteModal.invoice?.total || showCompleteModal.grandTotal || 0);
                const paidSoFar = (showCompleteModal.invoice?.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
                const currentBalance = Math.max(0, totalBill - paidSoFar);

                return (
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-1.5">
                    <div className="flex justify-between font-bold text-gray-600">
                      <span>Total Bill Amount:</span>
                      <span className="font-extrabold text-gray-900">LKR {totalBill.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Paid Amount So Far:</span>
                      <span>LKR {paidSoFar.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-black text-xs text-rose-600 pt-1.5 border-t border-gray-200">
                      <span>Remaining Balance to Collect:</span>
                      <span>LKR {currentBalance.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-extrabold text-gray-800 mb-1">Payment Collected Amount (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount collected..."
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="ONLINE">Online Payment</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CREDIT">Credit Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Reference / Txn ID</label>
                    <input
                      type="text"
                      placeholder="Ref # (optional)"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Delivery Remarks / Driver Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Notes (e.g. Handed over to shop owner)"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  {loading ? "Completing..." : "Confirm Delivery & Generate Invoice"}
                </button>
              </div>
            </form>
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
