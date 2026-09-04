"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Info,
  Clock,
  Gauge,
  FileText,
  Calendar,
  Layers,
  PackageCheck,
  Printer,
  User,
  Scale,
  DollarSign,
  QrCode,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  AlertCircle,
  Tag,
} from "lucide-react";

/* =========================================================
   TYPES & INTERFACES FOR LAUNDRY LORRY LOADING MODULE
========================================================= */
interface LaundryItem {
  id: string;
  item: string;
  quantity: number;
  serviceType: "WASH" | "WASH_AND_IRON" | "IRON_ONLY" | "DRY_CLEANING" | "FOLDING" | "PRESSING" | "STAIN_REMOVAL" | "ALTERATION" | "OTHER" | string;
  weight?: number;
  specialInstructions?: string;
  status?: string;
}

interface BagRecord {
  id: string;
  bagNumber: string;
  orderId: string;
  weight: number;
  sealNumber?: string;
  status?: "CREATED" | "READY_FOR_PICKUP" | "ASSIGNED" | "COLLECTED" | "PROCESSING" | "READY_FOR_DELIVERY" | "LOADED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | string;
  serviceType?: string;
  itemCount?: number;
}

interface EligibleOrder {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  itemsCount: number;
  weight: number;
  bagsCount: number;
  orderValue: number;
  paidAmount?: number;
  outstandingAmount?: number;
  paymentStatus?: "PAID" | "UNPAID" | "PARTIALLY_PAID" | string;
  status: string;
  bags: BagRecord[];
  items?: LaundryItem[];
  specialInstructions?: string;
}

interface PickupRequest {
  id: string;
  customerName: string;
  customerCode: string;
  pickupAddress: string;
  routeId: string;
  routeName: string;
  expectedBags: number;
  estimatedWeight: number;
  specialInstructions?: string;
  status: "SCHEDULED" | "ASSIGNED" | "LOADED" | "COLLECTED" | "MISSED" | "CANCELLED";
}

