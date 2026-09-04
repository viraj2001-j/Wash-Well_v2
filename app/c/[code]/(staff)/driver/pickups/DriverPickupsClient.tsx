"use client";

import { useState, useMemo } from "react";
import {
  PackageCheck, Phone, MapPin, CheckCircle2, Scale, X, Plus, Bell,
  Navigation, ExternalLink, Calendar, FileText, UserCheck, ShieldCheck,
  Printer, Download, Sparkles, Tag, DollarSign, Check, AlertCircle, ShoppingBag, Layers
} from "lucide-react";

interface DriverPickupsClientProps {
  companyCode: string;
  companyId: string;
  driverName?: string;
  assignedRoutes?: any[];
  initialPickups: any[];
}

// 1. GARMENT SERVICES CATALOG (Preconfigured suggested prices)
const GARMENT_SERVICES_CATALOG = [
  { id: "g1", serviceName: "Wash & Fold", garmentType: "Shirts & T-Shirts", includes: "Wash, Dry, Fold", suggestedPrice: 350 },
  { id: "g2", serviceName: "Wash & Fold", garmentType: "Trousers & Jeans", includes: "Wash, Dry, Fold", suggestedPrice: 400 },
  { id: "g3", serviceName: "Wash & Iron", garmentType: "Formal Shirt", includes: "Wash, Steam Iron", suggestedPrice: 450 },
  { id: "g4", serviceName: "Wash & Iron", garmentType: "Trousers & Suits", includes: "Wash, Press, Hanger", suggestedPrice: 600 },
  { id: "g5", serviceName: "Dry Cleaning", garmentType: "Suit 2-Piece", includes: "Dry Clean, Press, Cover", suggestedPrice: 1200 },
  { id: "g6", serviceName: "Dry Cleaning", garmentType: "Saree / Silk", includes: "Gentle Clean, Steam Press", suggestedPrice: 1500 },
];

// 2. PROCESS & TREATMENT CATALOG (Preconfigured suggested prices)
const PROCESS_TREATMENTS_CATALOG = [
  { id: "t1", processName: "Basic Stain Treatment", category: "Pre-treatment", description: "Treat light/common stains", suggestedPrice: 100 },
  { id: "t2", processName: "Heavy Stain Treatment", category: "Pre-treatment", description: "Treatment for heavy stains", suggestedPrice: 200 },
  { id: "t3", processName: "Oil & Grease Treatment", category: "Pre-treatment", description: "Special treatment for oil/grease", suggestedPrice: 150 },
  { id: "t4", processName: "Food Stain Treatment", category: "Pre-treatment", description: "Treatment for food stains", suggestedPrice: 100 },
  { id: "t5", processName: "Spot Treatment", category: "Pre-treatment", description: "Treatment of specific stained area", suggestedPrice: 100 },
  { id: "t6", processName: "Pre-soaking", category: "Pre-treatment", description: "Soak heavily soiled garments", suggestedPrice: 150 },
  { id: "t7", processName: "Normal Wash", category: "Washing", description: "Standard machine washing", suggestedPrice: 150 },
  { id: "t8", processName: "Heavy Wash", category: "Washing", description: "Intensive washing for soiled garments", suggestedPrice: 200 },
  { id: "t9", processName: "Delicate Wash", category: "Washing", description: "Gentle washing for sensitive fabrics", suggestedPrice: 250 },
  { id: "t10", processName: "Hand Wash", category: "Washing", description: "Manual washing for delicate garments", suggestedPrice: 250 },
  { id: "t11", processName: "Tumble Dry", category: "Drying", description: "Machine tumble drying", suggestedPrice: 100 },
  { id: "t12", processName: "Air Dry", category: "Drying", description: "Natural air drying", suggestedPrice: 60 },
  { id: "t13", processName: "Normal Ironing", category: "Ironing", description: "Standard ironing", suggestedPrice: 130 },
  { id: "t14", processName: "Steam Ironing", category: "Ironing", description: "Steam-based ironing", suggestedPrice: 150 },
  { id: "t15", processName: "Garment Pressing", category: "Ironing", description: "Professional garment pressing", suggestedPrice: 200 },
  { id: "t16", processName: "T-Shirt Folding", category: "Folding", description: "Neatly fold T-shirts", suggestedPrice: 30 },
  { id: "t17", processName: "General Folding", category: "Folding", description: "Fold normal garments", suggestedPrice: 30 },
];

