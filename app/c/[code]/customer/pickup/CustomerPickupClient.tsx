"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Shirt,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Building,
  Home,
  FileText,
  AlertTriangle,
  Zap,
  Plus,
  Minus,
  Check,
  Trash2,
  Layers,
  Droplets,
  Wind,
  ShoppingBag,
  Scale,
  Tag,
  DollarSign,
  X,
} from "lucide-react";

interface CustomerAddress {
  id: string;
  label?: string | null;
  address: string;
  city?: string | null;
  isPrimary: boolean;
}

interface ServicePrice {
  id: string;
  price: number | string;
}

interface DBService {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  pricingType: "PER_KG" | "PER_PIECE" | "FIXED";
  prices?: ServicePrice[];
}

interface CustomerPickupClientProps {
  companyCode: string;
  customer: any;
  addresses: CustomerAddress[];
  services: DBService[];
}

// 1. PRECONFIGURED GARMENT SERVICES CATALOG
const GARMENT_SERVICES_CATALOG = [
  { id: "g1", serviceName: "Wash & Fold", garmentType: "Shirts & T-Shirts", includes: "Wash, Dry, Fold", suggestedPrice: 350 },
  { id: "g2", serviceName: "Wash & Fold", garmentType: "Trousers & Jeans", includes: "Wash, Dry, Fold", suggestedPrice: 400 },
  { id: "g3", serviceName: "Wash & Iron", garmentType: "Formal Shirt", includes: "Wash, Steam Iron", suggestedPrice: 450 },
  { id: "g4", serviceName: "Wash & Iron", garmentType: "Trousers & Suits", includes: "Wash, Press, Hanger", suggestedPrice: 600 },
  { id: "g5", serviceName: "Dry Cleaning", garmentType: "Suit 2-Piece", includes: "Dry Clean, Press, Cover", suggestedPrice: 1200 },
  { id: "g6", serviceName: "Dry Cleaning", garmentType: "Saree / Silk", includes: "Gentle Clean, Steam Press", suggestedPrice: 1500 },
];

// 2. PRECONFIGURED PROCESS & TREATMENT CATALOG
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

