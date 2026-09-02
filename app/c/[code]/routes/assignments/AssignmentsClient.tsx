"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  X,
  Navigation,
  UserCheck,
  Truck,
  Calendar,
  Store,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Users,
  Building2,
  MapPin,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";

export interface AssignmentItem {
  id: string;
  workDate: Date | string;
  endDate?: Date | string | null;
  status: string;
  routeId?: string;
  refId?: string | null;
  driverId?: string | null;
  notes?: string | null;
  route?: {
    id: string;
    code: string;
    name: string;
    area?: string | null;
    district?: string | null;
    province?: string | null;
    customers?: Array<{
      id: string;
      customer: {
        id: string;
        code?: string | null;
        name: string;
        shopName?: string | null;
        phone?: string | null;
        address1?: string | null;
        city?: string | null;
      };
    }>;
  };
  ref?: { id?: string; fullName: string; phone?: string | null } | null;
  driver?: { id?: string; fullName: string; phone?: string | null } | null;
}

interface WorkerOption {
  id: string;
  fullName: string;
  phone?: string | null;
}

export interface RouteCustomerItem {
  id: string;
  customer: {
    id: string;
    code?: string | null;
    name: string;
    shopName?: string | null;
    phone?: string | null;
    address1?: string | null;
    city?: string | null;
  };
}

export interface RouteOption {
  id: string;
  code: string;
  name: string;
  district?: string | null;
  area?: string | null;
  province?: string | null;
  customers?: RouteCustomerItem[];
}

