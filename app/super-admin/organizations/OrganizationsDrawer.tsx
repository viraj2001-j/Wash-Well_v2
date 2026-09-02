"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Plus, Search, CheckCircle2, XCircle, ExternalLink, Copy, Check, UserPlus, Edit3, Power, Key, Eye, ShieldCheck, Phone, Mail, MapPin } from "lucide-react";

type CompanyData = {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  logoUrl: string | null;
  isActive: boolean;
  inactiveReason?: string | null;
  createdAt: string;
  _count: { branches: number; users: number };
  users: { id: string; fullName: string; email: string }[];
};

export default function OrganizationsDrawer({ initialData }: { initialData: CompanyData[] }) {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyData[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  const [sessionPasswords, setSessionPasswords] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);

  const [inactivateReason, setInactivateReason] = useState("");
  const [updateForm, setUpdateForm] = useState({ name: "", email: "", phone: "", address: "", city: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered search
  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }, [companies, searchQuery]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openDrawer = (company: CompanyData) => {
    setSelectedCompany(company);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedCompany(null), 300);
  };

  const openUpdateModal = () => {
    if (selectedCompany) {
      setUpdateForm({
        name: selectedCompany.name,
        email: selectedCompany.email || "",
        phone: selectedCompany.phone || "",
        address: selectedCompany.address || "",
        city: selectedCompany.city || "",
      });
      setIsUpdateModalOpen(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/super-admin/organizations/${selectedCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateDetails", ...updateForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCompanies(companies.map((c) => (c.id === selectedCompany.id ? { ...c, ...updateForm } : c)));
      setSelectedCompany({ ...selectedCompany, ...updateForm });
      setIsUpdateModalOpen(false);
      showToast("Organization updated successfully!", "success");
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to update organization", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedCompany) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/super-admin/organizations/${selectedCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleStatus", reason: inactivateReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const toggledStatus = !selectedCompany.isActive;
      const newReason = toggledStatus ? null : inactivateReason;

      setCompanies(
        companies.map((c) =>
          c.id === selectedCompany.id ? { ...c, isActive: toggledStatus, inactiveReason: newReason } : c
        )
      );
      setSelectedCompany({ ...selectedCompany, isActive: toggledStatus, inactiveReason: newReason });
      setIsInactivateModalOpen(false);
      setInactivateReason("");
      showToast(`Organization successfully ${toggledStatus ? "activated" : "inactivated"}!`, "success");
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "Failed to change status", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    pass += "1!";
    setAdminForm({ ...adminForm, password: pass });

    navigator.clipboard.writeText(pass);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const copyLoginUrl = (code: string) => {
    const url = `${window.location.origin}/c/${code}/login`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setIsProcessing(true);

    try {
      const createdPassword = adminForm.password;

      const res = await fetch(`/api/super-admin/organizations/${selectedCompany.id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });

      let data: any;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Server returned response status ${res.status}`);
      }

      if (!res.ok) throw new Error(data?.error || "Failed to create admin");

      setSessionPasswords((prev) => ({ ...prev, [data.user.id]: createdPassword }));

      const newAdmin = { id: data.user.id, fullName: data.user.fullName, email: data.user.email };
      const updatedCompany = { ...selectedCompany, users: [...(selectedCompany.users || []), newAdmin] };

      setSelectedCompany(updatedCompany);
      setCompanies(companies.map((c) => (c.id === selectedCompany.id ? updatedCompany : c)));

      showToast("Admin account created successfully!", "success");
      setIsAdminModalOpen(false);
      setAdminForm({ name: "", email: "", phone: "", password: "" });
    } catch (err: any) {
      showToast(err.message || "Failed to create admin", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST POPUP */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-2xl shadow-xl text-white text-xs font-black transition-all transform animate-in slide-in-from-top-5 duration-300 flex items-center gap-2 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-[#7C3AED] font-black text-[10px] rounded-md uppercase tracking-wider">
              Tenant Control Center
            </span>
            <span className="text-xs text-gray-400 font-bold">• {companies.length} Organizations Total</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Platform Organizations</h1>
          <p className="text-xs text-gray-500 font-medium">Manage multi-tenant company accounts, custom domains, and organization admins</p>
        </div>

        <Link
          href="/super-admin/organizations/new"
          className="px-4 py-2.5 bg-gradient-to-r from-[#7C3AED] to-purple-800 text-white rounded-xl font-extrabold text-xs shadow-md shadow-purple-200 hover:shadow-lg transition flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Add New Organization</span>
        </Link>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search organizations by name, code slug, email, or city..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
          />
        </div>
      </div>

      {/* ORGANIZATIONS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs overflow-hidden">
        {paginatedCompanies.length === 0 ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <Building2 className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
            <p className="font-bold text-sm">No organizations found matching your query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-5">Organization</th>
                  <th className="py-3.5 px-4">Code (Slug)</th>
                  <th className="py-3.5 px-4">Branches</th>
                  <th className="py-3.5 px-4">Users</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedCompanies.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => openDrawer(company)}
                    className="hover:bg-purple-50/30 transition cursor-pointer"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {company.logoUrl ? (
                            <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 text-sm">{company.name}</div>
                          <div className="text-gray-500 text-[11px] font-medium">{company.email || "No email listed"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-purple-900">
                      <span className="px-2.5 py-1 bg-purple-50 text-[#7C3AED] border border-purple-100 rounded-lg text-[11px]">
                        /c/{company.code}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-gray-800">{company._count.branches} Branches</td>
                    <td className="py-4 px-4 font-extrabold text-gray-800">{company._count.users} Users</td>
                    <td className="py-4 px-4">
                      {company.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(company);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-[#7C3AED] rounded-xl font-extrabold text-xs transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredCompanies.length)}</span> of{" "}
              <span className="font-bold">{filteredCompanies.length}</span> organizations
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY FOR DRAWER */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity" onClick={closeDrawer} />}

      {/* RIGHT SLIDING DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col font-sans ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedCompany && (
          <>
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 via-white to-purple-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#7C3AED] uppercase bg-purple-100 px-2 py-0.5 rounded-md">
                    Organization Profile
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 mt-0.5">{selectedCompany.name}</h3>
                </div>
              </div>
              <button onClick={closeDrawer} className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition">
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
                  {selectedCompany.logoUrl ? (
                    <img src={selectedCompany.logoUrl} className="object-cover h-full w-full" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900">{selectedCompany.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      /c/{selectedCompany.code}
                    </span>
                    {selectedCompany.isActive ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800">
                        INACTIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!selectedCompany.isActive && selectedCompany.inactiveReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                  <h4 className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Deactivation Reason</h4>
                  <p className="text-rose-700 italic">{selectedCompany.inactiveReason}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Contact & Location</h4>
                <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold">Email:</span>
                    <span className="font-extrabold text-gray-900">{selectedCompany.email || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold">Phone:</span>
                    <span className="font-extrabold text-gray-900">{selectedCompany.phone || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-gray-500 font-bold">Address:</span>
                    <span className="font-extrabold text-gray-900">{selectedCompany.address || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-bold">City / Country:</span>
                    <span className="font-extrabold text-gray-900">{selectedCompany.city ? `${selectedCompany.city}, ${selectedCompany.country}` : selectedCompany.country}</span>
                  </div>
                </div>
              </div>

              {/* ACCESS MANAGEMENT */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Access Management</h4>

                <div className="bg-purple-50/70 border border-purple-100 p-4 rounded-2xl space-y-2">
                  <span className="text-[11px] font-extrabold text-purple-900 block">Organization Login URL</span>
                  <div className="flex gap-2 items-center">
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/c/${selectedCompany.code}/login`}
                      className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-gray-600 outline-none font-mono"
                    />
                    <button
                      onClick={() => copyLoginUrl(selectedCompany.code)}
                      className="px-3 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition shrink-0"
                    >
                      {copiedLink ? "Copied!" : "Copy"}
                    </button>
                    <Link
                      href={`/c/${selectedCompany.code}/login`}
                      target="_blank"
                      className="px-3 py-2 bg-white border border-purple-200 text-[#7C3AED] rounded-xl text-xs font-bold hover:bg-purple-50 transition shrink-0 flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>

                <Link
                  href={`/c/${selectedCompany.code}/dashboard`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl hover:bg-black transition font-extrabold shadow-md"
                >
                  <Eye size={16} />
                  <span>Access Dashboard as Super Admin</span>
                </Link>

                {/* EXISTING ADMINS */}
                <div className="space-y-2 pt-2">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Organization Admins</h5>
                  {selectedCompany.users && selectedCompany.users.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCompany.users.map((u) => (
                        <div key={u.id} className="bg-white border border-gray-100 p-3.5 rounded-2xl space-y-2 shadow-2xs">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-extrabold text-gray-900">{u.fullName}</p>
                              <p className="text-gray-500 text-[11px] font-medium">{u.email}</p>
                            </div>
                            <span className="text-[10px] bg-purple-100 text-[#7C3AED] px-2.5 py-0.5 rounded-md font-black">
                              ORG_ADMIN
                            </span>
                          </div>

                          {sessionPasswords[u.id] && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                              <span className="text-[10px] font-black text-amber-800 uppercase block">Temporary Password</span>
                              <code className="block bg-white text-gray-900 border border-amber-200 p-2 rounded-lg font-mono text-xs select-all font-bold">
                                {sessionPasswords[u.id]}
                              </code>
                              <p className="text-[10px] text-amber-600 italic">Copy & save now. Disappears after page refresh.</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No admin accounts created yet for this organization.</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="w-full py-3 border-2 border-dashed border-purple-200 text-[#7C3AED] rounded-2xl hover:bg-purple-50 transition font-extrabold flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  <span>Create Admin Account</span>
                </button>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button
                type="button"
                onClick={openUpdateModal}
                className="flex-1 py-3 bg-[#7C3AED] text-white rounded-2xl hover:bg-purple-800 transition font-extrabold shadow-sm flex items-center justify-center gap-2"
              >
                <Edit3 size={16} />
                <span>Update</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInactivateModalOpen(true)}
                className={`flex-1 py-3 rounded-2xl transition font-extrabold shadow-sm text-white flex items-center justify-center gap-2 ${
                  selectedCompany.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <Power size={16} />
                <span>{selectedCompany.isActive ? "Inactivate" : "Activate"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* UPDATE MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleUpdate} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs font-sans">
            <h3 className="text-lg font-black text-gray-900">Update Organization Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Company Name</label>
                <input
                  required
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={updateForm.name}
                  onChange={(e) => setUpdateForm({ ...updateForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={updateForm.email}
                  onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone</label>
                <input
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={updateForm.phone}
                  onChange={(e) => setUpdateForm({ ...updateForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Address</label>
                <input
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={updateForm.address}
                  onChange={(e) => setUpdateForm({ ...updateForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">City</label>
                <input
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={updateForm.city}
                  onChange={(e) => setUpdateForm({ ...updateForm, city: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl font-extrabold hover:bg-purple-800 disabled:opacity-50 transition shadow-md shadow-purple-200"
              >
                {isProcessing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INACTIVATE/ACTIVATE MODAL */}
      {isInactivateModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 text-xs font-sans">
            <h3 className="text-lg font-black text-gray-900">
              {selectedCompany.isActive ? "Inactivate Organization?" : "Activate Organization?"}
            </h3>
            <p className="text-gray-600 font-medium">
              {selectedCompany.isActive
                ? "This will disable access for all users in this organization. Provide a reason below."
                : "This will restore system access for all users in this organization."}
            </p>

            {selectedCompany.isActive && (
              <textarea
                className="w-full border border-gray-200 p-3 rounded-xl text-xs outline-none focus:border-rose-500"
                rows={3}
                placeholder="Deactivation Reason (Optional)"
                value={inactivateReason}
                onChange={(e) => setInactivateReason(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsInactivateModalOpen(false)}
                className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isProcessing}
                className={`px-5 py-2.5 text-white rounded-xl font-extrabold disabled:opacity-50 transition shadow-md ${
                  selectedCompany.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isProcessing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ADMIN MODAL */}
      {isAdminModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateAdmin} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs font-sans">
            <div>
              <h3 className="text-lg font-black text-gray-900">Create Organization Admin</h3>
              <p className="text-gray-500 font-medium mt-0.5">Add an admin account for {selectedCompany.name}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  required
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  required
                  type="email"
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number (Optional)</label>
                <input
                  className="w-full border border-gray-200 p-2.5 rounded-xl outline-none focus:border-[#7C3AED]"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Temporary Password *</label>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    className="w-full border border-gray-200 p-2.5 rounded-xl bg-gray-50 outline-none focus:border-[#7C3AED] font-mono font-bold"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Click Generate or type..."
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-[#7C3AED] rounded-xl font-extrabold text-xs transition shrink-0"
                  >
                    {copiedPassword ? "Copied!" : "Generate"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(false)}
                className="px-4 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 bg-[#7C3AED] text-white rounded-xl font-extrabold hover:bg-purple-800 disabled:opacity-50 transition shadow-md shadow-purple-200"
              >
                {isProcessing ? "Creating..." : "Create Admin"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}