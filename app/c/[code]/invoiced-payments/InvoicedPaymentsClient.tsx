"use client";

import { useState, useMemo } from "react";
import {
  CreditCard, DollarSign, Wallet, FileText, CheckCircle2, AlertCircle,
  Clock, Search, Plus, Filter, Printer, Download, X, Building2, User,
  MapPin, Check, Eye, ArrowUpRight, ChevronRight, Layers, SlidersHorizontal
} from "lucide-react";

interface InvoicedPaymentsClientProps {
  companyCode: string;
  companyId: string;
  companyName: string;
  initialInvoices: any[];
  initialPayments: any[];
}

export default function InvoicedPaymentsClient({
  companyCode,
  companyId,
  companyName,
  initialInvoices = [],
  initialPayments = [],
}: InvoicedPaymentsClientProps) {
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);
  const [payments, setPayments] = useState<any[]>(initialPayments);

  // Tabs: Cash, Credit, Bill to Bill, Cheque, Bank Transfer
  const [activeTab, setActiveTab] = useState<"CASH" | "CREDIT" | "BILL_TO_BILL" | "CHEQUE" | "BANK_TRANSFER">("CASH");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Pay Modal State
  const [payInvoiceModal, setPayInvoiceModal] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Slide-over Detail Drawer
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<any | null>(null);

  // -------------------------------------------------------------
  // DATE FORMATTER (e.g. "28 Aug 2026, 01:53 pm")
  // -------------------------------------------------------------
  const formatDateStr = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "—";

    const day = d.getDate().toString().padStart(2, "0");
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = hours.toString().padStart(2, "0");

    return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
  };

  // -------------------------------------------------------------
  // FILTERED INVOICED PAYMENTS
  // -------------------------------------------------------------
  const processedInvoiceRows = useMemo(() => {
    return invoices.map((inv) => {
      const invTotal = Number(inv.total || inv.subtotal || 0);
      const allocations = inv.allocations || [];
      const paidSum = allocations.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
      const remainingBalance = Math.max(0, invTotal - paidSum);

      const isCompleted = remainingBalance <= 0 || inv.status === "PAID";
      const statusLabel = isCompleted ? "Completed" : "Pending";

      const custName = inv.order?.customer?.name || "Walk-in Customer";
      const placeName =
        inv.order?.customer?.placeName ||
        inv.order?.customer?.addresses?.[0]?.address ||
        inv.order?.customer?.addresses?.[0]?.city ||
        "Colombo Route";

      // Detect payment method associated with this invoice
      const primaryPayment = allocations[0]?.payment;
      let methodCategory = "CASH";
      if (primaryPayment) {
        const m = primaryPayment.method;
        if (m === "CHEQUE") methodCategory = "CHEQUE";
        else if (m === "CREDIT") methodCategory = "CREDIT";
        else if (m === "BANK_TRANSFER" || m === "CARD") methodCategory = "BANK_TRANSFER";
        else if (primaryPayment.notes?.toLowerCase().includes("bill") || primaryPayment.reference?.toLowerCase().includes("bill")) {
          methodCategory = "BILL_TO_BILL";
        } else {
          methodCategory = "CASH";
        }
      } else {
        if (inv.order?.customer?.paymentTerms?.toLowerCase().includes("credit")) {
          methodCategory = "CREDIT";
        }
      }

      const detailsStr = primaryPayment?.reference
        ? primaryPayment.reference
        : primaryPayment?.notes
        ? primaryPayment.notes
        : "—";

      return {
        ...inv,
        invTotal,
        paidSum,
        remainingBalance,
        statusLabel,
        isCompleted,
        custName,
        placeName,
        methodCategory,
        detailsStr,
        createdDateFormatted: formatDateStr(inv.createdAt),
      };
    });
  }, [invoices]);

  // Tab Filtering & Search Filtering
  const filteredRows = useMemo(() => {
    return processedInvoiceRows.filter((row) => {
      // Search
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        row.invoiceNo?.toLowerCase().includes(search) ||
        row.custName.toLowerCase().includes(search) ||
        row.placeName.toLowerCase().includes(search) ||
        row.order?.orderNo?.toLowerCase().includes(search);

      // Status
      let matchesStatus = true;
      if (statusFilter === "PENDING") matchesStatus = !row.isCompleted;
      if (statusFilter === "COMPLETED") matchesStatus = row.isCompleted;

      // Method Tab
      let matchesTab = true;
      if (activeTab === "CASH") matchesTab = row.methodCategory === "CASH";
      else if (activeTab === "CREDIT") matchesTab = row.methodCategory === "CREDIT";
      else if (activeTab === "BILL_TO_BILL") matchesTab = row.methodCategory === "BILL_TO_BILL";
      else if (activeTab === "CHEQUE") matchesTab = row.methodCategory === "CHEQUE";
      else if (activeTab === "BANK_TRANSFER") matchesTab = row.methodCategory === "BANK_TRANSFER";

      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [processedInvoiceRows, searchQuery, statusFilter, activeTab]);

  // -------------------------------------------------------------
  // KPI COMPUTATIONS
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const tabRows = processedInvoiceRows.filter((r) => r.methodCategory === activeTab);
    const methodEntriesCount = tabRows.length;
    const pendingCount = tabRows.filter((r) => !r.isCompleted).length;

    const totalCollected = tabRows.reduce((sum, r) => sum + r.paidSum, 0);
    const outstandingBalance = tabRows.reduce((sum, r) => sum + r.remainingBalance, 0);

    return {
      methodEntriesCount,
      pendingCount,
      totalCollected,
      outstandingBalance,
    };
  }, [processedInvoiceRows, activeTab]);

  // -------------------------------------------------------------
  // RECORD PAYMENT HANDLER
  // -------------------------------------------------------------
  const handleOpenPayModal = (row: any) => {
    setPayInvoiceModal(row);
    setPayAmount(row.remainingBalance > 0 ? row.remainingBalance.toString() : "");
    setPayMethod(activeTab === "CHEQUE" ? "CHEQUE" : activeTab === "BANK_TRANSFER" ? "BANK_TRANSFER" : "CASH");
    setPayRef("");
    setPayNotes("");
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceModal || !payAmount || Number(payAmount) <= 0) {
      showToast("Please enter a valid payment amount", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: payInvoiceModal.id,
          amount: Number(payAmount),
          method: payMethod,
          reference: payRef,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Payment of Rs. ${Number(payAmount).toLocaleString()} recorded successfully!`, "success");
        setPayInvoiceModal(null);

        // Re-fetch updated invoices
        const refreshRes = await fetch(`/api/c/${companyCode}/invoices`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setInvoices(refreshData.data);
        }
      } else {
        showToast(data.error || "Failed to record payment", "error");
      }
    } catch {
      showToast("Failed to record payment", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // PRINT FULL REPORT HANDLER
  // -------------------------------------------------------------
  const handlePrintFullReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHTML = filteredRows.map((r) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-family: monospace;">${r.invoiceNo}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${r.custName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${r.placeName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">Rs. ${r.invTotal.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #15803d; font-weight: bold;">Rs. ${r.paidSum.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #e11d48; font-weight: bold;">Rs. ${r.remainingBalance.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${r.statusLabel}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${r.createdDateFormatted}</td>
      </tr>
    `).join("");

    const activeTabLabel = activeTab.replace("_", " ");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoiced Payments Report - ${companyName}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 25px; color: #0f172a; }
            .header { border-bottom: 2px solid #503B91; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { font-size: 22px; font-weight: 900; color: #503B91; }
            .sub { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; }
            .kpi-lbl { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .kpi-val { font-size: 18px; font-weight: 900; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px; }
            th { background: #f1f5f9; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #475569; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">${companyName}</div>
              <div class="sub">Invoiced Payments & Collections Ledger (${activeTabLabel})</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              Generated: <strong>${new Date().toLocaleString()}</strong>
            </div>
          </div>

          <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-lbl">${activeTabLabel} Entries</div><div class="kpi-val">${kpis.methodEntriesCount}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Pending</div><div class="kpi-val" style="color: #b45309;">${kpis.pendingCount}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Total Collected</div><div class="kpi-val" style="color: #15803d;">Rs. ${kpis.totalCollected.toLocaleString()}</div></div>
            <div class="kpi-card"><div class="kpi-lbl">Outstanding Balance</div><div class="kpi-val" style="color: #be123c;">Rs. ${kpis.outstandingBalance.toLocaleString()}</div></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Beat</th>
                <th style="text-align: right;">Invoice Amt</th>
                <th style="text-align: right;">Paid</th>
                <th style="text-align: right;">Remaining</th>
                <th style="text-align: center;">Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML.length > 0 ? rowsHTML : `<tr><td colspan="8" style="text-align: center; padding: 20px;">No records matching search criteria.</td></tr>`}
            </tbody>
          </table>

          <div class="footer">
            Official Wash-Well Delivery & Financial Management System
          </div>
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
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Invoiced Payments</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Invoice collections by payment type — track paid, pending, and remaining balances.
          </p>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Method Entries Card */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">
              {activeTab === "CASH" ? "Cash entries" : activeTab === "CREDIT" ? "Credit entries" : activeTab === "CHEQUE" ? "Cheque entries" : activeTab === "BILL_TO_BILL" ? "Bill to Bill entries" : "Bank Transfer entries"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <FileText size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{kpis.methodEntriesCount}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Filtered payment records
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
              Awaiting settlement
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Total Collected Card */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">TOTAL COLLECTED</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              Rs. {kpis.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Received funds
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Outstanding Balance Card */}
        <div className="bg-[#ffe4e6] border border-rose-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#be123c]">OUTSTANDING BALANCE</span>
            <div className="w-7 h-7 rounded-lg bg-[#fecdd3] text-[#e11d48] flex items-center justify-center font-bold">
              <Wallet size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              Rs. {kpis.outstandingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[9.5px] text-[#e11d48] font-medium flex items-center gap-0.5 mt-0.5">
              Uncollected balance
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#e11d48] fill-none stroke-[2]">
              <path d="M 0,14 Q 25,14 45,13 T 65,12 T 80,6 T 90,13 L 100,14" />
            </svg>
          </div>
        </div>
      </div>

      {/* PAYMENT METHOD SUB-TABS NAVIGATION BAR */}
      <div className="bg-slate-200/50 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto text-xs font-bold shadow-2xs max-w-fit">
        {[
          { id: "CASH", label: "Cash" },
          { id: "CREDIT", label: "Credit" },
          { id: "BILL_TO_BILL", label: "Bill to Bill" },
          { id: "CHEQUE", label: "Cheque" },
          { id: "BANK_TRANSFER", label: "Bank Transfer" },
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

      {/* FILTER CONTROLS & PRINT BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search input */}
        <div className="relative flex-1">
          <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice, customer, beat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Print Full Report Button */}
          <button
            type="button"
            onClick={handlePrintFullReport}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Printer size={14} /> Print Full Report
          </button>
        </div>
      </div>

      {/* INVOICED PAYMENTS TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Invoice</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Beat</th>
                <th className="py-3.5 px-4 text-right">Invoice Amt</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Remaining</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Details</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400 font-bold">
                    No invoiced payments found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedDrawerItem(row)}
                      className="hover:bg-purple-50/40 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono font-extrabold text-purple-900">
                        {row.invoiceNo}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">
                        {row.custName}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-600">
                        {row.placeName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-gray-900">
                        Rs. {row.invTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                        Rs. {row.paidSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-600">
                        Rs. {row.remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            row.isCompleted
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-gray-400 font-medium">
                        {row.detailsStr}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium text-[11px] whitespace-nowrap">
                        {row.createdDateFormatted}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {row.remainingBalance > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPayModal(row);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 transition cursor-pointer"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDrawerItem(row);
                            }}
                            className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                            title="View Invoice Details Drawer"
                          >
                            <Eye size={15} />
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

      {/* RECORD PAYMENT MODAL ("PAY" ACTION) */}
      {payInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <DollarSign size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Record Invoice Payment</h3>
                  <p className="text-[10px] text-gray-400 font-bold">{payInvoiceModal.invoiceNo} • {payInvoiceModal.custName}</p>
                </div>
              </div>
              <button onClick={() => setPayInvoiceModal(null)} className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-100 flex items-center justify-between">
                <span className="font-extrabold text-rose-950 text-xs">Remaining Balance:</span>
                <span className="font-black text-rose-700 text-sm">
                  Rs. {payInvoiceModal.remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Payment Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter payment amount..."
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Type</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CREDIT">Credit</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ref / Cheque #</label>
                  <input
                    type="text"
                    placeholder="Ref # (optional)"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Payment notes..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayInvoiceModal(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DETAIL DRAWER */}
      {selectedDrawerItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setSelectedDrawerItem(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
              
              {/* HEADER */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-[#7C3AED] uppercase tracking-wider">
                    <FileText size={13} /> Invoiced Payment Drawer
                  </div>
                  <h2 className="text-base font-black text-gray-900 mt-0.5">
                    {selectedDrawerItem.invoiceNo}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDrawerItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* BANNER CARD */}
                <div className="bg-gradient-to-br from-purple-900 to-[#503B91] p-5 rounded-2xl text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                    <span>Total Invoice Amount</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/30 border border-purple-400/40 text-purple-200">
                      {selectedDrawerItem.statusLabel}
                    </span>
                  </div>
                  <div className="text-2xl font-black">
                    Rs. {selectedDrawerItem.invTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                    <div>
                      <span className="text-purple-300 block font-bold text-[10px] uppercase">Paid Amount</span>
                      <strong className="text-emerald-300 font-extrabold">Rs. {selectedDrawerItem.paidSum.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div>
                      <span className="text-purple-300 block font-bold text-[10px] uppercase">Remaining</span>
                      <strong className="text-rose-300 font-extrabold">Rs. {selectedDrawerItem.remainingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                </div>

                {/* CUSTOMER & BEAT */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Customer & Beat Info</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Customer Name:</span>
                      <span className="font-extrabold text-gray-900">{selectedDrawerItem.custName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Beat / Location:</span>
                      <span className="font-bold text-purple-900">📍 {selectedDrawerItem.placeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold">Invoice Date:</span>
                      <span className="font-bold text-gray-800">{selectedDrawerItem.createdDateFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* ALLOCATIONS PAYMENT HISTORY */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Payment Collections History</span>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 text-gray-400 font-extrabold uppercase text-[9px]">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(selectedDrawerItem.allocations || []).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-gray-400 font-bold">
                              No payments recorded for this invoice yet.
                            </td>
                          </tr>
                        ) : (
                          selectedDrawerItem.allocations.map((alloc: any) => (
                            <tr key={alloc.id}>
                              <td className="py-2.5 px-3 text-gray-500">{new Date(alloc.payment?.paymentDate || Date.now()).toLocaleDateString()}</td>
                              <td className="py-2.5 px-3 font-bold text-gray-700">{alloc.payment?.method || "CASH"}</td>
                              <td className="py-2.5 px-3 text-right font-black text-emerald-700">Rs. {Number(alloc.amount).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                {selectedDrawerItem.remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = selectedDrawerItem;
                      setSelectedDrawerItem(null);
                      handleOpenPayModal(item);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Pay Remaining Balance
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDrawerItem(null)}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold text-xs rounded-xl transition cursor-pointer ml-auto"
                >
                  Close
                </button>
              </div>

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
