"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface CustomerProfileClientProps {
  companyCode: string;
  user: {
    fullName: string;
    email: string;
    phone: string;
  };
  customer: any;
}

export default function CustomerProfileClient({
  companyCode,
  user,
  customer,
}: CustomerProfileClientProps) {
  const [fullName, setFullName] = useState(user.fullName || customer?.name || "");
  const [phone, setPhone] = useState(user.phone || customer?.phone || "");
  const [placeName, setPlaceName] = useState(customer?.placeName || "");
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">(
    customer?.customerType || "INDIVIDUAL"
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/c/${companyCode}/customer/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          placeName,
          customerType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setSuccessMsg("Profile details updated successfully!");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-purple-600/10 border border-purple-200 flex items-center justify-center text-purple-700 text-xl font-bold shrink-0">
          {fullName.charAt(0).toUpperCase() || "C"}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>{fullName || "My Customer Profile"}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Verified Account
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer No: <strong className="font-mono text-purple-700">{customer?.customerNo || "CUST-00001"}</strong> • Registered Email: {user.email}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900">Personal & Business Details</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Update your contact information for laundry collection and invoicing.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          {/* Account Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Account Category
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setCustomerType("INDIVIDUAL")}
                className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  customerType === "INDIVIDUAL"
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Individual
              </button>

              <button
                type="button"
                onClick={() => setCustomerType("BUSINESS")}
                className={`py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  customerType === "BUSINESS"
                    ? "bg-purple-600 border-purple-600 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Building className="w-3.5 h-3.5" /> Hotel / Business
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name / Contact Person *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full h-11 pl-10 pr-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Hotel / Business Name
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Grand City Hotel"
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-purple-600 transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
            >
              {loading ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