export default function CustomerPickupClient({
  companyCode,
  customer,
  addresses,
  services = [],
}: CustomerPickupClientProps) {
  const router = useRouter();

  // Address & Slot state
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isPrimary)?.id || addresses[0]?.id || ""
  );
  const [customAddress, setCustomAddress] = useState("");
  const [pickupDate, setPickupDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [timeSlot, setTimeSlot] = useState("Morning (8:00 AM - 11:00 AM)");

  // 1. COLLECTION MODE SWITCHER
  const [collectionMode, setCollectionMode] = useState<"KG" | "ITEMS" | "BOTH">("BOTH");

  // 2. WEIGHT / KG INPUTS
  const [actualKg, setActualKg] = useState("");
  const [kgRate, setKgRate] = useState("250");

  // 3. URGENT / EXPRESS PROCESS CHECKBOX
  const [isUrgent, setIsUrgent] = useState(false);
  const [expressFee, setExpressFee] = useState("300");

  // 4. GARMENTS & PROCESS TREATMENTS ITEM LIST
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [itemList, setItemList] = useState<
    Array<{ id: string; serviceId?: string; description: string; pricingType: string; quantity: number; unitPrice: number }>
  >([]);

  // 5. DISCOUNT, NOTES & PAYMENT
  const [discount, setDiscount] = useState("0");
  const [careNotes, setCareNotes] = useState("");
  const [upfrontPayment, setUpfrontPayment] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const timeSlots = [
    "Morning (8:00 AM - 11:00 AM)",
    "Afternoon (1:00 PM - 4:00 PM)",
    "Evening (5:00 PM - 8:00 PM)",
  ];

  // Add Item From Catalog Selection Dropdown
  const handleSelectCatalogItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCatalogId(val);
    if (!val) return;

    // Check DB Services first
    const dbSrv = services.find((s) => s.id === val);
    if (dbSrv) {
      const uPrice = dbSrv.prices && dbSrv.prices.length > 0 ? Number(dbSrv.prices[0].price) : 350;
      setItemList((prev) => [
        ...prev,
        {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          serviceId: dbSrv.id,
          description: dbSrv.name,
          pricingType: dbSrv.pricingType,
          quantity: 1,
          unitPrice: uPrice,
        },
      ]);
      setSelectedCatalogId("");
      return;
    }

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
        description: "Custom Garment / Special Care Process",
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

    const paidVal = Number(upfrontPayment) || 0;
    const balanceVal = Math.max(0, grandTotal - paidVal);

    let paymentStatus = "UNPAID";
    if (paidVal >= grandTotal && grandTotal > 0) {
      paymentStatus = "PAID";
    } else if (paidVal > 0 && paidVal < grandTotal) {
      paymentStatus = "PARTIALLY_PAID";
    }

    return { kgTotal, itemsTotal, subtotal, expressSurcharge, discountVal, grandTotal, paidVal, balanceVal, paymentStatus };
  }, [collectionMode, actualKg, kgRate, itemList, isUrgent, expressFee, discount, upfrontPayment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDate) {
      setError("Please choose a pickup date.");
      return;
    }
    if (addresses.length === 0 && !customAddress.trim()) {
      setError("Please enter a pickup address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/c/${companyCode}/customer/pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          customAddress,
          pickupDate,
          timeSlot,
          collectionMode,
          actualKg: (collectionMode === "KG" || collectionMode === "BOTH") ? Number(actualKg) || 0 : 0,
          kgRate: Number(kgRate) || 0,
          items: itemList,
          discount: Number(discount) || 0,
          isPriority: isUrgent,
          expressFee: isUrgent ? Number(expressFee) || 0 : 0,
          upfrontPayment: Number(upfrontPayment) || 0,
          careNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule pickup.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/c/${companyCode}/customer/orders`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Pickup Request Scheduled! 🎉
        </h2>
        <p className="text-sm text-slate-600">
          Your order has been submitted for manager approval. Our driver will arrive on <strong className="text-purple-700">{pickupDate}</strong> during the <strong className="text-purple-700">{timeSlot}</strong> slot.
        </p>
        {isUrgent && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            Urgent Express Delivery Flagged
          </div>
        )}
        <p className="text-xs text-slate-400">
          Redirecting to your orders dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Doorstep Collection & Processing Builder
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            Schedule a Laundry Pickup
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Configure collection mode (Weight / Items / Both), garment & treatment catalog items, urgent express priority, and upfront payments.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-xs text-slate-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Eco-Friendly Washing Guaranteed</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: SELECT ADDRESS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-extrabold">
              1
            </div>
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>Select Pickup & Delivery Address</span>
          </div>

          {addresses.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                    selectedAddressId === addr.id
                      ? "border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="addressSelect"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">
                        {addr.label || "Address"}
                      </span>
                      {addr.isPrimary && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed">{addr.address}</p>
                    {addr.city && <p className="text-slate-400 text-[11px]">{addr.city}</p>}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter Pickup Street Address *
              </label>
              <textarea
                required
                rows={3}
                placeholder="No. 123, Galle Road, Colombo 03..."
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-purple-600 transition"
              />
            </div>
          )}
        </div>

        {/* STEP 2: DATE & TIME SLOT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-extrabold">
              2
            </div>
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Select Pickup Date & Time Slot</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Preferred Pickup Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Preferred Time Slot *
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-purple-600 transition"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* STEP 3: COLLECTION MODE SWITCHER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-extrabold">
              3
            </div>
            <Scale className="w-4 h-4 text-purple-600" />
            <span>Select Collection Mode</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
                  className={`p-3.5 rounded-2xl border font-extrabold text-xs flex flex-col items-center justify-center gap-2 transition ${
                    active
                      ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-md"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs text-center leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 4: URGENT / EXPRESS PROCESSING CHECKBOX */}
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between shadow-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-amber-300 focus:ring-purple-500 cursor-pointer"
            />
            <div>
              <span className="font-extrabold text-amber-950 text-xs block">
                ⚡ Urgent / Express Processing
              </span>
              <span className="text-[11px] text-amber-800 font-medium">
                Flag express delivery & priority laundry handling
              </span>
            </div>
          </label>

          {isUrgent && (
            <div className="w-32 shrink-0">
              <label className="block text-[10px] font-extrabold text-amber-950 mb-0.5">
                Express Fee (LKR)
              </label>
              <input
                type="number"
                value={expressFee}
                onChange={(e) => setExpressFee(e.target.value)}
                className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-extrabold text-amber-950 outline-none"
              />
            </div>
          )}
        </div>

        {/* STEP 5: WEIGHT INPUTS (IF MODE INCLUDES KG) */}
        {(collectionMode === "KG" || collectionMode === "BOTH") && (
          <div className="grid grid-cols-2 gap-4 bg-purple-50/60 p-5 rounded-2xl border border-purple-100 shadow-xs">
            <div>
              <label className="block font-black text-purple-950 text-xs mb-1">
                Actual KG Collected *
              </label>
              <input
                type="number"
                step="0.1"
                required={collectionMode === "KG"}
                placeholder="e.g. 18.5"
                value={actualKg}
                onChange={(e) => setActualKg(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-purple-300 rounded-xl font-extrabold text-purple-950 text-xs outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div>
              <label className="block font-black text-purple-950 text-xs mb-1">
                KG Rate (LKR)
              </label>
              <input
                type="number"
                value={kgRate}
                onChange={(e) => setKgRate(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-purple-300 rounded-xl font-extrabold text-purple-950 text-xs outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 6: GARMENTS & PROCESS TREATMENTS CATALOG SELECTOR */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#7C3AED]" /> Garments & Process Treatments
            </span>
            <button
              type="button"
              onClick={handleAddCustomItem}
              className="text-[#7C3AED] font-extrabold text-xs hover:underline"
            >
              + Custom Item
            </button>
          </div>

          {/* CATALOG SELECTOR DROPDOWN */}
          <select
            value={selectedCatalogId}
            onChange={handleSelectCatalogItem}
            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-purple-600 transition"
          >
            <option value="">-- Add Garment Type or Process Treatment --</option>
            {services.length > 0 && (
              <optgroup label="🏢 COMPANY DATABASE SERVICES">
                {services.map((s) => {
                  const p = s.prices && s.prices.length > 0 ? Number(s.prices[0].price) : 350;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.pricingType}) - LKR {p}
                    </option>
                  );
                })}
              </optgroup>
            )}
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
          <div className="space-y-2.5">
            {itemList.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none"
                  placeholder="Item Description"
                />
                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-black text-xs outline-none"
                    placeholder="Qty"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-right font-black text-xs outline-none"
                    placeholder="Price"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 7: DISCOUNT & COLLECTION NOTES */}
        <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <label className="block font-bold text-xs text-slate-700 mb-1">
              Discount (LKR)
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-xs text-slate-700 mb-1">
              Collection Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Special stain note..."
              value={careNotes}
              onChange={(e) => setCareNotes(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
            />
          </div>
        </div>

        {/* STEP 8: LIVE REAL-TIME FINANCIAL SUMMARY & UPFRONT PAYMENTS */}
        <div className="bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-purple-800/60 pb-3">
            <span className="text-purple-200 text-xs font-bold">Computed Grand Total</span>
            <span className="text-xl font-black text-amber-300">
              LKR {financialTotals.grandTotal.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[10px] font-extrabold text-purple-200 uppercase mb-1">
                Upfront Payment (LKR)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={upfrontPayment}
                onChange={(e) => setUpfrontPayment(e.target.value)}
                className="w-full h-11 px-3 bg-white text-purple-950 rounded-xl font-black text-base outline-none"
              />
            </div>

            <div className="text-right">
              <span className="block text-[10px] font-extrabold text-purple-200 uppercase mb-1">
                Pending Balance Amount
              </span>
              <span className="text-lg font-black text-rose-300 block">
                LKR {financialTotals.balanceVal.toLocaleString()}
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase mt-1 ${
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

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Confirm & Schedule Pickup</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
