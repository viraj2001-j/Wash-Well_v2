"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Truck,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Calendar,
  Route as RouteIcon,
  User,
  PackageCheck,
  Check,
  Tag,
  ChevronDown,
  Layers,
  FileText,
  Lock,
  Plus,
  Printer,
  Eye,
  DollarSign,
  Scale,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";

interface EligibleInvoice {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  orderNo: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPlaceName?: string;
  customerPhone?: string;
  routeId: string;
  routeName: string;
  routeCode: string;
  invoiceDate: string;
  orderDate: string;
  repName: string;
  repId: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  totalItemsQty: number;
  items: Array<{
    id: string;
    name: string;
    service: string;
    pricingType: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  alreadyLoaded: boolean;
  activeLoadInfo?: {
    loadNumber: string;
    vehicleNumber: string;
    driverName: string;
    loadingDate: string;
    status: string;
  } | null;
  orderStatus: string;
}

interface SavedLoadRecord {
  id: string;
  loadNumber: string;
  companyId?: string;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  vehicleNumber: string;
  driverName: string;
  routeName: string;
  loadingDate: string;
  status: string; // LOADED, DRAFT, OUT_FOR_DELIVERY, COMPLETED, CANCELLED
  notes?: string;
  remark?: string;
  subtotal?: number;
  tax?: number;
  grandTotal?: number;
  totalOrders: number;
  totalCustomers?: number;
  totalItems: number;
  totalValue: number;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  orders?: Array<{
    id: string;
    orderId: string;
    order?: {
      id: string;
      orderNo: string;
      grandTotal: number;
      customer?: { name: string; phone?: string; placeName?: string };
      invoice?: { invoiceNo: string; total: number; subtotal: number; additionalCharges: number };
      items?: any[];
      visit?: { ref?: { fullName: string } };
      createdBy?: { fullName: string };
    };
  }>;
  salesmen?: Array<{ id: string; user?: { id: string; fullName: string } }>;
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function LorryLoadingPage() {
  const params = useParams();
  const companyCode = (params?.code as string) || "mob";

  // Data States
  const [savedLoads, setSavedLoads] = useState<SavedLoadRecord[]>([]);
  const [loadingSavedLoads, setLoadingSavedLoads] = useState(true);
  const [routes, setRoutes] = useState<any[]>([]);
  const [lorries, setLorries] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [eligibleInvoices, setEligibleInvoices] = useState<EligibleInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  // Main Page Filter States
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [tableRouteFilter, setTableRouteFilter] = useState("ALL");
  const [tableDriverFilter, setTableDriverFilter] = useState("ALL");
  const [tableStatusFilter, setTableStatusFilter] = useState("ALL");

  // Creation Popup Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Detail Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<SavedLoadRecord | null>(null);

  // Creation Form States
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [useAllDates, setUseAllDates] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedLorryId, setSelectedLorryId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("LOADED");
  const [customRemark, setCustomRemark] = useState<string>("");
  const [userHasEditedRemark, setUserHasEditedRemark] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (
    title: string,
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to safely parse JSON without throwing Unexpected end of JSON input
  const safeParseJson = async (res: Response) => {
    try {
      const text = await res.text();
      if (!text || !text.trim()) {
        return { success: false, error: `Server returned empty response (HTTP ${res.status})` };
      }
      return JSON.parse(text);
    } catch (err: any) {
      return { success: false, error: `Server returned invalid response (HTTP ${res.status})` };
    }
  };

  // 1. Fetch Saved Lorry Loads for Main Table
  const fetchSavedLoads = async () => {
    try {
      setLoadingSavedLoads(true);
      const res = await fetch(`/api/c/${companyCode}/laundry-loading`);
      const json = await safeParseJson(res);
      if (json.success) {
        setSavedLoads(json.data || []);
      } else {
        showToast("Notice", json.error || "Could not fetch saved lorry loads", "info");
      }
    } catch (err: any) {
      showToast("Error", "Failed to fetch saved lorry loads", "error");
    } finally {
      setLoadingSavedLoads(false);
    }
  };

  // 2. Fetch Master Dropdowns (Routes, Lorries, Drivers)
  const fetchDropdownData = async () => {
    try {
      const [resRoutes, resLorries, resDrivers] = await Promise.all([
        fetch(`/api/c/${companyCode}/routes`),
        fetch(`/api/c/${companyCode}/lorries`),
        fetch(`/api/c/${companyCode}/drivers`),
      ]);

      const jsonRoutes = await safeParseJson(resRoutes);
      if (jsonRoutes.success && jsonRoutes.data?.length > 0) {
        setRoutes(jsonRoutes.data);
        if (!selectedRouteId) setSelectedRouteId(jsonRoutes.data[0].id);
      }

      const jsonLorries = await safeParseJson(resLorries);
      if (jsonLorries.success && jsonLorries.data?.length > 0) {
        setLorries(jsonLorries.data);
        if (!selectedLorryId) setSelectedLorryId(jsonLorries.data[0].id);
      }

      const jsonDrivers = await safeParseJson(resDrivers);
      if (jsonDrivers.success && jsonDrivers.data?.length > 0) {
        setDrivers(jsonDrivers.data);
        if (!selectedDriverId) setSelectedDriverId(jsonDrivers.data[0].id);
      }
    } catch (err: any) {
      showToast("Error", "Failed to load master dropdown data", "error");
    }
  };

  useEffect(() => {
    fetchSavedLoads();
    fetchDropdownData();
  }, [companyCode]);

  // 3. Fetch Route Drivers (filters working drivers assigned to the specific route)
  const fetchRouteDrivers = async (rId: string, dateParam: string) => {
    if (!rId) return;
    try {
      const res = await fetch(`/api/c/${companyCode}/drivers?routeId=${rId}&date=${dateParam}`);
      const json = await safeParseJson(res);
      if (json.success && json.data?.length > 0) {
        setDrivers(json.data);
        const assignedDriver = json.data.find((d: any) => d.isAssignedToRoute);
        if (assignedDriver) {
          setSelectedDriverId(assignedDriver.id);
        } else if (json.data.length > 0) {
          setSelectedDriverId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch route drivers error:", err);
    }
  };

  // 4. Fetch Eligible Invoices & Drivers when Route or Date changes in Form
  const fetchEligibleInvoices = async () => {
    if (!selectedRouteId) return;

    try {
      setLoadingInvoices(true);
      const dateParam = useAllDates ? "ALL" : selectedInvoiceDate;

      // Fetch route-specific assigned working drivers
      fetchRouteDrivers(selectedRouteId, dateParam);

      const res = await fetch(
        `/api/c/${companyCode}/laundry-loading/eligible-orders?routeId=${selectedRouteId}&date=${dateParam}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      const json = await safeParseJson(res);
      if (json.success) {
        setEligibleInvoices(json.data || []);
      } else {
        showToast("Error", json.error || "Failed to fetch orders", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Failed to fetch orders", "error");
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (isCreateModalOpen && selectedRouteId) {
      fetchEligibleInvoices();
    }
  }, [selectedRouteId, selectedInvoiceDate, useAllDates, isCreateModalOpen]);

  // Open Create Modal Popup
  const handleOpenCreateModal = () => {
    setSelectedInvoiceIds([]);
    setUserHasEditedRemark(false);
    setCustomRemark("");
    setSelectedStatus("LOADED");
    if (routes.length > 0) setSelectedRouteId(routes[0].id);
    if (lorries.length > 0) setSelectedLorryId(lorries[0].id);
    if (drivers.length > 0) setSelectedDriverId(drivers[0].id);
    setIsCreateModalOpen(true);
  };

  // Open Detail Drawer
  const handleOpenDrawer = (load: SavedLoadRecord) => {
    setSelectedLoad(load);
    setIsDrawerOpen(true);
  };

  // Toggle Invoice Checkbox Selection
  const handleToggleInvoice = (inv: EligibleInvoice) => {
    if (inv.alreadyLoaded) {
      showToast(
        "Already Loaded",
        `Invoice ${inv.invoiceNo} is already loaded in ${inv.activeLoadInfo?.loadNumber || "an active lorry"}.`,
        "info"
      );
      return;
    }

    setSelectedInvoiceIds((prev) => {
      if (prev.includes(inv.id)) {
        return prev.filter((id) => id !== id);
      } else {
        return [...prev, inv.id];
      }
    });
  };

  // Toggle All Selectable Invoices
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const selectableIds = eligibleInvoices
        .filter((inv) => !inv.alreadyLoaded)
        .map((inv) => inv.id);
      setSelectedInvoiceIds(selectableIds);
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  // Selected Invoices Objects
  const selectedInvoiceObjects = useMemo(() => {
    return eligibleInvoices.filter((inv) => selectedInvoiceIds.includes(inv.id));
  }, [eligibleInvoices, selectedInvoiceIds]);

  // Auto-Derive Reps
  const derivedReps = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    selectedInvoiceObjects.forEach((inv) => {
      if (inv.repId && inv.repName) {
        map.set(inv.repId, { id: inv.repId, name: inv.repName });
      }
    });
    return Array.from(map.values());
  }, [selectedInvoiceObjects]);

  // Auto-Generate Remark
  useEffect(() => {
    if (!userHasEditedRemark) {
      if (selectedInvoiceObjects.length === 0) {
        setCustomRemark("");
      } else {
        const invNos = selectedInvoiceObjects.map((i) => i.invoiceNo).join(", ");
        setCustomRemark(`Loaded for Invoice(s): ${invNos}`);
      }
    }
  }, [selectedInvoiceObjects, userHasEditedRemark]);

  // Calculate Totals
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let grandTotal = 0;

    selectedInvoiceObjects.forEach((inv) => {
      subtotal += Number(inv.subtotal) || 0;
      tax += Number(inv.tax) || 0;
      grandTotal += Number(inv.grandTotal) || 0;
    });

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  }, [selectedInvoiceObjects]);

  // Save Lorry Loading
  const handleSaveLorryLoading = async () => {
    if (!selectedRouteId) {
      showToast("Validation Error", "Please select a route.", "error");
      return;
    }

    if (!selectedLorryId) {
      showToast("Validation Error", "Please select a valid lorry.", "error");
      return;
    }

    if (!selectedDriverId) {
      showToast("Validation Error", "Please select a valid driver.", "error");
      return;
    }

    if (selectedInvoiceIds.length === 0) {
      showToast(
        "Validation Error",
        "Please select at least one invoice to load.",
        "error"
      );
      return;
    }

    const selectedLorry = lorries.find((l) => l.id === selectedLorryId);
    const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

    setSavingLoading(true);

    const payload = {
      routeId: selectedRouteId,
      lorryId: selectedLorryId,
      vehicleNumber: selectedLorry?.vehicleNumber || "WP CAB-1234",
      driverId: selectedDriverId,
      driverName: selectedDriver?.fullName || "Driver",
      status: selectedStatus,
      orderIds: selectedInvoiceObjects.map((inv) => inv.orderId || inv.id),
      remark: customRemark.trim(),
      notes: customRemark.trim(),
      loadingDate: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/c/${companyCode}/laundry-loading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await safeParseJson(res);
      if (json.success) {
        showToast(
          "Lorry Loading Saved",
          json.message || `Lorry loading ${json.data?.loadNumber} saved successfully!`,
          "success"
        );
        setIsCreateModalOpen(false);
        setSelectedInvoiceIds([]);
        setUserHasEditedRemark(false);
        fetchSavedLoads();
      } else {
        showToast("Error", json.error || "Failed to save lorry loading", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Failed to save lorry loading", "error");
    } finally {
      setSavingLoading(false);
    }
  };

  // Print Loading Sheet Manifest Window
  const handlePrintManifest = (load: SavedLoadRecord) => {
    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) {
      showToast("Error", "Pop-up blocked. Please allow pop-ups to print loading sheet.", "error");
      return;
    }

    const ordersRows =
      load.orders && load.orders.length > 0
        ? load.orders
            .map(
              (o, i) => `
          <tr>
            <td>${i + 1}</td>
            <td style="font-weight:800; font-family:monospace;">${o.order?.invoice?.invoiceNo || o.order?.orderNo || `INV-${i + 1}`}</td>
            <td style="font-weight:700;">${o.order?.customer?.name || "Customer"}</td>
            <td style="font-weight:600;">${o.order?.visit?.ref?.fullName || o.order?.createdBy?.fullName || "Rep"}</td>
            <td style="text-align:right; font-weight:800;">LKR ${(o.order?.invoice?.total || o.order?.grandTotal || 0).toLocaleString()}</td>
            <td style="text-align:center;"><span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:800;">LOADED</span></td>
          </tr>
        `
            )
            .join("")
        : `<tr><td colSpan="6" style="text-align:center; padding:12px; color:#64748b;">Loaded Customer Orders & Invoices</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LORRY LOADING MANIFEST (${load.loadNumber})</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 35px; color: #0f172a; font-size: 12px; line-height: 1.5; }
            .sheet-card { border: 1px solid #cbd5e1; border-radius: 20px; padding: 35px; max-width: 820px; margin: 0 auto; }
            .header-bar { border-bottom: 3px solid #4338ca; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 20px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; letter-spacing: -0.5px; }
            .sub { font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 700; }
            .load-badge { background: #e0e7ff; color: #3730a3; font-weight: 900; padding: 6px 14px; border-radius: 10px; font-size: 14px; border: 1px solid #c7d2fe; display: inline-block; }
            .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 14px; border: 1px solid #f1f5f9; margin-bottom: 20px; }
            .meta-item label { font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 2px; }
            .meta-item span { font-weight: 800; color: #0f172a; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #f1f5f9; color: #475569; padding: 9px 11px; text-align: left; font-size: 10px; text-transform: uppercase; font-weight: 800; border-bottom: 2px solid #cbd5e1; }
            td { padding: 9px 11px; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
            .summary-box { background: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 14px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center; }
            .summary-box div label { font-size: 9px; font-weight: 800; color: #4338ca; text-transform: uppercase; display: block; }
            .summary-box div span { font-size: 15px; font-weight: 900; color: #1e1b4b; }
            .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 45px; text-align: center; }
            .sig-box { border-top: 1.5px solid #94a3b8; padding-top: 30px; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; }
            @media print { body { padding: 0; } .sheet-card { border: none; box-shadow: none; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="sheet-card">
            <div class="header-bar">
              <div>
                <div class="title">Wash & Well Laundry Management</div>
                <div class="sub">LORRY LOADING DISPATCH MANIFEST</div>
              </div>
              <div style="text-align:right;">
                <div class="load-badge">${load.loadNumber}</div>
                <div style="font-size:10px; font-weight:800; color:#16a34a; margin-top:4px;">STATUS: ${load.status}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item"><label>Loading Date</label><span>${load.loadingDate ? new Date(load.loadingDate).toLocaleDateString() : "Today"}</span></div>
              <div class="meta-item"><label>Route</label><span>${load.routeName}</span></div>
              <div class="meta-item"><label>Vehicle / Lorry</label><span>${load.vehicleNumber}</span></div>
              <div class="meta-item"><label>Assigned Driver</label><span>${load.driverName}</span></div>
              <div class="meta-item"><label>Loaded Invoices</label><span>${load.totalOrders} Invoices</span></div>
              <div class="meta-item"><label>Grand Total</label><span>LKR ${(load.grandTotal || load.totalValue || 0).toLocaleString()}</span></div>
            </div>

            <h4 style="font-size:10px; font-weight:800; text-transform:uppercase; color:#475569; margin-bottom:8px;">Loaded Invoices Breakdown</h4>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Rep / REF</th>
                  <th style="text-align:right;">Grand Total</th>
                  <th style="text-align:center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${ordersRows}
              </tbody>
            </table>

            <div class="summary-box">
              <div><label>TOTAL INVOICES</label><span>${load.totalOrders}</span></div>
              <div><label>TOTAL ITEMS</label><span>${load.totalItems || 0}</span></div>
              <div><label>GRAND TOTAL VALUE</label><span>LKR ${(load.grandTotal || load.totalValue || 0).toLocaleString()}</span></div>
            </div>

            <div class="signatures">
              <div class="sig-box">Driver Signature</div>
              <div class="sig-box">Loader Signature</div>
              <div class="sig-box">Manager Approval</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  // Main Page Filtered Saved Loads
  const filteredSavedLoads = useMemo(() => {
    return savedLoads.filter((load) => {
      const matchesSearch =
        tableSearchQuery === "" ||
        load.loadNumber.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        load.vehicleNumber.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        load.driverName.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        load.routeName.toLowerCase().includes(tableSearchQuery.toLowerCase());

      const matchesRoute = tableRouteFilter === "ALL" || load.routeId === tableRouteFilter || load.routeName.includes(tableRouteFilter);
      const matchesDriver = tableDriverFilter === "ALL" || load.driverId === tableDriverFilter;
      const matchesStatus = tableStatusFilter === "ALL" || load.status === tableStatusFilter;

      return matchesSearch && matchesRoute && matchesDriver && matchesStatus;
    });
  }, [savedLoads, tableSearchQuery, tableRouteFilter, tableDriverFilter, tableStatusFilter]);

  // KPI Calculations
  const totalLoadsCount = savedLoads.length;
  const activeLoadsCount = savedLoads.filter((l) => l.status === "LOADED" || l.status === "OUT_FOR_DELIVERY" || l.status === "CONFIRMED").length;
  const totalInvoicesLoadedSum = savedLoads.reduce((sum, l) => sum + (l.totalOrders || 0), 0);
  const totalLoadedValueSum = savedLoads.reduce((sum, l) => sum + Number(l.grandTotal || l.totalValue || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 relative text-xs font-sans">
      {/* ==================== FLOATING TOAST NOTIFICATIONS ==================== */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 ${
              t.type === "success"
                ? "bg-emerald-950/90 text-white border-emerald-700/50 shadow-emerald-950/40"
                : t.type === "error"
                ? "bg-red-950/90 text-white border-red-700/50 shadow-red-950/40"
                : "bg-indigo-950/90 text-white border-indigo-700/50 shadow-indigo-950/40"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === "error" && <AlertTriangle className="w-5 h-5 text-red-400" />}
              {t.type === "info" && <Lock className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-xs tracking-wide uppercase">{t.title}</h4>
              <p className="text-xs text-gray-200 mt-0.5 leading-snug">{t.message}</p>
            </div>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-white transition p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ==================== PAGE HEADER ==================== */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white p-6 md:p-8 rounded-3xl shadow-xl border border-indigo-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Laundry Logistics & Dispatch
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-indigo-300 stroke-[2.2]" />
            <span>Lorry Loading Management</span>
          </h1>
          <p className="text-indigo-200 text-xs mt-1 max-w-xl">
            Prepare completed customer orders and invoices for delivery, assign lorries and drivers, and save loading manifests cleanly into driver workflows.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <button
            onClick={fetchSavedLoads}
            disabled={loadingSavedLoads}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition flex items-center justify-center backdrop-blur-md border border-white/10"
            title="Refresh Loading Sheets"
          >
            <RefreshCw className={`w-5 h-5 ${loadingSavedLoads ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-600 hover:from-emerald-600 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-indigo-950/50 hover:shadow-indigo-950/80 transition flex items-center gap-2 transform active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>+ New Lorry Load</span>
          </button>
        </div>
      </div>

      {/* ==================== KPI STAT CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Lorry Loads</p>
            <h3 className="text-2xl font-black text-indigo-950 mt-1">{totalLoadsCount}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Saved Manifests</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Lorry Loads</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeLoadsCount}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Loaded / En Route</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Invoices Loaded</p>
            <h3 className="text-2xl font-black text-purple-900 mt-1">{totalInvoicesLoadedSum}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Customer Orders</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Payload Value</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">LKR {totalLoadedValueSum.toLocaleString()}</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Combined Value</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ==================== MAIN TABLE OF SAVED LORRY LOADS ==================== */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden space-y-4">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50/60 via-white to-indigo-50/20">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>Saved Lorry Loading Manifests</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Click any load row to open its slide-over detail drawer, view loaded invoices, or print dispatch manifest.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search load #, vehicle, driver, route..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold text-gray-700 focus:bg-white transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="LOADED">LOADED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Saved Loads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Load Number</th>
                <th className="py-3.5 px-4">Loading Date</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Lorry / Vehicle</th>
                <th className="py-3.5 px-4">Assigned Driver</th>
                <th className="py-3.5 px-4 text-center">Invoices</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loadingSavedLoads ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <span>Loading saved lorry loading manifests...</span>
                  </td>
                </tr>
              ) : filteredSavedLoads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2 stroke-[1.5]" />
                    <h3 className="font-bold text-gray-800">No Lorry Loading Sheets Found</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Click "+ New Lorry Load" button above to create a new lorry loading manifest.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSavedLoads.map((load) => (
                  <tr
                    key={load.id}
                    onClick={() => handleOpenDrawer(load)}
                    className="hover:bg-indigo-50/50 transition cursor-pointer"
                  >
                    {/* Load Number */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-indigo-900 bg-indigo-100/80 px-2.5 py-1 rounded-md border border-indigo-200">
                        {load.loadNumber}
                      </span>
                    </td>

                    {/* Loading Date */}
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">
                      {load.loadingDate ? new Date(load.loadingDate).toLocaleDateString() : "Today"}
                    </td>

                    {/* Route */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-purple-900">{load.routeName}</span>
                    </td>

                    {/* Lorry Vehicle */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                        🚛 {load.vehicleNumber}
                      </span>
                    </td>

                    {/* Driver */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-800">👤 {load.driverName}</span>
                    </td>

                    {/* Invoices Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        {load.totalOrders} Invoices
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                      LKR {Number(load.grandTotal || load.totalValue || 0).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          load.status === "LOADED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : load.status === "OUT_FOR_DELIVERY"
                            ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                            : load.status === "COMPLETED"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : load.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {load.status || "LOADED"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDrawer(load)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition"
                          title="View Details Drawer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintManifest(load)}
                          className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition"
                          title="Print Manifest"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== SLIDE-OVER DETAIL DRAWER ==================== */}
      {isDrawerOpen && selectedLoad && (
        <div className="fixed inset-0 z-[110] overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm bg-indigo-800/60 px-3 py-1 rounded-lg border border-indigo-700">
                      {selectedLoad.loadNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedLoad.status || "LOADED"}
                    </span>
                  </div>
                  <h2 className="text-lg font-black mt-2">Lorry Loading Manifest Details</h2>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Metadata Grid */}
                <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Vehicle / Lorry</span>
                    <span className="font-extrabold text-gray-900">🚛 {selectedLoad.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Assigned Driver</span>
                    <span className="font-extrabold text-gray-900">👤 {selectedLoad.driverName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Delivery Route</span>
                    <span className="font-extrabold text-purple-900">📍 {selectedLoad.routeName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Loading Date</span>
                    <span className="font-bold text-gray-900">
                      📅 {selectedLoad.loadingDate ? new Date(selectedLoad.loadingDate).toLocaleDateString() : "Today"}
                    </span>
                  </div>
                </div>

                {selectedLoad.remark && (
                  <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-950">
                    <strong className="block text-[10px] uppercase font-black text-amber-800 mb-0.5">Remark / Note</strong>
                    <span>{selectedLoad.remark}</span>
                  </div>
                )}

                {/* Loaded Invoices List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-2">
                    <span>Loaded Customer Invoices ({selectedLoad.orders?.length || selectedLoad.totalOrders || 0})</span>
                    <span className="font-black text-indigo-900">
                      Total: LKR {Number(selectedLoad.grandTotal || selectedLoad.totalValue || 0).toLocaleString()}
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {selectedLoad.orders && selectedLoad.orders.length > 0 ? (
                      selectedLoad.orders.map((o, idx) => {
                        const inv = o.order?.invoice;
                        const invNo = inv?.invoiceNo || o.order?.orderNo || `INV-${idx + 1}`;
                        const custName = o.order?.customer?.name || "Customer";
                        const repName = o.order?.visit?.ref?.fullName || o.order?.createdBy?.fullName || "Rep";
                        const amt = inv?.total || o.order?.grandTotal || 0;

                        return (
                          <div
                            key={o.id || idx}
                            className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-xs text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {invNo}
                              </span>
                              <span className="font-black text-emerald-700 text-xs">
                                LKR {Number(amt).toLocaleString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Customer</span>
                                <span className="font-bold text-gray-900">{custName}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold block uppercase">Rep / REF</span>
                                <span className="font-bold text-purple-900">{repName}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-xs">
                        Loaded orders detail breakdown saved on database.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrintManifest(selectedLoad)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Manifest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATION POPUP MODAL / DRAWER ==================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-6xl w-full rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-6 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  New Dispatch Manifest
                </div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Truck className="w-6 h-6 text-indigo-300" />
                  <span>Create Lorry Loading Sheet</span>
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Workflow Form */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
              {/* STEP 1 & 2: INVOICE DATE & ROUTE SELECTION */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-gray-900 tracking-tight flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Step 1 & 2 — Invoice Date & Route Selection</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* STEP 1: INVOICE DATE FILTER */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Invoice Date
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={selectedInvoiceDate}
                        disabled={useAllDates}
                        onChange={(e) => setSelectedInvoiceDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setUseAllDates(!useAllDates)}
                        className={`px-3 py-2.5 rounded-xl font-extrabold text-xs transition shrink-0 border ${
                          useAllDates
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {useAllDates ? "All Dates Active" : "All Dates"}
                      </button>
                    </div>
                  </div>

                  {/* STEP 2: ROUTE SELECTION */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Select Route (Database)
                    </label>
                    <div className="relative">
                      <select
                        value={selectedRouteId}
                        onChange={(e) => setSelectedRouteId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
                      >
                        {routes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* STEP 3: TOP OPTIONAL INVOICE MULTI-SELECT DROPDOWN */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                      Select Invoice(s) — Optional Top Selector
                    </label>
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const invId = e.target.value;
                          if (!invId) return;
                          const targetInv = eligibleInvoices.find((i) => i.id === invId);
                          if (targetInv) handleToggleInvoice(targetInv);
                          e.target.value = "";
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
                      >
                        <option value="">
                          -- Choose invoice to add ({selectedInvoiceIds.length} selected) --
                        </option>
                        {eligibleInvoices.map((inv) => (
                          <option
                            key={inv.id}
                            value={inv.id}
                            disabled={inv.alreadyLoaded}
                          >
                            {inv.invoiceNo} - {inv.customerName} (LKR {inv.grandTotal.toLocaleString()})
                            {inv.alreadyLoaded ? " [ALREADY LOADED]" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SELECTED INVOICE DETAILS CARDS */}
              {selectedInvoiceObjects.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-gray-900 tracking-tight flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Selected Invoice(s) Breakdown ({selectedInvoiceObjects.length})</span>
                    </span>
                    <button
                      onClick={() => setSelectedInvoiceIds([])}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Clear All Selections
                    </button>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedInvoiceObjects.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs space-y-2 relative"
                      >
                        <button
                          onClick={() => handleToggleInvoice(inv)}
                          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-full transition"
                          title="Remove Invoice"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 font-mono font-black text-xs border border-indigo-200">
                            {inv.invoiceNo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {inv.orderStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400 text-[10px] uppercase font-bold block">Customer</span>
                            <span className="font-extrabold text-gray-900">{inv.customerName}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] uppercase font-bold block">Route & Rep</span>
                            <span className="font-extrabold text-gray-900 block">{inv.routeName}</span>
                            <span className="text-[10px] text-purple-700 font-bold">Rep: {inv.repName}</span>
                          </div>
                        </div>

                        {/* Invoice Items */}
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                            Laundry Items & Service ({inv.items.length})
                          </span>
                          <div className="divide-y divide-gray-200/60 max-h-20 overflow-y-auto pr-1 space-y-1">
                            {inv.items.map((it) => (
                              <div key={it.id} className="pt-1 flex items-center justify-between text-[11px]">
                                <span className="font-bold text-gray-800">
                                  {it.name} <span className="text-[9px] text-gray-400 font-normal">({it.service})</span>
                                </span>
                                <span className="font-extrabold text-indigo-950">
                                  {it.quantity} Pcs — LKR {it.total.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs font-bold">
                          <span className="text-gray-500 text-[11px]">
                            Subtotal: LKR {inv.subtotal.toLocaleString()} | Tax: LKR {inv.tax.toLocaleString()}
                          </span>
                          <span className="text-xs font-black text-indigo-900">
                            Grand Total: LKR {inv.grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MAIN COMPLETED CUSTOMER ORDERS TABLE */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden space-y-3">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-gradient-to-r from-gray-50/60 via-white to-indigo-50/20">
                  <div>
                    <h3 className="text-xs font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-indigo-600" />
                      <span>Completed Customer Orders Table</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Check rows to include them in the lorry loading manifest.
                    </p>
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search invoice #, customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={
                              eligibleInvoices.length > 0 &&
                              eligibleInvoices.filter((i) => !i.alreadyLoaded).every((i) => selectedInvoiceIds.includes(i.id))
                            }
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Customer & Shop</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3">Items / Qty</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 text-right">Tax</th>
                        <th className="py-2.5 px-3 text-right">Grand Total</th>
                        <th className="py-2.5 px-3">Rep / REF</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {loadingInvoices ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-400">
                            <RefreshCw className="w-5 h-5 animate-spin text-indigo-600 mx-auto mb-1" />
                            <span>Loading completed customer orders...</span>
                          </td>
                        </tr>
                      ) : eligibleInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-500">
                            <PackageCheck className="w-8 h-8 text-gray-300 mx-auto mb-1 stroke-[1.5]" />
                            <h4 className="font-bold text-gray-800">No Completed Orders Found</h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              No eligible completed customer orders available for the selected route/date.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        eligibleInvoices.map((inv) => {
                          const isSelected = selectedInvoiceIds.includes(inv.id);

                          return (
                            <tr
                              key={inv.id}
                              onClick={() => handleToggleInvoice(inv)}
                              className={`transition cursor-pointer ${
                                inv.alreadyLoaded
                                  ? "bg-amber-50/40 opacity-80 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-indigo-50/70 font-semibold"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={inv.alreadyLoaded}
                                  onChange={() => handleToggleInvoice(inv)}
                                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </td>

                              {/* Invoice No */}
                              <td className="py-3 px-3">
                                <span className="font-mono font-black text-indigo-900 bg-indigo-100/80 px-2 py-0.5 rounded border border-indigo-200">
                                  {inv.invoiceNo}
                                </span>
                              </td>

                              {/* Customer & Address */}
                              <td className="py-3 px-3">
                                <span className="font-extrabold text-gray-900 block">{inv.customerName}</span>
                                {inv.customerPlaceName && (
                                  <span className="text-[9px] text-gray-500 font-bold block">🏪 {inv.customerPlaceName}</span>
                                )}
                                {(inv as any).customerAddress && (
                                  <span className="text-[9px] text-indigo-700 font-semibold block truncate max-w-[220px]" title={(inv as any).customerAddress}>
                                    📍 {(inv as any).customerAddress}
                                  </span>
                                )}
                              </td>

                              {/* Route */}
                              <td className="py-3 px-3">
                                <span className="font-bold text-purple-900">{inv.routeName}</span>
                              </td>

                              {/* Items Qty */}
                              <td className="py-3 px-3">
                                <span className="font-extrabold text-gray-800">{inv.totalItemsQty} Qty</span>
                              </td>

                              {/* Subtotal */}
                              <td className="py-3 px-3 text-right font-semibold text-gray-600">
                                Rs. {inv.subtotal.toLocaleString()}
                              </td>

                              {/* Tax */}
                              <td className="py-3 px-3 text-right font-semibold text-gray-600">
                                Rs. {inv.tax.toLocaleString()}
                              </td>

                              {/* Grand Total */}
                              <td className="py-3 px-3 text-right font-black text-indigo-950">
                                Rs. {inv.grandTotal.toLocaleString()}
                              </td>

                              {/* Rep */}
                              <td className="py-3 px-3">
                                <span className="font-extrabold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                  {inv.repName}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3 text-center">
                                {inv.alreadyLoaded ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> ALREADY LOADED
                                    </span>
                                    {inv.activeLoadInfo && (
                                      <span className="text-[9px] text-amber-800 font-bold mt-0.5">
                                        {inv.activeLoadInfo.loadNumber} ({inv.activeLoadInfo.vehicleNumber})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                                    READY
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LORRY LOADING ASSIGNMENT FORM */}
              <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-gray-900 tracking-tight flex items-center gap-2 border-b border-gray-100 pb-2.5">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>Loading Vehicle, Driver, Status & Rep Assignment</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* LORRY SELECTION */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                      Select Lorry (Database)
                    </label>
                    <div className="relative">
                      <select
                        value={selectedLorryId}
                        onChange={(e) => setSelectedLorryId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
                      >
                        {lorries.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.vehicleNumber} ({l.model || "Lorry"}) - [{l.status}]
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* DRIVER SELECTION */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                      Select Driver (DRIVER Role)
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
                      >
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.displayName || `${d.fullName} (${d.phone || d.username || "Driver"})`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* LOADING STATUS SELECTION */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                      Loading Status
                    </label>
                    <div className="relative">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none"
                      >
                        <option value="LOADED">LOADED (Ready for Delivery)</option>
                        <option value="DRAFT">DRAFT (Draft Loading Sheet)</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (En Route)</option>
                        <option value="COMPLETED">COMPLETED (All Delivered)</option>
                        <option value="CANCELLED">CANCELLED (Cancelled)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* AUTO-FILLED REPS */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                      Rep / Reps (Auto-Filled)
                    </label>
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap gap-1.5 min-h-[38px] items-center">
                      {derivedReps.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">Auto-derived Reps</span>
                      ) : (
                        derivedReps.map((rep) => (
                          <span
                            key={rep.id}
                            className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 font-extrabold text-xs border border-purple-200 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-purple-700" />
                            <span>{rep.name}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* REMARK AUTO-GENERATION */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                    Remark (Auto-Generated & Editable)
                  </label>
                  <textarea
                    rows={2}
                    value={customRemark}
                    onChange={(e) => {
                      setCustomRemark(e.target.value);
                      setUserHasEditedRemark(true);
                    }}
                    placeholder="Loaded for Invoice(s): INV-001..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer - Totals & Save Actions */}
            <div className="p-5 bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-indigo-900/50 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                <div>
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                    Selected Invoices
                  </span>
                  <span className="text-lg font-black text-white">
                    {selectedInvoiceObjects.length} Invoices
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Subtotal
                  </span>
                  <span className="text-base font-extrabold text-gray-200">
                    Rs. {calculatedTotals.subtotal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Tax / Charges
                  </span>
                  <span className="text-base font-extrabold text-gray-200">
                    Rs. {calculatedTotals.tax.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Grand Total
                  </span>
                  <span className="text-xl font-black text-emerald-300">
                    Rs. {calculatedTotals.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-bold text-xs transition border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLorryLoading}
                  disabled={savingLoading || selectedInvoiceIds.length === 0}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-black text-xs shadow-xl shadow-indigo-950/60 transition flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>{savingLoading ? "Saving Load..." : "SAVE LORRY LOAD"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
