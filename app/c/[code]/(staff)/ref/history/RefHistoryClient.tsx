"use client";

import { useState, useMemo } from "react";
import {
  History, Search, Calendar, UserCheck, ShoppingBag, PackageCheck,
  Navigation, Filter, Clock, ArrowUpRight, ChevronRight, X, Building2,
  FileText, CheckCircle2, AlertCircle, Phone, MapPin, ExternalLink, Activity
} from "lucide-react";

interface RefHistoryClientProps {
  companyCode: string;
  userName: string;
  userRole: string;
  initialVisits: any[];
  initialOrders: any[];
  initialPickups: any[];
  initialAssignments: any[];
  initialActivities: any[];
}

export default function RefHistoryClient({
  companyCode,
  userName,
  userRole,
  initialVisits = [],
  initialOrders = [],
  initialPickups = [],
  initialAssignments = [],
  initialActivities = [],
}: RefHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<"TIMELINE" | "VISITS" | "ORDERS" | "COLLECTIONS" | "LOGS">("TIMELINE");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<{ type: string; data: any } | null>(null);

  // Compute KPIs
  const totalVisitsCount = initialVisits.length;
  const totalOrdersCount = initialOrders.length;
  const totalOrdersValue = initialOrders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
  const totalPickupsCount = initialPickups.length;
  const totalPickupsWeight = initialPickups.reduce((sum, p) => sum + Number(p.actualKgCollected || p.totalWeight || 0), 0);
  const totalAssignmentsCount = initialAssignments.length;

  // Build Unified Timeline Stream
  const unifiedTimeline = useMemo(() => {
    const stream: Array<{
      id: string;
      type: "VISIT" | "ORDER" | "COLLECTION" | "ASSIGNMENT" | "LOG";
      title: string;
      subtitle: string;
      customerName?: string;
      status?: string;
      timestamp: Date;
      raw: any;
    }> = [];

    // 1. Visits
    initialVisits.forEach((v) => {
      stream.push({
        id: `v_${v.id}`,
        type: "VISIT",
        title: `Customer Visit: ${v.customer?.name || "Customer"}`,
        subtitle: `Outcome: ${v.outcome || "General Visit"}${v.notes ? ` - ${v.notes}` : ""}`,
        customerName: v.customer?.name,
        status: v.outcome,
        timestamp: new Date(v.visitDate || v.createdAt),
        raw: v,
      });
    });

    // 2. Orders
    initialOrders.forEach((o) => {
      stream.push({
        id: `o_${o.id}`,
        type: "ORDER",
        title: `Order Created: ${o.orderNo}`,
        subtitle: `Customer: ${o.customer?.name || "N/A"} • Amount: LKR ${Number(o.grandTotal || 0).toLocaleString()}`,
        customerName: o.customer?.name,
        status: o.status,
        timestamp: new Date(o.createdAt),
        raw: o,
      });
    });

    // 3. Collections/Pickups
    initialPickups.forEach((p) => {
      stream.push({
        id: `p_${p.id}`,
        type: "COLLECTION",
        title: `Laundry Collected: ${p.order?.orderNo || "Order"}`,
        subtitle: `Collected ${p.actualKgCollected || 0} KG for ${p.order?.customer?.name || "Customer"}`,
        customerName: p.order?.customer?.name,
        status: p.status || "COLLECTED",
        timestamp: new Date(p.createdAt),
        raw: p,
      });
    });

    // 4. Assignments
    initialAssignments.forEach((a) => {
      stream.push({
        id: `a_${a.id}`,
        type: "ASSIGNMENT",
        title: `Route Assignment: ${a.route?.name || "Route"} (${a.route?.code || ""})`,
        subtitle: `Assigned for ${new Date(a.workDate).toLocaleDateString("en-US")}`,
        status: a.status || "ASSIGNED",
        timestamp: new Date(a.workDate || a.createdAt),
        raw: a,
      });
    });

    // 5. Activity Logs
    initialActivities.forEach((act) => {
      stream.push({
        id: `act_${act.id}`,
        type: "LOG",
        title: `System Action: ${act.action}`,
        subtitle: act.description || `Entity: ${act.entityType}`,
        status: act.action,
        timestamp: new Date(act.createdAt),
        raw: act,
      });
    });

    // Sort descending by timestamp
    return stream.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [initialVisits, initialOrders, initialPickups, initialAssignments, initialActivities]);

  // Filtered Stream
  const filteredTimeline = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return unifiedTimeline.filter((item) => {
      if (activeTab === "VISITS" && item.type !== "VISIT") return false;
      if (activeTab === "ORDERS" && item.type !== "ORDER") return false;
      if (activeTab === "COLLECTIONS" && item.type !== "COLLECTION") return false;
      if (activeTab === "LOGS" && item.type !== "LOG") return false;

      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.customerName && item.customerName.toLowerCase().includes(q)) ||
        (item.status && item.status.toLowerCase().includes(q))
      );
    });
  }, [unifiedTimeline, activeTab, searchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-[#7C3AED] font-black text-[10px] rounded-md uppercase tracking-wider">
              {userRole} Workspace
            </span>
            <span className="text-xs text-gray-400 font-bold">• {userName}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">My Work History</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete audit feed & history of your field visits, orders, collections & route work
          </p>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold text-gray-500">Field Visits</span>
            <UserCheck className="w-5 h-5 p-1 bg-purple-50 rounded-lg text-[#7C3AED]" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalVisitsCount}</p>
          <p className="text-[10px] text-gray-400 font-medium">Logged shop outcomes</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold text-gray-500">Orders Created</span>
            <ShoppingBag className="w-5 h-5 p-1 bg-emerald-50 rounded-lg text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalOrdersCount}</p>
          <p className="text-[10px] text-emerald-700 font-bold">LKR {totalOrdersValue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-xs font-bold text-gray-500">Collections Handled</span>
            <PackageCheck className="w-5 h-5 p-1 bg-sky-50 rounded-lg text-sky-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalPickupsCount}</p>
          <p className="text-[10px] text-sky-700 font-bold">{totalPickupsWeight} KG Laundry</p>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold text-gray-500">Route Days</span>
            <Navigation className="w-5 h-5 p-1 bg-indigo-50 rounded-lg text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalAssignmentsCount}</p>
          <p className="text-[10px] text-gray-400 font-medium">Active route shifts</p>
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY TABS */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search work history by customer name, order #, visit outcome, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:bg-white transition"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-extrabold scrollbar-none">
          {[
            { id: "TIMELINE", label: `All Timeline (${unifiedTimeline.length})`, icon: History },
            { id: "VISITS", label: `Visits (${initialVisits.length})`, icon: UserCheck },
            { id: "ORDERS", label: `Orders (${initialOrders.length})`, icon: ShoppingBag },
            { id: "COLLECTIONS", label: `Collections (${initialPickups.length})`, icon: PackageCheck },
            { id: "LOGS", label: `System Logs (${initialActivities.length})`, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition ${
                  active
                    ? "bg-[#7C3AED] text-white shadow-md shadow-purple-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FEED & TABLE VIEW */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
        {filteredTimeline.length === 0 ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
            <p className="font-bold text-sm">No work history records found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTimeline.map((item) => {
              const getTypeColor = () => {
                switch (item.type) {
                  case "VISIT": return "bg-purple-100 text-purple-800 border-purple-200";
                  case "ORDER": return "bg-emerald-100 text-emerald-800 border-emerald-200";
                  case "COLLECTION": return "bg-sky-100 text-sky-800 border-sky-200";
                  case "ASSIGNMENT": return "bg-indigo-100 text-indigo-800 border-indigo-200";
                  default: return "bg-gray-100 text-gray-700 border-gray-200";
                }
              };

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedRecord({ type: item.type, data: item.raw })}
                  className="p-4 md:px-6 hover:bg-purple-50/30 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase shrink-0 ${getTypeColor()}`}>
                      {item.type}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-[11px] font-mono text-gray-400 font-bold">
                      {item.timestamp.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-[#7C3AED] rounded-xl font-extrabold text-xs transition flex items-center gap-1"
                    >
                      <span>View</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL SLIDE-OVER DRAWER */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-100 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#7C3AED] uppercase bg-purple-100 px-2 py-0.5 rounded-md">
                    {selectedRecord.type} Details
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 mt-0.5">
                    {selectedRecord.data.orderNo || selectedRecord.data.action || selectedRecord.data.customer?.name || "Record Details"}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              
              {/* VISIT DETAILS */}
              {selectedRecord.type === "VISIT" && (
                <div className="space-y-4">
                  <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-2">
                    <span className="text-gray-500 font-bold block text-[11px]">Customer Shop</span>
                    <h4 className="text-base font-black text-purple-900">{selectedRecord.data.customer?.name}</h4>
                    {selectedRecord.data.customer?.placeName && (
                      <p className="text-xs text-gray-600 font-bold">🏪 {selectedRecord.data.customer.placeName}</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Visit Date & Time:</span>
                      <strong className="text-gray-900">{new Date(selectedRecord.data.visitDate || selectedRecord.data.createdAt).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Visit Outcome:</span>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md font-black">
                        {selectedRecord.data.outcome}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold">Visit Type:</span>
                      <strong className="text-gray-900">{selectedRecord.data.visitType || "Field Check"}</strong>
                    </div>
                  </div>

                  {selectedRecord.data.notes && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                      <span className="text-gray-400 font-black text-[10px] tracking-wider uppercase">Visit Notes</span>
                      <p className="text-gray-800 italic bg-white p-3 rounded-xl border">{selectedRecord.data.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ORDER DETAILS */}
              {selectedRecord.type === "ORDER" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-2">
                    <span className="text-emerald-800 font-bold block text-[11px]">Order No: {selectedRecord.data.orderNo}</span>
                    <h4 className="text-base font-black text-emerald-950">Customer: {selectedRecord.data.customer?.name}</h4>
                    <p className="text-xs font-black text-emerald-700">Total: LKR {Number(selectedRecord.data.grandTotal || 0).toLocaleString()}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Order Status:</span>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-black">
                        {selectedRecord.data.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Created Date:</span>
                      <strong className="text-gray-900">{new Date(selectedRecord.data.createdAt).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold">Items Count:</span>
                      <strong className="text-gray-900">{selectedRecord.data.items?.length || 0} Line Items</strong>
                    </div>
                  </div>

                  {selectedRecord.data.items && selectedRecord.data.items.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-gray-400 font-black text-[10px] tracking-wider uppercase">Order Line Items</span>
                      <div className="space-y-2">
                        {selectedRecord.data.items.map((item: any) => (
                          <div key={item.id} className="p-3 bg-white border rounded-xl flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-900">{item.service?.name || "Service"}</span>
                              <span className="block text-[10px] text-gray-500 font-semibold">Qty: {item.quantity}</span>
                            </div>
                            <span className="font-extrabold text-gray-900">LKR {Number(item.totalPrice || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* COLLECTION DETAILS */}
              {selectedRecord.type === "COLLECTION" && (
                <div className="space-y-4">
                  <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 space-y-2">
                    <span className="text-sky-800 font-bold block text-[11px]">Collection Pickup</span>
                    <h4 className="text-base font-black text-sky-950">Customer: {selectedRecord.data.order?.customer?.name}</h4>
                    <p className="text-xs font-black text-sky-700">Actual Weight: {selectedRecord.data.actualKgCollected || 0} KG</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Collection Date:</span>
                      <strong className="text-gray-900">{new Date(selectedRecord.data.createdAt).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold">Associated Order:</span>
                      <strong className="text-purple-900 font-bold">{selectedRecord.data.order?.orderNo || "N/A"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ROUTE ASSIGNMENT DETAILS */}
              {selectedRecord.type === "ASSIGNMENT" && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
                    <span className="text-indigo-800 font-bold block text-[11px]">Daily Route Shift</span>
                    <h4 className="text-base font-black text-indigo-950">{selectedRecord.data.route?.name} ({selectedRecord.data.route?.code})</h4>
                    <p className="text-xs text-indigo-700 font-bold">Area: {selectedRecord.data.route?.area || selectedRecord.data.route?.district || "Default Area"}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Work Date:</span>
                      <strong className="text-gray-900" suppressHydrationWarning>{new Date(selectedRecord.data.workDate).toLocaleDateString("en-US")}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold">Assignment Status:</span>
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-black">
                        {selectedRecord.data.status || "ACTIVE"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* LOG DETAILS */}
              {selectedRecord.type === "LOG" && (
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 space-y-2">
                    <span className="text-gray-500 font-bold block text-[11px]">Audit Event Log</span>
                    <h4 className="text-base font-black text-gray-900">{selectedRecord.data.action}</h4>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Timestamp:</span>
                      <strong className="text-gray-900">{new Date(selectedRecord.data.createdAt).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-gray-500 font-bold">Entity Type:</span>
                      <strong className="text-gray-900">{selectedRecord.data.entityType}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block mb-1">Description:</span>
                      <p className="text-gray-800 italic bg-white p-3 rounded-xl border">{selectedRecord.data.description || "No description logged."}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition shadow-2xs"
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
