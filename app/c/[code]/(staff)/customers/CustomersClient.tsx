"use client";

import { useState } from "react";
import {
  Users, Plus, Search, MapPin, Phone, Mail, X, History, FileText,
  Navigation, Crosshair, Image as ImageIcon, CreditCard, Building2,
  Trash2, CheckCircle2, AlertCircle, Camera, ExternalLink, ShoppingBag,
  Edit3, Power
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CustomersClientProps {
  companyCode: string;
  companyId: string;
  initialCustomers: any[];
  routes: any[];
  initialBusinessTypes?: any[];
}

const CUSTOMER_TYPE_OPTIONS = [
  { label: "Cash", value: "Cash" },
  { label: "Credit", value: "Credit" },
  { label: "Discount", value: "Discount" },
  { label: "Bill To Bill", value: "Bill To Bill" },
  { label: "Agreement", value: "Agreement" },
  { label: "Cheque", value: "Cheque" },
];

export default function CustomersClient({
  companyCode,
  companyId,
  initialCustomers,
  routes,
  initialBusinessTypes = [],
}: CustomersClientProps) {
  const supabase = createClient();

  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [businessTypes, setBusinessTypes] = useState<any[]>(
    initialBusinessTypes.length > 0
      ? initialBusinessTypes
      : [
          { id: "bt-1", name: "Hotel" },
          { id: "bt-2", name: "Restaurant" },
          { id: "bt-3", name: "Office" },
          { id: "bt-4", name: "Hospital" },
          { id: "bt-5", name: "School" },
          { id: "bt-6", name: "Hostel" },
          { id: "bt-7", name: "Other" },
        ]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddBusinessTypeModal, setShowAddBusinessTypeModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddingBusinessType, setIsAddingBusinessType] = useState(false);
  const [newBusinessTypeName, setNewBusinessTypeName] = useState("");
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState("");

  // Customer Form State
  const [placeName, setPlaceName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedBusinessTypeId, setSelectedBusinessTypeId] = useState("");
  const [customerType, setCustomerType] = useState("Cash");
  const [creditLimit, setCreditLimit] = useState("");
  const [creditPeriodDays, setCreditPeriodDays] = useState("");
  const [gpsLatitude, setGpsLatitude] = useState("");
  const [gpsLongitude, setGpsLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [routeId, setRouteId] = useState("");
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "INACTIVATE" | "ACTIVATE" | "DELETE";
    customer: any;
  } | null>(null);

  // Open Edit Customer Modal
  const openEditCustomerModal = (cust: any) => {
    setPlaceName(cust.placeName || "");
    setName(cust.name || "");
    setPhone(cust.phone || "");
    setEmail(cust.email || "");
    setSelectedBusinessTypeId(cust.businessTypeId || "");
    setCustomerType(cust.customerType || cust.paymentTerms || "Cash");
    setCreditLimit(cust.creditLimit ? String(cust.creditLimit) : "");
    setCreditPeriodDays(cust.creditPeriodDays ? String(cust.creditPeriodDays) : "");
    setGpsLatitude(cust.gpsLatitude ? String(cust.gpsLatitude) : "");
    setGpsLongitude(cust.gpsLongitude ? String(cust.gpsLongitude) : "");
    setAddress(cust.address || cust.addresses?.[0]?.address || "");
    setCity(cust.city || cust.addresses?.[0]?.city || "");
    setRouteId(cust.routeLinks?.[0]?.routeId || "");
    setShopPhotos(cust.shopPhotos || []);
    setEditingCustomer(cust);
  };

  // Submit Edit Customer Form
  const handleUpdateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!name || !name.trim()) {
      showToast("Customer name is required", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          placeName,
          phone,
          email,
          businessTypeId: selectedBusinessTypeId,
          customerType,
          creditLimit,
          creditPeriodDays,
          gpsLatitude,
          gpsLongitude,
          address,
          city,
          routeId,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update customer");
      }

      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? data.data : c))
      );
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(data.data);
      }
      showToast(data.message || "Customer updated successfully!", "success");
      setEditingCustomer(null);
    } catch (err: any) {
      console.error("Update customer error:", err);
      showToast(err.message || "Failed to update customer", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Confirmed Actions (Inactivate / Activate / Delete)
  const handleExecuteConfirmedAction = async () => {
    if (!confirmModal || !confirmModal.customer) return;
    const targetCust = confirmModal.customer;
    setLoading(true);

    try {
      if (confirmModal.type === "DELETE") {
        const res = await fetch(`/api/c/${companyCode}/customers/${targetCust.id}`, {
          method: "DELETE",
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to delete customer");
        }

        setCustomers((prev) => prev.filter((c) => c.id !== targetCust.id));
        if (selectedCustomer?.id === targetCust.id) {
          setSelectedCustomer(null);
        }
        showToast(data.message || "Customer deleted successfully!", "success");
      } else {
        const newActive = confirmModal.type === "ACTIVATE";
        const res = await fetch(`/api/c/${companyCode}/customers/${targetCust.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: newActive }),
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update status");
        }

        setCustomers((prev) =>
          prev.map((c) => (c.id === targetCust.id ? { ...c, isActive: newActive } : c))
        );
        if (selectedCustomer?.id === targetCust.id) {
          setSelectedCustomer((prev: any) => ({ ...prev, isActive: newActive }));
        }
        showToast(data.message || `Customer status updated successfully!`, "success");
      }
      setConfirmModal(null);
    } catch (err: any) {
      console.error("Execute action error:", err);
      showToast(err.message || "Failed to execute action", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter Customers
  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.placeName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.customerNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || "").includes(searchQuery)
  );

  // GPS Recapture Handler
  const handleRecaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatusMsg("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGPS(true);
    setGpsStatusMsg("Capturing live GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLatitude(pos.coords.latitude.toFixed(7));
        setGpsLongitude(pos.coords.longitude.toFixed(7));
        setIsLocatingGPS(false);
        setGpsStatusMsg("📍 Live GPS coordinates captured successfully!");
        setTimeout(() => setGpsStatusMsg(""), 4000);
      },
      (err) => {
        setIsLocatingGPS(false);
        setGpsStatusMsg(`Failed to capture GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Image Compression helper for base64 uploads
  const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          } else {
            resolve((e.target?.result as string) || "");
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || "");
        img.src = (e.target?.result as string) || "";
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // Photo Upload Handler (Supports Supabase storage with compressed base64 fallback)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const newPhotoUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `shop_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Attempt Supabase storage bucket upload
        const { data, error } = await supabase.storage
          .from("shop-photos")
          .upload(fileName, file);

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from("shop-photos")
            .getPublicUrl(fileName);
          newPhotoUrls.push(publicUrlData.publicUrl);
        } else {
          // Compressed Base64 Data URL Fallback
          const compressedDataUrl = await compressImage(file);
          if (compressedDataUrl) {
            newPhotoUrls.push(compressedDataUrl);
          }
        }
      } catch {
        // Compressed Base64 Data URL Fallback
        const compressedDataUrl = await compressImage(file);
        if (compressedDataUrl) {
          newPhotoUrls.push(compressedDataUrl);
        }
      }
    }

    setShopPhotos((prev) => [...prev, ...newPhotoUrls]);
    setIsUploadingPhoto(false);
  };

  // Remove Photo from Preview Gallery
  const handleRemovePhoto = (index: number) => {
    setShopPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Business Type Handler (Popup + Auto-Select)
  const handleAddBusinessType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessTypeName.trim()) return;

    setIsAddingBusinessType(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/business-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBusinessTypeName.trim() }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const newBt = data.data;
        setBusinessTypes((prev) => {
          if (prev.some((b) => b.id === newBt.id || b.name.toLowerCase() === newBt.name.toLowerCase())) {
            return prev;
          }
          return [...prev, newBt];
        });
        setSelectedBusinessTypeId(newBt.id);
        setNewBusinessTypeName("");
        setShowAddBusinessTypeModal(false);
      } else {
        // Local fallback if API route fails
        const fallbackBt = { id: `bt_${Date.now()}`, name: newBusinessTypeName.trim() };
        setBusinessTypes((prev) => [...prev, fallbackBt]);
        setSelectedBusinessTypeId(fallbackBt.id);
        setNewBusinessTypeName("");
        setShowAddBusinessTypeModal(false);
      }
    } catch {
      const fallbackBt = { id: `bt_${Date.now()}`, name: newBusinessTypeName.trim() };
      setBusinessTypes((prev) => [...prev, fallbackBt]);
      setSelectedBusinessTypeId(fallbackBt.id);
      setNewBusinessTypeName("");
      setShowAddBusinessTypeModal(false);
    } finally {
      setIsAddingBusinessType(false);
    }
  };

  // Create Customer Form Submission
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedBt = businessTypes.find((b) => b.id === selectedBusinessTypeId);
      const isRealDbId = selectedBusinessTypeId && !selectedBusinessTypeId.startsWith("bt_");

      const res = await fetch(`/api/c/${companyCode}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          placeName: placeName || null,
          phone: phone || null,
          email: email || null,
          customerType,
          paymentTerms: customerType,
          creditLimit: customerType === "Credit" && creditLimit ? parseFloat(creditLimit) : null,
          creditPeriodDays: customerType === "Credit" && creditPeriodDays ? parseInt(creditPeriodDays) : null,
          businessTypeId: isRealDbId ? selectedBusinessTypeId : null,
          businessType: selectedBt?.name || null,
          gpsLatitude: gpsLatitude || null,
          gpsLongitude: gpsLongitude || null,
          shopPhotos,
          address: address || null,
          city: city || null,
          routeId: routeId || null,
        }),
      });

      let data: any;
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch {
        throw new Error("Failed to parse server response. Please try with fewer or smaller shop photos.");
      }

      if (data.success) {
        setCustomers([data.data, ...customers]);
        setShowCreateModal(false);
        // Reset form
        setPlaceName("");
        setName("");
        setPhone("");
        setEmail("");
        setSelectedBusinessTypeId("");
        setCustomerType("Cash");
        setCreditLimit("");
        setCreditPeriodDays("");
        setGpsLatitude("");
        setGpsLongitude("");
        setAddress("");
        setCity("");
        setRouteId("");
        setShopPhotos([]);
        showToast("Customer created successfully!", "success");
      } else {
        showToast(data.error || "Failed to create customer", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create customer", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Customer Directory</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Manage customer shop profiles, billing terms, location GPS & route assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus size={14} /> Add New Customer
        </button>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search size={14} className="text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, shop / place name, customer # or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* CUSTOMERS TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 font-extrabold tracking-wider border-b border-gray-100">
                <th className="py-4 px-5">ID & Shop / Place</th>
                <th className="py-4 px-5">Customer Name</th>
                <th className="py-4 px-5">Category & Terms</th>
                <th className="py-4 px-5">Phone</th>
                <th className="py-4 px-5">Assigned Route</th>
                <th className="py-4 px-5 text-center">Orders</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-purple-50/40 cursor-pointer transition"
                  >
                    <td className="py-4 px-5">
                      <div className="space-y-0.5">
                        <span className="font-black text-[#7C3AED] text-xs bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {cust.customerNo}
                        </span>
                        {cust.placeName && (
                          <p className="font-extrabold text-gray-900 mt-1">{cust.placeName}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-gray-800">
                      {cust.name}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800 w-fit">
                          {cust.customerType || cust.paymentTerms || "Cash"}
                        </span>
                        {(cust.businessTypeRef?.name || cust.businessType) && (
                          <span className="text-[10px] text-gray-500 font-bold">
                            🏭 {cust.businessTypeRef?.name || cust.businessType}
                          </span>
                        )}
                        {cust.customerType === "Credit" && cust.creditLimit && (
                          <span className="text-[10px] text-emerald-700 font-bold">
                            💳 Limit: Rs.{Number(cust.creditLimit).toLocaleString()} ({cust.creditPeriodDays || 0}d)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-700 font-semibold">{cust.phone || "-"}</td>
                    <td className="py-4 px-5 text-gray-600 font-medium">
                      {cust.routeLinks?.[0]?.route ? (
                        <span className="inline-flex items-center gap-1 font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100">
                          {cust.routeLinks[0].route.code} - {cust.routeLinks[0].route.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-center font-black text-gray-900">
                      {cust.orders?.length || 0}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-[#7C3AED] font-bold rounded-xl text-xs transition"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 my-auto">
            
            {/* Modal Header */}
            <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Building2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Add New Customer Account</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Register a shop customer, billing terms & GPS location</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
              <form id="createCustomerForm" onSubmit={handleCreateCustomer} className="space-y-6">
                
                {/* 1. SHOP & BASIC INFORMATION */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Shop & Basic Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Place Name / Shop Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Royal Laundry Shop / Outlet 01"
                        value={placeName}
                        onChange={(e) => setPlaceName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sunil Perera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="0771234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="info@shop.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      />
                    </div>
                  </div>

                  {/* Business Type Selector with (+) Add Popup Button */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Business Type / Category</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedBusinessTypeId}
                        onChange={(e) => setSelectedBusinessTypeId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      >
                        <option value="">-- Select Business Type --</option>
                        {businessTypes.map((bt) => (
                          <option key={bt.id} value={bt.id}>
                            {bt.name}
                          </option>
                        ))}
                      </select>

                      {/* (+) Popup Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setShowAddBusinessTypeModal(true)}
                        className="px-3 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-extrabold text-sm transition shrink-0 flex items-center gap-1 shadow-xs"
                        title="Create New Business Type"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add Type
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. CUSTOMER TYPE / BILLING TERMS */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Customer Type & Payment Terms
                  </h4>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-700">Select Customer Type / Terms</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {CUSTOMER_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCustomerType(opt.value)}
                          className={`p-3 rounded-2xl border text-xs font-extrabold transition flex items-center justify-between ${
                            customerType === opt.value
                              ? "bg-purple-50 text-[#7C3AED] border-[#7C3AED] shadow-2xs"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {customerType === opt.value && <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />}
                        </button>
                      ))}
                    </div>

                    {/* Conditional Input Fields for CREDIT */}
                    {customerType === "Credit" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 animate-in fade-in duration-200 mt-3">
                        <div>
                          <label className="block text-xs font-bold text-purple-900 mb-1">Credit Limit Amount (LKR) *</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 50000"
                            value={creditLimit}
                            onChange={(e) => setCreditLimit(e.target.value)}
                            className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-xs outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 font-bold transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-purple-900 mb-1">Credit Valid Period (Days) *</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 30"
                            value={creditPeriodDays}
                            onChange={(e) => setCreditPeriodDays(e.target.value)}
                            className="w-full p-2.5 bg-white border border-purple-300 rounded-xl text-xs outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 font-bold transition"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. SHOP LOCATION & GPS RECAPTURE */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                    <h4 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Shop Location & Live GPS
                    </h4>
                    <button
                      type="button"
                      onClick={handleRecaptureGPS}
                      disabled={isLocatingGPS}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${isLocatingGPS ? "animate-spin" : ""}`} />
                      {isLocatingGPS ? "Capturing..." : "Recapture GPS"}
                    </button>
                  </div>

                  {gpsStatusMsg && (
                    <div className="p-2.5 bg-sky-50 text-sky-800 rounded-xl text-xs font-bold border border-sky-200 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{gpsStatusMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">GPS Latitude</label>
                      <input
                        type="text"
                        placeholder="e.g. 6.9270786"
                        value={gpsLatitude}
                        onChange={(e) => setGpsLatitude(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 font-mono transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">GPS Longitude</label>
                      <input
                        type="text"
                        placeholder="e.g. 79.8612430"
                        value={gpsLongitude}
                        onChange={(e) => setGpsLongitude(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 font-mono transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Shop Address</label>
                      <input
                        type="text"
                        placeholder="Street address, shop number, road..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">City / Town</label>
                      <input
                        type="text"
                        placeholder="Colombo"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. SHOP PHOTOS & GALLERY PREVIEW */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Shop Photos & Gallery Preview
                  </h4>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2.5 bg-white border border-gray-300 hover:border-purple-500 text-gray-700 font-extrabold text-xs rounded-xl cursor-pointer transition flex items-center gap-2 shadow-2xs">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <span>{isUploadingPhoto ? "Uploading..." : "Upload Shop Photos"}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-gray-400">Upload one or more shop photos</span>
                    </div>

                    {/* Preview Gallery Grid */}
                    {shopPhotos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {shopPhotos.map((photoUrl, idx) => (
                          <div key={idx} className="relative group rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 shadow-2xs">
                            {/* eslint-disable-next-html-extension/no-img-element */}
                            <img
                              src={photoUrl}
                              alt={`Shop photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition"
                              title="Remove photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. ROUTE SELECTION */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <h4 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-2">
                    <Navigation className="w-4 h-4" /> Assign Permanent Route
                  </h4>

                  <select
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition font-bold"
                  >
                    <option value="">-- Select Route --</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name} ({r.area || r.district || "Default Area"})
                      </option>
                    ))}
                  </select>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="createCustomerForm"
                disabled={loading}
                className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-extrabold text-xs shadow-md shadow-purple-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Saving Customer..." : "Create Customer Account"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD NEW BUSINESS TYPE */}
      {showAddBusinessTypeModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddBusinessType}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-gray-100 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#7C3AED]" /> Create Business Type
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBusinessTypeModal(false)}
                className="w-7 h-7 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Business Type Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Laundry Agent / Salon / Spa"
                value={newBusinessTypeName}
                onChange={(e) => setNewBusinessTypeName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-purple-500 focus:bg-white transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddBusinessTypeModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingBusinessType}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              >
                {isAddingBusinessType ? "Saving..." : "Save & Select"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOMER PROFILE DETAIL SLIDE-OVER DRAWER */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <Building2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#7C3AED] text-[11px] bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200">
                      {selectedCustomer.customerNo}
                    </span>
                    {(selectedCustomer.businessTypeRef?.name || selectedCustomer.businessType) && (
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                        {selectedCustomer.businessTypeRef?.name || selectedCustomer.businessType}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight mt-1">{selectedCustomer.name}</h2>
                  {selectedCustomer.placeName && (
                    <p className="text-xs font-bold text-gray-600 flex items-center gap-1 mt-0.5">
                      <span>🏪</span> {selectedCustomer.placeName}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
              
              {/* Summary KPIs Banner */}
              <div className="grid grid-cols-2 gap-3 bg-gradient-to-br from-purple-50/70 to-purple-50/20 p-4 rounded-2xl border border-purple-100">
                <div className="space-y-1">
                  <span className="text-[11px] text-gray-500 font-bold block">Payment Terms</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-[#7C3AED] text-white shadow-2xs">
                    {selectedCustomer.customerType || selectedCustomer.paymentTerms || "Cash"}
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[11px] text-gray-500 font-bold block">Total Orders</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-white text-purple-900 border border-purple-200 shadow-2xs">
                    <ShoppingBag size={13} className="text-[#7C3AED]" />
                    {selectedCustomer.orders?.length || 0} Orders
                  </span>
                </div>

                {selectedCustomer.customerType === "Credit" && selectedCustomer.creditLimit && (
                  <div className="col-span-2 pt-2 border-t border-purple-100/60 flex items-center justify-between">
                    <span className="text-gray-600 font-bold flex items-center gap-1 text-[11px]">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Credit Limit & Terms:
                    </span>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      LKR {Number(selectedCustomer.creditLimit).toLocaleString()} ({selectedCustomer.creditPeriodDays || 0} Days)
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Information Card */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-3">
                <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#7C3AED]" /> Contact Information
                </h4>
                <div className="space-y-2.5 font-medium text-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-purple-500" /> Phone:
                    </span>
                    {selectedCustomer.phone ? (
                      <a href={`tel:${selectedCustomer.phone}`} className="font-extrabold text-[#7C3AED] hover:underline flex items-center gap-1">
                        {selectedCustomer.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" /> Email:
                    </span>
                    {selectedCustomer.email ? (
                      <a href={`mailto:${selectedCustomer.email}`} className="font-bold text-gray-800 hover:underline">
                        {selectedCustomer.email}
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-gray-500 flex items-center gap-2 shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> Address:
                    </span>
                    <span className="font-bold text-gray-900 text-right">
                      {selectedCustomer.address || selectedCustomer.addresses?.[0]?.address || "No address specified"}
                      {selectedCustomer.city && `, ${selectedCustomer.city}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location & GPS Recapture Card */}
              {selectedCustomer.gpsLatitude && selectedCustomer.gpsLongitude && (
                <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sky-900 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-sky-600" /> Live GPS Coordinates
                    </h4>
                    <a
                      href={`https://www.google.com/maps?q=${selectedCustomer.gpsLatitude},${selectedCustomer.gpsLongitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs transition"
                    >
                      <ExternalLink size={11} /> Open Map
                    </a>
                  </div>
                  <p className="text-sky-800 font-mono font-bold text-xs bg-white px-3 py-2 rounded-xl border border-sky-200">
                    📍 {selectedCustomer.gpsLatitude}, {selectedCustomer.gpsLongitude}
                  </p>
                </div>
              )}

              {/* Assigned Route Card */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2">
                <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-purple-500" /> Assigned Permanent Route
                </h4>
                {selectedCustomer.routeLinks?.[0]?.route ? (
                  <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <span className="font-black text-[#7C3AED] block">
                        {selectedCustomer.routeLinks[0].route.code} - {selectedCustomer.routeLinks[0].route.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {selectedCustomer.routeLinks[0].route.area || selectedCustomer.routeLinks[0].route.district || "Default Area"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-extrabold text-[10px] rounded-md">
                      ACTIVE ROUTE
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-400 italic bg-white p-3 rounded-xl border border-gray-200/70">
                    No route currently assigned to this customer account.
                  </p>
                )}
              </div>

              {/* Shop Photos Gallery */}
              {selectedCustomer.shopPhotos && selectedCustomer.shopPhotos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-500" /> Shop Gallery ({selectedCustomer.shopPhotos.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedCustomer.shopPhotos.map((photoUrl: string, idx: number) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 shadow-2xs">
                        {/* eslint-disable-next-html-extension/no-img-element */}
                        <img src={photoUrl} alt={`Shop photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition font-bold text-[10px] gap-1"
                        >
                          <ExternalLink size={12} /> View Full
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-gray-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#7C3AED]" /> Recent Orders History ({selectedCustomer.orders?.length || 0})
                  </h4>
                </div>

                {!selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 font-bold bg-gray-50/70 rounded-2xl border border-gray-100">
                    No recent order history found for this customer.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedCustomer.orders.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-3 bg-white hover:bg-purple-50/30 rounded-2xl border border-gray-200/80 flex items-center justify-between transition shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-purple-900">{ord.orderNo}</span>
                            <span
                              className={`px-2 py-0.5 text-[9px] font-black rounded-md ${
                                ord.status === "COMPLETED" || ord.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : ord.status === "REJECTED" || ord.status === "CANCELLED"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {ord.status}
                            </span>
                          </div>
                          {ord.createdAt && (
                            <span className="block text-[10px] text-gray-400 font-medium">
                              {new Date(ord.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-gray-900 text-xs block">
                            Rs.{Number(ord.grandTotal || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Sticky Drawer Footer with Working Edit, Inactivate & Delete Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/90 shrink-0 flex flex-wrap items-center justify-between gap-2">
              {selectedCustomer.phone ? (
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="py-2.5 px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Phone size={14} /> Call
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => openEditCustomerModal(selectedCustomer)}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Edit3 size={14} /> Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: selectedCustomer.isActive !== false ? "INACTIVATE" : "ACTIVATE",
                    customer: selectedCustomer,
                  })
                }
                className={`py-2.5 px-3 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                  selectedCustomer.isActive !== false
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Power size={14} />
                {selectedCustomer.isActive !== false ? "Inactivate" : "Activate"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: "DELETE",
                    customer: selectedCustomer,
                  })
                }
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Trash2 size={14} /> Delete
              </button>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition shadow-2xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP OK MODAL (FOR DELETE & INACTIVATE) */}
      {confirmModal?.isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === "DELETE"
                    ? "bg-rose-100 text-rose-600"
                    : confirmModal.type === "INACTIVATE"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {confirmModal.type === "DELETE" ? (
                  <Trash2 size={24} />
                ) : (
                  <AlertCircle size={24} />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {confirmModal.type === "DELETE"
                    ? "Delete Customer Account?"
                    : confirmModal.type === "INACTIVATE"
                    ? "Inactivate Customer Account?"
                    : "Activate Customer Account?"}
                </h3>
                <p className="text-xs text-gray-500 font-bold mt-0.5">
                  {confirmModal.customer?.name} ({confirmModal.customer?.customerNo})
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/70 text-xs text-gray-700 leading-relaxed font-medium">
              {confirmModal.type === "DELETE"
                ? `Are you sure you want to permanently delete customer '${confirmModal.customer?.name}' (${confirmModal.customer?.customerNo})? This action cannot be undone.`
                : confirmModal.type === "INACTIVATE"
                ? `Are you sure you want to inactivate customer '${confirmModal.customer?.name}' (${confirmModal.customer?.customerNo})?`
                : `Are you sure you want to reactivate customer '${confirmModal.customer?.name}' (${confirmModal.customer?.customerNo})?`}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer ${
                  confirmModal.type === "DELETE"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                    : confirmModal.type === "INACTIVATE"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>OK, Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editingCustomer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingCustomer(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Edit Customer Account
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">
                    {editingCustomer.name} ({editingCustomer.customerNo})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomerSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Place / Hotel Name
                  </label>
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    {CUSTOMER_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Assigned Permanent Route
                  </label>
                  <select
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  >
                    <option value="">-- No Permanent Route --</option>
                    {routes.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name} ({r.area || r.district || "Default Area"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Primary Delivery Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-200 transition flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
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
