"use client";

import { useState } from "react";
import { WashingMachine, CheckCircle2, ArrowRight, Clock, ShieldCheck, Sparkles, Filter, AlertCircle, X } from "lucide-react";

interface ProcessingClientProps {
  companyCode: string;
  companyId: string;
  initialProcessings: any[];
  ordersCollected: any[];
}

const STAGES = [
  { id: "RECEIVED", label: "Received", color: "bg-blue-50 border-blue-200 text-blue-900" },
  { id: "SORTING", label: "Sorting", color: "bg-[#503B91]/10 border-[#503B91]/20 text-[#503B91]" },
  { id: "WASHING", label: "Washing", color: "bg-indigo-50 border-indigo-200 text-indigo-900" },
  { id: "DRYING", label: "Drying", color: "bg-amber-50 border-amber-200 text-amber-900" },
  { id: "FINISHING", label: "Finishing/Iron", color: "bg-purple-50 border-purple-200 text-purple-900" },
  { id: "QUALITY_CHECK", label: "Quality Check", color: "bg-teal-50 border-teal-200 text-teal-900" },
  { id: "READY", label: "Ready for Delivery", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
];

export default function ProcessingClient({
  companyCode,
  companyId,
  initialProcessings = [],
  ordersCollected = [],
}: ProcessingClientProps) {
  const [processings, setProcessings] = useState<any[]>(initialProcessings);
  const [ordersList, setOrdersList] = useState<any[]>(ordersCollected);
  const [loading, setLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAdvanceStage = async (orderId: string, nextStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/processing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: nextStatus,
          notes: `Moved to ${nextStatus}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProcessings((prev) => {
          const exists = prev.some((p) => p.orderId === orderId);
          if (exists) {
            return prev.map((p) => (p.orderId === orderId ? { ...p, status: nextStatus } : p));
          } else {
            return [data.data, ...prev];
          }
        });
        setOrdersList((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, processing: data.data } : o))
        );
        showToast(`Order stage advanced to ${nextStatus}!`, "success");
      } else {
        showToast(data.error || "Failed to update processing stage", "error");
      }
    } catch (err) {
      showToast("Failed to advance processing stage", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laundry Processing Kanban</h1>
          <p className="text-xs text-gray-500 mt-1">Track physical laundry stages from facility receiving to ready for delivery</p>
        </div>
      </div>

      {/* KANBAN COLUMNS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage, sIdx) => {
          const cardsInStage = ordersList.filter((ord) => {
            const currentStage = ord.processing?.status || "RECEIVED";
            return currentStage === stage.id;
          });

          const nextStage = STAGES[sIdx + 1];

          return (
            <div key={stage.id} className="flex flex-col rounded-3xl bg-gray-50 border border-gray-200/80 p-3 min-h-[500px]">
              <div className={`p-2.5 rounded-2xl border ${stage.color} font-bold text-xs flex items-center justify-between mb-3 shadow-sm`}>
                <span>{stage.label}</span>
                <span className="w-5 h-5 rounded-full bg-white/80 text-[10px] flex items-center justify-center font-bold">
                  {cardsInStage.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {cardsInStage.length === 0 ? (
                  <div className="text-[11px] text-gray-400 text-center py-10 font-medium">
                    No orders in {stage.label}
                  </div>
                ) : (
                  cardsInStage.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2.5 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 text-xs">{ord.orderNo}</span>
                        <span className="text-[10px] text-gray-400" suppressHydrationWarning>
                          {new Date(ord.createdAt).toLocaleDateString("en-US")}
                        </span>
                      </div>

                      <div className="text-xs">
                        <p className="font-semibold text-gray-800">{ord.customer?.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {ord.pickup?.items?.length || 0} Collected Items
                        </p>
                      </div>

                      {nextStage && (
                        <button
                          onClick={() => handleAdvanceStage(ord.id, nextStage.id)}
                          disabled={loading}
                          className="w-full py-1.5 bg-[#6C4ED8] hover:bg-[#503B91] text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition shadow-sm"
                        >
                          Move to {nextStage.label} <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

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
