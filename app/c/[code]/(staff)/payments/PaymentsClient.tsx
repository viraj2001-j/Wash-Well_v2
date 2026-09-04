"use client";

import { useState, useMemo } from "react";
import {
  CreditCard, DollarSign, Wallet, FileText, CheckCircle2, AlertCircle,
  Clock, Search, Plus, Filter, ArrowUpRight, ArrowDownLeft, X,
  Building2, User, Printer, Download, Check, ShieldCheck, RefreshCw,
  AlertTriangle, Calendar, Layers, ChevronRight, Eye, Phone, MapPin, Tag,
  Receipt, Info, ExternalLink
} from "lucide-react";

interface PaymentsClientProps {
  companyCode: string;
  companyId: string;
  initialPayments: any[];
  initialPendingInvoices: any[];
  initialCreditCustomers: any[];
}

export default function PaymentsClient({
  companyCode,
  companyId,
  initialPayments = [],
  initialPendingInvoices = [],
  initialCreditCustomers = [],
}: PaymentsClientProps) {
  const [payments, setPayments] = useState<any[]>(initialPayments);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>(initialPendingInvoices);
  const [creditCustomers, setCreditCustomers] = useState<any[]>(initialCreditCustomers);

  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "CHEQUE" | "CREDIT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Record Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [chequeDate, setChequeDate] = useState("");

  // Cheque Action Modal
  const [selectedChequePayment, setSelectedChequePayment] = useState<any | null>(null);
  const [chequeAction, setChequeAction] = useState<"CLEARED" | "BOUNCED" | "CANCELLED">("CLEARED");
  const [chequeActionNote, setChequeActionNote] = useState("");

  // Customer Credit Settlement Modal
  const [selectedCreditCust, setSelectedCreditCust] = useState<any | null>(null);

  // Slide-over detail drawer state
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<{
    type: "PAYMENT" | "INVOICE" | "CREDIT_CUSTOMER";
    data: any;
  } | null>(null);

  const handlePrintReceipt = (item: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const isPayment = selectedDrawerItem?.type === "PAYMENT";
    const isInvoice = selectedDrawerItem?.type === "INVOICE";
    
    const title = isPayment ? `Receipt #${item.id?.slice(-8)}` : isInvoice ? `Invoice #${item.invoiceNo}` : `Credit Ledger - ${item.name}`;
    const amountStr = isPayment 
      ? Number(item.amount || 0).toLocaleString() 
      : isInvoice 
      ? Number(item.total || 0).toLocaleString()
      : Number(item.orders?.reduce((sum: number, o: any) => sum + Number(o.invoice?.total || 0), 0) || 0).toLocaleString();

    const customerName = item.order?.customer?.name || item.customer?.name || item.name || "Walk-in Customer";
    const orderNo = item.order?.orderNo || (item.orders && item.orders[0]?.orderNo);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 450px; margin: auto; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; margin-bottom: 20px; }
            .brand { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #503B91; }
            .sub { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 4px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 13px; }
            .bold { font-weight: 700; color: #0f172a; }
            .amount-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; text-align: center; margin: 20px 0; }
            .amount-val { font-size: 26px; font-weight: 900; color: #15803d; }
            .amount-lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
            .divider { border-top: 1px solid #e2e8f0; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">WASH-WELL LAUNDRY</div>
            <div class="sub">Official Transaction Summary & Receipt</div>
          </div>

          <div class="row"><span>Document Ref:</span> <span class="bold">${item.id || item.invoiceNo || "N/A"}</span></div>
          <div class="row"><span>Date & Time:</span> <span>${new Date(item.paymentDate || item.createdAt || Date.now()).toLocaleString()}</span></div>
          <div class="row"><span>Customer:</span> <span class="bold">${customerName}</span></div>
          ${orderNo ? `<div class="row"><span>Order Number:</span> <span class="bold">#${orderNo}</span></div>` : ""}
          ${item.method ? `<div class="row"><span>Payment Method:</span> <span class="bold">${item.method}</span></div>` : ""}
          ${item.reference ? `<div class="row"><span>Reference / Cheque #:</span> <span class="bold">${item.reference}</span></div>` : ""}
          ${item.status ? `<div class="row"><span>Status:</span> <span class="bold">${item.status}</span></div>` : ""}

          <div class="amount-card">
            <div class="amount-lbl">Total Amount</div>
            <div class="amount-val">LKR ${amountStr}</div>
          </div>

          ${item.notes ? `<div class="row"><span>Notes:</span> <span class="bold">${item.notes}</span></div>` : ""}

          <div class="footer">
            <p>Thank you for trusting Wash-Well Laundry Facility Management!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // -------------------------------------------------------------
  // KPI COMPUTATIONS
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const totalCollected = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalReceivables = pendingInvoices.reduce((sum, inv) => {
      const paidSum = (inv.allocations || []).reduce((aSum: number, a: any) => aSum + Number(a.amount || 0), 0);
      return sum + Math.max(0, Number(inv.total || 0) - paidSum);
    }, 0);

    const pendingCheques = payments.filter((p) => p.method === "CREDIT" || p.notes?.toLowerCase().includes("bank") || p.status === "PENDING");
    const pendingChequesCount = pendingCheques.length;
    const pendingChequesAmount = pendingCheques.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const creditCount = creditCustomers.filter((c) => {
      const unpaidOrders = c.orders || [];
      return unpaidOrders.length > 0;
    }).length;

    return { totalCollected, totalReceivables, pendingChequesCount, pendingChequesAmount, creditCount };
  }, [payments, pendingInvoices, creditCustomers]);

  // -------------------------------------------------------------
  // FILTERED PAYMENT FEED
  // -------------------------------------------------------------
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.order?.orderNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.order?.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod = methodFilter === "ALL" || p.method === methodFilter;
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [payments, searchQuery, methodFilter, statusFilter]);

  // Cheque list specifically
  const chequeList = useMemo(() => {
    return payments.filter((p) => p.notes?.toLowerCase().includes("bank") || p.method === "CREDIT" || p.reference?.toLowerCase().includes("chq") || p.status === "PENDING");
  }, [payments]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const openPaymentForInvoice = (inv: any) => {
    const invTotal = Number(inv.total || 0);
    const paidSum = (inv.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    const balance = Math.max(0, invTotal - paidSum);

    setSelectedInvoiceId(inv.id);
    setPayAmount(balance > 0 ? balance.toString() : "");
    setPayMethod("CASH");
    setPayRef("");
    setPayNotes("");
    setChequeBank("");
    setChequeDate("");
    setShowRecordModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      showToast("Please enter a valid payment amount.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId || undefined,
          amount: Number(payAmount),
          method: payMethod,
          reference: payRef,
          notes: payNotes,
          chequeBank,
          chequeDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPayments([data.data, ...payments]);
        setShowRecordModal(false);
        showToast("Payment recorded successfully!", "success");

        // Refresh list silently
        const refreshRes = await fetch(`/api/c/${companyCode}/payments`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setPayments(refreshData.data.payments);
          setPendingInvoices(refreshData.data.pendingInvoices);
          setCreditCustomers(refreshData.data.creditCustomers);
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

  const handleUpdatePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChequePayment) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: selectedChequePayment.id,
          status: chequeAction,
          note: chequeActionNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPayments((prev) =>
          prev.map((p) => (p.id === selectedChequePayment.id ? { ...p, status: chequeAction } : p))
        );
        setSelectedChequePayment(null);
        setChequeActionNote("");
        showToast(`Payment status updated to ${chequeAction}!`, "success");

        // Refresh data
        const refreshRes = await fetch(`/api/c/${companyCode}/payments`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setPayments(refreshData.data.payments);
          setPendingInvoices(refreshData.data.pendingInvoices);
          setCreditCustomers(refreshData.data.creditCustomers);
        }
      } else {
        showToast(data.error || "Failed to update payment status", "error");
      }
    } catch {
      showToast("Failed to update payment status", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Payments & Accounts Ledger</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Admin oversight across revenue collections, pending customer billing, cheque clearance, and credit ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedInvoiceId("");
              setPayAmount("");
              setPayMethod("CASH");
              setPayRef("");
              setPayNotes("");
              setShowRecordModal(true);
            }}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} /> Record New Payment
          </button>
        </div>
      </div>

      {/* 4 DISTINCTLY STYLED COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Revenue Collected */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL REVENUE</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">
              LKR {kpis.totalCollected.toLocaleString()}
            </p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Completed payment settlements
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-[#ffe4e6] border border-rose-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#be123c]">RECEIVABLES</span>
            <div className="w-7 h-7 rounded-lg bg-[#fecdd3] text-[#e11d48] flex items-center justify-center font-bold">
              <Wallet size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              LKR {kpis.totalReceivables.toLocaleString()}
            </p>
            <span className="text-[9.5px] text-[#e11d48] font-medium flex items-center gap-0.5 mt-0.5">
              {pendingInvoices.length} Unpaid / Partial Invoices
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#e11d48] fill-none stroke-[2]">
              <path d="M 0,14 Q 25,14 45,13 T 65,12 T 80,6 T 90,13 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Pending Cheques */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">PENDING CHEQUES</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {kpis.pendingChequesCount} Cheques
            </p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              LKR {kpis.pendingChequesAmount.toLocaleString()} in clearance
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Credit Accounts Ledger */}
        <div className="bg-[#f3e8ff] border border-purple-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">CREDIT LEDGER</span>
            <div className="w-7 h-7 rounded-lg bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
              <Building2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {kpis.creditCount} Accounts
            </p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Active credit customers with balance
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
          { id: "ALL", label: `All Payments (${payments.length})`, icon: CreditCard },
          { id: "PENDING", label: `Pending Invoices (${pendingInvoices.length})`, icon: Clock },
          { id: "CHEQUE", label: `Cheque Management (${chequeList.length})`, icon: Wallet },
          { id: "CREDIT", label: `Credit Ledger (${creditCustomers.length})`, icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
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
              <Icon size={14} className={active ? "text-[#4f46e5]" : "text-slate-400"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* FILTER CONTROLS TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search payment #, ref, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* TAB CONTENT 1: ALL PAYMENTS LOG */}
      {activeTab === "ALL" && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden space-y-2">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="font-extrabold text-xs text-gray-900">All Collections & Payment Feed</span>
            <div className="flex items-center gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-extrabold text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Payment ID / Date</th>
                  <th className="py-3 px-4">Customer & Order #</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Ref / Notes</th>
                  <th className="py-3 px-4 text-right">Amount (LKR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 font-bold">
                      No payments found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    let statusBadge = "bg-emerald-100 text-emerald-800";
                    if (p.status === "PENDING") statusBadge = "bg-amber-100 text-amber-800";
                    if (p.status === "CANCELLED" || p.status === "FAILED") statusBadge = "bg-rose-100 text-rose-800";

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedDrawerItem({ type: "PAYMENT", data: p })}
                        className="hover:bg-purple-50/40 transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-purple-900 block">{p.id.slice(-8)}</span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-gray-900 block">{p.order?.customer?.name || "Walk-in Customer"}</span>
                          {p.order?.orderNo && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                              Order #{p.order.orderNo}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-gray-600">
                          {p.reference && <strong className="text-gray-900 block font-mono text-[11px]">Ref: {p.reference}</strong>}
                          <span className="text-[10px] text-gray-500">{p.notes || "No remarks"}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-gray-900 text-sm">
                          LKR {Number(p.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${statusBadge}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChequePayment(p);
                                }}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg shadow-2xs"
                              >
                                Update Status
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerItem({ type: "PAYMENT", data: p });
                              }}
                              className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition"
                              title="View Payment Details Drawer"
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
      )}

      {/* TAB CONTENT 2: PENDING BILLING / UNPAID INVOICES */}
      {activeTab === "PENDING" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden space-y-2">
          <div className="p-4 border-b border-gray-100 bg-amber-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-amber-950 text-xs">Unpaid & Partially Paid Customer Invoices</h3>
              <p className="text-[10px] text-amber-700 font-bold mt-0.5">Collect payments against customer invoices</p>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 font-black text-[11px] rounded-lg">
              {pendingInvoices.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-extrabold text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 font-bold">
                      🎉 Great news! All customer invoices are fully paid.
                    </td>
                  </tr>
                ) : (
                  pendingInvoices.map((inv) => {
                    const invTotal = Number(inv.total || 0);
                    const paidSum = (inv.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
                    const balance = Math.max(0, invTotal - paidSum);

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setSelectedDrawerItem({ type: "INVOICE", data: inv })}
                        className="hover:bg-amber-50/40 transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-purple-900 block">{inv.invoiceNo}</span>
                          <span className="text-[10px] text-gray-400 font-bold">Order #{inv.order?.orderNo}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 block">{inv.order?.customer?.name}</span>
                          {inv.order?.customer?.phone && (
                            <span className="text-[10px] text-gray-400">{inv.order.customer.phone}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-gray-900">
                          LKR {invTotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          LKR {paidSum.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                          LKR {balance.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentForInvoice(inv);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 transition"
                            >
                              Record Payment
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerItem({ type: "INVOICE", data: inv });
                              }}
                              className="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg transition"
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
      )}

      {/* TAB CONTENT 3: CHEQUE MANAGEMENT */}
      {activeTab === "CHEQUE" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden space-y-2">
          <div className="p-4 border-b border-gray-100 bg-purple-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-purple-950 text-xs">Cheque Clearance & Bounced Cheque Tracking</h3>
              <p className="text-[10px] text-purple-700 font-bold mt-0.5">Manage bank cheque deposits and clearance statuses</p>
            </div>
            <span className="px-2.5 py-0.5 bg-purple-200 text-purple-900 font-black text-[11px] rounded-lg">
              {chequeList.length} Cheques Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-extrabold text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Payment ID / Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Bank / Cheque Details</th>
                  <th className="py-3 px-4 text-right">Cheque Amount</th>
                  <th className="py-3 px-4 text-center">Clearance Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chequeList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 font-bold">
                      No cheques registered in system.
                    </td>
                  </tr>
                ) : (
                  chequeList.map((chq) => {
                    return (
                      <tr
                        key={chq.id}
                        onClick={() => setSelectedDrawerItem({ type: "PAYMENT", data: chq })}
                        className="hover:bg-purple-50/40 transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-extrabold text-gray-900 block">{chq.id.slice(-8)}</span>
                          <span className="text-[10px] text-gray-400">{new Date(chq.paymentDate).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          {chq.order?.customer?.name || "Walk-in Customer"}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <span className="font-bold text-purple-900 block">{chq.reference || "No Cheque No"}</span>
                          <span className="text-[10px] text-gray-500">{chq.notes || "No Bank specified"}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-gray-900 text-sm">
                          LKR {Number(chq.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            chq.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                            chq.status === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {chq.status === "COMPLETED" ? "CLEARED" : chq.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChequePayment(chq);
                              }}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition"
                            >
                              Manage Clearance
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerItem({ type: "PAYMENT", data: chq });
                              }}
                              className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg transition"
                              title="View Details Drawer"
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
      )}

      {/* TAB CONTENT 4: CREDIT LEDGER */}
      {activeTab === "CREDIT" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden space-y-2">
          <div className="p-4 border-b border-gray-100 bg-indigo-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-indigo-950 text-xs">Customer Credit & Debtors Ledger</h3>
              <p className="text-[10px] text-indigo-700 font-bold mt-0.5">Track customer credit terms, credit limits, and outstanding debt</p>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-200 text-indigo-900 font-black text-[11px] rounded-lg">
              {creditCustomers.length} Credit Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-extrabold text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Customer Name & Shop</th>
                  <th className="py-3 px-4">Customer Type</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Credit Period</th>
                  <th className="py-3 px-4 text-right">Outstanding Debt</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creditCustomers.map((cust) => {
                  const unpaidOrders = cust.orders || [];
                  const debt = unpaidOrders.reduce((sum: number, ord: any) => {
                    const inv = ord.invoice;
                    if (!inv) return sum;
                    const paid = (inv.allocations || []).reduce((aSum: number, a: any) => aSum + Number(a.amount || 0), 0);
                    return sum + Math.max(0, Number(inv.total || 0) - paid);
                  }, 0);

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedDrawerItem({ type: "CREDIT_CUSTOMER", data: cust })}
                      className="hover:bg-indigo-50/40 transition cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-gray-900 block">{cust.name}</span>
                        {cust.placeName && <span className="text-[10px] text-gray-400 font-bold">🏪 {cust.placeName}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-700">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded border border-purple-100 text-[10px]">
                          {cust.customerType || "Standard"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-gray-800">
                        {cust.creditLimit ? `LKR ${Number(cust.creditLimit).toLocaleString()}` : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-gray-700">
                        {cust.creditPeriodDays ? `${cust.creditPeriodDays} Days` : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                        LKR {debt.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {debt > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCreditCust(cust);
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition"
                            >
                              Settle Balance
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-black">No Debt</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDrawerItem({ type: "CREDIT_CUSTOMER", data: cust });
                            }}
                            className="p-1.5 text-indigo-700 hover:bg-indigo-100 rounded-lg transition"
                            title="View Credit Ledger Drawer"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-gray-100 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">Record Customer Payment</h3>
                  <p className="text-[10px] text-gray-400 font-bold">Admin Revenue & Collection Entry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordModal(false)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block font-extrabold text-gray-800 mb-1">Select Target Invoice (Optional)</label>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    const invId = e.target.value;
                    setSelectedInvoiceId(invId);
                    const inv = pendingInvoices.find((i) => i.id === invId);
                    if (inv) {
                      const invTotal = Number(inv.total || 0);
                      const paidSum = (inv.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
                      setPayAmount(Math.max(0, invTotal - paidSum).toString());
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">-- Standalone / General Payment --</option>
                  {pendingInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} • {inv.order?.customer?.name} (Bal: LKR {(Number(inv.total || 0) - (inv.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0)).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-extrabold text-gray-800 mb-1">Payment Amount (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount..."
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT">Credit Account</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ref / Cheque #</label>
                  <input
                    type="text"
                    placeholder="Ref # (optional)"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {payMethod === "CHEQUE" && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block font-bold text-purple-900 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Commercial Bank"
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-purple-900 mb-1">Cheque Date</label>
                    <input
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? "Recording..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGING CHEQUE MODAL */}
      {selectedChequePayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-gray-900">Manage Cheque Clearance</h3>
              <button onClick={() => setSelectedChequePayment(null)} className="text-gray-400 hover:text-gray-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdatePaymentStatus} className="space-y-4">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="font-bold text-purple-900">Cheque Amount: LKR {Number(selectedChequePayment.amount || 0).toLocaleString()}</p>
                <p className="text-[11px] text-gray-600 mt-1">Reference: {selectedChequePayment.reference || "No Ref"}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-800 mb-1">Clearance Action</label>
                <select
                  value={chequeAction}
                  onChange={(e) => setChequeAction(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                >
                  <option value="COMPLETED">Mark as CLEARED (Complete)</option>
                  <option value="FAILED">Mark as BOUNCED (Failed)</option>
                  <option value="CANCELLED">Cancel Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Action Notes / Reason</label>
                <textarea
                  rows={2}
                  placeholder="Reason for bounce or clearance note..."
                  value={chequeActionNote}
                  onChange={(e) => setChequeActionNote(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedChequePayment(null)}
                  className="flex-1 py-2 bg-gray-100 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 py-2 bg-purple-600 text-white font-extrabold rounded-xl shadow"
                >
                  Update Clearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DETAIL DRAWER */}
      {selectedDrawerItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setSelectedDrawerItem(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300 font-sans">
              
              {/* DRAWER HEADER */}
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-[#7C3AED] uppercase tracking-wider">
                    <Receipt size={13} />
                    {selectedDrawerItem.type === "PAYMENT"
                      ? "Payment Record Drawer"
                      : selectedDrawerItem.type === "INVOICE"
                      ? "Customer Invoice Drawer"
                      : "Credit Account Ledger Drawer"}
                  </div>
                  <h2 className="text-base font-black text-gray-900 mt-0.5">
                    {selectedDrawerItem.type === "PAYMENT"
                      ? `Payment #${selectedDrawerItem.data.id?.slice(-8)}`
                      : selectedDrawerItem.type === "INVOICE"
                      ? `Invoice #${selectedDrawerItem.data.invoiceNo}`
                      : selectedDrawerItem.data.name}
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

              {/* DRAWER BODY */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                
                {/* 1. HIGHLIGHT BANNER */}
                {selectedDrawerItem.type === "PAYMENT" && (
                  <div className="bg-gradient-to-br from-purple-900 to-[#503B91] p-4.5 rounded-2xl text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                      <span>Total Payment Amount</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        selectedDrawerItem.data.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        selectedDrawerItem.data.status === "PENDING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}>
                        {selectedDrawerItem.data.status}
                      </span>
                    </div>
                    <div className="text-2xl font-black">
                      LKR {Number(selectedDrawerItem.data.amount || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10 text-purple-100 font-medium">
                      <span>Method: <strong className="text-white font-bold">{selectedDrawerItem.data.method}</strong></span>
                      <span>Date: <strong className="text-white font-bold">{new Date(selectedDrawerItem.data.paymentDate).toLocaleDateString()}</strong></span>
                    </div>
                  </div>
                )}

                {selectedDrawerItem.type === "INVOICE" && (
                  <div className="bg-gradient-to-br from-amber-900 to-amber-950 p-4.5 rounded-2xl text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                      <span>Invoice Total & Status</span>
                      <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-full text-[10px] font-black uppercase">
                        {selectedDrawerItem.data.status}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-amber-100">
                      LKR {Number(selectedDrawerItem.data.total || 0).toLocaleString()}
                    </div>
                    {(() => {
                      const invTotal = Number(selectedDrawerItem.data.total || 0);
                      const paidSum = (selectedDrawerItem.data.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
                      const balance = Math.max(0, invTotal - paidSum);
                      return (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                          <div>
                            <span className="text-amber-300 block font-bold text-[10px] uppercase">Paid Amount</span>
                            <strong className="text-emerald-300 font-extrabold">LKR {paidSum.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-amber-300 block font-bold text-[10px] uppercase">Remaining Balance</span>
                            <strong className="text-rose-300 font-extrabold">LKR {balance.toLocaleString()}</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedDrawerItem.type === "CREDIT_CUSTOMER" && (
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4.5 rounded-2xl text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                      <span>Credit Ledger Overview</span>
                      <span className="px-2 py-0.5 bg-purple-500/30 border border-purple-400/40 text-purple-200 rounded-full text-[10px] font-black uppercase">
                        {selectedDrawerItem.data.customerType || "Standard"}
                      </span>
                    </div>
                    {(() => {
                      const unpaidOrders = selectedDrawerItem.data.orders || [];
                      const debt = unpaidOrders.reduce((sum: number, ord: any) => {
                        const inv = ord.invoice;
                        if (!inv) return sum;
                        const paid = (inv.allocations || []).reduce((aSum: number, a: any) => aSum + Number(a.amount || 0), 0);
                        return sum + Math.max(0, Number(inv.total || 0) - paid);
                      }, 0);
                      return (
                        <>
                          <div className="text-2xl font-black text-rose-300">
                            LKR {debt.toLocaleString()}
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                            <div>
                              <span className="text-indigo-300 block font-bold text-[10px] uppercase">Credit Limit</span>
                              <strong className="text-white font-extrabold">{selectedDrawerItem.data.creditLimit ? `LKR ${Number(selectedDrawerItem.data.creditLimit).toLocaleString()}` : "N/A"}</strong>
                            </div>
                            <div>
                              <span className="text-indigo-300 block font-bold text-[10px] uppercase">Credit Period</span>
                              <strong className="text-white font-extrabold">{selectedDrawerItem.data.creditPeriodDays ? `${selectedDrawerItem.data.creditPeriodDays} Days` : "N/A"}</strong>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 2. CUSTOMER INFORMATION */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2 font-extrabold text-gray-900 text-xs border-b border-gray-200/60 pb-2">
                    <User size={14} className="text-[#7C3AED]" /> Customer Information
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">Customer Name:</span>
                      <span className="font-extrabold text-gray-900">
                        {selectedDrawerItem.type === "PAYMENT"
                          ? selectedDrawerItem.data.order?.customer?.name || "Walk-in Customer"
                          : selectedDrawerItem.type === "INVOICE"
                          ? selectedDrawerItem.data.order?.customer?.name || "Walk-in Customer"
                          : selectedDrawerItem.data.name}
                      </span>
                    </div>
                    {((selectedDrawerItem.type === "PAYMENT" && selectedDrawerItem.data.order?.customer?.placeName) ||
                      (selectedDrawerItem.type === "INVOICE" && selectedDrawerItem.data.order?.customer?.placeName) ||
                      selectedDrawerItem.data.placeName) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-bold">Shop / Place:</span>
                        <span className="font-extrabold text-purple-900">
                          🏪 {selectedDrawerItem.type === "PAYMENT" ? selectedDrawerItem.data.order?.customer?.placeName : selectedDrawerItem.type === "INVOICE" ? selectedDrawerItem.data.order?.customer?.placeName : selectedDrawerItem.data.placeName}
                        </span>
                      </div>
                    )}
                    {((selectedDrawerItem.type === "PAYMENT" && selectedDrawerItem.data.order?.customer?.phone) ||
                      (selectedDrawerItem.type === "INVOICE" && selectedDrawerItem.data.order?.customer?.phone) ||
                      selectedDrawerItem.data.phone) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-bold">Phone Number:</span>
                        <span className="font-bold text-gray-800">
                          📞 {selectedDrawerItem.type === "PAYMENT" ? selectedDrawerItem.data.order?.customer?.phone : selectedDrawerItem.type === "INVOICE" ? selectedDrawerItem.data.order?.customer?.phone : selectedDrawerItem.data.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. TRANSACTION / METADATA */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                  <div className="flex items-center gap-2 font-extrabold text-gray-900 text-xs border-b border-gray-200/60 pb-2">
                    <FileText size={14} className="text-[#7C3AED]" /> Detailed Metadata
                  </div>

                  <div className="space-y-2">
                    {selectedDrawerItem.type === "PAYMENT" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">Payment ID:</span>
                          <span className="font-mono text-[11px] font-bold text-gray-800">{selectedDrawerItem.data.id}</span>
                        </div>
                        {selectedDrawerItem.data.reference && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-bold">Reference / Cheque #:</span>
                            <span className="font-mono font-extrabold text-purple-900">{selectedDrawerItem.data.reference}</span>
                          </div>
                        )}
                        {selectedDrawerItem.data.order?.orderNo && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-bold">Associated Order #:</span>
                            <span className="font-extrabold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              Order #{selectedDrawerItem.data.order.orderNo}
                            </span>
                          </div>
                        )}
                        {selectedDrawerItem.data.createdBy?.fullName && (
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-bold">Recorded By Staff:</span>
                            <span className="font-bold text-gray-800">{selectedDrawerItem.data.createdBy.fullName}</span>
                          </div>
                        )}
                        {selectedDrawerItem.data.notes && (
                          <div className="pt-1">
                            <span className="text-gray-400 font-bold block mb-0.5">Remarks & Memos:</span>
                            <div className="p-2 bg-white rounded-xl border border-gray-200 text-gray-700 text-[11px]">
                              {selectedDrawerItem.data.notes}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {selectedDrawerItem.type === "INVOICE" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">Invoice Number:</span>
                          <span className="font-extrabold text-purple-900">{selectedDrawerItem.data.invoiceNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">Order Number:</span>
                          <span className="font-extrabold text-gray-900">Order #{selectedDrawerItem.data.order?.orderNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">Created Date:</span>
                          <span className="font-bold text-gray-700">{new Date(selectedDrawerItem.data.createdAt).toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {selectedDrawerItem.type === "CREDIT_CUSTOMER" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400 font-bold">Unpaid Orders Count:</span>
                          <span className="font-extrabold text-rose-700">
                            {(selectedDrawerItem.data.orders || []).length} Unpaid Orders
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. ALLOCATIONS / BREAKDOWN TABLE */}
                {selectedDrawerItem.type === "PAYMENT" && selectedDrawerItem.data.allocations?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-extrabold text-gray-900 text-xs block">Invoice Allocations</span>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px]">
                          <tr>
                            <th className="py-2 px-3">Invoice No</th>
                            <th className="py-2 px-3 text-right">Allocated Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedDrawerItem.data.allocations.map((alloc: any) => (
                            <tr key={alloc.id}>
                              <td className="py-2 px-3 font-extrabold text-purple-900">{alloc.invoice?.invoiceNo || "General"}</td>
                              <td className="py-2 px-3 text-right font-black text-gray-900">LKR {Number(alloc.amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedDrawerItem.type === "INVOICE" && selectedDrawerItem.data.allocations?.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-extrabold text-gray-900 text-xs block">Payments Allocated to this Invoice</span>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px]">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Method</th>
                            <th className="py-2 px-3 text-right">Amount Paid</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedDrawerItem.data.allocations.map((alloc: any) => (
                            <tr key={alloc.id}>
                              <td className="py-2 px-3 text-gray-500">{new Date(alloc.payment?.paymentDate || Date.now()).toLocaleDateString()}</td>
                              <td className="py-2 px-3 font-bold text-gray-700">{alloc.payment?.method || "CASH"}</td>
                              <td className="py-2 px-3 text-right font-black text-emerald-700">LKR {Number(alloc.amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedDrawerItem.type === "CREDIT_CUSTOMER" && (selectedDrawerItem.data.orders || []).length > 0 && (
                  <div className="space-y-2">
                    <span className="font-extrabold text-gray-900 text-xs block">Unpaid Customer Orders & Invoices</span>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-gray-50 text-gray-400 font-bold uppercase text-[9px]">
                          <tr>
                            <th className="py-2 px-3">Order #</th>
                            <th className="py-2 px-3 text-right">Invoice Total</th>
                            <th className="py-2 px-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedDrawerItem.data.orders.map((ord: any) => {
                            const inv = ord.invoice;
                            if (!inv) return null;
                            const invTotal = Number(inv.total || 0);
                            const paidSum = (inv.allocations || []).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
                            const balance = Math.max(0, invTotal - paidSum);
                            return (
                              <tr key={ord.id}>
                                <td className="py-2 px-3 font-bold text-purple-900">Order #{ord.orderNo}</td>
                                <td className="py-2 px-3 text-right font-bold text-gray-800">LKR {invTotal.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-black text-rose-600">LKR {balance.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* DRAWER FOOTER ACTIONS */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedDrawerItem.data)}
                  className="px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Printer size={14} /> Print Receipt
                </button>

                <div className="flex items-center gap-2">
                  {selectedDrawerItem.type === "INVOICE" && (
                    <button
                      type="button"
                      onClick={() => {
                        const inv = selectedDrawerItem.data;
                        setSelectedDrawerItem(null);
                        openPaymentForInvoice(inv);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                    >
                      Record Payment
                    </button>
                  )}

                  {selectedDrawerItem.type === "CREDIT_CUSTOMER" && (
                    <button
                      type="button"
                      onClick={() => {
                        const cust = selectedDrawerItem.data;
                        setSelectedDrawerItem(null);
                        setSelectedCreditCust(cust);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                    >
                      Settle Balance
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedDrawerItem(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-extrabold rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
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