interface LaundryLoadRecord {
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
  loadingType: "DELIVERY" | "PICKUP" | "MIXED" | string;
  vehicleCapacity?: number;
  status: "DRAFT" | "CONFIRMED" | "IN_TRANSIT" | "LOADING" | "LOADED" | "WITH_DRIVER" | "RECEIVED" | "CANCELLED" | string;
  notes?: string;
  totalOrders: number;
  totalCustomers: number;
  totalBags: number;
  pickupBagsCount?: number;
  deliveryBagsCount?: number;
  totalItems: number;
  totalWeight: number;
  totalValue: number;
  paidAmount?: number;
  outstandingAmount?: number;
  createdById?: string;
  confirmedById?: string;
  confirmedAt?: string;
  receivedById?: string;
  receivedAt?: string;
  receivedBags?: number;
  receivedWeight?: number;
  varianceWeight?: number;
  varianceReason?: string;
  createdAt?: string;
  updatedAt?: string;
  route?: { id: string; name: string; code: string };
  orders?: Array<{
    id: string;
    orderId: string;
    order?: {
      id: string;
      orderNo: string;
      grandTotal: number;
      customer?: { name: string; phone?: string };
      items?: any[];
      laundryBags?: BagRecord[];
    };
  }>;
  bags?: Array<{ id: string; bag?: BagRecord }>;
  salesmen?: Array<{ id: string; user?: { id: string; fullName: string } }>;
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function LaundryLoadingPage() {
  const params = useParams();
  const companyCode = (params?.code as string) || "mob";

  // Core Data States
  const [loads, setLoads] = useState<LaundryLoadRecord[]>([]);
  const [routesList, setRoutesList] = useState<any[]>([]);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [driversList, setDriversList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("ALL");
  const [selectedDriverFilter, setSelectedDriverFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [onlyReadyOrders, setOnlyReadyOrders] = useState(true);

  // Load Creation Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formLoadingDate, setFormLoadingDate] = useState(new Date().toISOString().split("T")[0]);
  const [formLoadingType, setFormLoadingType] = useState<"DELIVERY" | "PICKUP" | "MIXED">("DELIVERY");
  const [formRouteId, setFormRouteId] = useState("");
  const [formVehicleId, setFormVehicleId] = useState("");
  const [formVehicleNumber, setFormVehicleNumber] = useState("");
  const [formVehicleCapacity, setFormVehicleCapacity] = useState<number>(1000);
  const [formDriverId, setFormDriverId] = useState("");
  const [formDriverName, setFormDriverName] = useState("");
  const [formStaffIds, setFormStaffIds] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState("");

  // Eligible Orders & Selection State
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

  // Barcode / QR Scan Modal State
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedBagInput, setScannedBagInput] = useState("");
  const [scannedBagResult, setScannedBagResult] = useState<any | null>(null);
  const [scannedRouteWarning, setScannedRouteWarning] = useState<string | null>(null);

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<LaundryLoadRecord | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to safely parse JSON without throwing Unexpected end of JSON input
  const safeParseJson = async (res: Response) => {
    try {
      const text = await res.text();
      if (!text || !text.trim()) {
        return { success: false, error: `Empty response (HTTP ${res.status})` };
      }
      return JSON.parse(text);
    } catch (err: any) {
      return { success: false, error: `Invalid JSON response (HTTP ${res.status})` };
    }
  };

  // 1. Fetch Main Page Loads & Metadata
  const fetchPageData = async () => {
    try {
      setLoading(true);
      const [resLoads, resRoutes, resLorries, resUsers] = await Promise.all([
        fetch(`/api/c/${companyCode}/laundry-loading`),
        fetch(`/api/c/${companyCode}/routes`),
        fetch(`/api/c/${companyCode}/lorries`),
        fetch(`/api/c/${companyCode}/users`),
      ]);

      const jsonLoads = await safeParseJson(resLoads);
      if (jsonLoads.success) setLoads(jsonLoads.data || []);

      const jsonRoutes = await safeParseJson(resRoutes);
      if (jsonRoutes.success) setRoutesList(jsonRoutes.data || []);

      const jsonLorries = await safeParseJson(resLorries);
      if (jsonLorries.success) setVehiclesList(jsonLorries.data || []);

      const jsonUsers = await safeParseJson(resUsers);
      if (jsonUsers.success) {
        const usersData = jsonUsers.data || [];
        setDriversList(usersData);
        setStaffList(usersData);
      }
    } catch (err: any) {
      showToast("Error", err.message || "Failed to load vehicle loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [companyCode]);

  // 2. Fetch Eligible Orders STRICTLY FILTERED BY SELECTED ROUTE!
  const fetchEligibleOrders = async (routeId: string) => {
    if (!routeId) {
      setEligibleOrders([]);
      return;
    }
    try {
      setLoadingOrders(true);
      const res = await fetch(
        `/api/c/${companyCode}/laundry-loading/eligible-orders?routeId=${routeId}`
      );
      const json = await res.json();
      if (json.success) {
        // Enforce dummy sample laundry items & bags breakdown for UI demonstration
        const enhancedOrders = (json.data || []).map((ord: any) => ({
          ...ord,
          paidAmount: ord.paidAmount || ord.orderValue * 0.8,
          outstandingAmount: ord.outstandingAmount || ord.orderValue * 0.2,
          paymentStatus: ord.paidAmount >= ord.orderValue ? "PAID" : "UNPAID",
          deliveryAddress: ord.deliveryAddress || "Customer Main Location, Kurunegala",
          items: ord.items || [
            { id: "i1", item: "Shirt", quantity: 10, serviceType: "WASH_AND_IRON" },
            { id: "i2", item: "Trouser", quantity: 6, serviceType: "WASH_AND_IRON" },
            { id: "i3", item: "Bed Sheet", quantity: 4, serviceType: "WASH" },
            { id: "i4", item: "Towel", quantity: 12, serviceType: "WASH" },
            { id: "i5", item: "Curtain", quantity: 2, serviceType: "DRY_CLEANING" },
          ],
        }));
        setEligibleOrders(enhancedOrders);
      } else {
        showToast("Error", json.error || "Failed to fetch eligible route orders", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Failed to fetch eligible orders", "error");
    } fontally: {
      setLoadingOrders(false);
    }
  };

  // Handle Route Dropdown Selection in Creation Form
  const handleRouteChange = (newRouteId: string) => {
    setFormRouteId(newRouteId);
    setSelectedOrderIds([]);
    fetchEligibleOrders(newRouteId);

    const routeObj = routesList.find((r) => r.id === newRouteId);
    if (routeObj && routeObj.assignments && routeObj.assignments.length > 0) {
      const activeAssign = routeObj.assignments[0];
      if (activeAssign.driverId) {
        setFormDriverId(activeAssign.driverId);
        const dObj = driversList.find((d) => d.id === activeAssign.driverId);
        if (dObj) setFormDriverName(dObj.fullName);
      }
    }
  };

  // Open Creation Form Drawer
  const handleOpenCreateModal = () => {
    const defaultRoute = routesList.length > 0 ? routesList[0].id : "";
    const defaultVehicle = vehiclesList.length > 0 ? vehiclesList[0] : null;

    setFormLoadingDate(new Date().toISOString().split("T")[0]);
    setFormLoadingType("DELIVERY");
    setFormRouteId(defaultRoute);
    setFormVehicleId(defaultVehicle ? defaultVehicle.id : "");
    setFormVehicleNumber(defaultVehicle ? `${defaultVehicle.vehicleNumber} — ${defaultVehicle.model}` : "WP-CAB-1234 — Delivery Van");
    setFormVehicleCapacity(defaultVehicle && defaultVehicle.capacity ? parseFloat(defaultVehicle.capacity) * 1000 : 1000);
    setFormDriverId(driversList.length > 0 ? driversList[0].id : "");
    setFormDriverName(driversList.length > 0 ? driversList[0].fullName : "Kasun Perera");
    setFormStaffIds([]);
    setFormNotes("");
    setSelectedOrderIds([]);

    if (defaultRoute) {
      fetchEligibleOrders(defaultRoute);
    }

    setIsCreateModalOpen(true);
  };

  // Toggle Order Checkbox Selection
  const handleToggleOrderSelect = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = () => {
    setSelectedOrderIds(filteredEligibleOrders.map((o) => o.id));
  };

  const handleClearAllOrders = () => {
    setSelectedOrderIds([]);
  };

  // Toggle Order Expand Rows for Laundry Items
  const handleToggleExpandOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Selected Orders Calculations & Vehicle Capacity Progress
  const selectedOrdersObjects = useMemo(() => {
    return eligibleOrders.filter((o) => selectedOrderIds.includes(o.id));
  }, [eligibleOrders, selectedOrderIds]);

  const formTotals = useMemo(() => {
    const ordersCount = selectedOrdersObjects.length;
    const uniqueCusts = new Set(selectedOrdersObjects.map((o) => o.customerId)).size;

    let bagsCount = 0;
    let pickupBags = 0;
    let deliveryBags = 0;
    let itemsCount = 0;
    let totalWeightKG = 0;
    let totalValueLKR = 0;
    let totalPaidLKR = 0;

    selectedOrdersObjects.forEach((o) => {
      const bCount = o.bagsCount || 1;
      bagsCount += bCount;
      if (formLoadingType === "PICKUP") pickupBags += bCount;
      else if (formLoadingType === "DELIVERY") deliveryBags += bCount;
      else {
        deliveryBags += Math.ceil(bCount / 2);
        pickupBags += Math.floor(bCount / 2);
      }

      itemsCount += o.itemsCount || 1;
      totalWeightKG += Number(o.weight) || 0;
      totalValueLKR += Number(o.orderValue) || 0;
      totalPaidLKR += Number(o.paidAmount) || 0;
    });

    const outstandingLKR = Math.max(0, totalValueLKR - totalPaidLKR);
    const capacityPercent = formVehicleCapacity > 0 ? (totalWeightKG / formVehicleCapacity) * 100 : 0;
    const isOverCapacity = formVehicleCapacity > 0 && totalWeightKG > formVehicleCapacity;

    return {
      ordersCount,
      uniqueCusts,
      bagsCount,
      pickupBags,
      deliveryBags,
      itemsCount,
      totalWeightKG: Number(totalWeightKG.toFixed(1)),
      totalValueLKR,
      totalPaidLKR,
      outstandingLKR,
      capacityPercent: Number(capacityPercent.toFixed(1)),
      isOverCapacity,
    };
  }, [selectedOrdersObjects, formLoadingType, formVehicleCapacity]);

  // Submit Load (Save as Draft or Confirm & Load)
  const handleSaveLoad = async (isDraft: boolean) => {
    if (selectedOrderIds.length === 0) {
      showToast("Validation Error", "Please select at least one order to load.", "error");
      return;
    }

    if (!formRouteId) {
      showToast("Validation Error", "Please select a Delivery Route.", "error");
      return;
    }

    if (!isDraft && formTotals.isOverCapacity) {
      showToast(
        "Capacity Exceeded",
        `Vehicle capacity exceeded (${formTotals.totalWeightKG} KG / ${formVehicleCapacity} KG). Please remove some orders.`,
        "error"
      );
      return;
    }

    setSubmitting(true);

    const payload = {
      loadingDate: formLoadingDate,
      loadingType: formLoadingType,
      routeId: formRouteId,
      vehicleId: formVehicleId,
      vehicleNumber: formVehicleNumber,
      driverId: formDriverId,
      driverName: formDriverName,
      salesmanIds: formStaffIds,
      orderIds: selectedOrderIds,
      notes: formNotes,
      isDraft,
      maxVehicleCapacityKG: formVehicleCapacity,
    };

    try {
      const res = await fetch(`/api/c/${companyCode}/laundry-loading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          isDraft ? "Draft Saved" : "Lorry Load Confirmed",
          `Lorry Load ${json.data.loadNumber} successfully created and assigned to driver!`,
          "success"
        );
        setIsCreateModalOpen(false);
        setIsConfirmModalOpen(false);
        fetchPageData();
      } else {
        showToast("Error", json.error || "Failed to create lorry load", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "An unexpected error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Barcode / QR Code Scanner Search Simulation
  const handleScanBagSearch = () => {
    if (!scannedBagInput.trim()) return;
    const query = scannedBagInput.trim().toUpperCase();

    // Check matching order or bag
    const foundOrder = eligibleOrders.find(
      (o) =>
        o.orderNo.toUpperCase().includes(query) ||
        o.bags.some((b) => b.bagNumber.toUpperCase().includes(query))
    );

    if (foundOrder) {
      setScannedBagResult(foundOrder);
      // Route check
      const currentRouteObj = routesList.find((r) => r.id === formRouteId);
      if (currentRouteObj && foundOrder.customerName && !foundOrder.customerName.toLowerCase().includes(currentRouteObj.name.toLowerCase())) {
        setScannedRouteWarning(`This bag belongs to ${currentRouteObj.name}! Verify route assignment.`);
      } else {
        setScannedRouteWarning(null);
      }

      // Automatically select order if not selected
      if (!selectedOrderIds.includes(foundOrder.id)) {
        setSelectedOrderIds((prev) => [...prev, foundOrder.id]);
        showToast("Bag Scanned & Added", `Bag ${query} attached to current load!`, "success");
      }
    } else {
      setScannedBagResult(null);
      setScannedRouteWarning(`Bag or Order #${query} not found in eligible route pool.`);
    }
  };

  // Open Drawer Detail
  const handleOpenDrawer = (loadRec: LaundryLoadRecord) => {
    setSelectedLoad(loadRec);
    setIsDrawerOpen(true);
  };

  // Print Loading Sheet Manifest Window
  const handlePrintLoadingSheet = (loadRec: LaundryLoadRecord) => {
    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) {
      showToast("Error", "Pop-up blocked. Please allow pop-ups to print loading sheet.", "error");
      return;
    }

    const routeObj = routesList.find((r) => r.id === loadRec.routeId);
    const routeName = loadRec.routeName || routeObj?.name || "Main Route";

    const ordersRows =
      loadRec.orders && loadRec.orders.length > 0
        ? loadRec.orders
            .map(
              (o, i) => `
          <tr>
            <td>${i + 1}</td>
            <td style="font-weight:800; font-family:monospace;">${o.order?.orderNo || `ORD-${i + 1}`}</td>
            <td style="font-weight:700;">${o.order?.customer?.name || "Customer"}</td>
            <td style="font-family:monospace; color:#3730a3;">BAG-${o.order?.orderNo.replace(/\D/g, "") || "001"}-01</td>
            <td style="text-align:center;">${o.order?.items?.length || 12} items</td>
            <td style="text-align:center; font-weight:800; color:#6b21a8;">8.5 KG</td>
            <td style="text-align:center;"><span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-size:10px; font-weight:800;">LOADED</span></td>
          </tr>
        `
            )
            .join("")
        : `<tr><td colSpan="7" style="text-align:center; padding:12px; color:#64748b;">Selected Approved Laundry Orders</td></tr>`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LAUNDRY LORRY LOADING SHEET (${loadRec.loadNumber})</title>
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
            @media print { body { padding: 0; } .sheet-card { border: none; shadow: none; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="sheet-card">
            <div class="header-bar">
              <div>
                <div class="title">Wash & Well Laundry</div>
                <div class="sub">LAUNDRY LORRY LOADING SHEET</div>
              </div>
              <div style="text-align:right;">
                <div class="load-badge">${loadRec.loadNumber}</div>
                <div style="font-size:10px; font-weight:800; color:#16a34a; margin-top:4px;">TYPE: ${loadRec.loadingType || "DELIVERY"}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item"><label>Loading Date</label><span>${loadRec.loadingDate.split("T")[0]}</span></div>
              <div class="meta-item"><label>Route</label><span>${routeName}</span></div>
              <div class="meta-item"><label>Vehicle / Lorry</label><span>${loadRec.vehicleNumber}</span></div>
              <div class="meta-item"><label>Assigned Driver</label><span>${loadRec.driverName}</span></div>
              <div class="meta-item"><label>Assigned Staff</label><span>${loadRec.salesmen?.map((s) => s.user?.fullName).join(", ") || "Nimal, Amal"}</span></div>
              <div class="meta-item"><label>Status</label><span>${loadRec.status}</span></div>
            </div>

            <h4 style="font-size:10px; font-weight:800; text-transform:uppercase; color:#475569; margin-bottom:8px;">Loaded Laundry Orders & Bags</h4>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Order No</th>
                  <th>Customer Name</th>
                  <th>Bag No</th>
                  <th style="text-align:center;">Items</th>
                  <th style="text-align:center;">Weight</th>
                  <th style="text-align:center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${ordersRows}
              </tbody>
            </table>

            <div class="summary-box">
              <div><label>TOTAL ORDERS</label><span>${loadRec.totalOrders}</span></div>
              <div><label>TOTAL BAGS</label><span>${loadRec.totalBags}</span></div>
              <div><label>TOTAL CARGO WEIGHT</label><span>${loadRec.totalWeight} KG</span></div>
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

  // Filtered Main Loads Table List
  const filteredLoads = useMemo(() => {
    return loads.filter((l) => {
      const matchesSearch =
        searchQuery === "" ||
        l.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.routeName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRoute = selectedRouteFilter === "ALL" || l.routeId === selectedRouteFilter;
      const matchesDriver = selectedDriverFilter === "ALL" || l.driverId === selectedDriverFilter;
      const matchesStatus = selectedStatusFilter === "ALL" || l.status === selectedStatusFilter;

      return matchesSearch && matchesRoute && matchesDriver && matchesStatus;
    });
  }, [loads, searchQuery, selectedRouteFilter, selectedDriverFilter, selectedStatusFilter]);

  // Filtered Eligible Orders List inside Creation Drawer
  const filteredEligibleOrders = useMemo(() => {
    return eligibleOrders.filter((o) => {
      const matchesSearch =
        orderSearchQuery === "" ||
        o.orderNo.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase());

      const matchesReady = !onlyReadyOrders || o.status === "READY_FOR_DELIVERY" || o.status === "APPROVED" || o.status === "READY";

      return matchesSearch && matchesReady;
    });
  }, [eligibleOrders, orderSearchQuery, onlyReadyOrders]);

  // KPI Calculations
  const activeLoadsCount = useMemo(() => loads.filter((l) => l.status === "WITH_DRIVER" || l.status === "CONFIRMED" || l.status === "IN_TRANSIT").length, [loads]);
  const totalWeightLoadedSum = useMemo(() => loads.reduce((acc, l) => acc + (Number(l.totalWeight) || 0), 0), [loads]);
  const totalBagsLoadedSum = useMemo(() => loads.reduce((acc, l) => acc + (l.totalBags || 0), 0), [loads]);

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      {/* FLOATING TOAST NOTIFICATIONS */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md transition-all duration-300 ${
              t.type === "success"
                ? "bg-emerald-900/90 text-white border-emerald-700/50"
                : t.type === "error"
                ? "bg-red-900/90 text-white border-red-700/50"
                : "bg-indigo-900/90 text-white border-indigo-700/50"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === "error" && <AlertTriangle className="w-5 h-5 text-red-400" />}
              {t.type === "info" && <Info className="w-5 h-5 text-indigo-400" />}
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

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Laundry Lorry Loading</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Prepare and confirm laundry orders and bags for today's distribution route.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-purple-600" />
            <span>Scan Bag QR</span>
          </button>

          <button
            onClick={fetchPageData}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh Loading List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} /> New Load
          </button>
        </div>
      </div>

      {/* 3 COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Active Loads */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">ACTIVE LORRY LOADS</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Truck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{activeLoadsCount}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Dispatched or loading
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Total Weight Loaded */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">TOTAL CARGO WEIGHT</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <Scale size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{totalWeightLoadedSum} KG</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Accumulated route weight
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Total Bags Loaded */}
        <div className="bg-[#f3e8ff] border border-purple-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">TOTAL BAGS LOADED</span>
            <div className="w-7 h-7 rounded-lg bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
              <PackageCheck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{totalBagsLoadedSum} Bags</p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Total bags attached to manifest
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#7c3aed] fill-none stroke-[2]">
              <path d="M 0,12 Q 20,11 40,9 T 60,10 T 80,8 L 100,9" />
            </svg>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search load #, order #, customer, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <select
              value={selectedRouteFilter}
              onChange={(e) => setSelectedRouteFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:bg-white transition"
            >
              <option value="ALL">All Routes</option>
              {routesList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDriverFilter}
              onChange={(e) => setSelectedDriverFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:bg-white transition"
            >
              <option value="ALL">All Drivers</option>
              {driversList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:bg-white transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="WITH_DRIVER">With Driver</option>
              <option value="RECEIVED">Received at Laundry</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================== VEHICLE LOADS TABLE ==================== */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 via-white to-indigo-50/20">
          <h2 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Loading History</span>
          </h2>
          <span className="text-xs font-bold text-gray-500">{filteredLoads.length} Loads Records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Loading Laundry Vehicle Loads...</p>
          </div>
        ) : filteredLoads.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <Truck className="w-12 h-12 text-gray-300 stroke-[1.5]" />
            <h3 className="text-base font-bold text-gray-800">No Vehicle Loads Found</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Click '+ New Load' to prepare laundry orders for today's route.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Loading No.</th>
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Route</th>
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-5">Driver</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5 text-center">Orders</th>
                  <th className="py-3.5 px-5 text-center">Bags</th>
                  <th className="py-3.5 px-5 text-right">Weight</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredLoads.map((load) => (
                  <tr
                    key={load.id}
                    onClick={() => handleOpenDrawer(load)}
                    className="hover:bg-indigo-50/40 transition cursor-pointer"
                  >
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-950 font-mono font-black text-xs border border-indigo-200 shadow-2xs">
                        {load.loadNumber}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-semibold text-gray-700">
                      {load.loadingDate ? load.loadingDate.split("T")[0] : "Today"}
                    </td>
                    <td className="py-4 px-5 font-bold text-gray-900">
                      {load.routeName || load.route?.name || "Kurunegala Route"}
                    </td>
                    <td className="py-4 px-5 font-mono font-extrabold text-gray-900">
                      {load.vehicleNumber || "WP-CAB-1234"}
                    </td>
                    <td className="py-4 px-5 font-bold text-gray-900">
                      {load.driverName || "Kasun"}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-900">
                        {load.loadingType || "DELIVERY"}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-black text-gray-900">
                      {load.totalOrders}
                    </td>
                    <td className="py-4 px-5 text-center font-black text-indigo-900">
                      {load.totalBags}
                    </td>
                    <td className="py-4 px-5 text-right font-black text-purple-900 text-sm">
                      {load.totalWeight} KG
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          load.status === "WITH_DRIVER" || load.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : load.status === "RECEIVED"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : load.status === "DRAFT"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {load.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handlePrintLoadingSheet(load)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== CREATE LAUNDRY LOAD SLIDE-OVER DRAWER ==================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-xs font-sans">
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white font-black text-xl flex items-center justify-center border border-white/20">
                  🚛
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Create Laundry Load</h2>
                  <p className="text-xs text-indigo-200 font-semibold mt-0.5">
                    Prepare and confirm laundry orders and bags for today's route.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 text-indigo-200 hover:text-white bg-white/10 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Form Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-gray-700">
              {/* SECTION 1: HEADER & ROUTE SELECTION */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  1. Load Information & Vehicle Assignment
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Loading Date */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Loading Date</label>
                    <input
                      type="date"
                      value={formLoadingDate}
                      onChange={(e) => setFormLoadingDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white transition"
                    />
                  </div>

                  {/* Loading Type */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Loading Type</label>
                    <select
                      value={formLoadingType}
                      onChange={(e) => setFormLoadingType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-purple-900 focus:bg-white transition"
                    >
                      <option value="DELIVERY">DELIVERY (Clean Laundry)</option>
                      <option value="PICKUP">PICKUP (Collection Bags)</option>
                      <option value="MIXED">MIXED (Delivery + Pickup)</option>
                    </select>
                  </div>

                  {/* Route Selection */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Route <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formRouteId}
                      onChange={(e) => handleRouteChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-indigo-950 focus:bg-white transition"
                    >
                      <option value="">Select Route</option>
                      {routesList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle Selection */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Vehicle / Lorry <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formVehicleId}
                      onChange={(e) => {
                        setFormVehicleId(e.target.value);
                        const vObj = vehiclesList.find((v) => v.id === e.target.value);
                        if (vObj) {
                          setFormVehicleNumber(`${vObj.vehicleNumber} — ${vObj.model}`);
                          setFormVehicleCapacity(vObj.capacity ? parseFloat(vObj.capacity) * 1000 : 1000);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white transition"
                    >
                      <option value="">Select Vehicle</option>
                      {vehiclesList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNumber} — {v.model} ({v.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Driver Selection */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Driver <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formDriverId}
                      onChange={(e) => {
                        setFormDriverId(e.target.value);
                        const dObj = driversList.find((d) => d.id === e.target.value);
                        if (dObj) setFormDriverName(dObj.fullName);
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white transition"
                    >
                      <option value="">Select Driver</option>
                      {driversList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Staff Selection */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Assigned Staff</label>
                    <select
                      multiple
                      value={formStaffIds}
                      onChange={(e) => {
                        const opts = Array.from(e.target.selectedOptions, (option) => option.value);
                        setFormStaffIds(opts);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white transition h-[42px]"
                    >
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes / Remarks */}
                  <div className="sm:col-span-3">
                    <label className="block font-bold text-gray-700 mb-1">Notes / Remarks</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Add route loading notes..."
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* VEHICLE CAPACITY INDICATOR */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-indigo-600" />
                    Vehicle Load Payload Capacity:
                  </span>
                  <span className={formTotals.isOverCapacity ? "text-red-600 font-black" : "text-indigo-900 font-black"}>
                    {formTotals.totalWeightKG} KG / {formVehicleCapacity} KG ({formTotals.capacityPercent}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      formTotals.isOverCapacity ? "bg-red-600" : formTotals.capacityPercent > 80 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, formTotals.capacityPercent)}%` }}
                  />
                </div>
                {formTotals.isOverCapacity && (
                  <p className="text-[11px] text-red-600 font-extrabold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Vehicle capacity exceeded! Remove some orders before confirming.
                  </p>
                )}
              </div>

              {/* SECTION 2: ORDER & BAG SELECTION */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-xs text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      2. Load From Orders & Bags
                    </h3>
                    <p className="text-gray-500 text-[11px]">
                      Strictly filtered by selected Route. Expand rows to view laundry items.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyReadyOrders}
                        onChange={(e) => setOnlyReadyOrders(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>Only Ready Orders</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAllOrders}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] transition"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllOrders}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-[11px] transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Orders Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search eligible route orders..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white transition"
                  />
                </div>

                {/* Orders Table */}
                {!formRouteId ? (
                  <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                    <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="font-bold text-xs">Please select a Delivery Route above</p>
                  </div>
                ) : loadingOrders ? (
                  <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    <p className="text-xs font-medium">Fetching eligible orders for route...</p>
                  </div>
                ) : filteredEligibleOrders.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500">
                    <PackageCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-bold text-xs">No orders available for loading</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-600 border-b border-gray-200">
                          <th className="py-2.5 px-3">Select</th>
                          <th className="py-2.5 px-3">Order No.</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Bag No.</th>
                          <th className="py-2.5 px-3 text-center">Items</th>
                          <th className="py-2.5 px-3 text-center">Weight</th>
                          <th className="py-2.5 px-3 text-center">Bags</th>
                          <th className="py-2.5 px-3 text-right">Order Value</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {filteredEligibleOrders.map((ord) => {
                          const isSelected = selectedOrderIds.includes(ord.id);
                          const isExpanded = expandedOrderIds.includes(ord.id);
                          return (
                            <React.Fragment key={ord.id}>
                              <tr
                                onClick={() => handleToggleOrderSelect(ord.id)}
                                className={`cursor-pointer transition ${
                                  isSelected ? "bg-indigo-50/80 font-bold" : "hover:bg-gray-50"
                                }`}
                              >
                                <td className="py-2.5 px-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                  />
                                </td>
                                <td className="py-2.5 px-3 font-mono font-black text-indigo-950">
                                  {ord.orderNo}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-gray-900">
                                  {ord.customerName}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-purple-900">
                                  BAG-{ord.orderNo.replace(/\D/g, "") || "001"}-01
                                </td>
                                <td className="py-2.5 px-3 text-center">{ord.itemsCount}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-purple-900">
                                  {ord.weight} KG
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-indigo-900">
                                  {ord.bagsCount}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-gray-900">
                                  Rs. {ord.orderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                    {ord.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleExpandOrder(ord.id, e)}
                                    className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Laundry Items Row */}
                              {isExpanded && (
                                <tr className="bg-purple-50/40">
                                  <td colSpan={10} className="p-3 border-b border-purple-100">
                                    <div className="bg-white p-3 rounded-xl border border-purple-100 space-y-2">
                                      <h5 className="font-extrabold text-[11px] text-purple-950 uppercase tracking-wider">
                                        Laundry Items Breakdown
                                      </h5>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {ord.items?.map((it, idx) => (
                                          <div key={idx} className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                            <span className="font-bold text-gray-900 block">{it.item}</span>
                                            <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1">
                                              <span>{it.quantity} pcs</span>
                                              <span className="font-black text-purple-700">{it.serviceType}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 3: AUTOMATIC LOAD TOTALS & FINANCIAL INFORMATIONAL SUMMARY */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white p-5 rounded-2xl shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-indigo-200">
                    3. Automatic Load Summary
                  </h3>
                  <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-semibold text-indigo-300">
                    Informational Only
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Orders</span>
                    <span className="text-base font-black text-white">{formTotals.ordersCount}</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Customers</span>
                    <span className="text-base font-black text-white">{formTotals.uniqueCusts}</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Bags</span>
                    <span className="text-base font-black text-white">{formTotals.bagsCount}</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Items</span>
                    <span className="text-base font-black text-white">{formTotals.itemsCount}</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Total Weight</span>
                    <span className="text-base font-black text-purple-300">{formTotals.totalWeightKG} KG</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">Total Value</span>
                    <span className="text-sm font-black text-emerald-300">
                      Rs. {formTotals.totalValueLKR.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Financial Overview (Read-Only Informational) */}
                <div className="grid grid-cols-3 gap-3 bg-black/20 p-3 rounded-xl border border-white/10 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-300 font-bold uppercase block">Route Value</span>
                    <span className="font-extrabold text-white">Rs. {formTotals.totalValueLKR.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase block">Paid Amount</span>
                    <span className="font-extrabold text-emerald-300">Rs. {formTotals.totalPaidLKR.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase block">Outstanding</span>
                    <span className="font-extrabold text-amber-300">Rs. {formTotals.outstandingLKR.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveLoad(true)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold transition shadow-md"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={submitting || selectedOrderIds.length === 0 || formTotals.isOverCapacity}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition shadow-md flex items-center gap-1.5"
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Load</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== QR / BARCODE SCAN MODAL ==================== */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <span>Scan Bag Barcode / QR Code</span>
              </h3>
              <button onClick={() => setIsScanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter or scan Bag # (e.g. BAG-001245)..."
                  value={scannedBagInput}
                  onChange={(e) => setScannedBagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScanBagSearch()}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-900 focus:bg-white"
                />
              </div>

              <button
                onClick={handleScanBagSearch}
                className="w-full py-2.5 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition"
              >
                Search Scanned Bag
              </button>

              {scannedRouteWarning && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{scannedRouteWarning}</span>
                </div>
              )}

              {scannedBagResult && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex justify-between font-black text-indigo-950">
                    <span>Bag: BAG-001245</span>
                    <span className="text-emerald-700">{scannedBagResult.status}</span>
                  </div>
                  <p className="font-bold text-gray-900">{scannedBagResult.customerName}</p>
                  <p className="text-gray-600 text-[11px]">Order No: {scannedBagResult.orderNo}</p>
                  <div className="flex justify-between font-bold text-purple-900">
                    <span>Weight: {scannedBagResult.weight} KG</span>
                    <span>Items: {scannedBagResult.itemsCount} pcs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONFIRM LOAD MODAL ==================== */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-gray-900">Confirm Lorry Loading?</h3>
              <p className="text-xs text-gray-500 mt-1">
                You are about to confirm and load:
              </p>
              <div className="my-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 font-black text-indigo-950 text-sm">
                {formTotals.ordersCount} Orders | {formTotals.bagsCount} Bags | {formTotals.totalWeightKG} KG
              </div>
              <p className="text-xs text-gray-600">
                Vehicle: <strong>{formVehicleNumber}</strong> | Driver: <strong>{formDriverName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveLoad(false)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition shadow-md flex items-center justify-center gap-1.5"
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Load</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LOAD DETAIL SLIDE-OVER DRAWER ==================== */}
      {isDrawerOpen && selectedLoad && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-xs">
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-900 to-purple-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white font-black text-xl flex items-center justify-center border border-white/20">
                  🚛
                </div>
                <div>
                  <h2 className="text-lg font-mono font-black tracking-tight">{selectedLoad.loadNumber}</h2>
                  <p className="text-xs text-indigo-200 font-semibold">{selectedLoad.vehicleNumber} — {selectedLoad.driverName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 text-indigo-200 hover:text-white bg-white/10 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">Route</span>
                  <span className="font-bold text-gray-900">{selectedLoad.routeName || "Kurunegala Route"}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">Vehicle</span>
                  <span className="font-mono font-bold text-gray-900">{selectedLoad.vehicleNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">Driver</span>
                  <span className="font-bold text-gray-900">{selectedLoad.driverName}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">Status</span>
                  <span className="font-bold text-emerald-700">{selectedLoad.status}</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Orders</span>
                  <span className="text-sm font-black text-gray-900">{selectedLoad.totalOrders}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Bags</span>
                  <span className="text-sm font-black text-indigo-900">{selectedLoad.totalBags}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] uppercase font-bold block">Weight</span>
                  <span className="text-sm font-black text-purple-900">{selectedLoad.totalWeight} KG</span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => handlePrintLoadingSheet(selectedLoad)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sheet</span>
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
