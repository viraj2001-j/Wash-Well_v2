"use client";

import { useState } from "react";
import {
  Plus,
  MapPin,
  X,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Map,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Navigation,
} from "lucide-react";

export interface RouteItem {
  id: string;
  code: string;
  name: string;
  area?: string | null;
  district?: string | null;
  province?: string | null;
  notes?: string | null;
  isActive: boolean;
  frequency?: string | null;
  customers?: Array<{ id: string }>;
}

interface RoutesClientProps {
  companyCode: string;
  companyId?: string;
  initialRoutes: RouteItem[];
}

export default function RoutesClient({
  companyCode,
  initialRoutes,
}: RoutesClientProps) {
  const [routes, setRoutes] = useState<RouteItem[]>(initialRoutes);
  
  // Drawer & Selection state
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Custom Confirmation Popups state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<RouteItem | null>(null);

  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [routeToToggleStatus, setRouteToToggleStatus] = useState<RouteItem | null>(null);

  // Modals & Active route state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);

  // View & Filter controls
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("TABLE");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Loading & Toast Feedback state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Drawer handlers
  const openDrawer = (route: RouteItem) => {
    setSelectedRoute(route);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRoute(null);
  };

  // Form State for Creation & Editing
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    area: "",
    district: "",
    province: "",
    notes: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      area: "",
      district: "",
      province: "",
      notes: "",
      isActive: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (route: RouteItem) => {
    setEditingRoute(route);
    setFormData({
      code: route.code || "",
      name: route.name || "",
      area: route.area || "",
      district: route.district || "",
      province: route.province || "",
      notes: route.notes || "",
      isActive: route.isActive ?? true,
    });
    setShowEditModal(true);
  };

  // Prompt & Confirm Delete
  const promptDeleteRoute = (route: RouteItem) => {
    setRouteToDelete(route);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/routes/${routeToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setRoutes(routes.filter((rt) => rt.id !== routeToDelete.id));
        if (selectedRoute?.id === routeToDelete.id) {
          closeDrawer();
        }
        setShowDeleteConfirmModal(false);
        showToast(`Route "${routeToDelete.name}" deleted successfully!`, "success");
        setRouteToDelete(null);
      } else {
        showToast(data.error || "Failed to delete route", "error");
      }
    } catch {
      showToast("Failed to delete route", "error");
    } finally {
      setLoading(false);
    }
  };

  // Prompt & Confirm Toggle Status (Activate / Inactivate)
  const promptToggleStatus = (route: RouteItem) => {
    setRouteToToggleStatus(route);
    setShowStatusConfirmModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!routeToToggleStatus) return;
    setLoading(true);
    const updatedStatus = !routeToToggleStatus.isActive;
    try {
      const res = await fetch(`/api/c/${companyCode}/routes/${routeToToggleStatus.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: updatedStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoutes(routes.map((rt) => (rt.id === routeToToggleStatus.id ? data.data : rt)));
        if (selectedRoute?.id === routeToToggleStatus.id) {
          setSelectedRoute(data.data);
        }
        setShowStatusConfirmModal(false);
        showToast(
          `Route "${routeToToggleStatus.name}" is now ${updatedStatus ? "ACTIVE" : "INACTIVE"}`,
          "success"
        );
        setRouteToToggleStatus(null);
      } else {
        showToast(data.error || "Failed to update route status", "error");
      }
    } catch {
      showToast("Failed to update route status", "error");
    } finally {
      setLoading(false);
    }
  };

  // Create Route
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeCode: formData.code,
          name: formData.name,
          area: formData.area,
          district: formData.district,
          province: formData.province,
          notes: formData.notes,
          isActive: formData.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoutes([...routes, data.data]);
        setShowCreateModal(false);
        resetForm();
        showToast(`Route "${data.data.code} - ${data.data.name}" created successfully!`, "success");
      } else {
        showToast(data.error || "Failed to create route", "error");
      }
    } catch {
      showToast("Failed to create route due to a network error", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update Route
  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/routes/${editingRoute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeCode: formData.code,
          name: formData.name,
          area: formData.area,
          district: formData.district,
          province: formData.province,
          notes: formData.notes,
          isActive: formData.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoutes(routes.map((rt) => (rt.id === editingRoute.id ? data.data : rt)));
        if (selectedRoute?.id === editingRoute.id) {
          setSelectedRoute(data.data);
        }
        setShowEditModal(false);
        setEditingRoute(null);
        resetForm();
        showToast("Route updated successfully!", "success");
      } else {
        showToast(data.error || "Failed to update route", "error");
      }
    } catch {
      showToast("Failed to update route", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filtered routes
  const filteredRoutes = routes.filter((rt) => {
    const matchesSearch =
      rt.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rt.area && rt.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rt.district && rt.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rt.province && rt.province.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && rt.isActive) ||
      (statusFilter === "INACTIVE" && !rt.isActive);

    return matchesSearch && matchesStatus;
  });

  // KPIs
  const totalRoutesCount = routes.length;
  const activeRoutesCount = routes.filter((r) => r.isActive).length;
  const uniqueDistrictsCount = new Set(
    routes.map((r) => r.district).filter(Boolean)
  ).size;
  const totalAssignedCustomers = routes.reduce(
    (acc, r) => acc + (r.customers?.length || 0),
    0
  );

  return (
    <div className="p-6 md:p-1 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Navigation className="w-6 h-6 text-[#7C3AED]" /> Permanent Routes
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure geographical delivery & pickup route zones, territory details, and assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "TABLE"
                  ? "bg-white text-[#7C3AED] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <List size={15} /> Table
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "GRID"
                  ? "bg-white text-[#7C3AED] shadow-xs"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <LayoutGrid size={15} /> Grid
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-200 transition"
          >
            <Plus size={16} /> Create New Route
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Routes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
              <Map size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{totalRoutesCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Active Territory Routes</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{activeRoutesCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Covered Districts</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Building2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{uniqueDistrictsCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Total Route Customers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{totalAssignedCustomers}</p>
        </div>
      </div>

      {/* SEARCH AND STATUS FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search code, name, area, district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50/80 border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-purple-400 focus:bg-white transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                statusFilter === tab
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab === "ALL" ? "All Routes" : tab === "ACTIVE" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT VIEW: TABLE VIEW */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-4">Route Code</th>
                  <th className="px-6 py-4">Route Name</th>
                  <th className="px-6 py-4">Area / Zone</th>
                  <th className="px-6 py-4">District</th>
                  <th className="px-6 py-4">Province / State</th>
                  <th className="px-6 py-4 text-center">Customers</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Description / Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((rt) => (
                    <tr
                      key={rt.id}
                      onClick={() => openDrawer(rt)}
                      className="hover:bg-purple-50/30 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center bg-[#F0EBFF] text-[#7C3AED] px-3 py-1 rounded-full text-xs font-extrabold">
                          {rt.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                        {rt.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {rt.area ? (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-purple-400" /> {rt.area}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap font-medium">
                        {rt.district || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap font-medium">
                        {rt.province || "-"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-[#7C3AED] px-2.5 py-0.5 rounded-full text-xs font-bold">
                          {rt.customers?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${
                            rt.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {rt.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {rt.notes || "-"}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(rt);
                            }}
                            className="p-2 text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition"
                            title="Edit Route"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteRoute(rt);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Delete Route"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400 text-xs">
                      No routes found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT VIEW: GRID CARD VIEW */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((rt) => (
              <div
                key={rt.id}
                onClick={() => openDrawer(rt)}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#7C3AED] bg-[#F0EBFF] px-3 py-1 rounded-full text-xs">
                      {rt.code}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                        rt.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {rt.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base">{rt.name}</h3>

                  <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <strong className="text-gray-700">Area:</strong> {rt.area || "-"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <strong className="text-gray-700">District:</strong> {rt.district || "-"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <strong className="text-gray-700">Province:</strong> {rt.province || "-"}
                    </div>
                  </div>

                  {rt.notes && (
                    <p className="text-xs text-gray-500 bg-purple-50/40 p-3 rounded-xl border border-purple-100/50 italic line-clamp-2">
                      "{rt.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-600 font-medium">
                    <Users className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Customers:</span>
                    <strong className="text-gray-900">{rt.customers?.length || 0}</strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(rt);
                      }}
                      className="p-2 text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition"
                      title="Edit Route"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        promptDeleteRoute(rt);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Delete Route"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-400 text-xs border border-gray-100">
              No routes found matching your criteria.
            </div>
          )}
        </div>
      )}

      {/* Toast Popup Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl text-white text-xs font-bold transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 border ${
            toast.type === "success"
              ? "bg-emerald-600 border-emerald-500 shadow-emerald-900/20"
              : "bg-red-600 border-red-500 shadow-red-900/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* CREATE ROUTE CARD / MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden my-auto border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Route & Territory Information</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Define geographical route details & coverage notes.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateRoute} className="p-6 space-y-4 text-xs">
              
              {/* Row 1: 3 input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Route Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. RT-001"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Route Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kandy North Beat"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Area / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Katugastota"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>
              </div>

              {/* Row 2: 3 input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Kandy"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Province / State</label>
                  <input
                    type="text"
                    placeholder="e.g. Central Province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.isActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "ACTIVE" })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Full Width: Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add optional route notes or coverage details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-md shadow-purple-200 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Create Route"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EDIT ROUTE CARD / MODAL */}
      {showEditModal && editingRoute && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden my-auto border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Edit Route & Territory</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Update coverage zone, territory info, and status.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateRoute} className="p-6 space-y-4 text-xs">
              
              {/* Row 1: 3 input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Route Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. RT-001"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Route Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kandy North Beat"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Area / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Katugastota"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>
              </div>

              {/* Row 2: 3 input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Kandy"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Province / State</label>
                  <input
                    type="text"
                    placeholder="e.g. Central Province"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.isActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "ACTIVE" })}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Full Width: Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add optional route notes or coverage details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-md shadow-purple-200 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ROUTE DETAIL SLIDE-OVER DRAWER */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={closeDrawer}
        />
      )}

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedRoute && (
          <>
            {/* Drawer Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">{selectedRoute.name}</h2>
                  <p className="text-xs text-[#7C3AED] font-bold">Code: {selectedRoute.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
              {/* Status & Key Stats Banner */}
              <div className="flex items-center justify-between bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
                <div>
                  <span className="text-gray-500 font-medium block text-[11px] mb-0.5">Route Status</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      selectedRoute.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {selectedRoute.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 font-medium block text-[11px] mb-0.5">Assigned Customers</span>
                  <span className="inline-flex items-center gap-1 bg-white text-[#7C3AED] px-3 py-1 rounded-full text-xs font-extrabold shadow-xs border border-purple-100">
                    <Users size={13} /> {selectedRoute.customers?.length || 0} Customers
                  </span>
                </div>
              </div>

              {/* Territory & Geographical Breakdown */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                <h4 className="font-extrabold text-gray-400 text-[11px] tracking-wider uppercase">
                  Territory Details
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                    <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-purple-500" /> Area / Zone:
                    </span>
                    <strong className="text-gray-900">{selectedRoute.area || "-"}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                    <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-sky-500" /> District:
                    </span>
                    <strong className="text-gray-900">{selectedRoute.district || "-"}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                      <Map className="w-3.5 h-3.5 text-indigo-500" /> Province / State:
                    </span>
                    <strong className="text-gray-900">{selectedRoute.province || "-"}</strong>
                  </div>
                </div>
              </div>

              {/* Description & Notes */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <h4 className="font-extrabold text-gray-400 text-[11px] tracking-wider uppercase">
                  Description & Coverage Notes
                </h4>
                <p className="text-gray-700 leading-relaxed italic bg-white p-3 rounded-xl border border-gray-200/70">
                  {selectedRoute.notes || "No notes added for this route."}
                </p>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-5 border-t border-gray-100 flex items-center gap-2 bg-gray-50/90 shrink-0">
              <button
                type="button"
                onClick={() => openEditModal(selectedRoute)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-100 text-[#7C3AED] hover:bg-purple-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Edit2 size={14} /> Edit Route
              </button>

              <button
                type="button"
                onClick={() => promptToggleStatus(selectedRoute)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs ${
                  selectedRoute.isActive
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                }`}
              >
                {selectedRoute.isActive ? "Inactivate" : "Activate"}
              </button>

              <button
                type="button"
                onClick={() => promptDeleteRoute(selectedRoute)}
                className="py-2.5 px-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* DELETE CONFIRMATION POPUP MODAL */}
      {showDeleteConfirmModal && routeToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Delete Route</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete route <strong className="text-gray-800">"{routeToDelete.name}"</strong> ({routeToDelete.code})? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setRouteToDelete(null);
                }}
                className="px-5 py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={confirmDeleteRoute}
                className="px-5 py-2.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-200 transition flex-1 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "OK / Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE CONFIRMATION POPUP MODAL */}
      {showStatusConfirmModal && routeToToggleStatus && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                routeToToggleStatus.isActive
                  ? "bg-amber-100 text-amber-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {routeToToggleStatus.isActive ? "Inactivate Route" : "Activate Route"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to {routeToToggleStatus.isActive ? "inactivate" : "activate"} route{" "}
                <strong className="text-gray-800">"{routeToToggleStatus.name}"</strong> ({routeToToggleStatus.code})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowStatusConfirmModal(false);
                  setRouteToToggleStatus(null);
                }}
                className="px-5 py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={confirmToggleStatus}
                className={`px-5 py-2.5 text-xs text-white font-bold rounded-xl shadow-md transition flex-1 disabled:opacity-50 ${
                  routeToToggleStatus.isActive
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                }`}
              >
                {loading
                  ? "Updating..."
                  : routeToToggleStatus.isActive
                  ? "OK / Inactivate"
                  : "OK / Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
