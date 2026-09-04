"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, UserCheck, Power, TrendingUp, Search, Plus, Phone, Mail, 
  Star, Lock, CheckCircle, X, Shield, DollarSign, MapPin, CreditCard,
  FileText, Copy, ExternalLink, RefreshCw, AlertCircle, Truck, ShieldCheck
} from "lucide-react";

type Role = { id: string; name: string; description?: string | null };

type UserData = {
  id: string;
  fullName: string;
  username: string | null;
  email: string;
  phone: string | null;
  salary: number | null;
  commission: number | null;
  isActive: boolean;
  createdAt: string;
  roles: { role: Role }[];
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  notes?: string | null;
  termsAccepted?: boolean;
  assignedRoute?: { id: string; code: string; name: string } | null;
  customerCount?: number;
};

export default function UsersClient({ 
  companyCode, 
  initialUsers, 
  roles: initialRoles, 
  kpis 
}: { 
  companyCode: string; 
  initialUsers: UserData[]; 
  roles: Role[]; 
  kpis: {
    total: number;
    active: number;
    inactive: number;
    totalCustomers: number;
    admins: number;
    refs: number;
    drivers: number;
  };
}) {
  const router = useRouter();

  // State management
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // UI Controls
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [createActiveTab, setCreateActiveTab] = useState<"ADDRESS" | "BANK" | "NOTES">("ADDRESS");
  const [editActiveTab, setEditActiveTab] = useState<"ADDRESS" | "BANK" | "NOTES">("ADDRESS");

  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copiedPassword, setCopiedPassword] = useState(false);
  
  // Feedback toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form State for User Creation
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    roleId: "",
    phone: "",
    salary: "",
    commission: "",
    address1: "",
    address2: "",
    city: "",
    zip: "",
    state: "",
    accountName: "",
    accountNumber: "",
    accountType: "Savings",
    bankName: "",
    bankBranch: "",
    ifscCode: "",
    swiftCode: "",
    notes: "",
    termsAccepted: false
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<UserData> & { roleId?: string }>({});

  // Role Form State
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });

  // Generate 12-char secure temporary password
  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += "1!";
    setFormData(prev => ({ ...prev, password: pass }));
    setGeneratedPassword(pass);
    showToast("Temporary password generated!", "success");
  };

  const copyPasswordToClipboard = () => {
    if (formData.password) {
      navigator.clipboard.writeText(formData.password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  // Helper functions for user role identification
  const isRep = (user: UserData) => 
    user.roles.some(r => {
      const n = r.role.name.toUpperCase();
      return n === "REF" || n === "ROUTE_REP" || n.includes("REP") || n.includes("REF");
    });

  const isDriver = (user: UserData) => 
    user.roles.some(r => {
      const n = r.role.name.toUpperCase();
      return n === "DRIVER" || n.includes("DRIVER");
    });

  // Filter users based on tab and search query (Show each and every user)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Tab filter
      if (filterTab === "ACTIVE" && !user.isActive) return false;
      if (filterTab === "INACTIVE" && user.isActive) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(q) ||
        (user.username && user.username.toLowerCase().includes(q)) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone && user.phone.includes(q)) ||
        (user.assignedRoute && user.assignedRoute.name.toLowerCase().includes(q)) ||
        user.roles.some(r => r.role.name.toLowerCase().includes(q))
      );
    });
  }, [users, filterTab, searchQuery]);

  // Role Badge Renderer with distinct colors per role
  const renderRoleBadge = (user: UserData) => {
    if (isRep(user)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#F0EBFF] text-[#7C3AED] border border-purple-200/80">
          Route Rep
        </span>
      );
    }
    if (isDriver(user)) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200/80">
          Driver
        </span>
      );
    }
    const roleName = user.roles[0]?.role.name || "Staff";
    const upper = roleName.toUpperCase();
    if (upper.includes("ADMIN")) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          {roleName}
        </span>
      );
    }
    if (upper.includes("MANAGER")) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80">
          {roleName}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        {roleName}
      </span>
    );
  };

  // Helper for avatar circle background color per role
  const getAvatarBgClass = (user: UserData) => {
    if (isRep(user)) return "bg-[#7C3AED]";
    if (isDriver(user)) return "bg-[#0284C7]";
    const roleName = (user.roles[0]?.role.name || "").toUpperCase();
    if (roleName.includes("ADMIN")) return "bg-indigo-600";
    if (roleName.includes("MANAGER")) return "bg-amber-600";
    return "bg-emerald-600";
  };

  // Drawer Handler
  const openDrawer = (user: UserData) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  // Handle User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/c/${companyCode}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      showToast("Sales Rep / User registered successfully!", "success");
      
      // Update local state or trigger refresh
      const createdRole = roles.find(r => r.id === formData.roleId);
      const newUserObj: UserData = {
        ...data.user,
        salary: data.user.salary ? Number(data.user.salary) : null,
        commission: data.user.commission ? Number(data.user.commission) : null,
        createdAt: new Date().toISOString(),
        roles: createdRole ? [{ role: createdRole }] : [],
        assignedRoute: null,
        customerCount: 0,
      };

      setUsers([newUserObj, ...users]);
      
      // Reset form but leave temporary password visible in toast/alert if desired
      setFormData({
        name: "", username: "", email: "", password: "", roleId: "", phone: "",
        salary: "", commission: "", address1: "", address2: "", city: "", zip: "", state: "",
        accountName: "", accountNumber: "", accountType: "Savings", bankName: "", bankBranch: "",
        ifscCode: "", swiftCode: "", notes: "", termsAccepted: false
      });
      setIsCreateModalOpen(false);
      router.refresh();
    } catch (err: any) {
      showToast(err.message || "An error occurred while creating user", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Role Creation
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create role");

      setRoles([...roles, data.role]);
      setFormData(prev => ({ ...prev, roleId: data.role.id })); // Auto select new role
      setIsRoleModalOpen(false);
      setRoleForm({ name: "", description: "" });
      showToast(`Role "${data.role.name}" created successfully!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to create role", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Toggle Active/Inactive Status
  const handleToggleStatus = async (user: UserData) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/c/${companyCode}/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleStatus" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      const updatedUsers = users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u);
      setUsers(updatedUsers);
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, isActive: !selectedUser.isActive });
      }

      showToast(`User ${!user.isActive ? "Activated" : "Inactivated"} successfully!`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Edit User
  const openEditModal = (user: UserData) => {
    setEditFormData({
      fullName: user.fullName,
      username: user.username || "",
      email: user.email,
      phone: user.phone || "",
      salary: user.salary,
      commission: user.commission,
      address1: user.address1 || "",
      address2: user.address2 || "",
      city: user.city || "",
      state: user.state || "",
      zip: user.zip || "",
      accountName: user.accountName || "",
      accountNumber: user.accountNumber || "",
      accountType: user.accountType || "Savings",
      bankName: user.bankName || "",
      bankBranch: user.bankBranch || "",
      ifscCode: user.ifscCode || "",
      swiftCode: user.swiftCode || "",
      notes: user.notes || "",
      roleId: user.roles[0]?.role.id || ""
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`/api/c/${companyCode}/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateDetails", ...editFormData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      const updatedRole = roles.find(r => r.id === editFormData.roleId);
      const updatedUserObj: UserData = {
        ...selectedUser,
        fullName: editFormData.fullName || selectedUser.fullName,
        username: editFormData.username || null,
        phone: editFormData.phone || null,
        salary: editFormData.salary !== undefined && editFormData.salary !== null ? Number(editFormData.salary) : selectedUser.salary,
        commission: editFormData.commission !== undefined && editFormData.commission !== null ? Number(editFormData.commission) : selectedUser.commission,
        roles: updatedRole ? [{ role: updatedRole }] : selectedUser.roles,
        address1: editFormData.address1 || null,
        address2: editFormData.address2 || null,
        city: editFormData.city || null,
        state: editFormData.state || null,
        zip: editFormData.zip || null,
        accountName: editFormData.accountName || null,
        accountNumber: editFormData.accountNumber || null,
        accountType: editFormData.accountType || null,
        bankName: editFormData.bankName || null,
        bankBranch: editFormData.bankBranch || null,
        ifscCode: editFormData.ifscCode || null,
        swiftCode: editFormData.swiftCode || null,
        notes: editFormData.notes || null,
      };

      setUsers(users.map(u => u.id === selectedUser.id ? updatedUserObj : u));
      setSelectedUser(updatedUserObj);
      setIsEditModalOpen(false);
      showToast("User details updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update user", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Format initial avatar letter
  const getAvatarLetter = (name: string) => name ? name.charAt(0).toUpperCase() : "U";

  const formatCurrency = (val?: number | null) => {
    if (val === null || val === undefined) return "LKR: 0";
    return `LKR: ${val.toLocaleString()}`;
  };

  const stats = {
    total: users.length,
    reps: users.filter(isRep).length,
    drivers: users.filter(isDriver).length,
    admins: users.filter((u) => u.roles.some((r) => (r.role.name || "").toUpperCase().includes("ADMIN") || (r.role.name || "").toUpperCase().includes("MANAGER"))).length,
  };

  return (
    <div className="p-4 md:p-6 max-w-[1360px] mx-auto space-y-6 font-sans bg-[#f8fafc] min-h-screen">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2.5 ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e1b4b] tracking-tight">Organization Users</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Manage your team members, track assignments and roles.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-1.5 bg-[#6346f6] hover:bg-[#5235e5] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* 4 COLORFUL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div className="bg-[#4f46e5] p-3.5 px-4 rounded-2xl text-white shadow-md shadow-indigo-200/40 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">TOTAL USERS</span>
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <Users size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">{stats.total}</p>
            <span className="text-[9.5px] text-white/90 font-medium flex items-center gap-0.5 mt-0.5">
              Total registered accounts
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-white fill-none stroke-[2]">
              <path d="M 0,16 Q 15,14 30,12 T 50,11 T 70,4 T 85,12 L 100,14" />
            </svg>
          </div>
        </div>

        {/* Sales Reps */}
        <div className="bg-[#e6f7ef] border border-emerald-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">SALES REPS</span>
            <div className="w-7 h-7 rounded-lg bg-[#d1fae5] text-[#059669] flex items-center justify-center font-bold">
              <UserCheck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{stats.reps}</p>
            <span className="text-[9.5px] text-[#059669] font-medium flex items-center gap-0.5 mt-0.5">
              Active field representatives
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#059669] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Drivers */}
        <div className="bg-[#fffbeb] border border-amber-200/60 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b45309]">DRIVERS</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef3c7] text-[#d97706] flex items-center justify-center font-bold">
              <Truck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{stats.drivers}</p>
            <span className="text-[9.5px] text-[#d97706] font-medium flex items-center gap-0.5 mt-0.5">
              Logistics drivers
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#d97706] fill-none stroke-[2]">
              <path d="M 0,14 Q 20,12 40,10 T 60,14 T 80,8 L 100,10" />
            </svg>
          </div>
        </div>

        {/* Admin & Managers */}
        <div className="bg-[#f3e8ff] border border-purple-200/50 p-3.5 px-4 rounded-2xl shadow-2xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6d28d9]">ADMIN & MANAGERS</span>
            <div className="w-7 h-7 rounded-lg bg-[#e9d5ff] text-[#7c3aed] flex items-center justify-center font-bold">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{stats.admins}</p>
            <span className="text-[9.5px] text-[#7c3aed] font-medium flex items-center gap-0.5 mt-0.5">
              Management roles
            </span>
          </div>
          <div className="pt-0.5">
            <svg viewBox="0 0 100 20" className="w-full h-4.5 stroke-[#7c3aed] fill-none stroke-[2]">
              <path d="M 0,12 Q 20,11 40,9 T 60,10 T 80,8 L 100,9" />
            </svg>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER TOOLBAR */}

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="flex-1 flex items-center gap-2.5 bg-gray-50/70 px-4 py-2.5 rounded-full border border-gray-200/80 focus-within:border-purple-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-100 transition-all">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search by name, username, email, role or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setFilterTab("ALL")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterTab === "ALL" ? "bg-[#7C3AED] text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterTab("ACTIVE")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterTab === "ACTIVE" ? "bg-[#7C3AED] text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilterTab("INACTIVE")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterTab === "INACTIVE" ? "bg-[#7C3AED] text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Inactive
          </button>

          <span className="ml-1 bg-gray-100 text-gray-700 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap">
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
          </span>
        </div>

      </div>

      {/* SALES REPRESENTATIVES TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-700 text-xs font-extrabold tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Routes</th>
                <th className="px-6 py-4">Customers</th>
                <th className="px-6 py-4">Salary</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => openDrawer(user)}
                    className="hover:bg-purple-50/30 cursor-pointer transition-colors duration-150"
                  >
                    {/* Representative */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAvatarBgClass(user)} text-white font-black flex items-center justify-center text-xs shadow-xs flex-shrink-0`}>
                          {getAvatarLetter(user.fullName)}
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900 text-xs">{user.fullName}</div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <span>👤</span>
                            {user.username || user.email.split("@")[0]}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderRoleBadge(user)}
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {user.phone || "-"}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {user.email}
                        </div>
                      </div>
                    </td>

                    {/* Routes */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.assignedRoute ? (
                        <span className="inline-flex items-center bg-[#F0EBFF] text-[#7C3AED] px-3 py-1 rounded-full text-[11px] font-bold">
                          {user.assignedRoute.code} - {user.assignedRoute.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Not assigned</span>
                      )}
                    </td>

                    {/* Customers */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-[#F0EBFF] text-[#7C3AED] px-3 py-1 rounded-full text-xs font-bold">
                        <Star className="w-3 h-3 fill-[#7C3AED] stroke-[#7C3AED]" />
                        {user.customerCount || 0}
                      </span>
                    </td>

                    {/* Salary */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center bg-[#F0EBFF] text-[#7C3AED] px-3 py-1 rounded-full text-xs font-extrabold">
                        {formatCurrency(user.salary)}
                      </span>
                    </td>

                    {/* Commission (Only for Route Reps) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isRep(user) ? (
                        <span className="inline-flex items-center text-emerald-600 text-xs font-bold">
                          {user.commission ? `${user.commission}%` : "0%"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${user.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200/80" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-xs">
                    No users found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER / ADD REP MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden my-auto border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Add Organization User</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Register a new employee into your organization team.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: 2-Column Side-by-Side Grid */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <form id="createUserForm" onSubmit={handleCreateUser}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT COLUMN: BASIC INFORMATION */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" /> Basic Information
                      </h4>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                      <input 
                        required 
                        placeholder="e.g. Sunil Perera"
                        className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Login Username</label>
                        <input 
                          placeholder="sunil_sales"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={formData.username} 
                          onChange={e => setFormData({...formData, username: e.target.value})} 
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                        <input 
                          required 
                          type="email" 
                          placeholder="sunil@gmail.com"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Role *</label>
                      <div className="flex gap-2">
                        <select 
                          required 
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={formData.roleId} 
                          onChange={e => setFormData({...formData, roleId: e.target.value})}
                        >
                          <option value="">Select a role...</option>
                          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <button 
                          type="button" 
                          onClick={() => setIsRoleModalOpen(true)} 
                          className="px-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold text-base transition shrink-0"
                          title="Add New Role"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Base Salary (LKR)</label>
                        <input 
                          type="number" 
                          placeholder="45000"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={formData.salary} 
                          onChange={e => setFormData({...formData, salary: e.target.value})} 
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Commission %</label>
                        <input 
                          type="number" 
                          placeholder="10"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={formData.commission} 
                          onChange={e => setFormData({...formData, commission: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Personal Phone</label>
                      <input 
                        placeholder="0771234567"
                        className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Temporary Password *</label>
                      <div className="flex gap-2">
                        <input 
                          required 
                          readOnly 
                          placeholder="Click Generate to create password..."
                          className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-mono outline-none" 
                          value={formData.password} 
                        />
                        <button 
                          type="button" 
                          onClick={handleGeneratePassword} 
                          className="px-3 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold text-xs whitespace-nowrap transition flex items-center gap-1 shrink-0"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Generate
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: TABBED DETAILS */}
                  <div className="lg:col-span-6 flex flex-col space-y-4">
                    
                    {/* Tab Navigation Strip */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setCreateActiveTab("ADDRESS")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
                          createActiveTab === "ADDRESS"
                            ? "bg-white text-[#7C3AED] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        📍 Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateActiveTab("BANK")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
                          createActiveTab === "BANK"
                            ? "bg-white text-[#7C3AED] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        🏦 Bank Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateActiveTab("NOTES")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
                          createActiveTab === "NOTES"
                            ? "bg-white text-[#7C3AED] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        📝 Notes & Terms
                      </button>
                    </div>

                    {/* Active Tab Panel Body */}
                    <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 flex-1 space-y-3">
                      
                      {/* ADDRESS TAB */}
                      {createActiveTab === "ADDRESS" && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Address Line 1</label>
                            <input 
                              placeholder="Street address..."
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={formData.address1} 
                              onChange={e => setFormData({...formData, address1: e.target.value})} 
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Address Line 2</label>
                            <input 
                              placeholder="Apartment, suite, unit, etc."
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={formData.address2} 
                              onChange={e => setFormData({...formData, address2: e.target.value})} 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">City / Town</label>
                              <input 
                                placeholder="Colombo"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={formData.city} 
                                onChange={e => setFormData({...formData, city: e.target.value})} 
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Postal / Zip Code</label>
                              <input 
                                placeholder="00700"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={formData.zip} 
                                onChange={e => setFormData({...formData, zip: e.target.value})} 
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">State / Province</label>
                            <input 
                              placeholder="Western Province"
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={formData.state} 
                              onChange={e => setFormData({...formData, state: e.target.value})} 
                            />
                          </div>
                        </div>
                      )}

                      {/* BANK DETAILS TAB */}
                      {createActiveTab === "BANK" && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Account Holder Name</label>
                            <input 
                              placeholder="Name as per bank account"
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={formData.accountName} 
                              onChange={e => setFormData({...formData, accountName: e.target.value})} 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Account Number</label>
                              <input 
                                placeholder="Bank account number"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={formData.accountNumber} 
                                onChange={e => setFormData({...formData, accountNumber: e.target.value})} 
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Account Type</label>
                              <select 
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={formData.accountType} 
                                onChange={e => setFormData({...formData, accountType: e.target.value})}
                              >
                                <option value="Savings">Savings</option>
                                <option value="Current">Current</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Bank Name</label>
                              <input 
                                placeholder="Commercial Bank, Sampath, etc."
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={formData.bankName} 
                                onChange={e => setFormData({...formData, bankName: e.target.value})} 
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Bank Branch</label>
                              <input 
                                placeholder="Branch name"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={formData.bankBranch} 
                                onChange={e => setFormData({...formData, bankBranch: e.target.value})} 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NOTES TAB */}
                      {createActiveTab === "NOTES" && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Internal Notes</label>
                            <textarea 
                              rows={4} 
                              placeholder="Add any internal comments or coverage assignment notes..."
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={formData.notes} 
                              onChange={e => setFormData({...formData, notes: e.target.value})} 
                            />
                          </div>

                          <div className="pt-2 flex items-center gap-2.5">
                            <input 
                              type="checkbox" 
                              id="termsAccepted" 
                              required 
                              className="w-4 h-4 text-[#7C3AED] rounded focus:ring-purple-400"
                              checked={formData.termsAccepted} 
                              onChange={e => setFormData({...formData, termsAccepted: e.target.checked})} 
                            />
                            <label htmlFor="termsAccepted" className="text-xs text-gray-700 font-medium">
                              I confirm this employee has agreed to company terms & agreements.
                            </label>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/80 shrink-0">
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)} 
                className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="createUserForm" 
                disabled={isProcessing} 
                className="px-6 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold text-xs shadow-md shadow-purple-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? "Registering..." : "Register User"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE ROLE POPUP */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <form onSubmit={handleCreateRole} className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-900">Add New Role</h3>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Role Name (e.g. Sales Executive)</label>
              <input 
                required 
                className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-purple-400" 
                value={roleForm.name} 
                onChange={e => setRoleForm({...roleForm, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
              <input 
                className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-purple-400" 
                value={roleForm.description} 
                onChange={e => setRoleForm({...roleForm, description: e.target.value})} 
              />
            </div>
            <div className="pt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-xs">Cancel</button>
              <button type="submit" disabled={isProcessing} className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl font-bold text-xs">{isProcessing ? "Saving..." : "Save Role"}</button>
            </div>
          </form>
        </div>
      )}

      {/* USER DETAIL SLIDE-OVER DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 transition-opacity" onClick={closeDrawer} />
      )}

      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        {selectedUser && (
          <>
            {/* Drawer Header */}
            <div className="p-6 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Representative Profile</h2>
              <button onClick={closeDrawer} className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full flex items-center justify-center">✕</button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Profile Card */}
              <div className="flex items-center gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100/50">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {getAvatarLetter(selectedUser.fullName)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.fullName}</h3>
                  <p className="text-xs text-gray-500">@{selectedUser.username || selectedUser.email.split("@")[0]}</p>
                  <span className={`inline-flex mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${selectedUser.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"}`}>
                    {selectedUser.isActive ? "Active Rep" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Roles & Route Info */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-xs">
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-1">Assigned Role</strong> 
                  {selectedUser.roles.map(r => (
                    <span key={r.role.id} className="bg-[#7C3AED] text-white px-2.5 py-1 rounded-md font-bold text-[11px] mr-1 inline-block">
                      {r.role.name}
                    </span>
                  ))}
                </p>
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-1">Assigned Route</strong> 
                  {selectedUser.assignedRoute ? (
                    <span className="text-purple-700 font-bold">{selectedUser.assignedRoute.code} - {selectedUser.assignedRoute.name}</span>
                  ) : (
                    <span className="text-gray-400 italic">No route assigned</span>
                  )}
                </p>
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-1">Registered Customers</strong> 
                  <span className="font-bold text-gray-800">{selectedUser.customerCount || 0} customers</span>
                </p>
              </div>

              {/* Contact & Address */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-xs">
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-0.5">Email</strong> <span className="font-semibold text-gray-800">{selectedUser.email}</span></p>
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-0.5">Phone</strong> <span className="font-semibold text-gray-800">{selectedUser.phone || "-"}</span></p>
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-0.5">City / Address</strong> <span className="font-semibold text-gray-800">{selectedUser.city || selectedUser.address1 || "-"}</span></p>
              </div>

              {/* Financial Terms */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-xs">
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-0.5">Base Salary</strong> <span className="font-bold text-purple-700">{formatCurrency(selectedUser.salary)}</span></p>
                <p><strong className="text-gray-400 uppercase tracking-wider block mb-0.5">Commission Rate</strong> <span className="font-bold text-emerald-700">{selectedUser.commission ? `${selectedUser.commission}%` : "0%"}</span></p>
              </div>

            </div>

            {/* Drawer Actions */}
            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button 
                onClick={() => openEditModal(selectedUser)}
                className="flex-1 py-3 rounded-xl bg-purple-100 text-[#7C3AED] hover:bg-purple-200 font-bold text-xs transition"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => handleToggleStatus(selectedUser)}
                disabled={isProcessing}
                className={`flex-1 py-3 rounded-xl text-white font-bold text-xs transition ${selectedUser.isActive ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {selectedUser.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>

          </>
        )}
      </div>

      {/* EDIT USER MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden my-auto border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-200">
                  <UserCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Edit User Profile</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Update personal details, role, contact info, and banking information.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="w-8 h-8 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content Body: 2-Column Grid */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <form id="editUserForm" onSubmit={handleUpdateUser}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* LEFT COLUMN: BASIC INFORMATION */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4" /> Basic Information
                      </h4>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                      <input 
                        required 
                        placeholder="Full Name"
                        className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                        value={editFormData.fullName || ""} 
                        onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Login Username</label>
                        <input 
                          placeholder="Username"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={editFormData.username || ""} 
                          onChange={e => setEditFormData({...editFormData, username: e.target.value})} 
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Email (Read-only)</label>
                        <input 
                          readOnly
                          type="email" 
                          className="w-full bg-gray-100 border border-gray-200 p-2.5 rounded-xl text-xs text-gray-500 outline-none" 
                          value={editFormData.email || selectedUser.email} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Assigned Role *</label>
                      <select 
                        required 
                        className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                        value={editFormData.roleId || ""} 
                        onChange={e => setEditFormData({...editFormData, roleId: e.target.value})}
                      >
                        <option value="">Select a role...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Base Salary (LKR)</label>
                        <input 
                          type="number" 
                          placeholder="45000"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={editFormData.salary ?? ""} 
                          onChange={e => setEditFormData({...editFormData, salary: e.target.value ? parseFloat(e.target.value) : null})} 
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Commission %</label>
                        <input 
                          type="number" 
                          placeholder="10"
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                          value={editFormData.commission ?? ""} 
                          onChange={e => setEditFormData({...editFormData, commission: e.target.value ? parseFloat(e.target.value) : null})} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Personal Phone</label>
                      <input 
                        placeholder="0771234567"
                        className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                        value={editFormData.phone || ""} 
                        onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                      />
                    </div>

                  </div>

                  {/* RIGHT COLUMN: TABBED DETAILS */}
                  <div className="lg:col-span-6 flex flex-col space-y-4">
                    
                    {/* Tab Navigation Strip */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditActiveTab("ADDRESS")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
                          editActiveTab === "ADDRESS"
                            ? "bg-white text-[#7C3AED] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        📍 Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditActiveTab("BANK")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
                          editActiveTab === "BANK"
                            ? "bg-white text-[#7C3AED] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        🏦 Bank Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditActiveTab("NOTES")}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
                          editActiveTab === "NOTES"
                            ? "bg-white text-[#7C3AED] shadow-xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        📝 Internal Notes
                      </button>
                    </div>

                    {/* Active Tab Panel Body */}
                    <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-100 flex-1 space-y-3">
                      
                      {/* ADDRESS TAB */}
                      {editActiveTab === "ADDRESS" && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Address Line 1</label>
                            <input 
                              placeholder="Street address..."
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={editFormData.address1 || ""} 
                              onChange={e => setEditFormData({...editFormData, address1: e.target.value})} 
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Address Line 2</label>
                            <input 
                              placeholder="Apartment, suite, unit, etc."
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={editFormData.address2 || ""} 
                              onChange={e => setEditFormData({...editFormData, address2: e.target.value})} 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">City / Town</label>
                              <input 
                                placeholder="Colombo"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={editFormData.city || ""} 
                                onChange={e => setEditFormData({...editFormData, city: e.target.value})} 
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Postal / Zip Code</label>
                              <input 
                                placeholder="00700"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={editFormData.zip || ""} 
                                onChange={e => setEditFormData({...editFormData, zip: e.target.value})} 
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">State / Province</label>
                            <input 
                              placeholder="Western Province"
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={editFormData.state || ""} 
                              onChange={e => setEditFormData({...editFormData, state: e.target.value})} 
                            />
                          </div>
                        </div>
                      )}

                      {/* BANK DETAILS TAB */}
                      {editActiveTab === "BANK" && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Account Holder Name</label>
                            <input 
                              placeholder="Name as per bank account"
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={editFormData.accountName || ""} 
                              onChange={e => setEditFormData({...editFormData, accountName: e.target.value})} 
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Account Number</label>
                              <input 
                                placeholder="Bank account number"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={editFormData.accountNumber || ""} 
                                onChange={e => setEditFormData({...editFormData, accountNumber: e.target.value})} 
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Account Type</label>
                              <select 
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={editFormData.accountType || "Savings"} 
                                onChange={e => setEditFormData({...editFormData, accountType: e.target.value})}
                              >
                                <option value="Savings">Savings</option>
                                <option value="Current">Current</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Bank Name</label>
                              <input 
                                placeholder="Commercial Bank, Sampath, etc."
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={editFormData.bankName || ""} 
                                onChange={e => setEditFormData({...editFormData, bankName: e.target.value})} 
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-700 block mb-1">Bank Branch</label>
                              <input 
                                placeholder="Branch name"
                                className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                                value={editFormData.bankBranch || ""} 
                                onChange={e => setEditFormData({...editFormData, bankBranch: e.target.value})} 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NOTES TAB */}
                      {editActiveTab === "NOTES" && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                          <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">Internal Notes</label>
                            <textarea 
                              rows={5} 
                              placeholder="Add any internal comments, performance notes or coverage assignment remarks..."
                              className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-xs outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" 
                              value={editFormData.notes || ""} 
                              onChange={e => setEditFormData({...editFormData, notes: e.target.value})} 
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/80 shrink-0">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)} 
                className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="editUserForm" 
                disabled={isProcessing} 
                className="px-6 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-bold text-xs shadow-md shadow-purple-200 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}