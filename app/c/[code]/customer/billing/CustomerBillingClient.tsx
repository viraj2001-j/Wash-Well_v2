"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ShieldCheck,
  Search,
  Eye,
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Zap,
  Calendar,
  DollarSign,
  Package,
  Sparkles,
} from "lucide-react";

interface InvoiceItem {
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
    referenceNo?: string | null;
    createdAt?: string;
  } | null;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  additionalCharges?: number;
  total: number;
  balance?: number;
  paidAmount?: number;
  status: string;
  createdAt: string;
  dueDate?: string | null;
  order?: {
    id: string;
    orderNo: string;
    notes?: string | null;
    items?: InvoiceItem[];
    customer?: any;
    payments?: any[];
  } | null;
  customer?: any;
  items?: InvoiceItem[];
  allocations?: PaymentAllocation[];
  isVirtual?: boolean;
}

interface CustomerBillingClientProps {
  companyCode: string;
  companyName?: string;
  initialInvoices: Invoice[];
  customerInfo?: any;
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
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getInvoiceFinancials(inv: Invoice) {
  const total = Number(inv.total || 0);

  const directPaid = (inv.order?.payments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const allocationPaid = (inv.allocations || []).reduce(
    (sum, a: any) => sum + Number(a.amount || a.payment?.amount || 0),
    0
  );

  const paid =
    inv.paidAmount !== undefined
      ? Number(inv.paidAmount)
      : Math.max(directPaid, allocationPaid);

  const balance =
    inv.balance !== undefined ? Number(inv.balance) : Math.max(0, total - paid);

  const isPaid = balance <= 0 || (inv.status || "").toUpperCase() === "PAID";

  return { total, paid, balance, isPaid };
}

export default function CustomerBillingClient({
  companyCode,
  companyName = "Wash & Well",
  initialInvoices,
  customerInfo,
}: CustomerBillingClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Compute Financial Totals
  const totalPaid = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const { paid } = getInvoiceFinancials(inv);
      return sum + paid;
    }, 0);
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return invoices.reduce((sum, inv) => {
      const { balance } = getInvoiceFinancials(inv);
      return sum + (balance > 0 ? balance : 0);
    }, 0);
  }, [invoices]);

  // Filtered Invoices List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        (inv.order?.orderNo && inv.order.orderNo.toLowerCase().includes(q)) ||
        (inv.customer?.name && inv.customer.name.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const { isPaid } = getInvoiceFinancials(inv);
      if (statusFilter === "PAID") return isPaid;
      if (statusFilter === "PENDING") return !isPaid;

      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  const getStatusBadge = (status: string, balance: number) => {
    if (balance <= 0 || (status || "").toUpperCase() === "PAID") {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> PAID
        </span>
      );
    }
    if (balance < 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> OVERPAID
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
        <Clock className="w-3 h-3" /> UNPAID (LKR {balance.toLocaleString()})
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Billing & Digital Invoices</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review your digital invoices, print payment receipts, and track outstanding balances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === "PAID"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Paid Receipts
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Unpaid Bills
            </button>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Total Bills Issued
            </p>
            <p className="text-2xl font-extrabold text-purple-950 mt-1">
              {invoices.length}
            </p>
          </div>

          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Total Amount Paid
            </p>
            <p className="text-2xl font-extrabold text-emerald-950 mt-1">
              LKR {totalPaid.toLocaleString()}
            </p>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Outstanding Balance
            </p>
            <p className="text-2xl font-extrabold text-amber-950 mt-1">
              LKR {totalOutstanding.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice no, order ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-600 transition"
          />
        </div>
        <span className="text-xs font-bold text-slate-400 hidden sm:inline">
          Showing {filteredInvoices.length} Invoices
        </span>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching invoices found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Invoices for your laundry orders will automatically appear here once generated.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredInvoices.map((inv) => {
                  const { total, paid, balance } = getInvoiceFinancials(inv);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="hover:bg-purple-50/40 cursor-pointer transition group"
                    >
                      <td className="py-3.5 px-4 font-extrabold text-purple-700 group-hover:text-purple-900 transition">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {inv.order?.orderNo || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-500" suppressHydrationWarning>
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        LKR {total.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        LKR {paid.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-700">
                        LKR {balance.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(inv.status, balance)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-700 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View & Print
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

      {/* PERFECT DIGITAL INVOICE TEMPLATE DRAWER */}
      {selectedInvoice && (() => {
        const inv = selectedInvoice;
        const cust = inv.customer || inv.order?.customer || customerInfo;
        const items = inv.items || inv.order?.items || [];
        const subtotal = Number(inv.subtotal || 0);
        const expressCharges = Number((inv as any).additionalCharges || (inv as any).order?.additionalCharges || 0);
        const discountVal = Number((inv as any).discount || (inv as any).order?.discount || 0);

        const { total: grandTotal, paid: paidVal, balance: balanceVal } = getInvoiceFinancials(inv);

        const allocations = inv.allocations || [];
        const payments = inv.order?.payments || [];

        const primaryAddr = cust?.addresses?.find((a: any) => a.isPrimary) || cust?.addresses?.[0];
        const addrText = primaryAddr
          ? `${primaryAddr.label ? `[${primaryAddr.label}] ` : ""}${primaryAddr.address}${primaryAddr.city ? `, ${primaryAddr.city}` : ""}`
          : cust?.address1 || "Primary Delivery Address";

        return (
          <div className="fixed inset-0 z-50 overflow-hidden print-modal-container">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
              onClick={() => setSelectedInvoice(null)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 print:static print:p-0 print:w-full">
              <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition ease-in-out duration-300 print:shadow-none print:w-full print:max-w-none">
                
                {/* Header Action Bar (Hidden on Print) */}
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Digital Invoice Template - {inv.invoiceNo}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" /> Print / Save PDF
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* PRINTABLE INVOICE BODY */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 bg-white print:p-0 print:overflow-visible">
                  
                  {/* Company Branding & Invoice Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-lg shadow-md">
                          W
                        </div>
                        <div>
                          <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                            {companyName || "Wash & Well"}
                          </h2>
                          <p className="text-[11px] font-extrabold text-purple-700 uppercase tracking-widest">
                            Logistics & Laundry Care Management
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 pt-2 leading-tight">
                        Company Code: <strong className="font-mono text-slate-800">{companyCode.toUpperCase()}</strong> • Head Office Territory Route
                      </p>
                      <p className="text-xs text-slate-500">
                        Hotline: +94 11 234 5678 • Email: billing@{companyCode.toLowerCase()}.laundry.lk
                      </p>
                    </div>

                    <div className="text-left sm:text-right space-y-1">
                      <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-black inline-block">
                        INVOICE / RECEIPT
                      </span>
                      <h3 className="text-lg font-black text-purple-900">{inv.invoiceNo}</h3>
                      <p className="text-xs text-slate-500" suppressHydrationWarning>
                        Date: <strong>{formatDate(inv.createdAt)}</strong>
                      </p>
                      {inv.order?.orderNo && (
                        <p className="text-xs text-slate-500">
                          Order Ref: <strong className="font-mono text-slate-900">{inv.order.orderNo}</strong>
                        </p>
                      )}
                      <div className="pt-1">
                        {getStatusBadge(inv.status, balanceVal)}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information (Bill To) */}
                  <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Billed To Customer:
                      </span>
                      <p className="text-sm font-extrabold text-slate-900">
                        {cust?.name || customerInfo?.name || "Valued Customer"}
                      </p>
                      {cust?.customerNo && (
                        <p className="font-mono font-bold text-purple-700 text-[11px]">
                          Customer ID: {cust.customerNo}
                        </p>
                      )}
                      {cust?.phone && (
                        <p className="text-slate-600 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {cust.phone}
                        </p>
                      )}
                      {cust?.email && (
                        <p className="text-slate-600 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {cust.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Service Delivery Location:
                      </span>
                      <p className="text-slate-700 font-semibold leading-relaxed flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                        <span>{addrText}</span>
                      </p>
                    </div>
                  </div>

                  {/* Itemized Services Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Itemized Laundry Services & Care Breakdown
                    </h4>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">#</th>
                            <th className="py-2.5 px-4">Service Description</th>
                            <th className="py-2.5 px-3 text-center">Qty / Weight</th>
                            <th className="py-2.5 px-3 text-right">Unit Rate (LKR)</th>
                            <th className="py-2.5 px-4 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {items && items.length > 0 ? (
                            items.map((item: any, idx: number) => {
                              const desc = item.description || item.service?.name || "General Laundry Service";
                              const qty = item.quantity || item.pieces || item.weightKg || 1;
                              const uPrice = Number(item.unitPrice || 0);
                              const total = Number(item.total || uPrice * qty);

                              return (
                                <tr key={item.id || idx}>
                                  <td className="py-2.5 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                                  <td className="py-2.5 px-4 font-bold text-slate-900">{desc}</td>
                                  <td className="py-2.5 px-3 text-center font-semibold">
                                    {qty} {item.pricingType === "PER_KG" ? "KG" : "Item(s)"}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                                    LKR {uPrice.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">
                                    LKR {total.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-4 px-4 text-center text-slate-500 italic">
                                General Laundry & Linen Collection Service
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Total Summary */}
                  <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
                    {/* Notes / Special Terms */}
                    <div className="flex-1 space-y-2 text-xs">
                      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                        <span className="font-extrabold text-purple-900 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Customer Guarantee:
                        </span>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          All linen processed according to fabric care guidelines. Thank you for choosing Wash & Well!
                        </p>
                      </div>

                      {inv.order?.notes && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                          <strong>Collection Note:</strong> {inv.order.notes}
                        </div>
                      )}
                    </div>

                    {/* Math Calculation Table */}
                    <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs shrink-0">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal Amount:</span>
                        <span className="font-bold text-slate-900">LKR {subtotal.toLocaleString()}</span>
                      </div>

                      {expressCharges > 0 && (
                        <div className="flex justify-between text-amber-800">
                          <span>Express Surcharge:</span>
                          <span className="font-bold">+ LKR {expressCharges.toLocaleString()}</span>
                        </div>
                      )}

                      {discountVal > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount Applied:</span>
                          <span className="font-bold">- LKR {discountVal.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                        <span>Grand Total Bill:</span>
                        <span className="text-purple-700 font-extrabold">LKR {grandTotal.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-emerald-800 font-bold pt-1">
                        <span>Total Paid Amount:</span>
                        <span>LKR {paidVal.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between text-rose-700 font-black text-sm pt-1 border-t border-slate-200">
                        <span>Balance Due:</span>
                        <span>LKR {balanceVal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Allocations if any */}
                  {(allocations.length > 0 || payments.length > 0) && (
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Payment & Receipt Audit History
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        {(allocations.length > 0 ? allocations : payments).map((p: any, idx: number) => {
                          const pObj = p.payment || p;
                          return (
                            <div key={p.id || idx} className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-emerald-900 uppercase text-[10px]">
                                  {pObj.method || "CASH"} PAYMENT
                                </span>
                                <p className="text-[10px] text-slate-500" suppressHydrationWarning>
                                  {pObj.createdAt ? formatDate(pObj.createdAt) : "Received"}
                                </p>
                              </div>
                              <span className="font-black text-emerald-800">
                                LKR {Number(p.amount || pObj.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer Sign-off */}
                  <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                    <p>Computer Generated Official Digital Invoice • No Signature Required</p>
                    <p>Wash & Well Logistics Management</p>
                  </div>
                </div>

                {/* Print Media CSS Stylesheet */}
                <style jsx global>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    .print-modal-container,
                    .print-modal-container * {
                      visibility: visible;
                    }
                    .print-modal-container {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      height: auto;
                      background: white;
                    }
                  }
                `}</style>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
