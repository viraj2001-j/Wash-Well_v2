"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, ArrowRight, Sparkles, AlertCircle, Loader2 } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Login through Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (!data.user) {
        setError("Unable to authenticate user.");
        return;
      }

      // 2. Verify this user is our Platform Super Admin
      const response = await fetch("/api/auth/super-admin", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        await supabase.auth.signOut();
        setError(result.message || "You are not authorized as Super Admin.");
        return;
      }

      // 3. Go to Super Admin dashboard
      router.replace("/super-admin/organizations");
      router.refresh();
    } catch (err) {
      console.error("Super Admin login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 relative overflow-hidden font-sans">
      
      {/* BACKGROUND GLOW ACCENTS */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100/20 relative z-10 space-y-6">
        
        {/* HEADER BRANDING */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-[#7C3AED] to-purple-800 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="pt-2">
            <span className="px-3 py-1 bg-purple-100 text-[#7C3AED] text-[10px] font-black uppercase rounded-md tracking-wider">
              Super Admin Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Wash & Well Platform</h1>
          <p className="text-xs text-gray-500 font-medium">Global System & Tenant Administration</p>
        </div>

        {/* ERROR NOTICE */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-bold animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">Admin Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@wash-well.local"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-gray-700 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50/70 border border-gray-200 rounded-xl outline-none focus:border-[#7C3AED] focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-purple-800 text-white rounded-xl font-extrabold text-xs shadow-md shadow-purple-300 hover:shadow-lg hover:shadow-purple-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Super Admin</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-bold">
            Authorized Personnel Only • Wash & Well Platform Security
          </p>
        </div>

      </div>
    </main>
  );
}