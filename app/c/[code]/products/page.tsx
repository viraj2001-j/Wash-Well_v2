"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Package,
  PackageCheck,
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
} from "lucide-react";

/* =========================================================
   PRESET DEFAULTS FOR LAUNDRY CHEMICALS & TREATMENTS
========================================================= */

const DEFAULT_CATEGORIES = [
  "Laundry Chemicals & Cleaning Products",
  "Laundry Treatment Products",
];

const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  "Laundry Chemicals & Cleaning Products": [
    "Detergent",
    "Fabric Care",
    "Bleaching",
    "Stain Treatment",
    "Disinfection",
    "Special Treatment",
  ],
  "Laundry Treatment Products": [
    "Stain Treatment",
    "Fabric Protection",
    "Special Treatment",
    "Delicate Care",
  ],
};

const DEFAULT_BRANDS = ["Ariel", "OMO", "Clorox", "Local Supplier", "Diversey", "Ecolab", "Other"];
const DEFAULT_PRODUCT_FORMS = ["Liquid", "Powder", "Gel", "Granule", "Tablet", "Spray", "Cream", "Paste", "Other"];
const UOMS = ["KG", "GRAM", "LITRE", "ML", "PCS", "BOTTLE", "CAN", "PACK", "BOX", "DRUM"];

const DEFAULT_CHEMICAL_TYPES = [
  "Detergent",
  "Softener",
  "Bleach",
  "Disinfectant",
  "Stain Remover",
  "Neutralizer",
  "Whitening Agent",
  "Degreaser",
  "Enzyme",
  "Other",
];

const DEFAULT_USAGE_PURPOSES = [
  "Main Washing",
  "Pre-Wash",
  "Stain Treatment",
  "Rinsing",
  "Fabric Treatment",
  "Disinfection",
  "Dry Cleaning",
  "Special Treatment",
];

const DOSAGE_UNITS = [
  "ML / KG of Clothes",
  "GRAM / KG of Clothes",
  "PCS / Load",
  "ML / Wash",
  "GRAM / Wash",
  "Other",
];

interface ProductItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  subcategory?: string | null;
  brand?: string | null;
  productForm?: string | null;
  unitOfMeasure: string;
  packageSize?: number | null;
  packageUnit?: string | null;
  buyingPrice: number;
  sellingPrice?: number | null;
  costPerUnit?: number | null;
  openingStock: number;
  currentStock: number;
  reorderLevel?: number | null;
  maxStockLevel?: number | null;
  lowStockAlert: boolean;
  chemicalType?: string | null;
  usagePurpose?: string | null;
  dosage?: number | null;
  dosageUnit?: string | null;
  isExpirable: boolean;
  expiryDate?: string | null;
  batchNumber?: string | null;
  storageInstructions?: string | null;
  safetyInstructions?: string | null;
  barcode?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  status: string;
  trackInventory: boolean;
  createdAt: string;
}

interface DynamicOption {
  id: string;
  type: string;
  name: string;
  parentCategory?: string | null;
}

interface ToastNotification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export default function ProductsPage() {
  const params = useParams();
  const companyCode = params.code as string;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Floating Toast Notifications Queue
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

