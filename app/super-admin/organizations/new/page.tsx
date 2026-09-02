"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, ArrowLeft, Upload, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Sri Lanka",
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const generatedCode = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setFormData({ ...formData, name: newName, code: generatedCode });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size must be less than 5MB.");
      return;
    }

    setErrorMessage("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("code", formData.code);
      dataToSend.append("email", formData.email);
      dataToSend.append("phone", formData.phone);
      dataToSend.append("address", formData.address);
      dataToSend.append("city", formData.city);
      dataToSend.append("country", formData.country);

      if (logoFile) {
        dataToSend.append("logo", logoFile);
      }

      const response = await fetch("/api/super-admin/organizations", {
        method: "POST",
        body: dataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      router.push("/super-admin/organizations");
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      
      {/* TOP BACK LINK & HEADER */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
        <Link
          href="/super-admin/organizations"
          className="w-10 h-10 rounded-2xl bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-[#7C3AED] flex items-center justify-center transition shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-[#7C3AED] font-black text-[10px] rounded-md uppercase tracking-wider">
              Tenant Registration
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">Register New Organization</h1>
          <p className="text-xs text-gray-500 font-medium">Create a new company tenant on Wash & Well Platform</p>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-xs font-extrabold animate-in fade-in duration-200">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs space-y-6 text-xs">
        
        {/* LOGO UPLOAD SECTION */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-700 block">Company Logo (Optional)</label>
          <div className="flex items-center gap-4 p-4 bg-gray-50/70 border border-gray-100 rounded-2xl">
            {logoPreview ? (
              <img src={logoPreview} alt="Preview" className="h-16 w-16 object-cover rounded-2xl border border-gray-200 shadow-2xs shrink-0" />
            ) : (
              <div className="h-16 w-16 bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0">
                <Building2 size={24} />
              </div>
            )}
            <div className="space-y-1">
              <label className="cursor-pointer inline-flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-gray-50 border border-gray-200 shadow-2xs transition">
                <Upload size={14} className="text-[#7C3AED]" />
                <span>Upload Logo File</span>
                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
              </label>
              <p className="text-[10px] text-gray-400 font-medium">Supports JPG, PNG, WebP (Max 5MB)</p>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* BASIC INFORMATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">Company Name *</label>
            <input
              required
              type="text"
              placeholder="e.g. Wash & Well Colombo"
              value={formData.name}
              onChange={handleNameChange}
              className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">Generated Code Slug *</label>
            <input
              required
              type="text"
              placeholder="wash-well-colombo"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full pl-3.5 pr-4 py-2.5 bg-purple-50/60 border border-purple-100 text-purple-900 font-mono font-bold rounded-xl outline-none focus:border-[#7C3AED] transition"
            />
          </div>
        </div>

        {/* CONTACT & LOCATION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">Email Address</label>
            <input
              type="email"
              placeholder="contact@wash-well.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">Phone Number</label>
            <input
              type="tel"
              placeholder="+94 11 234 5678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-black text-gray-700 block">Street Address</label>
            <input
              type="text"
              placeholder="Main Street, Business Zone"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">City</label>
            <input
              type="text"
              placeholder="Colombo"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full pl-3.5 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
            />
          </div>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
          <Link
            href="/super-admin/organizations"
            className="px-5 py-2.5 border border-gray-200 text-gray-700 font-extrabold rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-[#7C3AED] to-purple-800 text-white font-extrabold rounded-xl hover:shadow-lg shadow-purple-200 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating Organization...</span>
              </>
            ) : (
              <span>Create Organization</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
