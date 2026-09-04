"use client";

import { useState, useMemo } from "react";
import {
  PackageCheck, Scale, Plus, X, Search, CreditCard, FileText,
  Phone, Mail, MapPin, ExternalLink, Camera, Building2, Calendar,
  User, Navigation, Printer, Download, ShieldCheck, Tag, DollarSign,
  ChevronRight, Filter, ShoppingBag, Layers, UserCheck, CheckCircle2, AlertCircle
} from "lucide-react";

interface CollectionsClientProps {
  companyCode: string;
  companyId: string;
  initialCollections: any[];
  ordersPendingCollection: any[];
  services: any[];
}

export default function CollectionsClient({
  companyCode,
  companyId,
  initialCollections = [],
  ordersPendingCollection = [],
  services = [],
}: CollectionsClientProps) {
  const [collections, setCollections] = useState<any[]>(initialCollections);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "KG" | "PAID">("ALL");
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Record Collection Modal state
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [actualKg, setActualKg] = useState("");
  const [kgRate, setKgRate] = useState("250");
  const [discount, setDiscount] = useState("0");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic individual items array
  const [itemList, setItemList] = useState<
    Array<{ description: string; pricingType: string; quantity: number; unitPrice: number }>
  >([]);

  const handleAddItem = () => {
    setItemList([...itemList, { description: "", pricingType: "PER_ITEM", quantity: 1, unitPrice: 150 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItemList(itemList.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...itemList];
    updated[index] = { ...updated[index], [field]: value };
    setItemList(updated);
  };

  // KPI Calculations
  const kpiMetrics = useMemo(() => {
    const totalCollectionsCount = collections.length;
    const totalKg = collections.reduce((sum, c) => {
      const kgItem = c.items?.find((i: any) => i.pricingType === "PER_KG");
      return sum + Number(c.actualKgCollected || kgItem?.quantity || 0);
    }, 0);

    const totalMoneyCollected = collections.reduce((sum, c) => {
      const allocations = c.order?.invoice?.allocations || [];
      const paid = allocations.reduce((aSum: number, a: any) => aSum + Number(a.amount || 0), 0);
      return sum + paid;
    }, 0);

    return { totalCollectionsCount, totalKg, totalMoneyCollected };
  }, [collections]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    let list = [...collections];

    if (activeTab === "KG") {
      list = list.filter((c) =>
        c.items?.some((i: any) => i.pricingType === "PER_KG") || Number(c.actualKgCollected || 0) > 0
      );
    } else if (activeTab === "PAID") {
      list = list.filter((c) => {
        const invTotal = Number(c.order?.invoice?.total || 0);
        const allocations = c.order?.invoice?.allocations || [];
        const paid = allocations.reduce((aSum: number, a: any) => aSum + Number(a.amount || 0), 0);
        return paid > 0;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.order?.orderNo?.toLowerCase().includes(q) ||
          c.order?.customer?.name?.toLowerCase().includes(q) ||
          c.collectedBy?.fullName?.toLowerCase().includes(q) ||
          (c.order?.invoice?.invoiceNo && c.order.invoice.invoiceNo.toLowerCase().includes(q))
      );
    }

    return list;
  }, [collections, activeTab, searchQuery]);

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      showToast("Please select an order to collect.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrderId,
          actualKg: Number(actualKg) || 0,
          kgRate: Number(kgRate) || 0,
          items: itemList,
          discount: Number(discount) || 0,
          payment: paymentAmount && Number(paymentAmount) > 0 ? {
            amount: Number(paymentAmount),
            method: paymentMethod,
            reference: paymentReference,
          } : undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCollections([data.data.pickup, ...collections]);
        setShowCollectModal(false);
        // Reset form
        setSelectedOrderId("");
        setActualKg("");
        setItemList([]);
        setPaymentAmount("");
        showToast("Collection recorded successfully!", "success");
      } else {
        showToast(data.error || "Failed to record collection", "error");
      }
    } catch {
      showToast("Failed to record collection", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, toStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus,
          note: `Status updated to ${toStatus} by Admin`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCollections((prev) =>
          prev.map((c) =>
            c.order?.id === orderId
              ? { ...c, order: { ...c.order, status: toStatus } }
              : c
          )
        );
        if (selectedCollection?.order?.id === orderId) {
          setSelectedCollection((prev: any) => ({
            ...prev,
            order: { ...prev.order, status: toStatus },
          }));
        }
        showToast(`Order status updated to ${toStatus}!`, "success");
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Failed to update order status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintDrawerInvoice = () => {
    window.print();
  };

  const handleDownloadDrawerPdf = () => {
    if (!selectedCollection?.order) return;
    const ord = selectedCollection.order;
    const inv = ord.invoice;

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${ord.orderNo}_${ord.customer?.name || "Customer"}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: Arial, sans-serif; color: #1f2937; padding: 24px; line-height: 1.5; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #7C3AED; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 900; color: #5b21b6; }
            .brand-sub { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
            .invoice-no { font-size: 18px; font-weight: 900; color: #7C3AED; text-align: right; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f3f4f6; color: #374151; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
            .totals { width: 280px; margin-left: auto; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; font-size: 12px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-weight: 600; }
            .grand-total { border-top: 2px solid #e5e7eb; padding-top: 10px; font-size: 15px; font-weight: 900; color: #111827; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Wash & Well Laundry</div>
              <div class="brand-sub">Official Laundry Collection Receipt</div>
            </div>
            <div>
              <div class="invoice-no">${inv?.invoiceNo || `INV-${ord.orderNo}`}</div>
              <div class="date">Collected: ${new Date(selectedCollection.collectedAt || selectedCollection.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <div class="card">
            <div style="font-size:18px; font-weight:900;">${ord.customer?.name}</div>
            ${ord.customer?.placeName ? `<div style="font-weight:bold; color:#4b5563;">🏪 ${ord.customer.placeName}</div>` : ""}
            <div style="margin-top:4px;">Phone: ${ord.customer?.phone || "N/A"}</div>
            <div>Address: ${ord.customer?.addresses?.[0]?.address || ord.customer?.address || "N/A"}</div>
            <div style="margin-top:6px; font-weight:bold; color:#7C3AED;">Driver Collected By: ${selectedCollection.collectedBy?.fullName || "Driver Staff"}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(selectedCollection.items || []).map((i: any) => `
                <tr>
                  <td><strong>${i.description}</strong></td>
                  <td style="text-align:center;">${i.quantity}</td>
                  <td style="text-align:right;">LKR ${Number(i.unitPrice || 0).toLocaleString()}</td>
                  <td style="text-align:right;"><strong>LKR ${Number(i.total || 0).toLocaleString()}</strong></td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row grand-total"><span>Grand Total Bill:</span> <span>LKR ${Number(inv?.total || ord.grandTotal || 0).toLocaleString()}</span></div>
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
      link.download = `${ord.orderNo}_Collection_Invoice.html`;
      link.click();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* HEADER & MAIN ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Driver Laundry Collections</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Admin oversight of physical laundry collections recorded by drivers with full itemized breakdown & images
          </p>
        </div>

        <button
          onClick={() => setShowCollectModal(true)}
          className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus size={14} /> Record New Collection
        </button>
      </div>

      {/* KPI METRICS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Collections Card */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL COLLECTIONS</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <PackageCheck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{kpiMetrics.totalCollectionsCount}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Logged pickup entries
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Total Weight Card */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">TOTAL WEIGHT</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <Scale size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpiMetrics.totalKg} KG</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Accumulated weight picked
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Upfront Payments Card */}
        <div className="bg-[#f3e8ff] border border-purple-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">UPFRONT PAYMENTS</span>
            <div className="w-7 h-7 rounded-lg bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              LKR {kpiMetrics.totalMoneyCollected.toLocaleString()}
            </p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Driver upfront collections
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
          { id: "ALL", label: `All Collections (${collections.length})` },
          { id: "KG", label: "Picked Up By Weight (KG)" },
          { id: "PAID", label: "Upfront Payments Received" },
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
            placeholder="Filter Order #, Customer, Driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* COLLECTIONS TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Order No</th>
                <th className="py-3.5 px-4">Customer & Shop</th>
                <th className="py-3.5 px-4">Collected By Driver</th>
                <th className="py-3.5 px-4">Collection Date</th>
                <th className="py-3.5 px-4">KG Collected</th>
                <th className="py-3.5 px-4">Invoice No</th>
                <th className="py-3.5 px-4 text-right">Invoice Total</th>
                <th className="py-3.5 px-4 text-right">Paid Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400 font-bold">
                    No collection records found.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((col) => {
                  const invTotal = Number(col.order?.invoice?.total || col.order?.grandTotal || 0);
                  const allocations = col.order?.invoice?.allocations || [];
                  const paidAmount = allocations.reduce((sum: number, a: any) => sum + Number(a.amount || 0), 0);
                  const balanceAmount = Math.max(0, invTotal - paidAmount);

                  let payStatusTag = "UNPAID";
                  if (paidAmount >= invTotal && invTotal > 0) payStatusTag = "PAID";
                  else if (paidAmount > 0) payStatusTag = "PARTIALLY PAID";

                  const kgItem = col.items?.find((i: any) => i.pricingType === "PER_KG");
                  const displayKg = col.actualKgCollected || kgItem?.quantity;

                  return (
                    <tr
                      key={col.id}
                      onClick={() => setSelectedCollection(col)}
                      className="hover:bg-purple-50/30 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-black text-[#7C3AED] bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                          {col.order?.orderNo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-gray-900 block">{col.order?.customer?.name}</span>
                        {col.order?.customer?.placeName && (
                          <span className="text-[10px] text-gray-500 font-bold block">🏪 {col.order.customer.placeName}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-purple-900 bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200 inline-flex items-center gap-1">
                          <User size={12} /> {col.collectedBy?.fullName || "Driver Staff"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-[11px] font-bold">
                        {new Date(col.collectedAt || col.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {displayKg ? (
                          <span className="font-extrabold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-lg">
                            ⚖️ {displayKg} KG
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Itemized</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-indigo-900">
                        {col.order?.invoice?.invoiceNo || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-gray-900">
                        LKR {invTotal.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-emerald-700 block">LKR {paidAmount.toLocaleString()}</span>
                        {balanceAmount > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">Bal: LKR {balanceAmount.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            payStatusTag === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : payStatusTag === "PARTIALLY PAID"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {payStatusTag}
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

      {/* DECORATED COLLECTION DETAIL SLIDE-OVER DRAWER */}
      {selectedCollection && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedCollection(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 text-xs font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <PackageCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#7C3AED] text-[11px] bg-purple-100 px-2 py-0.5 rounded-md">
                      {selectedCollection.order?.orderNo}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {selectedCollection.status}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-gray-900 leading-tight mt-0.5">
                    {selectedCollection.order?.customer?.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCollection(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              
              {/* DRIVER COLLECTED BY BANNER */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-4 rounded-2xl text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">Driver Collection Record</span>
                  <span className="text-[10px] font-bold text-purple-300">
                    {new Date(selectedCollection.collectedAt || selectedCollection.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs text-purple-200 block font-medium">Collected By Driver:</span>
                    <h4 className="text-sm font-black text-white">{selectedCollection.collectedBy?.fullName || "Driver Staff"}</h4>
                  </div>
                </div>
              </div>

              {/* ADMIN ORDER STATUS CHANGE CONTROLS */}
              {selectedCollection.order?.id && (
                <div className="bg-white p-4 rounded-2xl border border-purple-100 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                      Admin Status Management
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-200">
                      {selectedCollection.order?.status || "COLLECTED"}
                    </span>
                  </div>

                  {/* Conditionally hide status buttons if order is already processing, ready for delivery, delivered, or completed */}
                  {(() => {
                    const currentStatus = selectedCollection.order?.status;

                    if (["COMPLETED", "DELIVERED", "OUT_FOR_DELIVERY"].includes(currentStatus)) {
                      return (
                        <div className="pt-1 text-center font-extrabold text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          ✅ Order is {currentStatus} (Completed in Logistics Workflow)
                        </div>
                      );
                    }

                    if (currentStatus === "READY_FOR_DELIVERY") {
                      return (
                        <div className="pt-1 text-center font-extrabold text-xs text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                          🚚 Order is Ready for Driver Delivery
                        </div>
                      );
                    }

                    return (
                      <div className="pt-1 flex items-center gap-2">
                        {["COLLECTED", "PENDING", "APPROVED"].includes(currentStatus) && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(selectedCollection.order.id, "PROCESSING")}
                            disabled={loading}
                            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                          >
                            <span>🧺 Mark as Processing</span>
                          </button>
                        )}

                        {["PROCESSING", "COLLECTED", "PENDING"].includes(currentStatus) && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(selectedCollection.order.id, "READY_FOR_DELIVERY")}
                            disabled={loading}
                            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                          >
                            <span>🚚 Mark Ready for Delivery</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* CUSTOMER PROFILE & ADDRESS */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" /> Customer Profile Details
                  </h4>
                  {selectedCollection.order?.customer?.customerNo && (
                    <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                      #{selectedCollection.order.customer.customerNo}
                    </span>
                  )}
                </div>

                <div className="space-y-2 font-medium text-gray-800">
                  <p className="font-extrabold text-gray-900 text-sm">{selectedCollection.order?.customer?.name}</p>
                  {selectedCollection.order?.customer?.placeName && (
                    <p className="text-xs font-bold text-gray-600">🏪 Shop: {selectedCollection.order.customer.placeName}</p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                    <span className="text-gray-500">Phone:</span>
                    {selectedCollection.order?.customer?.phone ? (
                      <a
                        href={`tel:${selectedCollection.order.customer.phone}`}
                        className="font-extrabold text-[#7C3AED] hover:underline"
                      >
                        {selectedCollection.order.customer.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-gray-500 shrink-0">Address:</span>
                    <span className="font-bold text-gray-900 text-right">
                      {selectedCollection.order?.customer?.address || selectedCollection.order?.customer?.addresses?.[0]?.address || "No address"}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE GPS COORDINATES MAP CARD */}
              {selectedCollection.order?.customer?.gpsLatitude && selectedCollection.order?.customer?.gpsLongitude && (
                <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sky-900 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-sky-600" /> Live GPS Coordinates
                    </h4>
                    <a
                      href={`https://www.google.com/maps?q=${selectedCollection.order.customer.gpsLatitude},${selectedCollection.order.customer.gpsLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs transition"
                    >
                      <ExternalLink size={11} /> Open GPS Map
                    </a>
                  </div>
                </div>
              )}

              {/* SHOP PHOTOS SHOWCASE */}
              {selectedCollection.order?.customer?.shopPhotos && selectedCollection.order.customer.shopPhotos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-500" /> Customer Shop Photos ({selectedCollection.order.customer.shopPhotos.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedCollection.order.customer.shopPhotos.map((photoUrl: string, idx: number) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                        {/* eslint-disable-next-html-extension/no-img-element */}
                        <img src={photoUrl} alt={`Shop photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-[10px] gap-1 transition"
                        >
                          <ExternalLink size={12} /> View Image
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DRIVER NOTES */}
              {selectedCollection.notes && (
                <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-1">
                  <h4 className="font-black text-purple-900 text-[10px] uppercase">Driver Collection Notes</h4>
                  <p className="text-purple-950 italic">"{selectedCollection.notes}"</p>
                </div>
              )}

              {/* ITEMIZED LAUNDRY ITEMS BREAKDOWN */}
              <div className="space-y-2">
                <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#7C3AED]" /> Collected Items & Services Breakdown ({selectedCollection.items?.length || 0})
                </h4>

                <div className="space-y-2">
                  {selectedCollection.items?.map((item: any) => (
                    <div key={item.id} className="p-3 bg-white rounded-2xl border border-gray-200/80 flex items-center justify-between">
                      <div>
                        <span className="font-black text-gray-900 block">{item.description}</span>
                        <span className="text-[10px] text-gray-500 font-bold">
                          Qty: {item.quantity} × LKR {Number(item.unitPrice || 0).toLocaleString()}
                        </span>
                      </div>
                      <span className="font-extrabold text-[#7C3AED]">
                        LKR {Number(item.total || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FINANCIAL BREAKDOWN */}
              {selectedCollection.order?.invoice && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-wider">Financial Breakdown</h4>
                  <div className="flex justify-between font-bold text-gray-600">
                    <span>Invoice Number:</span>
                    <span className="text-purple-900">{selectedCollection.order.invoice.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t">
                    <span>Grand Total Bill:</span>
                    <span>LKR {Number(selectedCollection.order.invoice.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadDrawerPdf}
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
                onClick={() => setSelectedCollection(null)}
                className="py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RECORD NEW COLLECTION MODAL (FOR ADMIN/STAFF) */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-gray-900 text-sm">Record Laundry Collection</h3>
              <button onClick={() => setShowCollectModal(false)} className="w-7 h-7 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center text-xs">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordCollection} className="space-y-4">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Pending Order *</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  required
                  className="w-full p-2.5 border rounded-xl font-bold text-gray-900 outline-none focus:border-purple-500"
                >
                  <option value="">-- Choose Approved Order --</option>
                  {ordersPendingCollection.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} - {o.customer?.name} ({o.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* ACTUAL KG & RATE */}
              <div className="grid grid-cols-2 gap-3 bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                <div>
                  <label className="block font-bold text-purple-900 mb-1">Actual KG Collected</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.5"
                    value={actualKg}
                    onChange={(e) => setActualKg(e.target.value)}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-purple-900 mb-1">KG Rate (Rs.)</label>
                  <input
                    type="number"
                    value={kgRate}
                    onChange={(e) => setKgRate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-purple-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* ITEM BREAKDOWN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700">Itemized Garment & Treatment Pieces</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[#7C3AED] font-extrabold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {itemList.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border">
                      <input
                        type="text"
                        placeholder="Item (Shirt, Trouser...)"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="flex-1 p-1.5 border rounded-lg font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        className="w-16 p-1.5 border rounded-lg text-center font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                        className="w-20 p-1.5 border rounded-lg text-right font-bold"
                      />
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* OPTIONAL UPFRONT PAYMENT */}
              <div className="border-t pt-3 space-y-2">
                <span className="font-bold text-gray-800">Record Upfront Payment (Optional)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Amount (Rs.)"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="p-2.5 border rounded-xl font-bold"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="p-2.5 border rounded-xl font-bold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl shadow-md shadow-purple-200 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Confirm Collection & Generate Invoice"}
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