interface AssignmentsClientProps {
  companyCode: string;
  companyId?: string;
  initialAssignments: AssignmentItem[];
  routes: RouteOption[];
  refs: WorkerOption[];
  drivers: WorkerOption[];
}

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AssignmentsClient({
  companyCode,
  initialAssignments,
  routes,
  refs,
  drivers,
}: AssignmentsClientProps) {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);

  // Drawer & Detail View state
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);

  // Confirmation Popups
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentItem | null>(null);

  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [assignmentToToggleStatus, setAssignmentToToggleStatus] = useState<AssignmentItem | null>(null);

  // SECTION 1: Route Selection
  const [routeId, setRouteId] = useState("");

  // SECTION 2: Worker Choice & Assignments
  const [needDriver, setNeedDriver] = useState(true);
  const [needRef, setNeedRef] = useState(true);

  const [primaryDriverId, setPrimaryDriverId] = useState("");
  const [backupDriverId, setBackupDriverId] = useState("");

  const [primaryRefId, setPrimaryRefId] = useState("");
  const [backupRefId, setBackupRefId] = useState("");

  // SECTION 3: Schedule & Target Visits
  const [frequency, setFrequency] = useState("DAILY");
  const [targetVisits, setTargetVisits] = useState("20");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [scheduledDays, setScheduledDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);

  // SECTION 4: Assign Customers / Shops
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [shopSearchQuery, setShopSearchQuery] = useState("");

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Expiration check helper
  const isAssignmentExpired = (asg: AssignmentItem) => {
    if (asg.status === "EXPIRED" || asg.status === "INACTIVE" || asg.status === "CANCELLED" || asg.status === "COMPLETED") {
      return true;
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const checkDate = asg.endDate || (asg.route as any)?.endDate || asg.workDate;
    if (!checkDate) return false;
    const dStr = new Date(checkDate).toISOString().split("T")[0];
    return dStr < todayStr;
  };

  const activeAssignments = useMemo(
    () => assignments.filter((a) => !isAssignmentExpired(a)),
    [assignments]
  );

  const expiredAssignments = useMemo(
    () => assignments.filter((a) => isAssignmentExpired(a)),
    [assignments]
  );

  const handleStatusChange = async (asg: AssignmentItem, newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/c/${companyCode}/routes/assignments/${asg.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === asg.id ? data.data : a))
        );
        if (selectedAssignment?.id === asg.id) {
          setSelectedAssignment(data.data);
        }
        showToast(`Assignment status updated to ${newStatus}`, "success");
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Failed to update assignment status", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if a worker is currently assigned to another active, unexpired route
  const getWorkerActiveAssignment = (workerId: string, editingId?: string) => {
    if (!workerId) return null;
    const todayStr = new Date().toISOString().split("T")[0];

    return assignments.find((asg) => {
      // Ignore current assignment if editing
      if (editingId && asg.id === editingId) return false;

      // Must be ACTIVE or PLANNED
      if (asg.status !== "ACTIVE" && asg.status !== "PLANNED") return false;

      // Expiration check: if endDate is set, compare endDate. Otherwise compare workDate.
      if (asg.endDate) {
        const endStr = new Date(asg.endDate).toISOString().split("T")[0];
        if (endStr < todayStr) return false;
      } else if (asg.workDate) {
        const workStr = new Date(asg.workDate).toISOString().split("T")[0];
        if (workStr < todayStr) return false;
      }

      // Check if worker matches ref or driver
      const isRefMatch = asg.refId === workerId || asg.ref?.id === workerId;
      const isDriverMatch = asg.driverId === workerId || asg.driver?.id === workerId;

      return isRefMatch || isDriverMatch;
    });
  };

  // Currently selected route details for form
  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === routeId),
    [routes, routeId]
  );

  // Available shops for selected route
  const routeShops = useMemo(
    () => selectedRoute?.customers || [],
    [selectedRoute]
  );

  // Filtered shops based on search query
  const filteredRouteShops = useMemo(() => {
    if (!shopSearchQuery.trim()) return routeShops;
    const q = shopSearchQuery.toLowerCase();
    return routeShops.filter(
      (item) =>
        (item.customer.name && item.customer.name.toLowerCase().includes(q)) ||
        (item.customer.shopName && item.customer.shopName.toLowerCase().includes(q)) ||
        (item.customer.code && item.customer.code.toLowerCase().includes(q)) ||
        (item.customer.city && item.customer.city.toLowerCase().includes(q))
    );
  }, [routeShops, shopSearchQuery]);

  // Drawer handlers
  const openDrawer = (asg: AssignmentItem) => {
    setSelectedAssignment(asg);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedAssignment(null);
  };

  // Handle route change in Section 1
  const handleRouteChange = (newRouteId: string) => {
    setRouteId(newRouteId);
    const routeObj = routes.find((r) => r.id === newRouteId);
    if (routeObj && routeObj.customers) {
      setSelectedCustomerIds(routeObj.customers.map((c) => c.customer.id));
    } else {
      setSelectedCustomerIds([]);
    }
  };

  // Toggle Day selection
  const toggleDay = (day: string) => {
    setScheduledDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Toggle Customer Selection in Section 4
  const toggleCustomer = (customerId: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Select / Deselect all visible shops
  const handleSelectAllShops = () => {
    const allFilteredIds = filteredRouteShops.map((s) => s.customer.id);
    const isAllSelected = allFilteredIds.every((id) =>
      selectedCustomerIds.includes(id)
    );
    if (isAllSelected) {
      setSelectedCustomerIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      setSelectedCustomerIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Reset assignment modal form
  const resetAssignmentForm = () => {
    setRouteId("");
    setNeedDriver(true);
    setNeedRef(true);
    setPrimaryDriverId("");
    setBackupDriverId("");
    setPrimaryRefId("");
    setBackupRefId("");
    setFrequency("DAILY");
    setTargetVisits("20");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setScheduledDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setSelectedCustomerIds([]);
    setShopSearchQuery("");
  };

  const openCreateModal = () => {
    resetAssignmentForm();
    setShowCreateModal(true);
  };

  // Open Edit Modal with pre-filled assignment data
  const openEditModal = (asg: AssignmentItem) => {
    setEditingAssignment(asg);
    const rId = asg.routeId || asg.route?.id || "";
    setRouteId(rId);
    
    setNeedRef(Boolean(asg.refId || asg.ref?.id));
    setNeedDriver(Boolean(asg.driverId || asg.driver?.id));
    
    setPrimaryRefId(asg.refId || asg.ref?.id || "");
    setBackupRefId("");
    setPrimaryDriverId(asg.driverId || asg.driver?.id || "");
    setBackupDriverId("");
    
    setFrequency("DAILY");
    setTargetVisits("20");
    
    const formattedDate = asg.workDate
      ? new Date(asg.workDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    setStartDate(formattedDate);
    setEndDate(asg.endDate ? new Date(asg.endDate).toISOString().split("T")[0] : "");
    setScheduledDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

    const routeObj = routes.find((r) => r.id === rId);
    if (routeObj && routeObj.customers) {
      setSelectedCustomerIds(routeObj.customers.map((c) => c.customer.id));
    } else {
      setSelectedCustomerIds([]);
    }

    setShowEditModal(true);
  };

  // Prompt & Confirm Delete
  const promptDeleteAssignment = (asg: AssignmentItem) => {
    setAssignmentToDelete(asg);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/c/${companyCode}/routes/assignments/${assignmentToDelete.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setAssignments(assignments.filter((a) => a.id !== assignmentToDelete.id));
        if (selectedAssignment?.id === assignmentToDelete.id) {
          closeDrawer();
        }
        setShowDeleteConfirmModal(false);
        setAssignmentToDelete(null);
        showToast("Route assignment deleted successfully!", "success");
      } else {
        showToast(data.error || "Failed to delete assignment", "error");
      }
    } catch {
      showToast("Failed to delete assignment", "error");
    } finally {
      setLoading(false);
    }
  };

  // Prompt & Confirm Status Toggle (Inactivate / Activate)
  const promptToggleStatus = (asg: AssignmentItem) => {
    setAssignmentToToggleStatus(asg);
    setShowStatusConfirmModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!assignmentToToggleStatus) return;
    setLoading(true);
    const newStatus = assignmentToToggleStatus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(
        `/api/c/${companyCode}/routes/assignments/${assignmentToToggleStatus.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAssignments(
          assignments.map((a) => (a.id === assignmentToToggleStatus.id ? data.data : a))
        );
        if (selectedAssignment?.id === assignmentToToggleStatus.id) {
          setSelectedAssignment(data.data);
        }
        setShowStatusConfirmModal(false);
        setAssignmentToToggleStatus(null);
        showToast(
          `Assignment status changed to ${newStatus}`,
          "success"
        );
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Failed to update assignment status", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save New Assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeId) {
      showToast("Please select a route in Section 1.", "error");
      return;
    }

    // Client-side conflict check
    if (needRef && primaryRefId) {
      const busyRef = getWorkerActiveAssignment(primaryRefId);
      if (busyRef) {
        const workerName = refs.find((r) => r.id === primaryRefId)?.fullName || "Representative";
        showToast(
          `Representative "${workerName}" is currently assigned to Route ${busyRef.route?.code || ""} and cannot be assigned until inactivated, deleted, or expired.`,
          "error"
        );
        return;
      }
    }

    if (needDriver && primaryDriverId) {
      const busyDriver = getWorkerActiveAssignment(primaryDriverId);
      if (busyDriver) {
        const driverName = drivers.find((d) => d.id === primaryDriverId)?.fullName || "Driver";
        showToast(
          `Driver "${driverName}" is currently assigned to Route ${busyDriver.route?.code || ""} and cannot be assigned until inactivated, deleted, or expired.`,
          "error"
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/routes/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId,
          workDate: startDate,
          refId: needRef ? primaryRefId || null : null,
          driverId: needDriver ? primaryDriverId || null : null,
          backupRefId: needRef ? backupRefId || null : null,
          backupDriverId: needDriver ? backupDriverId || null : null,
          frequency,
          targetVisits: Number(targetVisits) || null,
          endDate: endDate || null,
          scheduledDays,
          assignedCustomerIds: selectedCustomerIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignments([data.data, ...assignments]);
        setShowCreateModal(false);
        resetAssignmentForm();
        showToast("Route assignment created successfully!", "success");
      } else {
        showToast(data.error || "Failed to save assignment", "error");
      }
    } catch {
      showToast("Failed to save assignment due to network error", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update Existing Assignment
  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment || !routeId) return;

    // Client-side conflict check
    if (needRef && primaryRefId) {
      const busyRef = getWorkerActiveAssignment(primaryRefId, editingAssignment.id);
      if (busyRef) {
        const workerName = refs.find((r) => r.id === primaryRefId)?.fullName || "Representative";
        showToast(
          `Representative "${workerName}" is currently assigned to Route ${busyRef.route?.code || ""} and cannot be assigned until inactivated, deleted, or expired.`,
          "error"
        );
        return;
      }
    }

    if (needDriver && primaryDriverId) {
      const busyDriver = getWorkerActiveAssignment(primaryDriverId, editingAssignment.id);
      if (busyDriver) {
        const driverName = drivers.find((d) => d.id === primaryDriverId)?.fullName || "Driver";
        showToast(
          `Driver "${driverName}" is currently assigned to Route ${busyDriver.route?.code || ""} and cannot be assigned until inactivated, deleted, or expired.`,
          "error"
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/c/${companyCode}/routes/assignments/${editingAssignment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            routeId,
            workDate: startDate,
            refId: needRef ? primaryRefId || null : null,
            driverId: needDriver ? primaryDriverId || null : null,
            backupRefId: needRef ? backupRefId || null : null,
            backupDriverId: needDriver ? backupDriverId || null : null,
            frequency,
            targetVisits: Number(targetVisits) || null,
            endDate: endDate || null,
            scheduledDays,
            assignedCustomerIds: selectedCustomerIds,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAssignments(
          assignments.map((a) => (a.id === editingAssignment.id ? data.data : a))
        );
        if (selectedAssignment?.id === editingAssignment.id) {
          setSelectedAssignment(data.data);
        }
        setShowEditModal(false);
        setEditingAssignment(null);
        resetAssignmentForm();
        showToast("Route assignment updated successfully!", "success");
      } else {
        showToast(data.error || "Failed to update assignment", "error");
      }
    } catch {
      showToast("Failed to update assignment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
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

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Route Assignments</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Configure territory routes, assign primary & backup drivers and reps, schedule visits, and select target shops.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus size={14} /> New Route Assignment
        </button>
      </div>

      {/* ACTIVE & PLANNED ASSIGNMENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-gray-900 text-sm">Active & Planned Route Assignments</h3>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {activeAssignments.length} Active
            </span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {assignments.length} Total Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-6">Work Date</th>
                <th className="py-4 px-6">End Date</th>
                <th className="py-4 px-6">Route</th>
                <th className="py-4 px-6">Assigned Representative</th>
                <th className="py-4 px-6">Assigned Driver</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                    No active or planned route assignments. Click "New Route Assignment" to create one.
                  </td>
                </tr>
              ) : (
                activeAssignments.map((asg) => (
                  <tr
                    key={asg.id}
                    onClick={() => openDrawer(asg)}
                    className="hover:bg-purple-50/30 cursor-pointer transition"
                  >
                    <td className="py-4 px-6 font-bold text-purple-900" suppressHydrationWarning>
                      {new Date(asg.workDate).toLocaleDateString("en-US")}
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-medium" suppressHydrationWarning>
                      {asg.endDate ? new Date(asg.endDate).toLocaleDateString("en-US") : "Ongoing"}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      <span className="inline-flex items-center gap-1.5 bg-[#F0EBFF] text-[#7C3AED] px-3 py-1 rounded-full text-xs font-extrabold">
                        {asg.route?.code}
                      </span>{" "}
                      <span className="ml-1">{asg.route?.name}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-semibold">
                      {asg.ref?.fullName ? (
                        <span className="flex items-center gap-1.5 text-gray-800">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600" /> {asg.ref.fullName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-semibold">
                      {asg.driver?.fullName ? (
                        <span className="flex items-center gap-1.5 text-gray-800">
                          <Truck className="w-3.5 h-3.5 text-indigo-600" /> {asg.driver.fullName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                        {asg.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={asg.status || "ACTIVE"}
                          onChange={(e) => handleStatusChange(asg, e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl px-2.5 py-1.5 hover:bg-gray-100 transition cursor-pointer"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PLANNED">PLANNED</option>
                          <option value="EXPIRED">EXPIRED</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => openEditModal(asg)}
                          className="p-2 text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition"
                          title="Edit Assignment"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDeleteAssignment(asg)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Delete Assignment"
                        >
                          <Trash2 size={15} />
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

      {/* EXPIRED & INACTIVE ASSIGNMENTS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-gray-100 bg-amber-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-gray-900 text-sm">Expired & Inactive Route Assignments</h3>
            <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              {expiredAssignments.length} Expired / Inactive
            </span>
          </div>
          <p className="text-xs text-amber-700 font-medium">
            Assignments here are expired or inactivated and no longer appear on Driver/Rep dashboards.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30 text-[11px] font-extrabold uppercase text-gray-400 tracking-wider">
                <th className="py-4 px-6">Work Date</th>
                <th className="py-4 px-6">End Date</th>
                <th className="py-4 px-6">Route</th>
                <th className="py-4 px-6">Assigned Representative</th>
                <th className="py-4 px-6">Assigned Driver</th>
                <th className="py-4 px-6">Status / Reason</th>
                <th className="py-4 px-6 text-right">Change Status & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expiredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                    No expired or inactive route assignments recorded.
                  </td>
                </tr>
              ) : (
                expiredAssignments.map((asg) => {
                  const datePast = isAssignmentExpired(asg);
                  const displayStatus = asg.status === "EXPIRED" || (datePast && (asg.status === "ACTIVE" || asg.status === "PLANNED"))
                    ? "EXPIRED"
                    : (asg.status || "INACTIVE");

                  return (
                    <tr
                      key={asg.id}
                      onClick={() => openDrawer(asg)}
                      className="hover:bg-amber-50/20 cursor-pointer transition opacity-90"
                    >
                      <td className="py-4 px-6 font-bold text-gray-700" suppressHydrationWarning>
                        {new Date(asg.workDate).toLocaleDateString("en-US")}
                      </td>
                      <td className="py-4 px-6 text-gray-500 font-medium" suppressHydrationWarning>
                        {asg.endDate ? new Date(asg.endDate).toLocaleDateString("en-US") : ((asg.route as any)?.endDate ? new Date((asg.route as any).endDate).toLocaleDateString("en-US") : "Expired")}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-800">
                        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-extrabold">
                          {asg.route?.code}
                        </span>{" "}
                        <span className="ml-1">{asg.route?.name}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-semibold">
                        {asg.ref?.fullName ? (
                          <span className="flex items-center gap-1.5 text-gray-700">
                            <UserCheck className="w-3.5 h-3.5 text-gray-400" /> {asg.ref.fullName}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600 font-semibold">
                        {asg.driver?.fullName ? (
                          <span className="flex items-center gap-1.5 text-gray-700">
                            <Truck className="w-3.5 h-3.5 text-gray-400" /> {asg.driver.fullName}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                            displayStatus === "EXPIRED"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={asg.status || "EXPIRED"}
                            onChange={(e) => handleStatusChange(asg, e.target.value)}
                            className="bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl px-2.5 py-1.5 hover:bg-amber-100 transition cursor-pointer"
                          >
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="ACTIVE">REACTIVATE (ACTIVE)</option>
                            <option value="PLANNED">PLANNED</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => openEditModal(asg)}
                            className="p-2 text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 rounded-xl transition"
                            title="Edit / Extend Assignment"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDeleteAssignment(asg)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Delete Assignment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROUTE ASSIGNMENT DETAIL SLIDE-OVER DRAWER */}
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
        {selectedAssignment && (
          <>
            {/* Drawer Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-purple-50/50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900">
                    {selectedAssignment.route?.name || "Route Assignment"}
                  </h2>
                  <p className="text-xs text-[#7C3AED] font-bold">
                    Code: {selectedAssignment.route?.code || "N/A"}
                  </p>
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
              {/* Status & Schedule Banner */}
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 font-medium block text-[11px] mb-1">Assignment Status</span>
                    <select
                      value={selectedAssignment.status || (isAssignmentExpired(selectedAssignment) ? "EXPIRED" : "ACTIVE")}
                      onChange={(e) => handleStatusChange(selectedAssignment, e.target.value)}
                      className="bg-white border border-purple-200 text-purple-900 font-extrabold text-xs rounded-xl px-3 py-1.5 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PLANNED">PLANNED</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                      isAssignmentExpired(selectedAssignment)
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-emerald-100 text-emerald-900 border-emerald-300"
                    }`}
                  >
                    {isAssignmentExpired(selectedAssignment) ? "EXPIRED" : "ACTIVE / VALID"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-purple-100/80">
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-2xs">
                    <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">Start Date</span>
                    <span className="text-xs font-extrabold text-[#7C3AED] flex items-center gap-1.5 mt-1" suppressHydrationWarning>
                      <Calendar size={13} />
                      {new Date(selectedAssignment.workDate).toLocaleDateString("en-US")}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-2xs">
                    <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">End Date</span>
                    <span className="text-xs font-extrabold text-indigo-700 flex items-center gap-1.5 mt-1" suppressHydrationWarning>
                      <Calendar size={13} />
                      {selectedAssignment.endDate
                        ? new Date(selectedAssignment.endDate).toLocaleDateString("en-US")
                        : (selectedAssignment.route as any)?.endDate
                        ? new Date((selectedAssignment.route as any).endDate).toLocaleDateString("en-US")
                        : "Ongoing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workers Assigned */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                <h4 className="font-extrabold text-gray-400 text-[11px] tracking-wider uppercase">
                  Assigned Personnel
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                    <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Representative (REF):
                    </span>
                    <strong className="text-gray-900">
                      {selectedAssignment.ref?.fullName || "Unassigned"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" /> Driver:
                    </span>
                    <strong className="text-gray-900">
                      {selectedAssignment.driver?.fullName || "Unassigned"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Linked Shops / Customers */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 border border-gray-100">
                <h4 className="font-extrabold text-gray-400 text-[11px] tracking-wider uppercase">
                  Linked Shops / Customers ({selectedAssignment.route?.customers?.length || 0})
                </h4>
                {selectedAssignment.route?.customers && selectedAssignment.route.customers.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedAssignment.route.customers.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white p-2.5 rounded-xl border border-gray-200/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-gray-900 font-bold block">
                            {c.customer.shopName || c.customer.name}
                          </strong>
                          <span className="text-[11px] text-gray-500">
                            {c.customer.name} {c.customer.city ? `• ${c.customer.city}` : ""}
                          </span>
                        </div>
                        {c.customer.code && (
                          <span className="text-[10px] bg-purple-50 text-[#7C3AED] px-2 py-0.5 rounded font-extrabold">
                            {c.customer.code}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No shops currently linked to this route.</p>
                )}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-5 border-t border-gray-100 flex items-center gap-2 bg-gray-50/90 shrink-0">
              <button
                type="button"
                onClick={() => openEditModal(selectedAssignment)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-100 text-[#7C3AED] hover:bg-purple-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Edit2 size={14} /> Edit Assignment
              </button>

              <button
                type="button"
                onClick={() => promptToggleStatus(selectedAssignment)}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs ${
                  selectedAssignment.status === "ACTIVE" || selectedAssignment.status === "PLANNED"
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                }`}
              >
                {selectedAssignment.status === "ACTIVE" || selectedAssignment.status === "PLANNED"
                  ? "Inactivate"
                  : "Activate"}
              </button>

              <button
                type="button"
                onClick={() => promptDeleteAssignment(selectedAssignment)}
                className="py-2.5 px-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* DELETE CONFIRMATION POPUP MODAL */}
      {showDeleteConfirmModal && assignmentToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Delete Route Assignment</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete assignment for route{" "}
                <strong className="text-gray-800">"{assignmentToDelete.route?.name}"</strong> on{" "}
                {new Date(assignmentToDelete.workDate).toLocaleDateString()}? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setAssignmentToDelete(null);
                }}
                className="px-5 py-2.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={confirmDeleteAssignment}
                className="px-5 py-2.5 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-200 transition flex-1 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "OK / Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE CONFIRMATION POPUP MODAL */}
      {showStatusConfirmModal && assignmentToToggleStatus && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                assignmentToToggleStatus.status === "ACTIVE" || assignmentToToggleStatus.status === "PLANNED"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {assignmentToToggleStatus.status === "ACTIVE" || assignmentToToggleStatus.status === "PLANNED"
                  ? "Inactivate Assignment"
                  : "Activate Assignment"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to{" "}
                {assignmentToToggleStatus.status === "ACTIVE" || assignmentToToggleStatus.status === "PLANNED"
                  ? "inactivate"
                  : "activate"}{" "}
                assignment for route <strong className="text-gray-800">"{assignmentToToggleStatus.route?.name}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowStatusConfirmModal(false);
                  setAssignmentToToggleStatus(null);
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
                  assignmentToToggleStatus.status === "ACTIVE" || assignmentToToggleStatus.status === "PLANNED"
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                }`}
              >
                {loading
                  ? "Updating..."
                  : assignmentToToggleStatus.status === "ACTIVE" || assignmentToToggleStatus.status === "PLANNED"
                  ? "OK / Inactivate"
                  : "OK / Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ROUTE ASSIGNMENT MODAL (Z-[60]) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden my-auto border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Configure Route Assignment</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Setup territory route, worker roles, schedule, and assign shop visits.</p>
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
            <form onSubmit={handleSaveAssignment} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* SECTION 1 — ROUTE */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#7C3AED] flex items-center justify-center font-extrabold text-xs">
                    1
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm">Section 1 — Route</h4>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Select Route *</label>
                  <select
                    value={routeId}
                    onChange={(e) => handleRouteChange(e.target.value)}
                    required
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition font-bold"
                  >
                    <option value="">-- Select Route --</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name} {r.district ? `(${r.district})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoute && (
                  <div className="bg-white p-3.5 rounded-xl border border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-50 text-[#7C3AED] font-extrabold px-2.5 py-0.5 rounded-md">
                        {selectedRoute.code}
                      </span>
                      <strong className="text-gray-900 font-bold">{selectedRoute.name}</strong>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600 text-[11px]">
                      <span>Area: <strong className="text-gray-800">{selectedRoute.area || "-"}</strong></span>
                      <span>District: <strong className="text-gray-800">{selectedRoute.district || "-"}</strong></span>
                      <span>Customers: <strong className="text-purple-700">{selectedRoute.customers?.length || 0}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2 — ASSIGNED DRIVER / SALES REPRESENTATIVE */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xs">
                      2
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">
                      Section 2 — Assigned Driver / Sales Representative
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 font-bold text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={needDriver}
                        onChange={(e) => setNeedDriver(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-gray-300"
                      />
                      <Truck className="w-3.5 h-3.5 text-indigo-600" /> Driver
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={needRef}
                        onChange={(e) => setNeedRef(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-gray-300"
                      />
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Sales Representative (REF)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {needDriver && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 border-b border-gray-100 pb-1.5">
                        <Truck className="w-4 h-4 text-indigo-600" /> Driver Selection
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Primary Driver</label>
                        <select
                          value={primaryDriverId}
                          onChange={(e) => setPrimaryDriverId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition font-bold"
                        >
                          <option value="">-- Select Primary Driver --</option>
                          {drivers
                            .filter((drv) => {
                              const activeAsg = getWorkerActiveAssignment(drv.id);
                              return !activeAsg || drv.id === primaryDriverId;
                            })
                            .map((drv) => (
                              <option key={drv.id} value={drv.id}>
                                {drv.fullName} {drv.phone ? `(${drv.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Backup Driver (Optional)</label>
                        <select
                          value={backupDriverId}
                          onChange={(e) => setBackupDriverId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition font-bold"
                        >
                          <option value="">-- Select Backup Driver --</option>
                          {drivers
                            .filter((drv) => {
                              const activeAsg = getWorkerActiveAssignment(drv.id);
                              return !activeAsg || drv.id === backupDriverId;
                            })
                            .map((drv) => (
                              <option key={drv.id} value={drv.id}>
                                {drv.fullName} {drv.phone ? `(${drv.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {needRef && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900 border-b border-gray-100 pb-1.5">
                        <UserCheck className="w-4 h-4 text-purple-600" /> Sales Representative (REF) Selection
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Primary Representative</label>
                        <select
                          value={primaryRefId}
                          onChange={(e) => setPrimaryRefId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition font-bold"
                        >
                          <option value="">-- Select Primary Representative --</option>
                          {refs
                            .filter((rf) => {
                              const activeAsg = getWorkerActiveAssignment(rf.id);
                              return !activeAsg || rf.id === primaryRefId;
                            })
                            .map((rf) => (
                              <option key={rf.id} value={rf.id}>
                                {rf.fullName} {rf.phone ? `(${rf.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Backup Representative (Optional)</label>
                        <select
                          value={backupRefId}
                          onChange={(e) => setBackupRefId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition font-bold"
                        >
                          <option value="">-- Select Backup Representative --</option>
                          {refs
                            .filter((rf) => {
                              const activeAsg = getWorkerActiveAssignment(rf.id);
                              return !activeAsg || rf.id === backupRefId;
                            })
                            .map((rf) => (
                              <option key={rf.id} value={rf.id}>
                                {rf.fullName} {rf.phone ? `(${rf.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3 — SCHEDULE & TARGET VISITS */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-xs">
                    3
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm">Section 3 — Schedule & Target Visits</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition font-bold"
                    >
                      <option value="DAILY">DAILY</option>
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="BIWEEKLY">BIWEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Target Visits / Calls</label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={targetVisits}
                      onChange={(e) => setTargetVisits(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      End Date <span className="text-[10px] text-gray-400 font-normal">(Auto-inactivates)</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-2">Scheduled Visit Days</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map((day) => {
                      const active = scheduledDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                            active
                              ? "bg-[#7C3AED] text-white shadow-xs"
                              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {active && <Check size={12} />} {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4 — ASSIGN CUSTOMERS / SHOPS */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-xs">
                      4
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">
                      Section 4 — Assign Customers / Shops ({selectedCustomerIds.length} Selected)
                    </h4>
                  </div>

                  {routeId && routeShops.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllShops}
                      className="text-xs font-bold text-[#7C3AED] hover:underline"
                    >
                      {filteredRouteShops.every((s) => selectedCustomerIds.includes(s.customer.id))
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>

                {!routeId ? (
                  <div className="bg-purple-50/40 border border-dashed border-purple-200 p-8 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center mx-auto">
                      <Store className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">No Route Selected</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Please select a route in Section 1 to view and assign its associated customers/shops.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search shops by name, code, or city..."
                        value={shopSearchQuery}
                        onChange={(e) => setShopSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-purple-400 transition"
                      />
                    </div>

                    {filteredRouteShops.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
                        No customers or shops found matching your search.
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {filteredRouteShops.map((item) => {
                          const cust = item.customer;
                          const selected = selectedCustomerIds.includes(cust.id);
                          return (
                            <label
                              key={cust.id}
                              className={`flex items-center justify-between p-3 cursor-pointer hover:bg-purple-50/30 transition text-xs ${
                                selected ? "bg-purple-50/20" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleCustomer(cust.id)}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-gray-300"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <strong className="text-gray-900 font-bold">
                                      {cust.shopName || cust.name}
                                    </strong>
                                    {cust.code && (
                                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-extrabold">
                                        {cust.code}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {cust.name} {cust.city ? `• ${cust.city}` : ""} {cust.phone ? `• ${cust.phone}` : ""}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                                  selected
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {selected ? "Assigned" : "Excluded"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
                  {loading ? "Saving..." : "Create Route Assignment"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT ROUTE ASSIGNMENT MODAL (Z-[60]) */}
      {showEditModal && editingAssignment && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden my-auto border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 font-sans">Edit Route Assignment</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Update territory route, worker roles, schedule, and assigned shop visits.</p>
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
            <form onSubmit={handleUpdateAssignment} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* SECTION 1 — ROUTE */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#7C3AED] flex items-center justify-center font-extrabold text-xs">
                    1
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm">Section 1 — Route</h4>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Select Route *</label>
                  <select
                    value={routeId}
                    onChange={(e) => handleRouteChange(e.target.value)}
                    required
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition font-bold"
                  >
                    <option value="">-- Select Route --</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name} {r.district ? `(${r.district})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoute && (
                  <div className="bg-white p-3.5 rounded-xl border border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-50 text-[#7C3AED] font-extrabold px-2.5 py-0.5 rounded-md">
                        {selectedRoute.code}
                      </span>
                      <strong className="text-gray-900 font-bold">{selectedRoute.name}</strong>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600 text-[11px]">
                      <span>Area: <strong className="text-gray-800">{selectedRoute.area || "-"}</strong></span>
                      <span>District: <strong className="text-gray-800">{selectedRoute.district || "-"}</strong></span>
                      <span>Customers: <strong className="text-purple-700">{selectedRoute.customers?.length || 0}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2 — ASSIGNED DRIVER / SALES REPRESENTATIVE */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xs">
                      2
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">
                      Section 2 — Assigned Driver / Sales Representative
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 font-bold text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={needDriver}
                        onChange={(e) => setNeedDriver(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-gray-300"
                      />
                      <Truck className="w-3.5 h-3.5 text-indigo-600" /> Driver
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={needRef}
                        onChange={(e) => setNeedRef(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-gray-300"
                      />
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Sales Representative (REF)
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {needDriver && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 border-b border-gray-100 pb-1.5">
                        <Truck className="w-4 h-4 text-indigo-600" /> Driver Selection
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Primary Driver</label>
                        <select
                          value={primaryDriverId}
                          onChange={(e) => setPrimaryDriverId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition font-bold"
                        >
                          <option value="">-- Select Primary Driver --</option>
                          {drivers
                            .filter((drv) => {
                              const activeAsg = getWorkerActiveAssignment(drv.id, editingAssignment.id);
                              return !activeAsg || drv.id === primaryDriverId;
                            })
                            .map((drv) => (
                              <option key={drv.id} value={drv.id}>
                                {drv.fullName} {drv.phone ? `(${drv.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Backup Driver (Optional)</label>
                        <select
                          value={backupDriverId}
                          onChange={(e) => setBackupDriverId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition font-bold"
                        >
                          <option value="">-- Select Backup Driver --</option>
                          {drivers
                            .filter((drv) => {
                              const activeAsg = getWorkerActiveAssignment(drv.id, editingAssignment.id);
                              return !activeAsg || drv.id === backupDriverId;
                            })
                            .map((drv) => (
                              <option key={drv.id} value={drv.id}>
                                {drv.fullName} {drv.phone ? `(${drv.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {needRef && (
                    <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900 border-b border-gray-100 pb-1.5">
                        <UserCheck className="w-4 h-4 text-purple-600" /> Sales Representative (REF) Selection
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Primary Representative</label>
                        <select
                          value={primaryRefId}
                          onChange={(e) => setPrimaryRefId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition font-bold"
                        >
                          <option value="">-- Select Primary Representative --</option>
                          {refs
                            .filter((rf) => {
                              const activeAsg = getWorkerActiveAssignment(rf.id, editingAssignment.id);
                              return !activeAsg || rf.id === primaryRefId;
                            })
                            .map((rf) => (
                              <option key={rf.id} value={rf.id}>
                                {rf.fullName} {rf.phone ? `(${rf.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Backup Representative (Optional)</label>
                        <select
                          value={backupRefId}
                          onChange={(e) => setBackupRefId(e.target.value)}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition font-bold"
                        >
                          <option value="">-- Select Backup Representative --</option>
                          {refs
                            .filter((rf) => {
                              const activeAsg = getWorkerActiveAssignment(rf.id, editingAssignment.id);
                              return !activeAsg || rf.id === backupRefId;
                            })
                            .map((rf) => (
                              <option key={rf.id} value={rf.id}>
                                {rf.fullName} {rf.phone ? `(${rf.phone})` : ""}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3 — SCHEDULE & TARGET VISITS */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-xs">
                    3
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-sm">Section 3 — Schedule & Target Visits</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition font-bold"
                    >
                      <option value="DAILY">DAILY</option>
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="BIWEEKLY">BIWEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Target Visits / Calls</label>
                    <input
                      type="number"
                      placeholder="e.g. 20"
                      value={targetVisits}
                      onChange={(e) => setTargetVisits(e.target.value)}
                      className="w-full p-3 bg-[#ffffff] border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      End Date <span className="text-[10px] text-gray-400 font-normal">(Auto-inactivates)</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-purple-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-2">Scheduled Visit Days</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map((day) => {
                      const active = scheduledDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                            active
                              ? "bg-[#7C3AED] text-white shadow-xs"
                              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {active && <Check size={12} />} {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4 — ASSIGN CUSTOMERS / SHOPS */}
              <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-xs">
                      4
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">
                      Section 4 — Assign Customers / Shops ({selectedCustomerIds.length} Selected)
                    </h4>
                  </div>

                  {routeId && routeShops.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllShops}
                      className="text-xs font-bold text-[#7C3AED] hover:underline"
                    >
                      {filteredRouteShops.every((s) => selectedCustomerIds.includes(s.customer.id))
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>

                {!routeId ? (
                  <div className="bg-purple-50/40 border border-dashed border-purple-200 p-8 rounded-2xl text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center mx-auto">
                      <Store className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-sm">No Route Selected</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Please select a route in Section 1 to view and assign its associated customers/shops.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search shops by name, code, or city..."
                        value={shopSearchQuery}
                        onChange={(e) => setShopSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-xs outline-none focus:border-purple-400 transition"
                      />
                    </div>

                    {filteredRouteShops.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
                        No customers or shops found matching your search.
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {filteredRouteShops.map((item) => {
                          const cust = item.customer;
                          const selected = selectedCustomerIds.includes(cust.id);
                          return (
                            <label
                              key={cust.id}
                              className={`flex items-center justify-between p-3 cursor-pointer hover:bg-purple-50/30 transition text-xs ${
                                selected ? "bg-purple-50/20" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => toggleCustomer(cust.id)}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400 border-gray-300"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <strong className="text-gray-900 font-bold">
                                      {cust.shopName || cust.name}
                                    </strong>
                                    {cust.code && (
                                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-extrabold">
                                        {cust.code}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {cust.name} {cust.city ? `• ${cust.city}` : ""} {cust.phone ? `• ${cust.phone}` : ""}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                                  selected
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {selected ? "Assigned" : "Excluded"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
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
                  {loading ? "Saving..." : "Save Assignment Changes"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
