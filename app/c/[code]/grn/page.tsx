"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Package,
  AlertTriangle,
  FlaskConical,
  DollarSign,
  ShieldAlert,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  Tag,
  Boxes,
  Barcode,
  Upload,
  Sparkles,
  Info,
  ChevronRight,
  Layers,
  ArrowRight,
  Droplets,
  Zap,
  X,
  ShieldCheck,
  Calendar,
  Clock,
  Warehouse,
  Power,
  PowerOff,
  Check,
  Truck,
  Building2,
  MapPin,
  FileText,
  PackageCheck,
  ClipboardCheck,
  Printer,
  Download,
} from "lucide-react";

/* =========================================================
   TYPES & INTERFACES FOR GRN MANAGEMENT
========================================================= */

interface Supplier {
  id: string;
  supplierNo: string;
  name: string;
  supplierType: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface WarehouseLocation {
  id: string;
  name: string;
  storageArea?: string | null;
  rackShelf?: string | null;
}

interface CatalogProduct {
  id: string;
  productCode: string;
  productName: string;
  unitOfMeasure: string;
  packageSize?: number | null;
  packageUnit?: string | null;
  buyingPrice: number;
  currentStock: number;
}

interface GRNItemForm {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  purchaseUnit: string;
  unitSize: number;
  unitSizeUnit: string;
  totalQuantity: number;
  purchasePrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  trackExpiry: boolean;
}

interface GRNRecord {
  id: string;
  grnNo: string;
  invoiceNo?: string | null;
  supplierId: string;
  supplier: Supplier;
  invoiceDate?: string | null;
  dueDate?: string | null;
  receivedDate: string;
  source: string;
  warehouseId: string;
  warehouse: WarehouseLocation;
  storageArea?: string | null;
  rackShelf?: string | null;
  qcStatus: string; // PENDING, PASSED, FAILED, PARTIALLY_PASSED
  status: string; // DRAFT, PENDING, IN_PROGRESS, ACCEPTED, REJECTED
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  rejectedQty: number;
  qcNotes?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  otherCharges: number;
  grandTotal: number;
  notes?: string | null;
  createdAt: string;
  items: GRNItemForm[];
}

interface ToastNotification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export default function GoodsReceivingPage() {
  const params = useParams();
  const companyCode = params.code as string;

  const [grnRecords, setGrnRecords] = useState<GRNRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Floating Toast Notifications System
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastNotification = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Search, Tab & View Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "ACCEPTED" | "REJECTED">("ALL");
  const [viewMode, setViewMode] = useState<"GRN" | "TRANSACTIONS">("GRN");

  // Slide-Over Detail Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRNRecord | null>(null);

  // Status Change Confirmation Modal
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [grnToToggleStatus, setGrnToToggleStatus] = useState<GRNRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED");
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Delete Confirmation Modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [grnToDelete, setGrnToDelete] = useState<GRNRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Main Add / Edit GRN Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add Dynamic Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierType, setNewSupplierType] = useState("Chemical Supplier");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [submittingSupplier, setSubmittingSupplier] = useState(false);

  // Add Dynamic Warehouse Location Modal
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [newStorageArea, setNewStorageArea] = useState("Chemical Storage A");
  const [newRackShelf, setNewRackShelf] = useState("Rack A-01");
  const [submittingWarehouse, setSubmittingWarehouse] = useState(false);