export default function DriverPickupsClient({
  companyCode,
  companyId,
  driverName,
  assignedRoutes = [],
  initialPickups = [],
}: DriverPickupsClientProps) {
  const [pickups, setPickups] = useState<any[]>(initialPickups);
  const [arrivedMap, setArrivedMap] = useState<Record<string, boolean>>({});
  const [showCollectModal, setShowCollectModal] = useState<any | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [issuedInvoice, setIssuedInvoice] = useState<any | null>(null);

  // Collection Form State
  const [collectionMode, setCollectionMode] = useState<"KG" | "ITEMS" | "BOTH">("BOTH");
  const [actualKg, setActualKg] = useState("");
  const [kgRate, setKgRate] = useState("250");
  const [isUrgent, setIsUrgent] = useState(false);
  const [expressFee, setExpressFee] = useState("300");
  const [discount, setDiscount] = useState("0");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic Item List
  const [itemList, setItemList] = useState<
    Array<{ id: string; description: string; pricingType: string; quantity: number; unitPrice: number }>
  >([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMarkArrived = (orderId: string) => {
    setArrivedMap((prev) => ({ ...prev, [orderId]: true }));
    showToast("📍 Arrival timestamp recorded for customer stop!", "success");
  };

  // Add Item From Pre-configured Catalogs
  const handleSelectCatalogItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCatalogId(val);
    if (!val) return;

    // Check Garment Catalog
    const garment = GARMENT_SERVICES_CATALOG.find((g) => g.id === val);
    if (garment) {
      setItemList((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          description: `${garment.serviceName} - ${garment.garmentType} (${garment.includes})`,
          pricingType: "PER_ITEM",
          quantity: 1,
          unitPrice: garment.suggestedPrice,
        },
      ]);
      setSelectedCatalogId("");
      return;
    }

    // Check Process Catalog
    const proc = PROCESS_TREATMENTS_CATALOG.find((p) => p.id === val);
    if (proc) {
      setItemList((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          description: `${proc.processName} (${proc.category})`,
          pricingType: "PER_ITEM",
          quantity: 1,
          unitPrice: proc.suggestedPrice,
        },
      ]);
      setSelectedCatalogId("");
      return;
    }
  };

  const handleAddCustomItem = () => {
    setItemList((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        description: "Custom Garment / Special Service",
        pricingType: "PER_ITEM",
        quantity: 1,
        unitPrice: 200,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItemList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItemList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Live Real-Time Financial Computations
  const financialTotals = useMemo(() => {
    const kgTotal = (collectionMode === "KG" || collectionMode === "BOTH") && Number(actualKg) > 0
      ? Number(actualKg) * (Number(kgRate) || 0)
      : 0;

    const itemsTotal = itemList.reduce(
      (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0),
      0
    );

    const subtotal = kgTotal + itemsTotal;
    const expressSurcharge = isUrgent ? (Number(expressFee) || 0) : 0;
    const discountVal = Number(discount) || 0;
    const grandTotal = Math.max(0, subtotal + expressSurcharge - discountVal);

    const paidVal = Number(paymentAmount) || 0;
    const balanceVal = Math.max(0, grandTotal - paidVal);

    let paymentStatus = "UNPAID";
    if (paidVal >= grandTotal && grandTotal > 0) {
      paymentStatus = "PAID";
    } else if (paidVal > 0 && paidVal < grandTotal) {
      paymentStatus = "PARTIALLY_PAID";
    }

    return { subtotal, expressSurcharge, discountVal, grandTotal, paidVal, balanceVal, paymentStatus };
  }, [collectionMode, actualKg, kgRate, itemList, isUrgent, expressFee, discount, paymentAmount]);

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCollectModal) return;

    setLoading(true);
    try {
      const payloadItems = itemList;
      const res = await fetch(`/api/c/${companyCode}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: showCollectModal.id,
          actualKg: (collectionMode === "KG" || collectionMode === "BOTH") ? Number(actualKg) || 0 : 0,
          kgRate: Number(kgRate) || 0,
          items: payloadItems,
          discount: Number(discount) || 0,
          additionalCharges: isUrgent ? Number(expressFee) || 0 : 0,
          payment: Number(paymentAmount) > 0 ? {
            amount: Number(paymentAmount),
            method: "CASH",
            notes: isUrgent ? "Urgent Order Upfront Payment" : "Upfront Payment at Collection",
          } : undefined,
          notes: `${isUrgent ? "[URGENT ORDER] " : ""}${notes}`.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Setup Invoice Receipt for Customer
        setIssuedInvoice({
          order: showCollectModal,
          customer: showCollectModal.customer,
          actualKg: (collectionMode === "KG" || collectionMode === "BOTH") && Number(actualKg) > 0 ? actualKg : undefined,
          kgRate,
          items: payloadItems,
          totals: financialTotals,
          isUrgent,
          notes,
          collectedAt: new Date().toLocaleString(),
          invoiceNo: `INV-${showCollectModal.orderNo}`,
        });

        setPickups(pickups.filter((p) => p.id !== showCollectModal.id));
        setShowCollectModal(null);
        // Reset form
        setActualKg("");
        setItemList([]);
        setPaymentAmount("");
        setIsUrgent(false);
        setNotes("");
        showToast("Collection recorded successfully!", "success");
      } else {
        showToast(data.error || "Failed to record collection", "error");
      }
    } catch {
      showToast("Failed to record collection due to network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!issuedInvoice) return;

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${issuedInvoice.invoiceNo}_${issuedInvoice.customer?.name || "Customer"}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1f2937;
              padding: 24px;
              line-height: 1.5;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #7C3AED;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand {
              font-size: 26px;
              font-weight: 900;
              color: #5b21b6;
            }
            .brand-sub {
              font-size: 11px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 800;
              margin-top: 2px;
            }
            .invoice-no {
              font-size: 18px;
              font-weight: 900;
              color: #7C3AED;
              text-align: right;
            }
            .date {
              font-size: 11px;
              color: #6b7280;
              font-weight: 600;
            }
            .card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 18px;
              margin-bottom: 24px;
            }
            .customer-name {
              font-size: 18px;
              font-weight: 900;
              color: #111827;
            }
            .urgent-badge {
              display: inline-block;
              background: #fef3c7;
              color: #92400e;
              font-size: 10px;
              font-weight: 800;
              padding: 4px 10px;
              border-radius: 6px;
              margin-top: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th {
              background: #f3f4f6;
              color: #374151;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 12px;
              font-size: 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            .totals {
              width: 280px;
              margin-left: auto;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 16px;
              font-size: 12px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-weight: 600;
            }
            .grand-total {
              border-top: 2px solid #e5e7eb;
              padding-top: 10px;
              font-size: 15px;
              font-weight: 900;
              color: #111827;
            }
            .status-badge {
              display: inline-block;
              background: #ede9fe;
              color: #5b21b6;
              font-weight: 900;
              font-size: 10px;
              padding: 4px 10px;
              border-radius: 6px;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
              border-top: 1px solid #f3f4f6;
              padding-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Wash & Well Laundry</div>
              <div class="brand-sub">Official Customer Receipt & Invoice</div>
            </div>
            <div>
              <div class="invoice-no">${issuedInvoice.invoiceNo}</div>
              <div class="date">Date: ${issuedInvoice.collectedAt}</div>
            </div>
          </div>

          <div class="card">
            <div class="customer-name">${issuedInvoice.customer?.name}</div>
            ${issuedInvoice.customer?.placeName ? `<div style="font-weight:bold; color:#4b5563; margin-top:2px;">🏪 ${issuedInvoice.customer.placeName}</div>` : ''}
            <div style="margin-top:4px; font-weight:600;">Phone: ${issuedInvoice.customer?.phone || 'N/A'}</div>
            ${issuedInvoice.customer?.addresses?.[0]?.address ? `<div style="color:#6b7280;">Address: ${issuedInvoice.customer.addresses[0].address}</div>` : ''}
            ${issuedInvoice.isUrgent ? `<div class="urgent-badge">⚡ EXPRESS URGENT ORDER</div>` : ''}
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
              ${issuedInvoice.actualKg && Number(issuedInvoice.actualKg) > 0 ? `
                <tr>
                  <td><strong>Washing & Cleaning (${issuedInvoice.actualKg} KG)</strong></td>
                  <td style="text-align:center;">${issuedInvoice.actualKg} KG</td>
                  <td style="text-align:right;">LKR ${Number(issuedInvoice.kgRate).toLocaleString()}</td>
                  <td style="text-align:right;"><strong>LKR ${(Number(issuedInvoice.actualKg) * Number(issuedInvoice.kgRate)).toLocaleString()}</strong></td>
                </tr>
              ` : ''}
              ${(issuedInvoice.items || []).map((item: any) => `
                <tr>
                  <td><strong>${item.description}</strong></td>
                  <td style="text-align:center;">${item.quantity}</td>
                  <td style="text-align:right;">LKR ${Number(item.unitPrice).toLocaleString()}</td>
                  <td style="text-align:right;"><strong>LKR ${(item.quantity * item.unitPrice).toLocaleString()}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row"><span>Subtotal:</span> <span>LKR ${issuedInvoice.totals.subtotal.toLocaleString()}</span></div>
            ${issuedInvoice.totals.expressSurcharge > 0 ? `<div class="total-row" style="color:#92400e;"><span>Express Surcharge:</span> <span>+ LKR ${issuedInvoice.totals.expressSurcharge.toLocaleString()}</span></div>` : ''}
            ${issuedInvoice.totals.discountVal > 0 ? `<div class="total-row" style="color:#047857;"><span>Discount:</span> <span>- LKR ${issuedInvoice.totals.discountVal.toLocaleString()}</span></div>` : ''}
            <div class="total-row grand-total"><span>Grand Total Bill:</span> <span>LKR ${issuedInvoice.totals.grandTotal.toLocaleString()}</span></div>
            <div class="total-row" style="color:#047857; font-weight:bold;"><span>Amount Paid:</span> <span>LKR ${issuedInvoice.totals.paidVal.toLocaleString()}</span></div>
            <div class="total-row" style="color:#b91c1c; font-weight:bold;"><span>Pending Balance:</span> <span>LKR ${issuedInvoice.totals.balanceVal.toLocaleString()}</span></div>
            <div class="total-row" style="margin-top:8px;"><span>Payment Status:</span> <span class="status-badge">${issuedInvoice.totals.paymentStatus.replace("_", " ")}</span></div>
          </div>

          <div class="footer">
            Thank you for choosing Wash & Well Laundry! For any inquiries, please contact our support team.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
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
      link.download = `${issuedInvoice.invoiceNo}_Invoice.html`;
      link.click();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 font-extrabold text-[10px] rounded-md uppercase tracking-wider">
              Route Scoped Logistics
            </span>
            {driverName && <span className="text-xs text-gray-500 font-bold">• Driver: {driverName}</span>}
          </div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight mt-1">Pickup Orders Logistics</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Customer pickups assigned to your active route requiring physical laundry collection
          </p>
        </div>
      </div>

      {/* DRIVER ROUTE NOTIFICATION BANNER */}
      {pickups.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 rounded-3xl text-white shadow-md flex items-start gap-3 animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-white text-orange-900 font-black text-[10px] rounded-md">
                NOTIFICATION
              </span>
              <h3 className="font-extrabold text-sm">Approved Route Pickup Orders Available!</h3>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed">
              Admin has approved <strong>{pickups.length} order(s)</strong> for your assigned route. Review full details, navigate to customer locations, and collect laundry.
            </p>
          </div>
        </div>
      )}

      {/* PICKUPS LIST */}
      <div className="space-y-4">
        {pickups.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-2xs space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-extrabold text-gray-900">No Pending Pickups on Your Route!</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              All assigned pickup orders for your route have been completed or no new approved orders are pending.
            </p>
          </div>
        ) : (
          pickups.map((ord) => {
            const isArrived = arrivedMap[ord.id] || ord.pickup?.status === "ARRIVED";
            const routeInfo = ord.customer?.routeLinks?.[0]?.route;
            const primaryAddr = ord.customer?.addresses?.[0]?.address || "No address specified";

            return (
              <div
                key={ord.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-purple-900 text-sm bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                      {ord.orderNo}
                    </span>
                    {routeInfo && (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                        📍 {routeInfo.code} - {routeInfo.name}
                      </span>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase">
                    {ord.status}
                  </span>
                </div>

                {/* Customer Information & Address */}
                <div className="space-y-2">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">{ord.customer?.name}</h3>
                    {ord.customer?.placeName && (
                      <p className="text-xs font-bold text-gray-500">🏪 {ord.customer.placeName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-start gap-2">
                      <MapPin size={15} className="text-rose-500 shrink-0 mt-0.5" />
                      <span className="font-medium">{primaryAddr}</span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {ord.customer?.gpsLatitude && ord.customer?.gpsLongitude && (
                        <a
                          href={`https://www.google.com/maps?q=${ord.customer.gpsLatitude},${ord.customer.gpsLongitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-extrabold text-[10px] flex items-center gap-1 transition shadow-2xs"
                        >
                          <ExternalLink size={11} /> Open GPS Map
                        </a>
                      )}
                    </div>
                  </div>

                  {ord.notes && (
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs italic text-purple-900">
                      <strong>Special Rep Notes:</strong> "{ord.notes}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderDetails(ord)}
                    className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-2xl text-center transition flex items-center justify-center gap-1"
                  >
                    <FileText size={14} /> Details
                  </button>

                  {ord.customer?.phone ? (
                    <a
                      href={`tel:${ord.customer.phone}`}
                      className="py-2.5 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] font-extrabold text-xs rounded-2xl text-center transition flex items-center justify-center gap-1 border border-purple-200"
                    >
                      <Phone size={14} /> Call Shop
                    </a>
                  ) : (
                    <button disabled className="py-2.5 bg-gray-100 text-gray-400 font-bold text-xs rounded-2xl">
                      No Phone
                    </button>
                  )}

                  {!isArrived ? (
                    <button
                      onClick={() => handleMarkArrived(ord.id)}
                      className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow transition"
                    >
                      Mark Arrived
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowCollectModal(ord)}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow transition flex items-center justify-center gap-1"
                    >
                      <PackageCheck size={14} /> Collect
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-black text-[#7C3AED] text-xs bg-purple-100 px-2 py-0.5 rounded-md">
                  {selectedOrderDetails.orderNo}
                </span>
                <h3 className="font-extrabold text-gray-900 text-base mt-1">Full Pickup Details</h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full flex items-center justify-center text-xs"
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer Info */}
            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-2">
              <h4 className="font-black text-purple-900 text-sm">{selectedOrderDetails.customer?.name}</h4>
              {selectedOrderDetails.customer?.placeName && (
                <p className="text-xs font-bold text-gray-700">🏪 Shop: {selectedOrderDetails.customer.placeName}</p>
              )}
              <p className="text-gray-700">Phone: <strong>{selectedOrderDetails.customer?.phone || "N/A"}</strong></p>
              <p className="text-gray-700">Address: <strong>{selectedOrderDetails.customer?.addresses?.[0]?.address || "N/A"}</strong></p>
            </div>

            {/* Route & Approvals */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-gray-500 font-bold">Assigned Route:</span>
                <strong className="text-purple-900 font-extrabold">
                  {selectedOrderDetails.customer?.routeLinks?.[0]?.route?.code} - {selectedOrderDetails.customer?.routeLinks?.[0]?.route?.name}
                </strong>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-gray-500 font-bold">Created By Sales Rep:</span>
                <strong className="text-gray-900">{selectedOrderDetails.createdBy?.fullName || "Rep"}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-bold">Approved By Admin:</span>
                <strong className="text-emerald-700 font-bold">{selectedOrderDetails.approvedBy?.fullName || "Admin Approved"}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-xl text-xs transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENHANCED COLLECTION MODAL (KG / ITEMS / BOTH + CATALOGS + URGENT + PARTIAL PAYMENTS) */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto text-xs animate-in zoom-in-95 duration-150 border border-gray-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-black text-[#7C3AED] text-[11px] bg-purple-100 px-2.5 py-0.5 rounded-md">
                  {showCollectModal.orderNo}
                </span>
                <h3 className="font-black text-gray-900 text-base mt-0.5">Record Laundry Collection</h3>
              </div>
              <button
                onClick={() => setShowCollectModal(null)}
                className="w-8 h-8 bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full flex items-center justify-center text-xs"
              >
                <X size={16} />
              </button>
            </div>

            {/* Customer Summary Card */}
            <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100 flex items-center justify-between">
              <div>
                <p className="font-black text-purple-900 text-sm">{showCollectModal.customer?.name}</p>
                <p className="text-gray-600 font-bold">{showCollectModal.customer?.phone || "No phone"}</p>
              </div>
              <span className="px-2.5 py-1 bg-white text-[#7C3AED] font-extrabold rounded-lg border border-purple-100 shadow-2xs">
                {showCollectModal.customer?.customerType || "Cash"}
              </span>
            </div>

            <form onSubmit={handleRecordCollection} className="space-y-5">
              
              {/* 1. MEASUREMENT MODE SWITCHER */}
              <div className="space-y-2">
                <label className="block font-black text-gray-700 uppercase tracking-wider text-[10px]">
                  Select Collection Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "KG", label: "By Weight (KG)", icon: Scale },
                    { id: "ITEMS", label: "Individual Count", icon: ShoppingBag },
                    { id: "BOTH", label: "Both (KG + Items)", icon: Layers },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = collectionMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCollectionMode(m.id as any)}
                        className={`p-3 rounded-2xl border font-extrabold text-xs flex flex-col items-center justify-center gap-1.5 transition ${
                          active
                            ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <Icon size={16} />
                        <span className="text-[11px] text-center leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. URGENT / EXPRESS CHECKBOX */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 text-[#7C3AED] rounded border-gray-300 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-extrabold text-amber-900 text-xs block">⚡ Urgent / Express Processing</span>
                    <span className="text-[10px] text-amber-700 font-medium">Flag express delivery & priority laundry handling</span>
                  </div>
                </label>

                {isUrgent && (
                  <div className="w-28 shrink-0">
                    <label className="block text-[9px] font-extrabold text-amber-900 mb-0.5">Express Fee (LKR)</label>
                    <input
                      type="number"
                      value={expressFee}
                      onChange={(e) => setExpressFee(e.target.value)}
                      className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* 3. WEIGHT INPUT (IF MODE INCLUDES KG) */}
              {(collectionMode === "KG" || collectionMode === "BOTH") && (
                <div className="grid grid-cols-2 gap-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  <div>
                    <label className="block font-black text-purple-950 mb-1">Actual KG Collected *</label>
                    <input
                      type="number"
                      step="0.1"
                      required={collectionMode === "KG"}
                      placeholder="e.g. 18.5"
                      value={actualKg}
                      onChange={(e) => setActualKg(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-bold text-purple-900 outline-none focus:ring-2 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <label className="block font-black text-purple-950 mb-1">KG Rate (LKR)</label>
                    <input
                      type="number"
                      value={kgRate}
                      onChange={(e) => setKgRate(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-bold text-purple-900 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 4. INDIVIDUAL GARMENT & TREATMENT SELECTOR (AVAILABLE IN ALL MODES) */}
              <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-700 text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#7C3AED]" /> Garments & Process Treatments
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="text-[#7C3AED] font-extrabold text-[11px] hover:underline"
                  >
                    + Custom Item
                  </button>
                </div>

                {/* PRE-CONFIGURED CATALOG SELECTOR */}
                <select
                  value={selectedCatalogId}
                  onChange={handleSelectCatalogItem}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs outline-none focus:border-purple-500"
                >
                  <option value="">-- Add Garment Type or Process Treatment --</option>
                  <optgroup label="👚 GARMENT SERVICES CATALOG">
                    {GARMENT_SERVICES_CATALOG.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.serviceName} - {g.garmentType} ({g.includes}) - LKR {g.suggestedPrice}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="✨ PROCESS & TREATMENT CATALOG">
                    {PROCESS_TREATMENTS_CATALOG.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.processName} [{p.category}] - LKR {p.suggestedPrice}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* ADDED ITEM LIST */}
                <div className="space-y-2">
                  {itemList.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                        className="flex-1 p-1.5 border rounded-lg text-xs font-bold"
                        placeholder="Item Description"
                      />
                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                          className="w-full p-1.5 border rounded-lg text-center font-bold text-xs"
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))}
                          className="w-full p-1.5 border rounded-lg text-right font-bold text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. NOTES & DISCOUNT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount (LKR)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Collection Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Special stain note..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* 6. LIVE REAL-TIME FINANCIAL SUMMARY & PARTIAL PAYMENTS */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-4 rounded-2xl text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-purple-700/60 pb-2">
                  <span className="text-purple-200 text-[11px] font-bold">Computed Grand Total</span>
                  <span className="text-base font-black text-amber-300">
                    LKR {financialTotals.grandTotal.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-purple-200 uppercase mb-1">
                      Upfront Payment (LKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-2 bg-white text-purple-950 rounded-xl font-black text-sm outline-none"
                    />
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-purple-200 uppercase mb-1">
                      Pending Balance Amount
                    </span>
                    <span className="text-base font-black text-rose-300 block">
                      LKR {financialTotals.balanceVal.toLocaleString()}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1 ${
                        financialTotals.paymentStatus === "PAID"
                          ? "bg-emerald-400 text-emerald-950"
                          : financialTotals.paymentStatus === "PARTIALLY_PAID"
                          ? "bg-amber-400 text-amber-950"
                          : "bg-rose-400 text-rose-950"
                      }`}
                    >
                      {financialTotals.paymentStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl shadow-md shadow-purple-200 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "Processing..." : "Confirm & Issue Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. POST-COLLECTION CUSTOMER INVOICE & RECEIPT MODAL (PRINT & PDF DOWNLOAD) */}
      {issuedInvoice && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Printable Receipt Container */}
            <div id="customer-printable-invoice" className="space-y-5 text-xs text-gray-800">
              
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-purple-900 tracking-tight">Wash & Well Laundry</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Customer Official Invoice / Receipt</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-[#7C3AED] text-sm block">{issuedInvoice.invoiceNo}</span>
                  <span className="text-[10px] text-gray-400 block font-mono">{issuedInvoice.collectedAt}</span>
                </div>
              </div>

              {/* Customer & Order Details */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-1">
                <p className="font-black text-purple-900 text-sm">{issuedInvoice.customer?.name}</p>
                {issuedInvoice.customer?.placeName && (
                  <p className="font-bold text-gray-600 text-xs">🏪 {issuedInvoice.customer.placeName}</p>
                )}
                <p className="text-gray-600 font-medium">Phone: {issuedInvoice.customer?.phone || "N/A"}</p>
                {issuedInvoice.isUrgent && (
                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-black text-[10px] rounded mt-1">
                    ⚡ EXPRESS URGENT ORDER
                  </span>
                )}
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left border-t border-b border-gray-200">
                  <thead className="bg-gray-50 font-black text-gray-500 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right px-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {issuedInvoice.actualKg && Number(issuedInvoice.actualKg) > 0 && (
                      <tr>
                        <td className="py-2 px-2 font-bold">Washing & Cleaning ({issuedInvoice.actualKg} KG)</td>
                        <td className="py-2 text-center">{issuedInvoice.actualKg} KG</td>
                        <td className="py-2 text-right">Rs.{Number(issuedInvoice.kgRate).toLocaleString()}</td>
                        <td className="py-2 text-right font-black px-2">
                          Rs.{(Number(issuedInvoice.actualKg) * Number(issuedInvoice.kgRate)).toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {issuedInvoice.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 font-bold">{item.description}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">Rs.{Number(item.unitPrice).toLocaleString()}</td>
                        <td className="py-2 text-right font-black px-2">
                          Rs.{(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="space-y-1.5 font-bold text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>LKR {issuedInvoice.totals.subtotal.toLocaleString()}</span>
                </div>
                {issuedInvoice.totals.expressSurcharge > 0 && (
                  <div className="flex justify-between text-amber-800">
                    <span>Express Surcharge:</span>
                    <span>+ LKR {issuedInvoice.totals.expressSurcharge.toLocaleString()}</span>
                  </div>
                )}
                {issuedInvoice.totals.discountVal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>- LKR {issuedInvoice.totals.discountVal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-gray-900 pt-2 border-t">
                  <span>Grand Total Bill:</span>
                  <span>LKR {issuedInvoice.totals.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-extrabold pt-1">
                  <span>Amount Paid:</span>
                  <span>LKR {issuedInvoice.totals.paidVal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-black text-sm pt-1 border-t">
                  <span>Pending Balance:</span>
                  <span>LKR {issuedInvoice.totals.balanceVal.toLocaleString()}</span>
                </div>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 uppercase">Payment Status</span>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 font-black text-[10px] rounded uppercase">
                    {issuedInvoice.totals.paymentStatus.replace("_", " ")}
                  </span>
                </div>
              </div>

            </div>

            {/* Print & Download Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex-1 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 transition"
              >
                <Download size={15} /> Download PDF
              </button>

              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer size={15} /> Print Invoice
              </button>

              <button
                type="button"
                onClick={() => setIssuedInvoice(null)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-xl text-xs transition"
              >
                Done
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