  // Dynamic Options from DB
  const [dbOptions, setDbOptions] = useState<DynamicOption[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  // Main Add/Edit Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail Side Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Status Change Confirmation Modal
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [productToToggleStatus, setProductToToggleStatus] = useState<ProductItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Delete Confirmation Modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add Dynamic Option Popup Modal State
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [optionModalType, setOptionModalType] = useState<
    "CATEGORY" | "SUBCATEGORY" | "BRAND" | "PRODUCT_FORM" | "CHEMICAL_TYPE" | "USAGE_PURPOSE"
  >("BRAND");
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionParentCategory, setNewOptionParentCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [submittingOption, setSubmittingOption] = useState(false);

  // Form Inputs
  const [formCode, setFormCode] = useState<string>("");
  const [formProductName, setFormProductName] = useState<string>(""); // MANUAL INPUT
  const [formCategory, setFormCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [formSubcategory, setFormSubcategory] = useState<string>("");
  const [formBrand, setFormBrand] = useState<string>("Local Supplier");
  const [formProductForm, setFormProductForm] = useState<string>("Liquid");

  const [formUOM, setFormUOM] = useState<string>("LITRE");
  const [formPackageSize, setFormPackageSize] = useState<string>("25");
  const [formPackageUnit, setFormPackageUnit] = useState<string>("LITRE");

  const [formBuyingPrice, setFormBuyingPrice] = useState<string>("850.00");
  const [formSellingPrice, setFormSellingPrice] = useState<string>("1000.00");

  const [formOpeningStock, setFormOpeningStock] = useState<string>("25.00");
  const [formReorderLevel, setFormReorderLevel] = useState<string>("10.00");
  const [formMaxStockLevel, setFormMaxStockLevel] = useState<string>("50.00");
  const [formLowStockAlert, setFormLowStockAlert] = useState<boolean>(true);

  const [formChemicalType, setFormChemicalType] = useState<string>("Detergent");
  const [formUsagePurpose, setFormUsagePurpose] = useState<string>("Main Washing");
  const [formDosage, setFormDosage] = useState<string>("50");
  const [formDosageUnit, setFormDosageUnit] = useState<string>("ML / KG of Clothes");

  const [formIsExpirable, setFormIsExpirable] = useState<boolean>(false);
  const [formExpiryDate, setFormExpiryDate] = useState<string>("");
  const [formBatchNumber, setFormBatchNumber] = useState<string>("");
  const [formStorageInstructions, setFormStorageInstructions] = useState<string>("");
  const [formSafetyInstructions, setFormSafetyInstructions] = useState<string>("");

  const [formBarcode, setFormBarcode] = useState<string>("");
  const [formSKU, setFormSKU] = useState<string>("");
  const [formStatus, setFormStatus] = useState<string>("ACTIVE");
  const [formTrackInventory, setFormTrackInventory] = useState<boolean>(true);

  // Load Products & Options
  const fetchProducts = async () => {
    if (!companyCode) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/c/${companyCode}/products`);
      if (!res.ok) {
        showToast("Error", `Failed to load products (HTTP ${res.status})`, "error");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      } else {
        showToast("Error", json.error || "Failed to load products", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    if (!companyCode) return;
    try {
      const res = await fetch(`/api/c/${companyCode}/products/options`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setDbOptions(json.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch options:", err);
    }
  };

  useEffect(() => {
    if (companyCode) {
      fetchProducts();
      fetchOptions();
    }
  }, [companyCode]);

  // Derived Options Lists (Default + DB dynamic)
  const availableCategories = useMemo(() => {
    const customCats = dbOptions.filter((o) => o.type === "CATEGORY").map((o) => o.name);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...customCats]));
  }, [dbOptions]);

  const availableSubcategories = useMemo(() => {
    const defaultSubs = DEFAULT_SUBCATEGORIES[formCategory] || [
      "Detergent",
      "Fabric Care",
      "Bleaching",
      "Stain Treatment",
      "Disinfection",
      "Special Treatment",
    ];
    const customSubs = dbOptions
      .filter((o) => o.type === "SUBCATEGORY" && (!o.parentCategory || o.parentCategory === formCategory))
      .map((o) => o.name);
    return Array.from(new Set([...defaultSubs, ...customSubs]));
  }, [dbOptions, formCategory]);

  const availableBrands = useMemo(() => {
    const customBrands = dbOptions.filter((o) => o.type === "BRAND").map((o) => o.name);
    return Array.from(new Set([...DEFAULT_BRANDS, ...customBrands]));
  }, [dbOptions]);

  const availableForms = useMemo(() => {
    const customForms = dbOptions.filter((o) => o.type === "PRODUCT_FORM").map((o) => o.name);
    return Array.from(new Set([...DEFAULT_PRODUCT_FORMS, ...customForms]));
  }, [dbOptions]);

  const availableChemicalTypes = useMemo(() => {
    const customTypes = dbOptions.filter((o) => o.type === "CHEMICAL_TYPE").map((o) => o.name);
    return Array.from(new Set([...DEFAULT_CHEMICAL_TYPES, ...customTypes]));
  }, [dbOptions]);

  const availableUsagePurposes = useMemo(() => {
    const customPurposes = dbOptions.filter((o) => o.type === "USAGE_PURPOSE").map((o) => o.name);
    return Array.from(new Set([...DEFAULT_USAGE_PURPOSES, ...customPurposes]));
  }, [dbOptions]);

  // Code & Barcode generators
  const generateNewProductCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `CHEM-${randomNum}`;
  };

  const generateBarcode = () => {
    const prefix = "890";
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    setFormBarcode(`${prefix}${randomDigits}`);
  };

  // Cost per unit auto calculation
  const computedCostPerUnit = useMemo(() => {
    const price = parseFloat(formBuyingPrice);
    const size = parseFloat(formPackageSize);
    if (!isNaN(price) && !isNaN(size) && size > 0) {
      return (price / size).toFixed(2);
    }
    return null;
  }, [formBuyingPrice, formPackageSize]);

  // Open Record Drawer
  const handleOpenDrawer = (p: ProductItem) => {
    setSelectedProduct(p);
    setIsDrawerOpen(true);
  };

  // Prompt Status Change Confirmation Modal
  const handlePromptStatusChange = (p: ProductItem) => {
    const nextStatus = p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setProductToToggleStatus(p);
    setTargetStatus(nextStatus);
    setIsStatusConfirmOpen(true);
  };

  // Perform Confirmed Activate / Inactivate Action
  const handleConfirmStatusChange = async () => {
    if (!productToToggleStatus) return;
    setTogglingStatus(true);

    try {
      const res = await fetch(`/api/c/${companyCode}/products/${productToToggleStatus.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const json = await res.json();
      if (json.success) {
        const updated = json.data;
        if (selectedProduct?.id === productToToggleStatus.id) {
          setSelectedProduct(updated);
        }
        setProducts((prev) => prev.map((item) => (item.id === productToToggleStatus.id ? updated : item)));

        showToast(
          targetStatus === "ACTIVE" ? "Product Activated" : "Product Inactivated",
          `Product "${productToToggleStatus.productName}" is now ${targetStatus}.`,
          "success"
        );
        setIsStatusConfirmOpen(false);
        setProductToToggleStatus(null);
      } else {
        showToast("Status Update Failed", json.error || "Could not change status", "error");
      }
    } catch (err: any) {
      showToast("Status Update Error", err.message || "An error occurred", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedProduct(null);

    const newCode = generateNewProductCode();
    setFormCode(newCode);
    setFormProductName("");

    const cat = availableCategories[0] || DEFAULT_CATEGORIES[0];
    setFormCategory(cat);
    const subs = DEFAULT_SUBCATEGORIES[cat] || [];
    setFormSubcategory(subs[0] || "");

    setFormBrand(availableBrands[0] || "Local Supplier");
    setFormProductForm(availableForms[0] || "Liquid");

    setFormUOM("LITRE");
    setFormPackageSize("25");
    setFormPackageUnit("LITRE");

    setFormBuyingPrice("850.00");
    setFormSellingPrice("1000.00");

    setFormOpeningStock("25.00");
    setFormReorderLevel("10.00");
    setFormMaxStockLevel("50.00");
    setFormLowStockAlert(true);

    setFormChemicalType(availableChemicalTypes[0] || "Detergent");
    setFormUsagePurpose(availableUsagePurposes[0] || "Main Washing");
    setFormDosage("50");
    setFormDosageUnit("ML / KG of Clothes");

    setFormIsExpirable(false);
    setFormExpiryDate("");
    setFormBatchNumber(`BATCH-${new Date().getFullYear()}-001`);
    setFormStorageInstructions("Store in a cool, dry place away from direct sunlight.");
    setFormSafetyInstructions("Keep away from children. Avoid contact with eyes and skin.");

    setFormBarcode(`890${Math.floor(100000000 + Math.random() * 900000000)}`);
    setFormSKU(newCode);
    setFormStatus("ACTIVE");
    setFormTrackInventory(true);

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: ProductItem) => {
    setIsEditing(true);
    setSelectedProduct(p);

    setFormCode(p.productCode);
    setFormProductName(p.productName);

    setFormCategory(p.category || availableCategories[0]);
    setFormSubcategory(p.subcategory || "");
    setFormBrand(p.brand || "Local Supplier");
    setFormProductForm(p.productForm || "Liquid");

    setFormUOM(p.unitOfMeasure);
    setFormPackageSize(p.packageSize ? String(p.packageSize) : "");
    setFormPackageUnit(p.packageUnit || p.unitOfMeasure);

    setFormBuyingPrice(String(p.buyingPrice));
    setFormSellingPrice(p.sellingPrice !== null && p.sellingPrice !== undefined ? String(p.sellingPrice) : "");

    setFormOpeningStock(String(p.openingStock));
    setFormReorderLevel(p.reorderLevel !== null && p.reorderLevel !== undefined ? String(p.reorderLevel) : "");
    setFormMaxStockLevel(p.maxStockLevel !== null && p.maxStockLevel !== undefined ? String(p.maxStockLevel) : "");
    setFormLowStockAlert(p.lowStockAlert);

    setFormChemicalType(p.chemicalType || availableChemicalTypes[0] || "Detergent");
    setFormUsagePurpose(p.usagePurpose || availableUsagePurposes[0] || "Main Washing");
    setFormDosage(p.dosage !== null && p.dosage !== undefined ? String(p.dosage) : "");
    setFormDosageUnit(p.dosageUnit || "ML / KG of Clothes");

    setFormIsExpirable(p.isExpirable);
    setFormExpiryDate(p.expiryDate ? p.expiryDate.split("T")[0] : "");
    setFormBatchNumber(p.batchNumber || "");
    setFormStorageInstructions(p.storageInstructions || "");
    setFormSafetyInstructions(p.safetyInstructions || "");

    setFormBarcode(p.barcode || "");
    setFormSKU(p.sku || p.productCode);
    setFormStatus(p.status);
    setFormTrackInventory(p.trackInventory);

    setIsModalOpen(true);
  };

  // Trigger Delete Confirmation Popup
  const handlePromptDelete = (p: ProductItem) => {
    setProductToDelete(p);
    setIsDeleteConfirmOpen(true);
  };

  // Perform Confirmed Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          "Product Deleted",
          `Product "${productToDelete.productName}" has been removed permanently.`,
          "success"
        );
        if (selectedProduct?.id === productToDelete.id) {
          setIsDrawerOpen(false);
          setSelectedProduct(null);
        }
        setIsDeleteConfirmOpen(false);
        setProductToDelete(null);
        fetchProducts();
      } else {
        showToast("Delete Failed", json.error || "Failed to delete product.", "error");
      }
    } catch (err: any) {
      showToast("Delete Error", err.message || "Error deleting product.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Open Add Option Popup Modal
  const handleOpenAddOptionModal = (
    type: "CATEGORY" | "SUBCATEGORY" | "BRAND" | "PRODUCT_FORM" | "CHEMICAL_TYPE" | "USAGE_PURPOSE"
  ) => {
    setOptionModalType(type);
    setNewOptionName("");
    setNewOptionParentCategory(formCategory);
    setIsOptionModalOpen(true);
  };

  // Save Dynamic Option to DB
  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    setSubmittingOption(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/products/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: optionModalType,
          name: newOptionName.trim(),
          parentCategory: optionModalType === "SUBCATEGORY" ? newOptionParentCategory : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchOptions();

        const addedName = json.data.name;
        if (optionModalType === "CATEGORY") {
          setFormCategory(addedName);
        } else if (optionModalType === "SUBCATEGORY") {
          setFormSubcategory(addedName);
        } else if (optionModalType === "BRAND") {
          setFormBrand(addedName);
        } else if (optionModalType === "PRODUCT_FORM") {
          setFormProductForm(addedName);
        } else if (optionModalType === "CHEMICAL_TYPE") {
          setFormChemicalType(addedName);
        } else if (optionModalType === "USAGE_PURPOSE") {
          setFormUsagePurpose(addedName);
        }

        showToast(
          "Option Saved",
          `Added new ${optionModalType.toLowerCase().replace("_", " ")}: "${addedName}"`,
          "success"
        );
        setIsOptionModalOpen(false);
      } else {
        showToast("Option Error", json.error || "Failed to add option", "error");
      }
    } catch (err: any) {
      showToast("Option Error", err.message || "Error adding option", "error");
    } finally {
      setSubmittingOption(false);
    }
  };

  // Submit Product Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formCode || !formProductName.trim() || !formCategory || !formUOM || !formBuyingPrice) {
      showToast("Validation Error", "Please fill in all required fields (Product Code, Name, Category, UOM, Buying Price).", "error");
      setSubmitting(false);
      return;
    }

