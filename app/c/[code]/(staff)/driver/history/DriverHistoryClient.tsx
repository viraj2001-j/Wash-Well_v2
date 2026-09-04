"use client";

import { useState, useMemo } from "react";
import {
  History, Search, Filter, Calendar, FileText, ChevronRight, X, ExternalLink,
  Printer, Download, DollarSign, Scale, User, ShieldCheck, Tag, MapPin, Truck, PackageCheck
} from "lucide-react";

interface DriverHistoryClientProps {
  companyCode: string;
  driverName: string;
  pickupsHistory: any[];
  deliveriesHistory: any[];
  activityLogs: any[];
}

export default function DriverHistoryClient({
  companyCode,
  driverName,
  pickupsHistory = [],
  deliveriesHistory = [],
  activityLogs = [],
}: DriverHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "PICKUPS" | "DELIVERIES" | "LOGS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);

  // Driver Performance KPIs
  const kpiMetrics = useMemo(() => {
    const totalPickupsCount = pickupsHistory.length;
    const totalDeliveriesCount = deliveriesHistory.length;

    const totalKgCollected = pickupsHistory.reduce((sum, p) => {
      const kgItem = p.items?.find((i: any) => i.pricingType === "PER_KG");
      return sum + Number(p.actualKgCollected || kgItem?.quantity || 0);
    }, 0);

    const totalMoneyCollected = pickupsHistory.reduce((sum, p) => {
      const invTotal = Number(p.order?.invoice?.total || 0);
      const paid = (p.order?.invoice?.allocations || []).reduce(
        (aSum: number, a: any) => aSum + Number(a.amount || 0),
        0
      );
      return sum + paid;
    }, 0);

    return { totalPickupsCount, totalDeliveriesCount, totalKgCollected, totalMoneyCollected };
  }, [pickupsHistory, deliveriesHistory]);

  // Combined History Stream
  const combinedHistory = useMemo(() => {
    const pList = pickupsHistory.map((p) => ({
      id: `pickup_${p.id}`,
      type: "PICKUP",
      orderNo: p.order?.orderNo || "N/A",
      customerName: p.order?.customer?.name || "Customer",
      placeName: p.order?.customer?.placeName,
      phone: p.order?.customer?.phone,
      address: p.order?.customer?.addresses?.[0]?.address || p.order?.customer?.address,
      timestamp: p.collectedAt || p.createdAt,
      status: p.order?.status || "COLLECTED",
      kgCollected: p.items?.find((i: any) => i.pricingType === "PER_KG")?.quantity || undefined as number | undefined,
      notes: p.notes,
      order: p.order,
      items: p.items,
      raw: p,
    }));

    const dList = deliveriesHistory.map((d) => ({
      id: `delivery_${d.id}`,
      type: "DELIVERY",
      orderNo: d.order?.orderNo || "N/A",
      customerName: d.order?.customer?.name || "Customer",
      placeName: d.order?.customer?.placeName,
      phone: d.order?.customer?.phone,
      address: d.order?.customer?.addresses?.[0]?.address || d.order?.customer?.address,
      timestamp: d.deliveredAt || d.createdAt,
      status: d.order?.status || "DELIVERED",
      kgCollected: undefined as number | undefined,
      notes: d.notes,
      order: d.order,
      items: d.items,
      raw: d,
    }));

    let merged = [...pList, ...dList].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (activeTab === "PICKUPS") {
      merged = merged.filter((item) => item.type === "PICKUP");
    } else if (activeTab === "DELIVERIES") {
      merged = merged.filter((item) => item.type === "DELIVERY");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      merged = merged.filter(
        (item) =>
          item.orderNo.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          (item.placeName && item.placeName.toLowerCase().includes(q))
      );
    }

    return merged;
  }, [pickupsHistory, deliveriesHistory, activeTab, searchQuery]);

  const handlePrintDrawerInvoice = (item: any) => {
    window.print();
  };

  const handleDownloadDrawerPdf = (item: any) => {
    if (!item?.order) return;

    const ord = item.order;
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
              <div class="brand-sub">Official Driver Work History Receipt</div>
            </div>
            <div>
              <div class="invoice-no">${inv?.invoiceNo || `INV-${ord.orderNo}`}</div>
              <div class="date">Date: ${new Date(item.timestamp).toLocaleString()}</div>
            </div>
          </div>

          <div class="card">
            <div style="font-size:18px; font-weight:900;">${ord.customer?.name}</div>
            ${ord.customer?.placeName ? `<div style="font-weight:bold; color:#4b5563;">🏪 ${ord.customer.placeName}</div>` : ""}
            <div style="margin-top:4px;">Phone: ${ord.customer?.phone || "N/A"}</div>
            <div>Address: ${ord.customer?.addresses?.[0]?.address || ord.customer?.address || "N/A"}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item / Service</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${(ord.items || []).map((i: any) => `
                <tr>
                  <td><strong>${i.service?.name || i.description || "Service Item"}</strong></td>
                  <td style="text-align:center;">${i.quantity}</td>
                  <td style="text-align:right;">LKR ${Number(i.unitPrice || 0).toLocaleString()}</td>
                  <td style="text-align:right;"><strong>LKR ${Number(i.totalPrice || i.total || 0).toLocaleString()}</strong></td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row grand-total"><span>Grand Total:</span> <span>LKR ${Number(ord.grandTotal || inv?.total || 0).toLocaleString()}</span></div>
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
      link.download = `${ord.orderNo}_Invoice.html`;
      link.click();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#24164E] via-[#3B2282] to-[#503B91] p-6 md:p-8 rounded-3xl text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest text-purple-200 uppercase bg-white/10 px-3 py-1 rounded-lg backdrop-blur-xs">
            Driver Logistics History
          </span>
          <span className="text-xs font-extrabold text-purple-200 flex items-center gap-1">
            <User size={14} /> Driver: {driverName}
          </span>
        </div>
        <h1 className="text-xl md:text-3xl font-black tracking-tight">Driver Work History 📜</h1>
        <p className="text-xs text-purple-200 font-medium">
          Comprehensive log of completed pickups, collections, deliveries, and customer payments for {driverName}
        </p>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Completed Pickups</span>
          <span className="text-xl font-black text-purple-900 block">{kpiMetrics.totalPickupsCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total KG Collected</span>
          <span className="text-xl font-black text-sky-800 block">{kpiMetrics.totalKgCollected} KG</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Completed Deliveries</span>
          <span className="text-xl font-black text-emerald-800 block">{kpiMetrics.totalDeliveriesCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Collections</span>
          <span className="text-base font-black text-indigo-900 block">LKR {kpiMetrics.totalMoneyCollected.toLocaleString()}</span>
        </div>
      </div>

      {/* MAIN HISTORY FEED CARD */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
        
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
            <History className="w-5 h-5 text-[#7C3AED]" /> Completed Work Log
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Order # or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-100 pb-3 text-xs overflow-x-auto">
          {[
            { id: "ALL", label: `All Works (${pickupsHistory.length + deliveriesHistory.length})` },
            { id: "PICKUPS", label: `Pickups / Collections (${pickupsHistory.length})` },
            { id: "DELIVERIES", label: `Deliveries (${deliveriesHistory.length})` },
            { id: "LOGS", label: `Audit Feed (${activityLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold transition shrink-0 ${
                activeTab === tab.id
                  ? "bg-[#7C3AED] text-white shadow-2xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Audit Feed View */}
        {activeTab === "LOGS" ? (
          <div className="space-y-2">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs italic">No activity logs recorded yet.</div>
            ) : (
              activityLogs.map((log: any) => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-purple-900 block">{log.action}</span>
                    <p className="text-gray-600 text-[11px]">{log.description}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Cards Stream */
          <div className="space-y-3">
            {combinedHistory.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs font-medium bg-gray-50 rounded-2xl border">
                No work history records found matching your filters.
              </div>
            ) : (
              combinedHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHistoryItem(item)}
                  className="bg-white hover:bg-purple-50/20 p-4.5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#7C3AED] text-xs bg-purple-100 px-2.5 py-0.5 rounded-md">
                        {item.orderNo}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          item.type === "PICKUP"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">{item.customerName}</h4>
                      {item.placeName && <p className="text-xs font-bold text-gray-600">🏪 {item.placeName}</p>}
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={13} className="text-rose-500 shrink-0" />
                        {item.address || "No address specified"}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      {item.kgCollected && (
                        <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-800 font-extrabold text-[10px] rounded">
                          ⚖️ {item.kgCollected} KG
                        </span>
                      )}
                      {item.order?.grandTotal && (
                        <span className="block font-black text-gray-900 text-xs">
                          LKR {Number(item.order.grandTotal).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <div className="p-2.5 bg-gray-50 rounded-xl border text-[11px] italic text-gray-700">
                      "{item.notes}"
                    </div>
                  )}

                  <div className="flex justify-end pt-1 border-t border-gray-100">
                    <span className="text-[#7C3AED] font-extrabold text-[11px] flex items-center gap-1 hover:underline">
                      View Details & Printable Receipt <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      {selectedHistoryItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedHistoryItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 text-xs font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div>
                <span className="font-black text-[#7C3AED] text-xs bg-purple-100 px-2.5 py-0.5 rounded-md">
                  {selectedHistoryItem.orderNo}
                </span>
                <h3 className="font-black text-gray-900 text-base mt-1">{selectedHistoryItem.customerName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full flex items-center justify-center text-xs"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 font-bold block text-[10px] uppercase">Work Type & Status</span>
                  <span className="font-black text-purple-900 text-sm uppercase">{selectedHistoryItem.type} • {selectedHistoryItem.status}</span>
                </div>
                <span className="text-gray-500 font-bold text-[11px]">
                  {new Date(selectedHistoryItem.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-wider">Customer Information</h4>
                <p className="font-extrabold text-gray-900 text-sm">{selectedHistoryItem.customerName}</p>
                {selectedHistoryItem.placeName && <p className="font-bold text-gray-600">🏪 {selectedHistoryItem.placeName}</p>}
                <p className="text-gray-600">Phone: {selectedHistoryItem.phone || "N/A"}</p>
                <p className="text-gray-600">Address: {selectedHistoryItem.address || "N/A"}</p>
              </div>

              {selectedHistoryItem.order?.items && selectedHistoryItem.order.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-wider">Itemized Breakdown</h4>
                  <div className="space-y-2">
                    {selectedHistoryItem.order.items.map((i: any) => (
                      <div key={i.id} className="p-3 bg-gray-50 rounded-xl border flex justify-between items-center">
                        <div>
                          <span className="font-bold text-gray-900">{i.service?.name || i.description || "Service Item"}</span>
                          <span className="block text-[10px] text-gray-500">Qty: {i.quantity}</span>
                        </div>
                        <span className="font-extrabold text-gray-900">
                          LKR {Number(i.totalPrice || i.total || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedHistoryItem.order?.grandTotal && (
                <div className="bg-purple-900 text-white p-4 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 font-bold text-xs">Total Bill Amount</span>
                    <span className="text-base font-black text-amber-300">
                      LKR {Number(selectedHistoryItem.order.grandTotal).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadDrawerPdf(selectedHistoryItem)}
                className="flex-1 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 transition"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => handlePrintDrawerInvoice(selectedHistoryItem)}
                className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer size={14} /> Print
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistoryItem(null)}
                className="py-2.5 px-4 bg-white border rounded-xl font-bold text-xs"
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
