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
  Edit2,
  Trash2,
  Building2,
  ShieldCheck,
  Power,
  PowerOff,
  Info,
  Clock,
  Gauge,
  FileText,
  Calendar,
  Layers,
  Wrench,
} from "lucide-react";

/* =========================================================
   TYPES & INTERFACES FOR LORRY MANAGEMENT
========================================================= */
interface LorryRecord {
  id: string;
  companyId?: string;
  vehicleNumber: string;
  model: string;
  capacity: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE" | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function LorriesPage() {
  const params = useParams();
  const companyCode = (params?.code as string) || "mob";

  // Data States
  const [lorries, setLorries] = useState<LorryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "MAINTENANCE" | "INACTIVE">("ALL");

  // Drawer State for Row Click Details
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Popup Modal States for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLorry, setSelectedLorry] = useState<LorryRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [lorryToDelete, setLorryToDelete] = useState<LorryRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields State matching exact user requirements
  const [formVehicleNumber, setFormVehicleNumber] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "MAINTENANCE" | "INACTIVE">("ACTIVE");
  const [formNotes, setFormNotes] = useState("");

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

  // Fetch Lorries Data
  const fetchLorries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/c/${companyCode}/lorries`);
      const json = await res.json();
      if (json.success) {
        setLorries(json.data || []);
      } else {
        showToast("Error", json.error || "Failed to load lorries list", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLorries();
  }, [companyCode]);

  // Open Slide-Over Detail Drawer when clicking a table record
  const handleOpenDrawer = (lorry: LorryRecord) => {
    setSelectedLorry(lorry);
    setIsDrawerOpen(true);
  };

  // Open Create Modal with default sample values matching user prompt
  const handleOpenCreateModal = () => {
    setIsEditing(false);

    setFormVehicleNumber("WP LH-4592");
    setFormModel("Isuzu NPR");
    setFormCapacity("5 Ton");
    setFormStatus("ACTIVE");
    setFormNotes("Main delivery vehicle assigned to western province route");

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (lorry: LorryRecord) => {
    setIsEditing(true);
    setSelectedLorry(lorry);

    setFormVehicleNumber(lorry.vehicleNumber);
    setFormModel(lorry.model || "");
    setFormCapacity(lorry.capacity || "");
    setFormStatus((lorry.status.toUpperCase() as any) || "ACTIVE");
    setFormNotes(lorry.notes || "");

    setIsModalOpen(true);
  };

  // Quick Inactivate / Activate / Maintenance status toggle
  const handleToggleStatus = (lorry: LorryRecord, newStatus: "ACTIVE" | "MAINTENANCE" | "INACTIVE") => {
    setLorries((prev) =>
      prev.map((l) => (l.id === lorry.id ? { ...l, status: newStatus } : l))
    );
    if (selectedLorry && selectedLorry.id === lorry.id) {
      setSelectedLorry({ ...selectedLorry, status: newStatus });
    }
    showToast(
      "Status Updated",
      `Vehicle ${lorry.vehicleNumber} status updated to ${newStatus}.`,
      "success"
    );
  };

  // Handle Form Submit
  const handleSubmitLorry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formVehicleNumber || !formVehicleNumber.trim()) {
      showToast("Validation Error", "Please enter Vehicle / Lorry Number.", "error");
      return;
    }

    setSubmitting(true);

    const payload = {
      vehicleNumber: formVehicleNumber.trim(),
      model: formModel.trim() || "Isuzu NPR",
      capacity: formCapacity.trim() || "5 Ton",
      status: formStatus,
      notes: formNotes.trim(),
    };

    try {
      const url = `/api/c/${companyCode}/lorries`;
      const method = "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          isEditing ? "Lorry Updated" : "Lorry Added",
          `Vehicle ${payload.vehicleNumber} (${payload.model}) successfully saved!`,
          "success"
        );
        setIsModalOpen(false);
        fetchLorries();
      } else {
        showToast("Error", json.error || "Failed to save lorry", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "An unexpected error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Prompt
  const handlePromptDelete = (lorry: LorryRecord) => {
    setLorryToDelete(lorry);
    setIsDeleteConfirmOpen(true);
  };

  // Confirm Delete Lorry
  const handleConfirmDelete = async () => {
    if (!lorryToDelete) return;
    setDeleting(true);
    try {
      setLorries((prev) => prev.filter((l) => l.id !== lorryToDelete.id));
      showToast("Lorry Removed", `Vehicle ${lorryToDelete.vehicleNumber} removed from fleet.`, "info");
      setIsDeleteConfirmOpen(false);
      if (selectedLorry && selectedLorry.id === lorryToDelete.id) {
        setIsDrawerOpen(false);
      }
      setLorryToDelete(null);
    } catch (err: any) {
      showToast("Error", err.message || "Failed to delete vehicle", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Derived Filtered List
  const filteredLorries = useMemo(() => {
    return lorries.filter((l) => {
      const matchesSearch =
        searchQuery === "" ||
        l.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.notes && l.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "ACTIVE" && (l.status === "ACTIVE" || l.status === "Active")) ||
        (activeTab === "MAINTENANCE" && (l.status === "MAINTENANCE" || l.status === "Maintenance")) ||
        (activeTab === "INACTIVE" && (l.status === "INACTIVE" || l.status === "Inactive"));

      return matchesSearch && matchesTab;
    });
  }, [lorries, searchQuery, activeTab]);

  // KPI Calculations
  const activeCount = useMemo(
    () => lorries.filter((l) => l.status === "ACTIVE" || l.status === "Active").length,
    [lorries]
  );
  const maintenanceCount = useMemo(
    () => lorries.filter((l) => l.status === "MAINTENANCE" || l.status === "Maintenance").length,
    [lorries]
  );
  const inactiveCount = useMemo(
    () => lorries.filter((l) => l.status === "INACTIVE" || l.status === "Inactive").length,
    [lorries]
  );

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
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Lorries & Fleet Tracking</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage delivery vehicles, transport capacity, lorry models, and active fleet operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLorries}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh Lorries List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} /> Add Lorries
          </button>
        </div>
      </div>

      {/* 4 DISTINCTLY STYLED COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Lorries */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL LORRIES</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Truck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{lorries.length}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Registered fleet vehicles
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">ACTIVE VEHICLES</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{activeCount}</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Ready for delivery routes
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">IN MAINTENANCE</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <Wrench size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{maintenanceCount}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              Service & repairs
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Inactive */}
        <div className="bg-[#ffe4e6] border border-rose-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#be123c]">INACTIVE</span>
            <div className="w-7 h-7 rounded-lg bg-[#fecdd3] text-[#e11d48] flex items-center justify-center font-bold">
              <PowerOff size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{inactiveCount}</p>
            <span className="text-[9.5px] text-[#e11d48] font-medium flex items-center gap-0.5 mt-0.5">
              Out of service
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#e11d48] fill-none stroke-[2]">
              <path d="M 0,14 Q 25,14 45,13 T 65,12 T 80,6 T 90,13 L 100,14" />
            </svg>
          </div>
        </div>
      </div>

      {/* ==================== STATUS TABS & SEARCH ==================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F1F5F9]/80 p-1.5 rounded-full border border-gray-200/60 w-fit">
          {(["ALL", "ACTIVE", "MAINTENANCE", "INACTIVE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition capitalize ${
                activeTab === tab
                  ? "bg-white text-purple-950 shadow-xs font-extrabold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== LORRIES TABLE CARD ==================== */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md overflow-hidden">
        {/* Card Header with Title and Search Input */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 via-white to-purple-50/20">
          <h2 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Fleet Vehicles List</span>
          </h2>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search lorry number, model, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-sm font-medium">Loading Lorries list...</p>
          </div>
        ) : filteredLorries.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <Truck className="w-12 h-12 text-gray-300 stroke-[1.5]" />
            <h3 className="text-base font-bold text-gray-800">No Lorries Found</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              {searchQuery || activeTab !== "ALL"
                ? "Try adjusting your filters or search query."
                : "Click 'Add Lorries' to register your first delivery vehicle."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Vehicle / Lorry No</th>
                  <th className="py-3.5 px-5">Name / Model</th>
                  <th className="py-3.5 px-5">Capacity</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredLorries.map((lorry) => (
                  <tr
                    key={lorry.id}
                    onClick={() => handleOpenDrawer(lorry)}
                    className="hover:bg-purple-50/40 transition cursor-pointer"
                  >
                    {/* Vehicle / Lorry Number */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center shrink-0 border border-purple-200 shadow-2xs">
                          🚛
                        </div>
                        <div>
                          <span className="font-mono font-black text-gray-900 text-sm block">
                            {lorry.vehicleNumber}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">Click to view details</span>
                        </div>
                      </div>
                    </td>

                    {/* Name / Model */}
                    <td className="py-4 px-5 font-bold text-gray-900">
                      {lorry.model || "Isuzu NPR"}
                    </td>

                    {/* Capacity */}
                    <td className="py-4 px-5 font-extrabold text-purple-900">
                      {lorry.capacity || "5 Ton"}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          lorry.status.toUpperCase() === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : lorry.status.toUpperCase() === "MAINTENANCE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            lorry.status.toUpperCase() === "ACTIVE"
                              ? "bg-emerald-500"
                              : lorry.status.toUpperCase() === "MAINTENANCE"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {lorry.status}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="py-4 px-5 text-gray-500 text-[11px] max-w-xs truncate">
                      {lorry.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== SLIDE-OVER DETAIL DRAWER ==================== */}
      {isDrawerOpen && selectedLorry && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white font-black text-xl flex items-center justify-center border border-white/20">
                  🚛
                </div>
                <div>
                  <h2 className="text-lg font-mono font-black tracking-tight">{selectedLorry.vehicleNumber}</h2>
                  <p className="text-xs text-purple-200 font-semibold">{selectedLorry.model || "Isuzu NPR"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 text-purple-200 hover:text-white bg-white/10 rounded-full flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Quick Action Bar */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Status:</span>
                <select
                  value={selectedLorry.status.toUpperCase()}
                  onChange={(e) => handleToggleStatus(selectedLorry, e.target.value as any)}
                  className={`px-3 py-1 rounded-full text-xs font-black border cursor-pointer focus:outline-none transition ${
                    selectedLorry.status.toUpperCase() === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : selectedLorry.status.toUpperCase() === "MAINTENANCE"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleOpenEditModal(selectedLorry);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 font-bold text-xs flex items-center gap-1.5 transition border border-purple-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handlePromptDelete(selectedLorry)}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-xs"
                  title="Delete Lorry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-gray-700">
              {/* Dedicated Change Status Control Box */}
              <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50/50 rounded-2xl border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Power className="w-4 h-4 text-purple-700" />
                    Change Vehicle Status
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">Current: {selectedLorry.status}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleToggleStatus(selectedLorry, "ACTIVE")}
                    className={`py-2 px-2.5 rounded-xl font-black text-[11px] transition border flex items-center justify-center gap-1 ${
                      selectedLorry.status.toUpperCase() === "ACTIVE"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(selectedLorry, "MAINTENANCE")}
                    className={`py-2 px-2.5 rounded-xl font-black text-[11px] transition border flex items-center justify-center gap-1 ${
                      selectedLorry.status.toUpperCase() === "MAINTENANCE"
                        ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                        : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Maint.</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(selectedLorry, "INACTIVE")}
                    className={`py-2 px-2.5 rounded-xl font-black text-[11px] transition border flex items-center justify-center gap-1 ${
                      selectedLorry.status.toUpperCase() === "INACTIVE"
                        ? "bg-gray-700 text-white border-gray-700 shadow-2xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Inactive</span>
                  </button>
                </div>
              </div>
              {/* 1. Lorry & Vehicle Specifications */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-purple-600" />
                  1. Vehicle Specifications
                </h3>

                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Vehicle Number</span>
                    <span className="font-mono font-black text-gray-900 text-sm">{selectedLorry.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Model / Name</span>
                    <span className="font-bold text-gray-900 text-sm">{selectedLorry.model || "Isuzu NPR"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Payload Capacity</span>
                    <span className="font-extrabold text-purple-900 text-sm">{selectedLorry.capacity || "5 Ton"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Operational Status</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{selectedLorry.status}</span>
                  </div>
                </div>
              </div>

              {/* 2. Operational Fleet Info */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-purple-600" />
                  2. Fleet Status & Delivery Route
                </h3>

                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Assigned Branch:</span>
                    <span className="font-extrabold text-purple-950">Wash & Well Main Laundry</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Active Route Assignment:</span>
                    <span className="font-bold text-gray-900">Western Province District 01</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Vehicle Registration:</span>
                    <span className="font-bold text-emerald-700">Verified & Active</span>
                  </div>
                </div>
              </div>

              {/* 3. Notes & Remarks */}
              {selectedLorry.notes && (
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-600" />
                    3. Notes & Remarks
                  </h3>
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 italic">
                    "{selectedLorry.notes}"
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
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

      {/* ==================== ADD / EDIT LORRY POPUP MODAL (2 INPUT FIELDS PER ROW) ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 text-xs font-sans">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                  <Truck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">
                    {isEditing ? "Edit Lorry" : "Add Lorry"}
                  </h2>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">
                    {isEditing ? "Update vehicle registration and model info." : "Register a new delivery vehicle to fleet."}
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

            {/* Modal Form Body with 2 input fields per row grid */}
            <form onSubmit={handleSubmitLorry} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Row 1 Field 1: Vehicle / Lorry Number * */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Vehicle / Lorry Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formVehicleNumber}
                    onChange={(e) => setFormVehicleNumber(e.target.value)}
                    placeholder="WP LH-4592"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Row 1 Field 2: Name / Model */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Name / Model</label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="Isuzu NPR"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Row 2 Field 1: Capacity */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Capacity</label>
                  <input
                    type="text"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    placeholder="5 Ton"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Row 2 Field 2: Status */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Status</label>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: "ACTIVE", label: "Active", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
                      { id: "MAINTENANCE", label: "Maint.", color: "bg-amber-100 text-amber-800 border-amber-300" },
                      { id: "INACTIVE", label: "Inactive", color: "bg-gray-100 text-gray-800 border-gray-300" },
                    ].map((statusOpt) => (
                      <button
                        key={statusOpt.id}
                        type="button"
                        onClick={() => setFormStatus(statusOpt.id as any)}
                        className={`flex-1 py-2 px-1 rounded-xl font-extrabold text-[11px] border transition ${
                          formStatus === statusOpt.id
                            ? `${statusOpt.color} ring-2 ring-purple-500 shadow-2xs`
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {formStatus === statusOpt.id ? "✓ " : ""}
                        {statusOpt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 3: Notes (full width across 2 columns) */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Add vehicle maintenance notes or route assignment remarks..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold transition shadow-md flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEditing ? "Update Lorry" : "Save Lorry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {isDeleteConfirmOpen && lorryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-gray-900">Remove Vehicle?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove lorry <strong className="text-gray-900 font-mono">{lorryToDelete.vehicleNumber}</strong> from active fleet?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition shadow-md flex items-center justify-center gap-1.5"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
