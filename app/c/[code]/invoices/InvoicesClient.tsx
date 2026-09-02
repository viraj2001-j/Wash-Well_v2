"use client";

import { useState, useMemo } from "react";
import {
  FileText, Search, Printer, X, CreditCard, CheckCircle2, AlertCircle,
  Clock, Download, Filter, Eye, RefreshCw, Layers, ShieldCheck,
  PackageCheck, Building2, MapPin, Phone, ChevronRight, Ban, Check, SlidersHorizontal
} from "lucide-react";

interface InvoicesClientProps {
  companyCode: string;
  companyId: string;
  companyName: string;
  initialInvoices: any[];
}

export default function InvoicesClient({
  companyCode,
  companyId,
  companyName,
  initialInvoices = [],
}: InvoicesClientProps) {
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [beatFilter, setBeatFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Slide-over Detail Drawer
  const [selectedInvoiceDrawer, setSelectedInvoiceDrawer] = useState<any | null>(null);

  // Status / Restock Modal
  const [selectedStatusInvoice, setSelectedStatusInvoice] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>("PAID");
  const [statusNote, setStatusNote] = useState("");

  // -------------------------------------------------------------
  // BEAT LIST (Unique routes / customer areas)
  // -------------------------------------------------------------
  const beatList = useMemo(() => {
    const beatsSet = new Set<string>();
    invoices.forEach((inv) => {
      const cust = inv.order?.customer;
      const beat = cust?.placeName || cust?.addresses?.[0]?.city || cust?.addresses?.[0]?.address;
      if (beat) beatsSet.add(beat);
    });
    return Array.from(beatsSet);
  }, [invoices]);

  // -------------------------------------------------------------
  // FILTERED INVOICES
  // -------------------------------------------------------------
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const custName = inv.order?.customer?.name || "";
      const invNo = inv.invoiceNo || "";
      const orderNo = inv.order?.orderNo || "";
      const beatStr = (
        inv.order?.customer?.placeName ||
        inv.order?.customer?.addresses?.[0]?.city ||
        inv.order?.customer?.addresses?.[0]?.address ||
        ""
      ).toLowerCase();

      const matchesSearch =
        invNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beatStr.includes(searchQuery.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === "PENDING") matchesStatus = inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID";
      else if (statusFilter === "COMPLETED") matchesStatus = inv.status === "PAID";
      else if (statusFilter === "CANCELLED") matchesStatus = inv.status === "CANCELLED";
      else if (statusFilter !== "ALL") matchesStatus = inv.status === statusFilter;

      let matchesBeat = true;
      if (beatFilter !== "ALL") {
        matchesBeat = beatStr.includes(beatFilter.toLowerCase());
      }

      return matchesSearch && matchesStatus && matchesBeat;
    });
  }, [invoices, searchQuery, statusFilter, beatFilter]);

  // -------------------------------------------------------------
  // KPI COMPUTATIONS
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const totalCount = invoices.length;
    const pendingCount = invoices.filter((i) => i.status === "UNPAID" || i.status === "PARTIALLY_PAID").length;
    const completedCount = invoices.filter((i) => i.status === "PAID").length;
    const cancelledCount = invoices.filter((i) => i.status === "CANCELLED").length;
    return { totalCount, pendingCount, completedCount, cancelledCount };
  }, [invoices]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatusInvoice) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/invoices`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedStatusInvoice.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === selectedStatusInvoice.id ? { ...i, status: newStatus } : i))
        );
        if (selectedInvoiceDrawer?.id === selectedStatusInvoice.id) {
          setSelectedInvoiceDrawer({ ...selectedInvoiceDrawer, status: newStatus });
        }
        setSelectedStatusInvoice(null);
        showToast(`Invoice ${selectedStatusInvoice.invoiceNo} status updated to ${newStatus}!`, "success");
      } else {
        showToast(data.error || "Failed to update invoice status", "error");
      }
    } catch {
      showToast("Failed to update invoice status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestockInvoice = async (inv: any) => {
    if (!confirm(`Are you sure you want to restock items and cancel invoice ${inv.invoiceNo}?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/invoices`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: inv.id,
          status: "CANCELLED",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === inv.id ? { ...i, status: "CANCELLED" } : i))
        );
        showToast(`Invoice ${inv.invoiceNo} items restocked and marked Cancelled!`, "success");
      } else {
        showToast(data.error || "Failed to restock invoice items", "error");
      }
    } catch {
      showToast("Failed to restock invoice items", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      showToast("No invoices to export", "error");
      return;
    }

    const headers = ["Invoice No", "Date", "Customer", "Beat / Address", "Cases", "Bottles / Qty", "Subtotal (LKR)", "Returns/Discount (LKR)", "Grand Total (LKR)", "Status"];
    const rows = filteredInvoices.map((inv) => {
      const custName = inv.order?.customer?.name || "Walk-in Customer";
      const beat = inv.order?.customer?.placeName || inv.order?.customer?.addresses?.[0]?.address || "—";
      const casesCount = inv.items?.filter((i: any) => i.description?.toLowerCase().includes("case") || i.description?.toLowerCase().includes("crate")).length || (inv.items?.length > 0 ? 1 : "—");
      const bottlesCount = inv.items?.reduce((sum: number, i: any) => sum + Number(i.quantity || 0), 0) || "—";
      const subtotal = Number(inv.subtotal || inv.total || 0);
      const discount = Number(inv.discount || 0);
      const total = Number(inv.total || 0);

      return [
        `"${inv.invoiceNo}"`,
        `"${new Date(inv.createdAt).toLocaleDateString()}"`,
        `"${custName}"`,
        `"${beat}"`,
        `"${casesCount}"`,
        `"${bottlesCount}"`,
        subtotal,
        discount,
        total,
        `"${inv.status}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported invoices to CSV successfully!", "success");
  };

  // Print Distribution Invoices batch / single
  const handlePrintDistributionInvoice = (invItem?: any) => {
    const targetInvoices = invItem ? [invItem] : filteredInvoices;
    if (targetInvoices.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoicesHTML = targetInvoices.map((inv) => {
      const custName = inv.order?.customer?.name || "Walk-in Customer";
      const placeName = inv.order?.customer?.placeName || inv.order?.customer?.addresses?.[0]?.address || "Main Beat";
      const phone = inv.order?.customer?.phone || "N/A";
      const subtotal = Number(inv.subtotal || inv.total || 0);
      const discount = Number(inv.discount || 0);
      const total = Number(inv.total || 0);

      const itemsRows = (inv.items || []).map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${item.description}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.description?.toLowerCase().includes("case") ? 1 : "—"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">${Number(item.quantity || 1)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">Rs. ${Number(item.unitPrice || 0).toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold;">Rs. ${Number(item.total || 0).toLocaleString()}</td>
        </tr>
      `).join("");

      return `
        <div style="page-break-after: always; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 30px; font-family: system-ui, sans-serif;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #503B91; padding-bottom: 15px; margin-bottom: 20px;">
            <div>
              <h2 style="margin: 0; color: #503B91; font-size: 22px; font-weight: 900;">${companyName}</h2>
              <p style="margin: 3px 0 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase;">Distribution Invoice Manifest</p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 18px; font-weight: 900; color: #0f172a;">${inv.invoiceNo}</span>
              <p style="margin: 2px 0 0; color: #64748b; font-size: 11px;">Date: <strong>${new Date(inv.createdAt).toLocaleDateString()}</strong></p>
              <p style="margin: 2px 0 0; color: #64748b; font-size: 11px;">Order: <strong>#${inv.order?.orderNo || "N/A"}</strong></p>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; font-size: 12px; display: flex; justify-content: space-between;">
            <div>
              <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">Customer & Location</span>
              <div style="font-weight: 900; font-size: 14px; color: #0f172a; margin-top: 2px;">${custName}</div>
              <div style="color: #475569; font-weight: 600;">📍 ${placeName}</div>
            </div>
            <div style="text-align: right;">
              <span style="color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase;">Phone / Contact</span>
              <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">📞 ${phone}</div>
              <div style="font-weight: 800; color: #503B91; text-transform: uppercase; margin-top: 4px;">Status: ${inv.status}</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase;">
                <th style="padding: 8px; text-align: left;">Item Description</th>
                <th style="padding: 8px; text-align: center;">Cases</th>
                <th style="padding: 8px; text-align: center;">Bottles / Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows.length > 0 ? itemsRows : `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #94a3b8;">No itemized details attached</td></tr>`}
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 250px; font-size: 12px; space-y: 6px;">
              <div style="display: flex; justify-content: space-between; color: #475569;"><span>Subtotal:</span> <span>Rs. ${subtotal.toLocaleString()}</span></div>
              ${discount > 0 ? `<div style="display: flex; justify-content: space-between; color: #e11d48;"><span>Returns / Discount:</span> <span>- Rs. ${discount.toLocaleString()}</span></div>` : ""}
              <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 15px; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
                <span>Net Payable:</span>
                <span>Rs. ${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Print Distribution Invoices</title></head>
        <body style="margin: 0; padding: 20px; background: white;">
          ${invoicesHTML}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Invoices</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            All generated invoices — view details and print distribution Invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={14} className="text-emerald-600" /> Excel
          </button>
          <button
            type="button"
            onClick={() => handlePrintDistributionInvoice()}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Invoices Card */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL INVOICES</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <FileText size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{kpis.totalCount}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Active ledger invoices
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">PENDING</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpis.pendingCount}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              Awaiting payment
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Completed Card */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">COMPLETED</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpis.completedCount}</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Fully settled
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Cancelled Card */}
        <div className="bg-[#ffe4e6] border border-rose-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#be123c]">CANCELLED</span>
            <div className="w-7 h-7 rounded-lg bg-[#fecdd3] text-[#e11d48] flex items-center justify-center font-bold">
              <Ban size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpis.cancelledCount}</p>
            <span className="text-[9.5px] text-[#e11d48] font-medium flex items-center gap-0.5 mt-0.5">
              Restocked / voided
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#e11d48] fill-none stroke-[2]">
              <path d="M 0,14 Q 25,14 45,13 T 65,12 T 80,6 T 90,13 L 100,14" />
            </svg>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice no. or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="UNPAID">Pending / Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Completed / Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={beatFilter}
            onChange={(e) => setBeatFilter(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer max-w-[160px] truncate"
          >
            <option value="ALL">All Beats / Areas</option>
            {beatList.map((beat) => (
              <option key={beat} value={beat}>
                {beat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* INVOICES TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Beat</th>
                <th className="py-3 px-4 text-center">Cases</th>
                <th className="py-3 px-4 text-center">Bottles</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 font-bold">
                    No generated invoices match your search query.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const custName = inv.order?.customer?.name || "Walk-in Customer";
                  const beat =
                    inv.order?.customer?.placeName ||
                    inv.order?.customer?.addresses?.[0]?.city ||
                    inv.order?.customer?.addresses?.[0]?.address ||
                    "Main Beat";

                  const casesCount = inv.items?.filter((i: any) =>
                    i.description?.toLowerCase().includes("case") || i.description?.toLowerCase().includes("crate")
                  ).length || (inv.items?.length > 0 ? 1 : "—");

                  const bottlesCount =
                    inv.items?.reduce((sum: number, i: any) => sum + Number(i.quantity || 0), 0) || "—";

                  const grossAmount = Number(inv.subtotal || inv.total || 0);
                  const discountDeduction = Number(inv.discount || 0);

                  let statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  let statusText = "Delivered";
                  if (inv.status === "UNPAID") {
                    statusBadge = "bg-amber-100 text-amber-800 border-amber-200";
                    statusText = "Pending";
                  } else if (inv.status === "PARTIALLY_PAID") {
                    statusBadge = "bg-purple-100 text-purple-800 border-purple-200";
                    statusText = "Partially Paid";
                  } else if (inv.status === "CANCELLED") {
                    statusBadge = "bg-rose-100 text-rose-800 border-rose-200";
                    statusText = "Cancelled";
                  }

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoiceDrawer(inv)}
                      className="hover:bg-purple-50/40 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-extrabold text-purple-900">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-500">
                        {new Date(inv.createdAt).toISOString().split("T")[0]}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-gray-900 block">{custName}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-600">
                        {beat}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {casesCount}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {bottlesCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-gray-900 block">
                          Rs. {grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        {discountDeduction > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            - Rs. {discountDeduction.toLocaleString("en-US", { minimumFractionDigits: 2 })} returns
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusBadge}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStatusInvoice(inv);
                              setNewStatus(inv.status === "PAID" ? "UNPAID" : "PAID");
                            }}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[10px] rounded-lg transition"
                          >
                            Status
                          </button>
                          {inv.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestockInvoice(inv);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200 transition"
                            >
                              Restock
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoiceDrawer(inv);
                            }}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg shadow-2xs transition"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OVER DETAIL DRAWER FOR VIEW */}
      {selectedInvoiceDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setSelectedInvoiceDrawer(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
              
              {/* DRAWER HEADER */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-[#7C3AED] uppercase tracking-wider">
                    <FileText size={13} /> Distribution Invoice Record
                  </div>
                  <h2 className="text-base font-black text-gray-900 mt-0.5">
                    {selectedInvoiceDrawer.invoiceNo}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceDrawer(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* DRAWER BODY */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                
                {/* 1. HIGHLIGHT CARD */}
                <div className="bg-gradient-to-br from-purple-900 to-[#503B91] p-5 rounded-2xl text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                    <span>Net Invoice Amount</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/30 border border-purple-400/40 text-purple-200">
                      {selectedInvoiceDrawer.status}
                    </span>
                  </div>
                  <div className="text-2xl font-black">
                    Rs. {Number(selectedInvoiceDrawer.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10 text-purple-100 font-medium">
                    <span>Date: <strong className="text-white font-bold">{new Date(selectedInvoiceDrawer.createdAt).toLocaleDateString()}</strong></span>
                    <span>Order: <strong className="text-white font-bold">#{selectedInvoiceDrawer.order?.orderNo || "N/A"}</strong></span>
                  </div>
                </div>

                {/* 2. CUSTOMER & BEAT DETAILS */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Customer & Distribution Beat</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Customer Name:</span>
                      <span className="font-extrabold text-gray-900">{selectedInvoiceDrawer.order?.customer?.name || "Walk-in Customer"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Beat / Area:</span>
                      <span className="font-bold text-purple-900">
                        📍 {selectedInvoiceDrawer.order?.customer?.placeName || selectedInvoiceDrawer.order?.customer?.addresses?.[0]?.address || "Main Beat"}
                      </span>
                    </div>
                    {selectedInvoiceDrawer.order?.customer?.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-bold">Phone Contact:</span>
                        <span className="font-bold text-gray-800">📞 {selectedInvoiceDrawer.order.customer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. ITEMIZATION BREAKDOWN */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Itemized Products & Quantities</span>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 text-gray-400 font-extrabold uppercase text-[9px]">
                        <tr>
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-3 text-center">Cases</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(selectedInvoiceDrawer.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-400 font-bold">
                              No items detailed on invoice.
                            </td>
                          </tr>
                        ) : (
                          selectedInvoiceDrawer.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="py-2.5 px-3 font-extrabold text-gray-900">{item.description}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-gray-600">{item.description?.toLowerCase().includes("case") ? 1 : "—"}</td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-purple-900">{Number(item.quantity || 1)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-gray-700">Rs. {Number(item.unitPrice || 0).toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right font-black text-gray-900">Rs. {Number(item.total || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. TOTALS DEDUCTION BREAKDOWN */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex justify-between text-gray-600 font-bold">
                    <span>Gross Subtotal:</span>
                    <span>Rs. {Number(selectedInvoiceDrawer.subtotal || selectedInvoiceDrawer.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {Number(selectedInvoiceDrawer.discount || 0) > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Returns & Discounts:</span>
                      <span>- Rs. {Number(selectedInvoiceDrawer.discount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-900 font-black text-sm pt-2 border-t border-gray-200">
                    <span>Net Amount Payable:</span>
                    <span>Rs. {Number(selectedInvoiceDrawer.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>

              {/* DRAWER FOOTER */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintDistributionInvoice(selectedInvoiceDrawer)}
                  className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer size={14} /> Print Distribution Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceDrawer(null)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* STATUS UPDATE MODAL */}
      {selectedStatusInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-gray-900">Update Invoice Status</h3>
              <button onClick={() => setSelectedStatusInvoice(null)} className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="font-bold text-purple-900">Invoice: {selectedStatusInvoice.invoiceNo}</p>
                <p className="text-[11px] text-gray-600 mt-1">Customer: {selectedStatusInvoice.order?.customer?.name || "Walk-in"}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="PAID">PAID / Delivered</option>
                  <option value="UNPAID">UNPAID / Pending</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatusInvoice(null)}
                  className="flex-1 py-2 bg-gray-100 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl shadow transition"
                >
                  {loading ? "Updating..." : "Save Status"}
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