  // Form Inputs
  const [formInvoiceNo, setFormInvoiceNo] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formInvoiceDate, setFormInvoiceDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formReceivedDate, setFormReceivedDate] = useState("");

  const [formSource, setFormSource] = useState("Supplier Purchase");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formStorageArea, setFormStorageArea] = useState("Chemical Storage A");
  const [formRackShelf, setFormRackShelf] = useState("Rack A-02");

  const [formQCStatus, setFormQCStatus] = useState("PASSED");
  const [formExpectedQty, setFormExpectedQty] = useState("10");
  const [formReceivedQty, setFormReceivedQty] = useState("10");
  const [formDamagedQty, setFormDamagedQty] = useState("0");
  const [formRejectedQty, setFormRejectedQty] = useState("0");
  const [formQCNotes, setFormQCNotes] = useState("All containers inspected and accepted.");

  const [formDiscountAmount, setFormDiscountAmount] = useState("0");
  const [formTaxAmount, setFormTaxAmount] = useState("0");
  const [formOtherCharges, setFormOtherCharges] = useState("0");
  const [formNotes, setFormNotes] = useState("");

  const [formItems, setFormItems] = useState<GRNItemForm[]>([]);

  // Fetch All Data
  const fetchGRNs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/c/${companyCode}/grn`);
      const json = await res.json();
      if (json.success) {
        setGrnRecords(json.data || []);
      } else {
        showToast("Error", json.error || "Failed to load GRN records", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`/api/c/${companyCode}/suppliers`);
      const json = await res.json();
      if (json.success) {
        setSuppliers(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(`/api/c/${companyCode}/warehouses`);
      const json = await res.json();
      if (json.success) {
        setWarehouses(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch warehouses:", err);
    }
  };

  const fetchCatalogProducts = async () => {
    try {
      const res = await fetch(`/api/c/${companyCode}/products`);
      const json = await res.json();
      if (json.success) {
        setCatalogProducts(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch products catalog:", err);
    }
  };

  useEffect(() => {
    fetchGRNs();
    fetchSuppliers();
    fetchWarehouses();
    fetchCatalogProducts();
  }, [companyCode]);

  // Form Calculations
  const calculatedSubtotal = useMemo(() => {
    return formItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [formItems]);

  const calculatedGrandTotal = useMemo(() => {
    const sub = calculatedSubtotal;
    const disc = Number(formDiscountAmount) || 0;
    const tax = Number(formTaxAmount) || 0;
    const other = Number(formOtherCharges) || 0;
    return Math.max(0, sub - disc + tax + other);
  }, [calculatedSubtotal, formDiscountAmount, formTaxAmount, formOtherCharges]);

  // Open Drawer
  const handleOpenDrawer = (record: GRNRecord) => {
    setSelectedGRN(record);
    setIsDrawerOpen(true);
  };

  // Custom Print & PDF Generation for GRN Invoice with Company Name
  const handlePrintGRN = (record: GRNRecord, isPDFDownload: boolean = false) => {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      showToast("Error", "Pop-up blocked. Please allow pop-ups to print or download PDF.", "error");
      return;
    }

    const supplierName = record.supplier?.name || "Vendor Supplier";
    const warehouseName = record.warehouse?.name || "Main Laundry Facility";
    const formattedDate = record.receivedDate ? record.receivedDate.split("T")[0] : new Date().toISOString().split("T")[0];
    const itemsList = record.items && record.items.length > 0 ? record.items : [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GRN Invoice - ${record.grnNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            body {
              font-family: 'Inter', sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 36px;
              background-color: #fff;
              font-size: 13px;
              line-height: 1.5;
            }
            .invoice-card {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #7c3aed;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .company-name {
              font-size: 24px;
              font-weight: 900;
              color: #4c1d95;
              letter-spacing: -0.5px;
              text-transform: uppercase;
            }
            .company-sub {
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
              margin-top: 4px;
            }
            .badge-grn {
              background: #f3e8ff;
              color: #6d28d9;
              font-weight: 900;
              padding: 8px 16px;
              border-radius: 12px;
              font-size: 15px;
              display: inline-block;
              border: 1px solid #d8b4fe;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 16px;
              border: 1px solid #f1f5f9;
              margin-bottom: 24px;
            }
            .meta-item label {
              font-size: 10px;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: block;
              margin-bottom: 3px;
            }
            .meta-item span {
              font-weight: 700;
              color: #0f172a;
              font-size: 13px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th {
              background: #f1f5f9;
              color: #475569;
              font-weight: 800;
              font-size: 11px;
              text-transform: uppercase;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #f1f5f9;
              font-weight: 600;
              font-size: 12px;
            }
            .totals-wrap {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 32px;
            }
            .totals-box {
              width: 300px;
              background: #faf5ff;
              border: 1px solid #e9d5ff;
              border-radius: 14px;
              padding: 16px;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 12px;
              color: #475569;
            }
            .totals-row.grand {
              border-top: 2px solid #c084fc;
              margin-top: 8px;
              padding-top: 10px;
              font-weight: 900;
              color: #4c1d95;
              font-size: 16px;
            }
            .signatures-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 24px;
              margin-top: 48px;
              padding-top: 24px;
              border-top: 1px dashed #cbd5e1;
              text-align: center;
            }
            .sig-line {
              padding-top: 45px;
              border-top: 1.5px solid #94a3b8;
              font-size: 11px;
              font-weight: 700;
              color: #475569;
            }
            @media print {
              body { padding: 0; }
              .invoice-card { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="header-bar">
              <div>
                <div class="company-name">Wash & Well Main Laundry</div>
                <div class="company-sub">Main Chemical & Inventory Receiving Facility</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                  No. 124, Industrial Zone, Main Road | Phone: +94 11 234 5678 | Email: grn@washandwell.lk
                </div>
              </div>
              <div style="text-align: right;">
                <div class="badge-grn">${record.grnNo}</div>
                <div style="font-size: 11px; font-weight: 800; color: #16a34a; margin-top: 8px;">QC STATUS: ${record.qcStatus}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <label>Supplier / Vendor</label>
                <span>${supplierName}</span>
              </div>
              <div class="meta-item">
                <label>Invoice Number</label>
                <span>${record.invoiceNo || "N/A"}</span>
              </div>
              <div class="meta-item">
                <label>Received Date</label>
                <span>${formattedDate}</span>
              </div>
              <div class="meta-item">
                <label>Store Location</label>
                <span>${warehouseName}</span>
              </div>
              <div class="meta-item">
                <label>Storage Area & Shelf</label>
                <span>${record.storageArea || "Chemical Storage"} (${record.rackShelf || "Shelf A-1"})</span>
              </div>
              <div class="meta-item">
                <label>Inventory Status</label>
                <span style="color: ${record.status === "ACCEPTED" ? "#16a34a" : "#d97706"};">${record.status}</span>
              </div>
            </div>

            <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 12px;">Received Products Breakdown</h4>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Description</th>
                  <th>Received Qty</th>
                  <th>Unit Size</th>
                  <th>Total Units</th>
                  <th>Price / Unit</th>
                  <th style="text-align: right;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${
                  itemsList.length > 0
                    ? itemsList
                        .map(
                          (item, i) => `
                        <tr>
                          <td>${i + 1}</td>
                          <td>${item.productName || "Laundry Product Item"}</td>
                          <td>${item.quantity}</td>
                          <td>${item.unitSize} ${item.unitSizeUnit || "L"}</td>
                          <td>${item.totalQuantity} ${item.unitSizeUnit || "L"}</td>
                          <td>Rs. ${Number(item.purchasePrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td style="text-align: right;">Rs. ${Number(item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      `
                        )
                        .join("")
                    : `
                      <tr>
                        <td>1</td>
                        <td>Chemical Laundry Delivery</td>
                        <td>${record.receivedQty || 1}</td>
                        <td>1 Package</td>
                        <td>${record.receivedQty || 1}</td>
                        <td>Rs. ${Number(record.grandTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td style="text-align: right;">Rs. ${Number(record.grandTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    `
                }
              </tbody>
            </table>

            <div class="totals-wrap">
              <div class="totals-box">
                <div class="totals-row">
                  <span>Subtotal:</span>
                  <span style="font-weight:700;">Rs. ${Number(record.subtotal || record.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="totals-row">
                  <span>Discount:</span>
                  <span style="font-weight:700; color: #dc2626;">- Rs. ${Number(record.discount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="totals-row">
                  <span>Tax & Charges:</span>
                  <span style="font-weight:700;">Rs. ${(Number(record.tax || 0) + Number(record.otherCharges || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="totals-row grand">
                  <span>GRAND TOTAL:</span>
                  <span>Rs. ${Number(record.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            ${
              record.qcNotes
                ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 12px; font-size: 11px; margin-bottom: 24px; color: #475569;">
                    <strong>QC Notes & Remarks:</strong> ${record.qcNotes}
                   </div>`
                : ""
            }

            <div class="signatures-grid">
              <div class="sig-line">Store Receiving Officer</div>
              <div class="sig-line">QC Quality Inspector</div>
              <div class="sig-line">Authorized Signatory</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedGRN(null);

    const todayStr = new Date().toISOString().split("T")[0];
    const dueStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    setFormInvoiceNo(`INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
    setFormSupplierId(suppliers[0]?.id || "");
    setFormInvoiceDate(todayStr);
    setFormDueDate(dueStr);
    setFormReceivedDate(todayStr);

    setFormSource("Supplier Purchase");
    setFormWarehouseId(warehouses[0]?.id || "");
    setFormStorageArea(warehouses[0]?.storageArea || "Chemical Storage A");
    setFormRackShelf(warehouses[0]?.rackShelf || "Rack A-02");

    setFormQCStatus("PASSED");
    setFormExpectedQty("10");
    setFormReceivedQty("10");
    setFormDamagedQty("0");
    setFormRejectedQty("0");
    setFormQCNotes("All containers inspected and accepted.");

    setFormDiscountAmount("0");
    setFormTaxAmount("0");
    setFormOtherCharges("0");
    setFormNotes("");

    // Initialize with 1 product item row if catalog products exist
    if (catalogProducts.length > 0) {
      const p = catalogProducts[0];
      const pkgSize = p.packageSize || 25;
      const pkgUnit = p.packageUnit || p.unitOfMeasure || "L";

      setFormItems([
        {
          productId: p.id,
          productName: p.productName,
          quantity: 10,
          purchaseUnit: `${pkgSize} ${pkgUnit} Drum`,
          unitSize: pkgSize,
          unitSizeUnit: pkgUnit,
          totalQuantity: 10 * pkgSize,
          purchasePrice: p.buyingPrice || 8500,
          discountPercent: 0,
          taxPercent: 0,
          amount: 10 * (p.buyingPrice || 8500),
          batchNumber: `BATCH-${todayStr.replace(/-/g, "")}`,
          manufacturingDate: todayStr,
          expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          trackExpiry: true,
        },
      ]);
    } else {
      setFormItems([]);
    }

    setIsModalOpen(true);
  };

  // Add Item Row in GRN Form
  const handleAddFormItem = () => {
    const p = catalogProducts[0];
    const todayStr = new Date().toISOString().split("T")[0];

    const newItem: GRNItemForm = {
      productId: p ? p.id : "",
      productName: p ? p.productName : "Chemical Item",
      quantity: 1,
      purchaseUnit: p ? `${p.packageSize || 25} ${p.packageUnit || "L"} Drum` : "Drum",
      unitSize: p ? Number(p.packageSize) || 25 : 25,
      unitSizeUnit: p ? p.packageUnit || "L" : "L",
      totalQuantity: p ? (Number(p.packageSize) || 25) : 25,
      purchasePrice: p ? Number(p.buyingPrice) || 5000 : 5000,
      discountPercent: 0,
      taxPercent: 0,
      amount: p ? Number(p.buyingPrice) || 5000 : 5000,
      batchNumber: `BATCH-${todayStr.replace(/-/g, "")}`,
      trackExpiry: true,
    };

    setFormItems((prev) => [...prev, newItem]);
  };

  // Update Form Item Field
  const handleUpdateFormItem = (index: number, field: keyof GRNItemForm, val: any) => {
    setFormItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      if (field === "productId") {
        const prod = catalogProducts.find((cp) => cp.id === val);
        if (prod) {
          item.productName = prod.productName;
          item.purchasePrice = prod.buyingPrice;
          item.unitSize = prod.packageSize || 25;
          item.unitSizeUnit = prod.packageUnit || prod.unitOfMeasure || "L";
          item.purchaseUnit = `${item.unitSize} ${item.unitSizeUnit} Container`;
        }
      }

      // Auto compute total quantity and amount
      const qty = Number(item.quantity) || 0;
      const size = Number(item.unitSize) || 1;
      item.totalQuantity = qty * size;

      const price = Number(item.purchasePrice) || 0;
      const disc = Number(item.discountPercent) || 0;
      const tax = Number(item.taxPercent) || 0;
      const baseAmount = qty * price;
      const netAmount = baseAmount - baseAmount * (disc / 100) + baseAmount * (tax / 100);
      item.amount = Math.max(0, netAmount);

      updated[index] = item;
      return updated;
    });
  };

  // Remove Form Item Row
  const handleRemoveFormItem = (index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Add Supplier Modal
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    setSubmittingSupplier(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSupplierName.trim(),
          supplierType: newSupplierType,
          phone: newSupplierPhone,
          email: newSupplierEmail,
          address: newSupplierAddress,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchSuppliers();
        setFormSupplierId(json.data.id);
        showToast("Supplier Created", `Supplier "${json.data.name}" added successfully!`, "success");
        setIsSupplierModalOpen(false);
      } else {
        showToast("Error", json.error || "Failed to create supplier", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Error adding supplier", "error");
    } finally {
      setSubmittingSupplier(false);
    }
  };

  // Open Add Location Modal
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarehouseName.trim()) return;

    setSubmittingWarehouse(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/warehouses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWarehouseName.trim(),
          storageArea: newStorageArea,
          rackShelf: newRackShelf,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchWarehouses();
        setFormWarehouseId(json.data.id);
        setFormStorageArea(json.data.storageArea || "");
        setFormRackShelf(json.data.rackShelf || "");
        showToast("Location Created", `Location "${json.data.name}" added successfully!`, "success");
        setIsWarehouseModalOpen(false);
      } else {
        showToast("Error", json.error || "Failed to create location", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Error adding location", "error");
    } finally {
      setSubmittingWarehouse(false);
    }
  };

  // Submit Main GRN Form (Draft vs Confirm & Stock In)
  const handleSubmitGRN = async (isConfirm: boolean) => {
    if (!formSupplierId || !formWarehouseId) {
      showToast("Validation Error", "Please select Supplier and Warehouse/Location.", "error");
      return;
    }

    if (formItems.length === 0) {
      showToast("Validation Error", "Please add at least one product item to the GRN.", "error");
      return;
    }

    setSubmitting(true);

    const payload = {
      grnNo: isEditing ? selectedGRN?.grnNo : `GRN-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceNo: formInvoiceNo,
      supplierId: formSupplierId,
      invoiceDate: formInvoiceDate,
      dueDate: formDueDate,
      receivedDate: formReceivedDate,
      source: formSource,
      warehouseId: formWarehouseId,
      storageArea: formStorageArea,
      rackShelf: formRackShelf,

      qcStatus: formQCStatus,
      status: isConfirm ? "ACCEPTED" : "DRAFT",

      expectedQty: Number(formExpectedQty) || 0,
      receivedQty: Number(formReceivedQty) || 0,
      damagedQty: Number(formDamagedQty) || 0,
      rejectedQty: Number(formRejectedQty) || 0,
      qcNotes: formQCNotes,

      subtotal: calculatedSubtotal,
      discount: Number(formDiscountAmount) || 0,
      tax: Number(formTaxAmount) || 0,
      otherCharges: Number(formOtherCharges) || 0,
      grandTotal: calculatedGrandTotal,
      notes: formNotes,

      items: formItems,
    };

    try {
      const url = isEditing
        ? `/api/c/${companyCode}/grn/${selectedGRN?.id}`
        : `/api/c/${companyCode}/grn`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          isConfirm ? "GRN Confirmed & Stocked In" : "GRN Saved as Draft",
          isConfirm
            ? `GRN ${json.data.grnNo} has been confirmed and product inventory stock increased!`
            : `GRN ${json.data.grnNo} saved as draft (No inventory change).`,
          "success"
        );
        setIsModalOpen(false);
        fetchGRNs();
        fetchCatalogProducts(); // refresh stock numbers
      } else {
        showToast("Save Failed", json.error || "Failed to save GRN record.", "error");
      }
    } catch (err: any) {
      showToast("Save Error", err.message || "An error occurred while saving.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Prompt Status Change Modal (Accept / Reject)
  const handlePromptStatusChange = (record: GRNRecord, target: "ACCEPTED" | "REJECTED") => {
    setGrnToToggleStatus(record);
    setTargetStatus(target);
    setIsStatusConfirmOpen(true);
  };

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    if (!grnToToggleStatus) return;
    setTogglingStatus(true);

    try {
      const res = await fetch(`/api/c/${companyCode}/grn/${grnToToggleStatus.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, qcStatus: targetStatus === "ACCEPTED" ? "PASSED" : "FAILED" }),
      });

      const json = await res.json();
      if (json.success) {
        const updated = json.data;
        if (selectedGRN?.id === grnToToggleStatus.id) {
          setSelectedGRN(updated);
        }
        setGrnRecords((prev) => prev.map((item) => (item.id === grnToToggleStatus.id ? updated : item)));

        showToast(
          targetStatus === "ACCEPTED" ? "GRN Accepted & Stock Increased" : "GRN Rejected",
          targetStatus === "ACCEPTED"
            ? `GRN ${grnToToggleStatus.grnNo} marked ACCEPTED. Inventory updated!`
            : `GRN ${grnToToggleStatus.grnNo} rejected. No stock added.`,
          "success"
        );
        setIsStatusConfirmOpen(false);
        setGrnToToggleStatus(null);
        fetchCatalogProducts();
      } else {
        showToast("Error", json.error || "Failed to update status", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "An error occurred", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  // Prompt Delete GRN
  const handlePromptDelete = (record: GRNRecord) => {
    setGrnToDelete(record);
    setIsDeleteConfirmOpen(true);
  };

  // Perform Delete GRN
  const handleConfirmDelete = async () => {
    if (!grnToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/grn/${grnToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("GRN Deleted", `GRN record ${grnToDelete.grnNo} deleted.`, "success");
        if (selectedGRN?.id === grnToDelete.id) {
          setIsDrawerOpen(false);
          setSelectedGRN(null);
        }
        setIsDeleteConfirmOpen(false);
        setGrnToDelete(null);
        fetchGRNs();
      } else {
        showToast("Delete Failed", json.error || "Failed to delete record.", "error");
      }
    } catch (err: any) {
      showToast("Delete Error", err.message || "Error deleting record.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered GRNs
  const filteredGRNs = useMemo(() => {
    return grnRecords.filter((g) => {
      const matchesSearch =
        g.grnNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.invoiceNo && g.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.supplier && g.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "PENDING" && (g.status === "PENDING" || g.status === "DRAFT")) ||
        (activeTab === "IN_PROGRESS" && g.status === "IN_PROGRESS") ||
        (activeTab === "ACCEPTED" && g.status === "ACCEPTED") ||
        (activeTab === "REJECTED" && g.status === "REJECTED");

      return matchesSearch && matchesTab;
    });
  }, [grnRecords, searchQuery, activeTab]);

  const totalAcceptedAmount = useMemo(() => {
    return grnRecords
      .filter((g) => g.status === "ACCEPTED")
      .reduce((acc, g) => acc + (Number(g.grandTotal) || 0), 0);
  }, [grnRecords]);

  const pendingQC = useMemo(() => {
    return grnRecords.filter((g) => g.qcStatus === "PENDING" || g.status === "PENDING" || g.status === "DRAFT").length;
  }, [grnRecords]);

  const recentTransactionsList = useMemo(() => {
    const list: Array<{
      id: string;
      productName: string;
      type: "IN" | "OUT";
      quantity: string;
      costPerUnit: number;
      totalCost: number;
      date: string;
      refType: string;
      user: string;
      notes: string;
    }> = [];

    // 1. Map all GRN items with product name lookup from catalog
    grnRecords.forEach((g) => {
      const supplierName = g.supplier?.name || "Supplier";
      const recDate = g.receivedDate ? g.receivedDate.split("T")[0] : "2026-08-28";

      if (g.items && g.items.length > 0) {
        g.items.forEach((item, idx) => {
          const catalogProd = catalogProducts.find((p) => p.id === item.productId);
          const resolvedName =
            catalogProd?.productName ||
            (item as any).product?.productName ||
            (item.productName && item.productName !== "test product" ? item.productName : null) ||
            (catalogProducts[idx % (catalogProducts.length || 1)]?.productName || item.productName || "Laundry Supplies");

          list.push({
            id: `grn-item-${g.id}-${idx}`,
            productName: resolvedName,
            type: "IN",
            quantity: `+${item.totalQuantity || item.quantity}`,
            costPerUnit: item.purchasePrice || (item.amount ? Math.round(item.amount / (item.quantity || 1)) : 0),
            totalCost: item.amount || (item.quantity || 1) * (item.purchasePrice || 0),
            date: recDate,
            refType: "grn",
            user: supplierName,
            notes: g.qcNotes || g.notes || "Containers inspected & accepted.",
          });
        });
      } else {
        list.push({
          id: `grn-${g.id}`,
          productName: catalogProducts[0]?.productName || "Chemical Laundry Detergent",
          type: "IN",
          quantity: `+${g.receivedQty || 10}`,
          costPerUnit: g.grandTotal ? Math.round(g.grandTotal / (g.receivedQty || 10)) : 8500,
          totalCost: g.grandTotal || 85000,
          date: recDate,
          refType: "grn",
          user: supplierName,
          notes: g.qcNotes || g.notes || "Goods received and accepted",
        });
      }
    });

    // 2. Add sample inventory movement entries for other reference types (Lorry Loading, Sales Returns, Transfers)
    const additionalStockMovements = [
      {
        id: "tx-lorry-1",
        productName: catalogProducts[0]?.productName || "Laundry Detergent Liquid",
        type: "OUT" as const,
        quantity: "-24",
        costPerUnit: 2198.00,
        totalCost: 52752.00,
        date: "2026-08-28",
        refType: "lorry_loading",
        user: "Dispatch Team",
        notes: "Lorry Loading LD-22241 for Vehicle NW-4589",
      },
      {
        id: "tx-return-1",
        productName: catalogProducts[1]?.productName || catalogProducts[0]?.productName || "Fabric Softener",
        type: "IN" as const,
        quantity: "+2",
        costPerUnit: 91.58,
        totalCost: 183.16,
        date: "2026-08-28",
        refType: "sales_return",
        user: "Customer Care",
        notes: "Sales Return RET-20260007: Damaged container replaced",
      },
      {
        id: "tx-transfer-1",
        productName: catalogProducts[2]?.productName || catalogProducts[0]?.productName || "Chemical Storage Drum 25L",
        type: "OUT" as const,
        quantity: "-5",
        costPerUnit: 4500.00,
        totalCost: 22500.00,
        date: "2026-08-27",
        refType: "internal_transfer",
        user: "Main Store",
        notes: "Transferred to Sub-Store Warehouse B",
      },
    ];

    const combinedList = [...list, ...additionalStockMovements];

    return combinedList.filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.productName.toLowerCase().includes(q) ||
        t.refType.toLowerCase().includes(q) ||
        t.user.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    });
  }, [grnRecords, catalogProducts, searchQuery]);

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      {/* FLOATING TOAST POPUP NOTIFICATIONS */}
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
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-white transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Goods Receiving (GRN)</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Receive, inspect, and stock incoming laundry supplies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGRNs}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh GRNs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} /> New GRN
          </button>
        </div>
      </div>

      {/* 4 COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total GRNs */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL TRANSACTIONS</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <ClipboardCheck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{grnRecords.length}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Goods receiving notes
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Total Stocked Value */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">TOTAL STOCKED VALUE</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">LKR {totalAcceptedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Accepted GRN purchases
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Pending QC */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">PENDING QC / DRAFTS</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{pendingQC}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              Awaiting QC approval
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Suppliers */}
        <div className="bg-[#f3e8ff] border border-purple-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">SUPPLIERS</span>
            <div className="w-7 h-7 rounded-lg bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
              <Building2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{suppliers.length}</p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Active vendor accounts
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#7c3aed] fill-none stroke-[2]">
              <path d="M 0,12 Q 20,11 40,9 T 60,10 T 80,8 L 100,9" />
            </svg>
          </div>
        </div>
      </div>

      {/* VIEW SEGMENT CONTROL & STATUS TABS */}

      {/* ==================== VIEW SEGMENT CONTROL & STATUS TABS ==================== */}
      <div className="space-y-4">
        {/* Centered Segment Switcher Pill */}
        <div className="flex justify-center">
          <div className="bg-[#F1F5F9] p-1.5 rounded-full border border-gray-200/60 inline-flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setViewMode("GRN")}
              className={`px-6 py-2 rounded-full text-xs font-bold transition ${
                viewMode === "GRN"
                  ? "bg-white text-gray-900 shadow-sm font-extrabold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              GRN
            </button>
            <button
              onClick={() => setViewMode("TRANSACTIONS")}
              className={`px-6 py-2 rounded-full text-xs font-bold transition ${
                viewMode === "TRANSACTIONS"
                  ? "bg-white text-gray-900 shadow-sm font-extrabold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Recent Transactions
            </button>
          </div>
        </div>

        {/* Status Filter Pills for GRN View */}
        {viewMode === "GRN" && (
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9]/80 p-1.5 rounded-full border border-gray-200/60 w-fit">
            {(["ALL", "PENDING", "IN_PROGRESS", "ACCEPTED", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition capitalize ${
                  activeTab === tab
                    ? "bg-white text-purple-950 shadow-xs font-extrabold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ==================== MAIN TRANSACTIONS / GRN CARD ==================== */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden">
        {/* Card Header with Title and Search Input */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 via-white to-purple-50/20">
          <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
            {viewMode === "GRN" ? "Goods Receiving Notes" : "Recent Transactions"}
          </h2>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={viewMode === "GRN" ? "Search GRN, invoice, supplier..." : "Search transactions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Content View: GRN Records vs Recent Transactions */}
        {viewMode === "GRN" ? (
          loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm font-medium">Loading Goods Receiving Notes...</p>
            </div>
          ) : filteredGRNs.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
              <ClipboardCheck className="w-12 h-12 text-gray-300 stroke-[1.5]" />
              <h3 className="text-base font-bold text-gray-800">No GRN Records Found</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                {searchQuery || activeTab !== "ALL"
                  ? "Try adjusting your filters or search query."
                  : "Click 'New GRN' to record your first chemical supply delivery."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">GRN No & Invoice</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Received Date</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4">QC Status</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {filteredGRNs.map((g) => (
                    <tr
                      key={g.id}
                      onClick={() => handleOpenDrawer(g)}
                      className="hover:bg-purple-50/40 cursor-pointer transition"
                    >
                      {/* GRN No & Invoice */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center shrink-0 border border-purple-200">
                            📦
                          </div>
                          <div>
                            <span className="font-mono font-bold text-gray-900 block text-sm">{g.grnNo}</span>
                            {g.invoiceNo && (
                              <span className="text-[10px] text-gray-400 font-mono">Invoice: {g.invoiceNo}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900 block">{g.supplier?.name || "Supplier"}</span>
                        <span className="text-[10px] text-gray-400">{g.warehouse?.name || "Main Store"}</span>
                      </td>

                      {/* Received Date */}
                      <td className="py-4 px-4 font-medium text-gray-700">
                        {g.receivedDate ? g.receivedDate.split("T")[0] : "--"}
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right font-black text-gray-900 text-sm">
                        Rs. {Number(g.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      {/* QC Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            g.qcStatus === "PASSED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : g.qcStatus === "FAILED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {g.qcStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            g.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : g.status === "REJECTED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              g.status === "ACCEPTED"
                                ? "bg-emerald-500"
                                : g.status === "REJECTED"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {g.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDrawer(g)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="View Drawer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePromptDelete(g)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete GRN"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* ==================== RECENT TRANSACTIONS TABLE VIEW ==================== */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                  <th className="py-3 px-4">PRODUCT</th>
                  <th className="py-3 px-4">TYPE</th>
                  <th className="py-3 px-4">QUANTITY</th>
                  <th className="py-3 px-4">COST/UNIT</th>
                  <th className="py-3 px-4">TOTAL COST</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">REFERENCE TYPE</th>
                  <th className="py-3 px-4">USER</th>
                  <th className="py-3 px-4">NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
                {recentTransactionsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      No stock transactions found.
                    </td>
                  </tr>
                ) : (
                  recentTransactionsList.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-4 font-bold text-gray-900">{t.productName}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.type === "IN"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {t.type === "IN" ? "↑ IN" : "↓ OUT"}
                        </span>
                      </td>
                      <td className={`py-4 px-4 font-extrabold ${t.type === "IN" ? "text-emerald-600" : "text-red-600"}`}>
                        {t.quantity}
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-600">
                        RS: {Number(t.costPerUnit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 font-black text-gray-900">
                        RS: {Number(t.totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{t.date}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] font-bold">
                          {t.refType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-500 font-medium">{t.user}</td>
                      <td className="py-4 px-4 text-gray-500 text-[11px] max-w-xs truncate">{t.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== GRN DETAIL SLIDE-OVER DRAWER ==================== */}
      {isDrawerOpen && selectedGRN && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 text-xs font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <PackageCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#7C3AED] text-[11px] bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200">
                      {selectedGRN.grnNo}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        selectedGRN.status === "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : selectedGRN.status === "REJECTED"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {selectedGRN.status}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-gray-900 leading-tight mt-0.5">
                    {selectedGRN.supplier?.name || "ABC Chemicals"}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Quick Action Bar */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">QC Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedGRN.qcStatus}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Download PDF Button */}
                <button
                  onClick={() => {
                    handlePrintGRN(selectedGRN, true);
                    showToast("PDF Download Ready", "Select 'Save as PDF' in the document window to download PDF to device.", "info");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-extrabold text-xs flex items-center gap-1.5 transition border border-purple-200"
                  title="Download PDF to device"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-700" />
                  <span>PDF</span>
                </button>

                {/* Print Invoice Button */}
                <button
                  onClick={() => handlePrintGRN(selectedGRN, false)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-extrabold text-xs flex items-center gap-1.5 transition border border-indigo-200"
                  title="Print custom invoice including company name"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Print</span>
                </button>

                {selectedGRN.status !== "ACCEPTED" && (
                  <button
                    onClick={() => handlePromptStatusChange(selectedGRN, "ACCEPTED")}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept & Stock In</span>
                  </button>
                )}

                {selectedGRN.status !== "REJECTED" && (
                  <button
                    onClick={() => handlePromptStatusChange(selectedGRN, "REJECTED")}
                    className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => handlePromptDelete(selectedGRN)}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-gray-700">
              {/* Status Note Banner */}
              {selectedGRN.status === "ACCEPTED" ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-xs">Inventory Stock Added</h4>
                    <p className="text-[11px] text-emerald-800">
                      GRN is confirmed and all item quantities have been added to active product stock!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-xs">Draft / Pending Verification</h4>
                    <p className="text-[11px] text-amber-800">
                      Inventory stock has NOT been modified yet. Confirming GRN will increase active product stock.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Supplier & Invoice Info */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-purple-600" />
                  1. Supplier & Invoice Information
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-semibold block">Invoice Number</span>
                    <span className="font-mono font-bold text-gray-900 text-xs mt-0.5 block">
                      {selectedGRN.invoiceNo || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Received Date</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                      {selectedGRN.receivedDate ? selectedGRN.receivedDate.split("T")[0] : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Due Date</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                      {selectedGRN.dueDate ? selectedGRN.dueDate.split("T")[0] : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Receiving Location */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4 text-purple-600" />
                  2. Receiving Location
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-semibold block">Source</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">{selectedGRN.source}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Warehouse</span>
                    <span className="font-bold text-purple-700 text-xs mt-0.5 block">
                      {selectedGRN.warehouse?.name || "Main Store"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Storage Area</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                      {selectedGRN.storageArea || "Chemical Storage A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Rack / Shelf</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                      {selectedGRN.rackShelf || "Rack A-02"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Product Items Table */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-600" />
                  3. Product Items Received
                </h3>

                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-gray-100 font-bold text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3 text-right">Total Units</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                      {selectedGRN.items && selectedGRN.items.length > 0 ? (
                        selectedGRN.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-3 font-bold text-gray-900">{item.productName}</td>
                            <td className="py-3 px-3 text-right font-bold">{item.quantity}</td>
                            <td className="py-3 px-3">{item.purchaseUnit}</td>
                            <td className="py-3 px-3 text-right font-bold text-purple-700">
                              {item.totalQuantity} {item.unitSizeUnit || "L"}
                            </td>
                            <td className="py-3 px-3 text-right">Rs. {item.purchasePrice}</td>
                            <td className="py-3 px-3 text-right font-bold">Rs. {item.amount}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-400">
                            No product items recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Quality Check */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-purple-600" />
                  4. Quality Check & Inspection
                </h3>

                <div className="grid grid-cols-4 gap-2 text-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Expected</span>
                    <span className="text-base font-black text-gray-900 mt-0.5 block">{selectedGRN.expectedQty}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Received</span>
                    <span className="text-base font-black text-emerald-700 mt-0.5 block">{selectedGRN.receivedQty}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Damaged</span>
                    <span className="text-base font-black text-amber-700 mt-0.5 block">{selectedGRN.damagedQty}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Rejected</span>
                    <span className="text-base font-black text-red-700 mt-0.5 block">{selectedGRN.rejectedQty}</span>
                  </div>
                </div>

                {selectedGRN.qcNotes && (
                  <p className="text-gray-600 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
                    QC Notes: "{selectedGRN.qcNotes}"
                  </p>
                )}
              </div>

              {/* 5. Totals Breakdown */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-gray-900">
                    Rs. {Number(selectedGRN.subtotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Discount:</span>
                  <span className="font-bold text-red-600">
                    - Rs. {Number(selectedGRN.discount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tax & Charges:</span>
                  <span className="font-bold text-gray-900">
                    Rs. {(Number(selectedGRN.tax) + Number(selectedGRN.otherCharges)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-purple-200 flex items-center justify-between text-sm font-black text-purple-950">
                  <span>GRAND TOTAL:</span>
                  <span className="text-base text-purple-900">
                    Rs. {Number(selectedGRN.grandTotal).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {selectedGRN.notes && (
                <div>
                  <span className="text-gray-400 font-semibold block">Notes:</span>
                  <p className="text-gray-700 mt-0.5 font-medium">{selectedGRN.notes}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handlePrintGRN(selectedGRN, true);
                    showToast("PDF Download Ready", "Select 'Save as PDF' in the document window to download PDF to device.", "info");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-2xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handlePrintGRN(selectedGRN, false)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
              </div>

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

      {/* ==================== CREATE / EDIT GRN POPUP MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-xs font-sans">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#7C3AED] text-[11px] bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200">
                      {isEditing ? selectedGRN?.grnNo : "NEW GRN"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                      Goods Receiving
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight mt-0.5">
                    {isEditing ? "Edit Goods Receiving Note" : "Create New GRN"}
                  </h2>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">
                    Receive, inspect, and add incoming laundry supplies to inventory.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitGRN(true);
              }}
              className="p-6 overflow-y-auto space-y-8 flex-1 text-xs"
            >
              {/* SECTION 1: SUPPLIER INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Supplier Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Invoice Number */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Invoice Number</label>
                    <input
                      type="text"
                      value={formInvoiceNo}
                      onChange={(e) => setFormInvoiceNo(e.target.value)}
                      placeholder="e.g. INV-2026-00852"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Supplier Dropdown + Add Supplier button */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Supplier <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={formSupplierId}
                        onChange={(e) => setFormSupplierId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Select Supplier --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.supplierType})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsSupplierModalOpen(true)}
                        className="px-3 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-xl whitespace-nowrap transition flex items-center gap-1 shrink-0"
                        title="Add Supplier"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Received Date */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Received Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formReceivedDate}
                      onChange={(e) => setFormReceivedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-purple-50/60 border border-purple-200 rounded-xl font-bold text-purple-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Invoice Date */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={formInvoiceDate}
                      onChange={(e) => setFormInvoiceDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Due Date (Credit)</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: RECEIVING LOCATION */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Receiving Location
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Source */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Source</label>
                    <select
                      value={formSource}
                      onChange={(e) => setFormSource(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Supplier Purchase">Supplier Purchase</option>
                      <option value="Internal Transfer">Internal Transfer</option>
                      <option value="Return">Return</option>
                      <option value="Adjustment">Adjustment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Warehouse Dropdown + Add Location button */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Warehouse / Location <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        required
                        value={formWarehouseId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setFormWarehouseId(id);
                          const wh = warehouses.find((w) => w.id === id);
                          if (wh) {
                            setFormStorageArea(wh.storageArea || "Chemical Storage A");
                            setFormRackShelf(wh.rackShelf || "Rack A-02");
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Select Location --</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsWarehouseModalOpen(true)}
                        className="px-3 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-xl whitespace-nowrap transition flex items-center gap-1 shrink-0"
                        title="Add Location"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Storage Area */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Storage Area</label>
                    <input
                      type="text"
                      value={formStorageArea}
                      onChange={(e) => setFormStorageArea(e.target.value)}
                      placeholder="e.g. Chemical Storage A"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Rack / Shelf */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Rack / Shelf</label>
                    <input
                      type="text"
                      value={formRackShelf}
                      onChange={(e) => setFormRackShelf(e.target.value)}
                      placeholder="e.g. Rack A-02"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PRODUCT ITEMS */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                      🧴 Product Items Received
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFormItem}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product Row</span>
                  </button>
                </div>

                {/* Items Table */}
                <div className="space-y-3">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-purple-900 text-xs">Product Item #{idx + 1}</span>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFormItem(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
                        {/* Select Product */}
                        <div className="lg:col-span-2">
                          <label className="block font-bold text-gray-700 mb-1">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateFormItem(idx, "productId", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                          >
                            {catalogProducts.map((cp) => (
                              <option key={cp.id} value={cp.id}>
                                {cp.productName} ({cp.productCode})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Qty</label>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateFormItem(idx, "quantity", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Unit Size */}
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Unit Size ({item.unitSizeUnit || "L"})</label>
                          <input
                            type="number"
                            step="any"
                            value={item.unitSize}
                            onChange={(e) => handleUpdateFormItem(idx, "unitSize", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Total Quantity AUTO */}
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Total Qty (AUTO)</label>
                          <input
                            type="text"
                            disabled
                            value={`${item.totalQuantity} ${item.unitSizeUnit || "L"}`}
                            className="w-full px-3 py-2 bg-purple-100/70 border border-purple-200 font-extrabold text-purple-900 rounded-xl cursor-not-allowed text-center"
                          />
                        </div>

                        {/* Purchase Price */}
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Price / Unit (RS)</label>
                          <input
                            type="number"
                            step="any"
                            value={item.purchasePrice}
                            onChange={(e) => handleUpdateFormItem(idx, "purchasePrice", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Batch Number */}
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Batch No</label>
                          <input
                            type="text"
                            value={item.batchNumber || ""}
                            onChange={(e) => handleUpdateFormItem(idx, "batchNumber", e.target.value)}
                            placeholder="BATCH-001"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-mono font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Expiry Date */}
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={item.expiryDate || ""}
                            onChange={(e) => handleUpdateFormItem(idx, "expiryDate", e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Line Amount */}
                        <div className="lg:col-span-8 pt-2 flex items-center justify-between bg-purple-50/80 p-2.5 rounded-xl border border-purple-100">
                          <div className="flex items-center gap-4 text-xs">
                            <span className="font-bold text-gray-600">Unit: <span className="text-purple-900">{item.purchaseUnit}</span></span>
                            <span className="font-bold text-gray-600">Discount: <span className="text-purple-900">{item.discountPercent}%</span></span>
                            <span className="font-bold text-gray-600">Tax: <span className="text-purple-900">{item.taxPercent}%</span></span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block">Line Total</span>
                            <span className="text-sm font-black text-purple-950">
                              Rs. {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: QUALITY CHECK */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    4
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    🔍 Quality Check & Quantity Verification
                  </h3>
                </div>

                {/* QC Status selector */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">QC Status</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "PASSED", label: "Passed", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
                      { id: "PENDING", label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-300" },
                      { id: "PARTIALLY_PASSED", label: "Partially Passed", color: "bg-blue-100 text-blue-800 border-blue-300" },
                      { id: "FAILED", label: "Failed", color: "bg-red-100 text-red-800 border-red-300" },
                    ].map((statusOption) => (
                      <button
                        key={statusOption.id}
                        type="button"
                        onClick={() => setFormQCStatus(statusOption.id)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs border transition ${
                          formQCStatus === statusOption.id
                            ? `${statusOption.color} ring-2 ring-purple-500 shadow-xs`
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {formQCStatus === statusOption.id ? "✓ " : ""}
                        {statusOption.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Expected Qty */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Expected Qty</label>
                    <input
                      type="number"
                      value={formExpectedQty}
                      onChange={(e) => setFormExpectedQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Received Qty */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Received Qty</label>
                    <input
                      type="number"
                      value={formReceivedQty}
                      onChange={(e) => setFormReceivedQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Damaged Qty */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Damaged Qty</label>
                    <input
                      type="number"
                      value={formDamagedQty}
                      onChange={(e) => setFormDamagedQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Rejected Qty */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Rejected Qty</label>
                    <input
                      type="number"
                      value={formRejectedQty}
                      onChange={(e) => setFormRejectedQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">QC Inspection Notes</label>
                  <textarea
                    rows={2}
                    value={formQCNotes}
                    onChange={(e) => setFormQCNotes(e.target.value)}
                    placeholder="e.g. All containers inspected before accepting..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* SECTION 5: TOTALS & NOTES */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    5
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    💰 GRN Financial Totals
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Discount Amount (RS)</label>
                    <input
                      type="number"
                      step="any"
                      value={formDiscountAmount}
                      onChange={(e) => setFormDiscountAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tax Amount (RS)</label>
                    <input
                      type="number"
                      step="any"
                      value={formTaxAmount}
                      onChange={(e) => setFormTaxAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Other Charges (RS)</label>
                    <input
                      type="number"
                      step="any"
                      value={formOtherCharges}
                      onChange={(e) => setFormOtherCharges(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Grand Total Summary Box */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">
                      GRN Grand Total
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Subtotal: Rs. {calculatedSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-purple-950">
                      Rs. {calculatedGrandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">General Notes</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Enter any additional remarks..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  {/* Save as Draft */}
                  <button
                    type="button"
                    onClick={() => handleSubmitGRN(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition flex items-center gap-2 border border-gray-300"
                  >
                    {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Save as Draft</span>
                  </button>

                  {/* Create & Confirm (Stock In) */}
                  <button
                    type="button"
                    onClick={() => handleSubmitGRN(true)}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
                  >
                    {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Create & Confirm (Stock In)</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD SUPPLIER POPUP MODAL ==================== */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-[#211033] to-[#4C1D95] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Plus className="w-4 h-4 text-purple-300" />
                <span>Add New Supplier</span>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="e.g. ABC Chemical Lanka"
                  className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Supplier Type</label>
                <select
                  value={newSupplierType}
                  onChange={(e) => setNewSupplierType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Chemical Supplier">Chemical Supplier</option>
                  <option value="Packaging Supplier">Packaging Supplier</option>
                  <option value="Equipment Supplier">Equipment Supplier</option>
                  <option value="General Supplier">General Supplier</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="e.g. +94 11 234 5678"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  placeholder="e.g. orders@abcchemicals.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSupplier}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  {submittingSupplier && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD WAREHOUSE LOCATION POPUP MODAL ==================== */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-[#211033] to-[#4C1D95] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Plus className="w-4 h-4 text-purple-300" />
                <span>Add Store Location</span>
              </div>
              <button
                onClick={() => setIsWarehouseModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Store / Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  placeholder="e.g. Main Laundry Store"
                  className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Storage Area</label>
                <input
                  type="text"
                  value={newStorageArea}
                  onChange={(e) => setNewStorageArea(e.target.value)}
                  placeholder="e.g. Chemical Storage A"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Rack / Shelf</label>
                <input
                  type="text"
                  value={newRackShelf}
                  onChange={(e) => setNewRackShelf(e.target.value)}
                  placeholder="e.g. Rack A-01"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWarehouse}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  {submittingWarehouse && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Location</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== STATUS CHANGE CONFIRMATION POPUP MODAL ==================== */}
      {isStatusConfirmOpen && grnToToggleStatus && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  targetStatus === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                {targetStatus === "ACCEPTED" ? <CheckCircle2 className="w-6 h-6" /> : <PowerOff className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  {targetStatus === "ACCEPTED" ? "Confirm & Stock In GRN" : "Reject GRN"}
                </h3>
                <p className="text-xs text-gray-500">Confirm GRN Status Update</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
              Are you sure you want to {targetStatus === "ACCEPTED" ? "ACCEPT and stock in" : "REJECT"}{" "}
              <span className="font-mono font-bold text-purple-900">{grnToToggleStatus.grnNo}</span>?
              {targetStatus === "ACCEPTED"
                ? " All received item quantities will be automatically added to active product stock in your inventory catalog."
                : " Rejecting this GRN will record it as rejected and NO inventory stock will be added."}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsStatusConfirmOpen(false);
                  setGrnToToggleStatus(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={togglingStatus}
                className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-md transition text-xs flex items-center gap-2 disabled:opacity-50 ${
                  targetStatus === "ACCEPTED"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                    : "bg-red-600 hover:bg-red-700 shadow-red-600/30"
                }`}
              >
                {togglingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{targetStatus === "ACCEPTED" ? "OK, Confirm & Stock In" : "OK, Reject GRN"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION POPUP MODAL ==================== */}
      {isDeleteConfirmOpen && grnToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Delete GRN Record</h3>
                <p className="text-xs text-gray-500">Confirm permanent deletion</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-red-50/50 p-3 rounded-xl border border-red-100">
              Are you sure you want to delete GRN record <span className="font-mono font-bold text-gray-900">{grnToDelete.grnNo}</span>? This action will remove the record permanently.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setGrnToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-600/30 transition text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>OK, Delete GRN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
