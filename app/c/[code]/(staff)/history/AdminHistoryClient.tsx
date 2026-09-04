"use client";

import { useState, useMemo } from "react";
import {
  History, Search, Filter, Calendar, User, PackageCheck, Truck, Scale,
  Receipt, DollarSign, ChevronRight, X, Building2, Navigation, Camera,
  Tag, Download, Printer, ShieldCheck, CheckCircle2, RefreshCw, FileText, Layers
} from "lucide-react";

interface AdminHistoryClientProps {
  companyCode: string;
  companyId: string;
  orders: any[];
  pickups: any[];
  deliveries: any[];
  activities: any[];
}

export default function AdminHistoryClient({
  companyCode,
  companyId,
  orders = [],
  pickups = [],
  deliveries = [],
  activities = [],
}: AdminHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<
    "ALL" | "PICKUPS" | "PROCESSING" | "DELIVERIES" | "FINANCE" | "AUDIT"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrawerOrder, setSelectedDrawerOrder] = useState<any | null>(null);

  // KPI Calculations
  const kpiMetrics = useMemo(() => {
    const totalOrdersCount = orders.length;
    const completedOrdersCount = orders.filter((o) => o.status === "COMPLETED" || o.status === "DELIVERED").length;

    const totalKgCollected = pickups.reduce((sum, p) => {
      const kgItem = p.items?.find((i: any) => i.pricingType === "PER_KG");
      return sum + Number(p.actualKgCollected || kgItem?.quantity || 0);
    }, 0);

    const totalRevenueCollected = orders.reduce((sum, o) => {
      const allocations = o.invoice?.allocations || [];
      const paid = allocations.reduce((aSum: number, a: any) => aSum + Number(a.amount || 0), 0);
      return sum + paid;
    }, 0);

    return { totalOrdersCount, completedOrdersCount, totalKgCollected, totalRevenueCollected };
  }, [orders, pickups]);

  // Filtered orders / records list based on tab & search query
  const filteredRecords = useMemo(() => {
    let list = [...orders];

    if (activeTab === "PICKUPS") {
      list = list.filter((o) => o.pickup !== null || o.status === "COLLECTED");
    } else if (activeTab === "PROCESSING") {
      list = list.filter((o) => o.status === "PROCESSING" || o.processing !== null);
    } else if (activeTab === "DELIVERIES") {
      list = list.filter((o) => ["READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(o.status));
    } else if (activeTab === "FINANCE") {
      list = list.filter((o) => {
        const allocations = o.invoice?.allocations || [];
        return allocations.length > 0;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNo?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.pickup?.collectedBy?.fullName?.toLowerCase().includes(q) ||
          o.delivery?.completedBy?.fullName?.toLowerCase().includes(q) ||
          (o.invoice?.invoiceNo && o.invoice.invoiceNo.toLowerCase().includes(q))
      );
    }

    return list;
  }, [orders, activeTab, searchQuery]);

  const handlePrintDrawerInvoice = () => {
    window.print();
  };

  const handleDownloadDrawerPdf = (data: any) => {
    if (!data) return;

    const ordNo = data.orderNo;
    const invNo = data.invoice?.invoiceNo || `INV-${ordNo}`;
    const cust = data.customer;
    const items = data.items || [];
    const pk = data.pickup;

    const kgVal = pk?.actualKgCollected || pk?.items?.find((i: any) => i.pricingType === "PER_KG")?.quantity;
    const kgRateVal = pk?.kgRate || 250;

    const grandTotalVal = Number(data.invoice?.total || data.grandTotal || 0);
    const totalPaidVal = (data.invoice?.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const balanceVal = Math.max(0, grandTotalVal - totalPaidVal);
    const statusVal = totalPaidVal >= grandTotalVal ? "PAID" : totalPaidVal > 0 ? "PARTIALLY PAID" : "UNPAID";

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
            .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
            .totals { width: 300px; margin-left: auto; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-weight: 600; }
            .grand-total { border-top: 2px solid #e5e7eb; padding-top: 10px; font-size: 15px; font-weight: 900; color: #111827; }
            .kg-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 12px; margin-bottom: 16px; font-size: 12px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Wash & Well Laundry</div>
              <div class="brand-sub">Admin Operations Audit Invoice</div>
            </div>
            <div>
              <div class="invoice-no">${invNo}</div>
              <div class="date">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="card">
            <div style="font-size:18px; font-weight:900;">${cust?.name}</div>
            ${cust?.placeName ? `<div style="font-weight:bold; color:#4b5563;">🏪 ${cust.placeName}</div>` : ""}
            <div style="margin-top:4px; font-weight:600;">Phone: ${cust?.phone || "N/A"}</div>
            <div>Address: ${cust?.addresses?.[0]?.address || cust?.address || "N/A"}</div>
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
          </div>

          <div class="footer">Thank you for choosing Wash & Well Laundry!</div>
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
      link.download = `${invNo}_Admin_History.html`;
      link.click();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Admin Complete Operations & History</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Full operational history across driver pickups, collections, processing, deliveries, billing & audit feeds
          </p>
        </div>
      </div>

      {/* 4 COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Operations */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL OPERATIONS</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <History size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{kpiMetrics.totalOrdersCount}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Logged operations
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Total Laundry Weight */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">TOTAL LAUNDRY WEIGHT</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <Scale size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpiMetrics.totalKgCollected} KG</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Accumulated laundry weight
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
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpiMetrics.completedOrdersCount}</p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Fulfilled orders
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#7c3aed] fill-none stroke-[2]">
              <path d="M 0,12 Q 20,11 40,9 T 60,10 T 80,8 L 100,9" />
            </svg>
          </div>
        </div>

        {/* Total Revenue Collected */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">TOTAL REVENUE</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">LKR {kpiMetrics.totalRevenueCollected.toLocaleString()}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              Accumulated collections
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="bg-slate-200/50 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto text-xs font-bold shadow-2xs max-w-fit">
        {[
          { id: "ALL", label: `All Operations (${orders.length})` },
          { id: "PICKUPS", label: `Driver Pickups (${pickups.length})` },
          { id: "PROCESSING", label: "Processing & Washing" },
          { id: "DELIVERIES", label: `Deliveries (${deliveries.length})` },
          { id: "FINANCE", label: "Billing & Financial Payments" },
          { id: "AUDIT", label: `Audit Feed (${activities.length})` },
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

      {/* MAIN DATA TABLE / AUDIT FEED */}
      {activeTab === "AUDIT" ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7C3AED]" /> Organization System Audit Logs ({activities.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-black text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                      {new Date(act.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {act.user?.fullName || "System"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                        {act.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-semibold">{act.entityType}</td>
                    <td className="py-3 px-4 text-gray-800">{act.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-black text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">Order No</th>
                  <th className="py-3.5 px-4">Customer & Shop</th>
                  <th className="py-3.5 px-4">Staff / Driver</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4 text-right">Invoice Total</th>
                  <th className="py-3.5 px-4 text-right">Paid Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400 font-bold">
                      No operational history records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((ord) => {
                    const invTotal = Number(ord.invoice?.total || ord.grandTotal || 0);
                    const allocations = ord.invoice?.allocations || [];
                    const paidAmount = allocations.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
                    const balanceAmount = Math.max(0, invTotal - paidAmount);

                    let statusTagColor = "bg-purple-100 text-purple-800";
                    if (ord.status === "PROCESSING") statusTagColor = "bg-indigo-100 text-indigo-800";
                    else if (ord.status === "READY_FOR_DELIVERY") statusTagColor = "bg-purple-100 text-purple-800";
                    else if (ord.status === "OUT_FOR_DELIVERY") statusTagColor = "bg-amber-100 text-amber-800";
                    else if (ord.status === "DELIVERED") statusTagColor = "bg-emerald-100 text-emerald-800";
                    else if (ord.status === "COMPLETED") statusTagColor = "bg-teal-100 text-teal-800";

                    const staffName = ord.delivery?.completedBy?.fullName || ord.pickup?.collectedBy?.fullName || ord.createdBy?.fullName || "Staff";

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
                            <User size={12} /> {staffName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px] font-bold">
                          {new Date(ord.updatedAt || ord.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-indigo-900">
                          {ord.invoice?.invoiceNo || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-gray-900">
                          LKR {invTotal.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-700 font-extrabold">
                          LKR {paidAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {balanceAmount > 0 ? (
                            <span className="font-extrabold text-rose-600">LKR {balanceAmount.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400 font-bold">LKR 0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${statusTagColor}`}>
                            {ord.status}
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
      )}

      {/* SLIDE-OVER DETAIL DRAWER */}
      {selectedDrawerOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedDrawerOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 text-xs font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <History className="w-5 h-5 stroke-[2.2]" />
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
              
              {/* STAFF & TIMESTAMP BANNER */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-4 rounded-2xl text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Admin Operations History Record</span>
                  <span className="text-[10px] font-bold text-purple-300">
                    {new Date(selectedDrawerOrder.updatedAt || selectedDrawerOrder.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs text-purple-200 block font-medium">Assigned Staff / Driver:</span>
                    <h4 className="text-sm font-black text-white">
                      {selectedDrawerOrder.delivery?.completedBy?.fullName || selectedDrawerOrder.pickup?.collectedBy?.fullName || selectedDrawerOrder.createdBy?.fullName || "Staff Member"}
                    </h4>
                  </div>
                </div>
              </div>

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
                onClick={() => handleDownloadDrawerPdf(selectedDrawerOrder)}
                className="flex-1 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 transition"
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                type="button"
                onClick={handlePrintDrawerInvoice}
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

    </div>
  );
}