    const payload = {
      productCode: formCode,
      productName: formProductName.trim(),
      category: formCategory,
      subcategory: formSubcategory,
      brand: formBrand,
      productForm: formProductForm,

      unitOfMeasure: formUOM,
      packageSize: formPackageSize,
      packageUnit: formPackageUnit,

      buyingPrice: formBuyingPrice,
      sellingPrice: formSellingPrice,

      openingStock: formOpeningStock,
      reorderLevel: formReorderLevel,
      maxStockLevel: formMaxStockLevel,
      lowStockAlert: formLowStockAlert,

      chemicalType: formChemicalType,
      usagePurpose: formUsagePurpose,
      dosage: formDosage,
      dosageUnit: formDosageUnit,

      isExpirable: formIsExpirable,
      expiryDate: formIsExpirable ? formExpiryDate : null,
      batchNumber: formBatchNumber,
      storageInstructions: formStorageInstructions,
      safetyInstructions: formSafetyInstructions,

      barcode: formBarcode,
      sku: formSKU || formCode,
      status: formStatus,
      trackInventory: formTrackInventory,
    };

    try {
      const url = isEditing
        ? `/api/c/${companyCode}/products/${selectedProduct?.id}`
        : `/api/c/${companyCode}/products`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          isEditing ? "Product Updated" : "Product Created",
          isEditing
            ? `Product "${payload.productName}" updated successfully!`
            : `New product "${payload.productName}" created successfully!`,
          "success"
        );
        setIsModalOpen(false);
        if (isEditing && selectedProduct) {
          setSelectedProduct(json.data);
        }
        fetchProducts();
      } else {
        showToast("Save Failed", json.error || "Failed to save product.", "error");
      }
    } catch (err: any) {
      showToast("Save Error", err.message || "An error occurred while saving.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        categoryFilter === "ALL" || p.category === categoryFilter;

      const isLowStock =
        p.trackInventory &&
        p.reorderLevel !== null &&
        p.reorderLevel !== undefined &&
        Number(p.currentStock) <= Number(p.reorderLevel);

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "LOW_STOCK" && isLowStock) ||
        (stockFilter === "OUT_OF_STOCK" && Number(p.currentStock) === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) =>
        p.trackInventory &&
        p.reorderLevel !== null &&
        p.reorderLevel !== undefined &&
        Number(p.currentStock) <= Number(p.reorderLevel)
    ).length;
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => {
      const price = Number(p.buyingPrice) || 0;
      const stock = Number(p.currentStock) || 0;
      const pkgSize = Number(p.packageSize) || 1;
      return acc + (price * (stock / pkgSize));
    }, 0);
  }, [products]);

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
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Laundry Products Catalog</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage cleaning chemicals, treatment products, dosage specs, unit costs, and automated stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} /> Add New Product
          </button>
        </div>
      </div>

      {/* 4 COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Products */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL PRODUCTS</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <PackageCheck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{products.length}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Chemicals & SKUs registered
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Total Valuation */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">TOTAL VALUATION</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <DollarSign size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">LKR {totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Stock asset value
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">LOW STOCK ALERTS</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{lowStockCount}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              Requires reordering
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-[#ffe4e6] border border-rose-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#be123c]">OUT OF STOCK</span>
            <div className="w-7 h-7 rounded-lg bg-[#fecdd3] text-[#e11d48] flex items-center justify-center font-bold">
              <XCircle size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">
              {products.filter((p) => Number(p.currentStock) === 0).length}
            </p>
            <span className="text-[9.5px] text-[#e11d48] font-medium flex items-center gap-0.5 mt-0.5">
              Zero inventory items
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#e11d48] fill-none stroke-[2]">
              <path d="M 0,14 Q 25,14 45,13 T 65,12 T 80,6 T 90,13 L 100,14" />
            </svg>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}

      {/* ==================== FILTERS & SEARCH BAR ==================== */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code, name, brand, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              categoryFilter === "ALL"
                ? "bg-purple-600 text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Products
          </button>
          {availableCategories.slice(0, 3).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                categoryFilter === cat
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.length > 20 ? `${cat.substring(0, 18)}...` : cat}
            </button>
          ))}
          <button
            onClick={() => setStockFilter(stockFilter === "LOW_STOCK" ? "ALL" : "LOW_STOCK")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              stockFilter === "LOW_STOCK"
                ? "bg-amber-500 text-white shadow-2xs"
                : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* ==================== PRODUCTS TABLE ==================== */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-sm font-medium">Loading products catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <Package className="w-12 h-12 text-gray-300 stroke-[1.5]" />
            <h3 className="text-base font-bold text-gray-800">No products found</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              {searchQuery || categoryFilter !== "ALL" || stockFilter !== "ALL"
                ? "Try adjusting your filters or search query to find the product."
                : "Start by clicking 'Add New Product' to register your first laundry chemical."}
            </p>
            {!searchQuery && categoryFilter === "ALL" && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition"
              >
                + Create Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Code & Item</th>
                  <th className="py-3.5 px-4">Category / Form</th>
                  <th className="py-3.5 px-4">Brand</th>
                  <th className="py-3.5 px-4">Stock Level</th>
                  <th className="py-3.5 px-4">Pricing</th>
                  <th className="py-3.5 px-4">Dosage / Purpose</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredProducts.map((p) => {
                  const isLowStock =
                    p.trackInventory &&
                    p.reorderLevel !== null &&
                    p.reorderLevel !== undefined &&
                    Number(p.currentStock) <= Number(p.reorderLevel);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenDrawer(p)}
                      className="hover:bg-purple-50/40 cursor-pointer transition"
                    >
                      {/* Code & Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center shrink-0 border border-purple-200">
                            {p.productForm === "Liquid" ? "🧪" : p.productForm === "Powder" ? "⚪" : "🧴"}
                          </div>
                          <div>
                            <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-gray-100 text-gray-700 rounded-md mb-0.5">
                              {p.productCode}
                            </span>
                            <h4 className="font-bold text-gray-900 leading-snug">{p.productName}</h4>
                            {p.packageSize && (
                              <span className="text-[11px] text-gray-500 font-medium">
                                ({p.packageSize} {p.packageUnit || p.unitOfMeasure} Package)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800 block">{p.category}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.subcategory && (
                            <span className="text-[10px] text-purple-600 bg-purple-50 font-bold px-2 py-0.5 rounded-md">
                              {p.subcategory}
                            </span>
                          )}
                          {p.productForm && (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                              {p.productForm}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-4 px-4 font-semibold text-gray-800">
                        {p.brand || "Local Supplier"}
                      </td>

                      {/* Stock Level */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <span className={isLowStock ? "text-amber-600 font-extrabold" : "text-gray-900"}>
                              {p.currentStock} {p.unitOfMeasure}
                            </span>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                                <AlertTriangle className="w-3 h-3" />
                                Low Stock
                              </span>
                            )}
                          </div>
                          {p.reorderLevel !== null && p.reorderLevel !== undefined && (
                            <p className="text-[10px] text-gray-400">
                              Reorder: {p.reorderLevel} {p.unitOfMeasure} | Max: {p.maxStockLevel || "--"}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          Rs. {Number(p.buyingPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                        {p.costPerUnit && (
                          <span className="text-[10px] text-purple-600 font-semibold block">
                            Cost: Rs. {p.costPerUnit} / {p.unitOfMeasure}
                          </span>
                        )}
                        {p.sellingPrice && (
                          <span className="text-[10px] text-gray-400 block">
                            Sell: Rs. {Number(p.sellingPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      {/* Dosage */}
                      <td className="py-4 px-4">
                        {p.dosage ? (
                          <div>
                            <span className="font-semibold text-gray-800 block">
                              {p.dosage} {p.dosageUnit || "ML / KG"}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {p.usagePurpose || "Main Washing"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                          />
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDrawer(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                            title="View Drawer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePromptDelete(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== PRODUCT DETAIL SIDE DRAWER ==================== */}
      {isDrawerOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#211033] via-[#3B1E5E] to-[#4C1D95] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/10">
                  {selectedProduct.productForm === "Liquid" ? "🧪" : selectedProduct.productForm === "Powder" ? "⚪" : "🧴"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-white/20 text-white font-mono text-[10px] font-bold rounded-md">
                      {selectedProduct.productCode}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedProduct.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
                    >
                      ● {selectedProduct.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold mt-1 text-white leading-snug">
                    {selectedProduct.productName}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Drawer Action Bar with ACTIVATE / INACTIVATE button (with confirmation popup) */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                    selectedProduct.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-gray-200 text-gray-700 border border-gray-300"
                  }`}
                >
                  {selectedProduct.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* ACTIVATE / INACTIVATE BUTTON (Triggers confirmation popup modal) */}
                <button
                  onClick={() => handlePromptStatusChange(selectedProduct)}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition border shadow-2xs ${
                    selectedProduct.status === "ACTIVE"
                      ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  }`}
                  title={selectedProduct.status === "ACTIVE" ? "Inactivate Product" : "Activate Product"}
                >
                  {selectedProduct.status === "ACTIVE" ? (
                    <PowerOff className="w-3.5 h-3.5 text-amber-700" />
                  ) : (
                    <Power className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>{selectedProduct.status === "ACTIVE" ? "Inactivate" : "Activate"}</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(selectedProduct)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition border border-blue-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handlePromptDelete(selectedProduct)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs flex items-center gap-1.5 transition border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Drawer Body Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Stock Status Banner */}
              {selectedProduct.trackInventory &&
                selectedProduct.reorderLevel !== null &&
                selectedProduct.reorderLevel !== undefined &&
                Number(selectedProduct.currentStock) <= Number(selectedProduct.reorderLevel) && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-amber-900 text-xs uppercase">⚠ Low Stock Alert</h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Current stock ({selectedProduct.currentStock} {selectedProduct.unitOfMeasure}) is at or below the reorder level ({selectedProduct.reorderLevel} {selectedProduct.unitOfMeasure}). Reordering recommended!
                      </p>
                    </div>
                  </div>
                )}

              {/* 1. Basic Specifications */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-600" />
                  Basic Specifications
                </h3>

                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-semibold block">Category</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">{selectedProduct.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Subcategory</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">{selectedProduct.subcategory || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Brand</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">{selectedProduct.brand || "Local Supplier"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Product Form</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">{selectedProduct.productForm || "Liquid"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Unit of Measure</span>
                    <span className="font-bold text-purple-700 text-xs mt-0.5 block">{selectedProduct.unitOfMeasure}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Package Size</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                      {selectedProduct.packageSize ? `${selectedProduct.packageSize} ${selectedProduct.packageUnit || selectedProduct.unitOfMeasure}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Stock & Inventory Gauge */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4 text-purple-600" />
                  Stock & Inventory Gauge
                </h3>

                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-3 rounded-xl shadow-2xs">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Current Stock</span>
                      <span className="text-lg font-black text-purple-900 block mt-0.5">
                        {selectedProduct.currentStock} {selectedProduct.unitOfMeasure}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-2xs">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Reorder Level</span>
                      <span className="text-lg font-black text-amber-700 block mt-0.5">
                        {selectedProduct.reorderLevel ?? "N/A"} {selectedProduct.unitOfMeasure}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-2xs">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Max Level</span>
                      <span className="text-lg font-black text-gray-800 block mt-0.5">
                        {selectedProduct.maxStockLevel ?? "N/A"} {selectedProduct.unitOfMeasure}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-purple-800 font-semibold pt-1">
                    <span>Opening Stock: {selectedProduct.openingStock} {selectedProduct.unitOfMeasure}</span>
                    <span>Track Inventory: {selectedProduct.trackInventory ? "☑ Yes" : "☒ No"}</span>
                  </div>
                </div>
              </div>

              {/* 3. Pricing Breakdown */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  Pricing & Cost Breakdown
                </h3>

                <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-semibold block">Buying Price</span>
                    <span className="font-black text-gray-900 text-sm mt-0.5 block">
                      Rs. {Number(selectedProduct.buyingPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Cost Per Unit</span>
                    <span className="font-black text-purple-700 text-sm mt-0.5 block">
                      {selectedProduct.costPerUnit ? `Rs. ${selectedProduct.costPerUnit} / ${selectedProduct.unitOfMeasure}` : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Selling Price</span>
                    <span className="font-black text-gray-900 text-sm mt-0.5 block">
                      {selectedProduct.sellingPrice ? `Rs. ${Number(selectedProduct.sellingPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Chemical & Dosage Specs */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-purple-600" />
                  Chemical & Dosage Specs
                </h3>

                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 font-semibold block">Chemical Type</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">{selectedProduct.chemicalType || "Detergent"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Usage Purpose</span>
                    <span className="font-bold text-gray-900 text-xs mt-0.5 block">{selectedProduct.usagePurpose || "Main Washing"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 font-semibold block">Dosage Specification</span>
                    <span className="font-extrabold text-purple-900 text-xs mt-0.5 block">
                      {selectedProduct.dosage ? `${selectedProduct.dosage} ${selectedProduct.dosageUnit || "ML / KG"}` : "N/A"}
                    </span>
                  </div>
                </div>

                {selectedProduct.dosage && (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-semibold">
                      Standard Batch Estimator: 20 KG clothes load × {selectedProduct.dosage} {selectedProduct.dosageUnit} ={" "}
                      <span className="font-extrabold text-amber-900">
                        {20 * Number(selectedProduct.dosage)} {(selectedProduct.dosageUnit || "ML").split(" ")[0]}
                      </span>{" "}
                      chemical consumption.
                    </p>
                  </div>
                )}
              </div>

              {/* 5. Safety & Expiry Specifications */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Safety & Expiry Specifications
                </h3>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-400 font-semibold block">Is Expirable?</span>
                      <span className="font-bold text-gray-900 text-xs mt-0.5 block">
                        {selectedProduct.isExpirable ? "⚠️ Yes (Expirable)" : "No"}
                      </span>
                    </div>
                    {selectedProduct.isExpirable && (
                      <div>
                        <span className="text-gray-400 font-semibold block">Expiry Date</span>
                        <span className="font-extrabold text-red-600 text-xs mt-0.5 block">
                          {selectedProduct.expiryDate ? selectedProduct.expiryDate.split("T")[0] : "N/A"}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 font-semibold block">Batch Number</span>
                      <span className="font-bold text-gray-900 text-xs font-mono mt-0.5 block">
                        {selectedProduct.batchNumber || "N/A"}
                      </span>
                    </div>
                  </div>

                  {selectedProduct.storageInstructions && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-400 font-semibold block">Storage Instructions:</span>
                      <p className="text-gray-700 mt-0.5 font-medium">{selectedProduct.storageInstructions}</p>
                    </div>
                  )}

                  {selectedProduct.safetyInstructions && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-red-600 font-semibold block">Safety & Handling Instructions:</span>
                      <p className="text-gray-700 mt-0.5 font-medium">{selectedProduct.safetyInstructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Barcode & SKU */}
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-xl font-mono text-[11px] text-gray-600">
                <span>SKU: {selectedProduct.sku || selectedProduct.productCode}</span>
                <span>Barcode: {selectedProduct.barcode || "N/A"}</span>
              </div>
            </div>

            {/* Drawer Footer Actions with Activate / Inactivate */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => handlePromptStatusChange(selectedProduct)}
                className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition border ${
                  selectedProduct.status === "ACTIVE"
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                }`}
              >
                {selectedProduct.status === "ACTIVE" ? (
                  <PowerOff className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <Power className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>{selectedProduct.status === "ACTIVE" ? "Inactivate Product" : "Activate Product"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handleOpenEditModal(selectedProduct)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ACTIVATE / INACTIVATE CONFIRMATION POPUP MODAL ==================== */}
      {isStatusConfirmOpen && productToToggleStatus && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  targetStatus === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {targetStatus === "ACTIVE" ? <Power className="w-6 h-6" /> : <PowerOff className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">
                  {targetStatus === "ACTIVE" ? "Activate Product" : "Inactivate Product"}
                </h3>
                <p className="text-xs text-gray-500">Confirm product status change</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
              Are you sure you want to {targetStatus === "ACTIVE" ? "activate" : "inactivate"}{" "}
              <span className="font-bold text-gray-900">"{productToToggleStatus.productName}"</span> (Code:{" "}
              <span className="font-mono font-bold">{productToToggleStatus.productCode}</span>)?
              {targetStatus === "INACTIVE"
                ? " Inactive products will be flagged as inactive in catalog lists."
                : " Active products can be selected in routines."}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsStatusConfirmOpen(false);
                  setProductToToggleStatus(null);
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
                  targetStatus === "ACTIVE"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                }`}
              >
                {togglingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{targetStatus === "ACTIVE" ? "OK, Activate Product" : "OK, Inactivate Product"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION POPUP MODAL ==================== */}
      {isDeleteConfirmOpen && productToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Delete Product</h3>
                <p className="text-xs text-gray-500">Confirm permanent deletion</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-red-50/50 p-3 rounded-xl border border-red-100">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{productToDelete.productName}"</span> (Code: <span className="font-mono font-bold">{productToDelete.productCode}</span>)? This action will remove the product permanently from your catalog.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setProductToDelete(null);
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
                <span>OK, Delete Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT PRODUCT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-[#211033] to-[#4C1D95] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
                  🧴
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isEditing ? "Edit Laundry Product" : "Add New Laundry Product"}
                  </h2>
                  <p className="text-xs text-purple-200">
                    Add a chemical or treatment product to your inventory.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 flex-1 text-xs">
              {/* SECTION 1: PRODUCT INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Product Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Code */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Product Code <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="e.g. CHEM-001"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => setFormCode(generateNewProductCode())}
                        className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl whitespace-nowrap transition"
                      >
                        Auto
                      </button>
                    </div>
                  </div>

                  {/* Product Name */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formProductName}
                      onChange={(e) => setFormProductName(e.target.value)}
                      placeholder="e.g. Laundry Detergent — Liquid / Heavy Duty Cleaner"
                      className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Category with + button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700">
                        Category <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setFormCategory(newCat);
                          const subs = DEFAULT_SUBCATEGORIES[newCat] || [];
                          setFormSubcategory(subs[0] || "");
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenAddOptionModal("CATEGORY")}
                        className="w-10 h-10 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-lg rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition active:scale-95"
                        title="Add New Category"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subcategory with + button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700">Subcategory</label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={formSubcategory}
                        onChange={(e) => setFormSubcategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">-- Select Subcategory --</option>
                        {availableSubcategories.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenAddOptionModal("SUBCATEGORY")}
                        className="w-10 h-10 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-lg rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition active:scale-95"
                        title="Add New Subcategory"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Brand with + button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700">Brand</label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        {availableBrands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenAddOptionModal("BRAND")}
                        className="w-10 h-10 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-lg rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition active:scale-95"
                        title="Add New Brand"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Product Form with + button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700">Product Form</label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={formProductForm}
                        onChange={(e) => setFormProductForm(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        {availableForms.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenAddOptionModal("PRODUCT_FORM")}
                        className="w-10 h-10 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-lg rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition active:scale-95"
                        title="Add New Product Form"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: UNIT & PACKAGING */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    Unit & Packaging
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Unit of Measure */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Unit of Measure <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formUOM}
                      onChange={(e) => {
                        setFormUOM(e.target.value);
                        setFormPackageUnit(e.target.value);
                      }}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      {UOMS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Package Size */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Package Size</label>
                    <input
                      type="number"
                      step="any"
                      value={formPackageSize}
                      onChange={(e) => setFormPackageSize(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Package Unit */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Package Unit</label>
                    <select
                      value={formPackageUnit}
                      onChange={(e) => setFormPackageUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      {UOMS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Packaging Summary Badge */}
                {formPackageSize && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-purple-900">
                    <span className="font-semibold text-xs">Packaging Representation:</span>
                    <span className="font-extrabold text-sm bg-purple-600 text-white px-3 py-1 rounded-lg">
                      {formPackageSize} {formPackageUnit} Container / Package
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 3: PRICING */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    💰 Pricing & Cost Calculation
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Buying Price */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Buying Price (RS) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formBuyingPrice}
                      onChange={(e) => setFormBuyingPrice(e.target.value)}
                      placeholder="e.g. 850.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-extrabold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Selling Price (RS) <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value)}
                      placeholder="e.g. 1000.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>

                {/* Computed Cost Per Unit */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                      Cost Per Unit (AUTO)
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Calculated automatically for laundry operating cost tracking.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-purple-900">
                      {computedCostPerUnit ? `Rs. ${computedCostPerUnit} / ${formUOM}` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: INVENTORY */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    4
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    📦 Inventory & Stock Controls
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Opening Stock */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Opening Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      disabled={isEditing}
                      value={formOpeningStock}
                      onChange={(e) => setFormOpeningStock(e.target.value)}
                      placeholder="e.g. 25.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                    />
                  </div>

                  {/* Current Stock */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Current Stock <span className="text-xs text-purple-600 font-bold">(AUTO)</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${formOpeningStock} ${formUOM}`}
                      className="w-full px-3.5 py-2.5 bg-purple-50/60 border border-purple-200 text-purple-900 font-black rounded-xl cursor-not-allowed"
                    />
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      step="any"
                      value={formReorderLevel}
                      onChange={(e) => setFormReorderLevel(e.target.value)}
                      placeholder="e.g. 10.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Max Stock Level */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Maximum Stock Level</label>
                    <input
                      type="number"
                      step="any"
                      value={formMaxStockLevel}
                      onChange={(e) => setFormMaxStockLevel(e.target.value)}
                      placeholder="e.g. 50.00"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formLowStockAlert}
                      onChange={(e) => setFormLowStockAlert(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="ml-3 font-bold text-gray-800 text-xs">Enable Low Stock Alert Notifications</span>
                  </label>
                </div>
              </div>

              {/* SECTION 5: CHEMICAL INFORMATION */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    5
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    🧪 Chemical & Dosage Specs
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Chemical Type with + button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700">Chemical Type</label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={formChemicalType}
                        onChange={(e) => setFormChemicalType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        {availableChemicalTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenAddOptionModal("CHEMICAL_TYPE")}
                        className="w-10 h-10 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-lg rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition active:scale-95"
                        title="Add New Chemical Type"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Usage Purpose with + button */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700">Usage Purpose</label>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={formUsagePurpose}
                        onChange={(e) => setFormUsagePurpose(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        {availableUsagePurposes.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenAddOptionModal("USAGE_PURPOSE")}
                        className="w-10 h-10 bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-lg rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition active:scale-95"
                        title="Add New Usage Purpose"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Dosage</label>
                    <input
                      type="number"
                      step="any"
                      value={formDosage}
                      onChange={(e) => setFormDosage(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Dosage Unit */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Dosage Unit</label>
                    <select
                      value={formDosageUnit}
                      onChange={(e) => setFormDosageUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                    >
                      {DOSAGE_UNITS.map((du) => (
                        <option key={du} value={du}>
                          {du}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 6: SAFETY & EXPIRY */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    6
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    ⚠️ Safety & Expiry Specifications
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsExpirable}
                      onChange={(e) => setFormIsExpirable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    <span className="ml-3 font-bold text-gray-800 text-xs">
                      Is Expirable Chemical Product?
                    </span>
                  </label>
                </div>

                {formIsExpirable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50/40 p-4 rounded-2xl border border-red-100">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={formExpiryDate}
                        onChange={(e) => setFormExpiryDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Batch Number</label>
                      <input
                        type="text"
                        value={formBatchNumber}
                        onChange={(e) => setFormBatchNumber(e.target.value)}
                        placeholder="e.g. BATCH-2026-001"
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Storage Instructions</label>
                    <textarea
                      rows={2}
                      value={formStorageInstructions}
                      onChange={(e) => setFormStorageInstructions(e.target.value)}
                      placeholder="e.g. Store in a cool and dry place..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Safety Instructions</label>
                    <textarea
                      rows={2}
                      value={formSafetyInstructions}
                      onChange={(e) => setFormSafetyInstructions(e.target.value)}
                      placeholder="e.g. Keep away from children. Avoid contact..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7: IDENTIFICATION & CODES */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                    7
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-wide">
                    🏷️ Barcode & SKU Identification
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Barcode</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formBarcode}
                        onChange={(e) => setFormBarcode(e.target.value)}
                        placeholder="Enter Barcode"
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={generateBarcode}
                        className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl whitespace-nowrap shadow-2xs transition"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={formSKU}
                      onChange={(e) => setFormSKU(e.target.value)}
                      placeholder="e.g. CHEM-001"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 8: STATUS & CONTROLS */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800">Status:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="ACTIVE"
                        checked={formStatus === "ACTIVE"}
                        onChange={() => setFormStatus("ACTIVE")}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-bold text-emerald-600">● Active</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="INACTIVE"
                        checked={formStatus === "INACTIVE"}
                        onChange={() => setFormStatus("INACTIVE")}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-bold text-gray-500">○ Inactive</span>
                    </label>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={formTrackInventory}
                      onChange={(e) => setFormTrackInventory(e.target.checked)}
                      className="rounded-md text-purple-600 focus:ring-purple-500"
                    />
                    <span>Track Inventory</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isEditing ? "Update Product" : "Save Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD DYNAMIC OPTION POPUP MODAL ==================== */}
      {isOptionModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-[#211033] to-[#4C1D95] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Plus className="w-4 h-4 text-purple-300" />
                <span>
                  Add New {optionModalType.replace("_", " ")}
                </span>
              </div>
              <button
                onClick={() => setIsOptionModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOption} className="p-6 space-y-4 text-xs">
              {optionModalType === "SUBCATEGORY" && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Parent Category</label>
                  <select
                    value={newOptionParentCategory}
                    onChange={(e) => setNewOptionParentCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {optionModalType.replace("_", " ")} Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder={`Enter new ${optionModalType.toLowerCase().replace("_", " ")} name...`}
                  className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOptionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOption}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  {submittingOption && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Option</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
