"use client";

import { useState, use, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert,
  Phone,
  MessageSquare,
  KeyRound,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { PurpleLogo, PurpleVisual } from "@/components/auth/WashingMachineVisual";

export default function CustomerLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const registered = resolvedSearchParams?.registered === "true";

  const [companyName, setCompanyName] = useState<string>("Customer Portal");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Tab State: "PASSWORD" (Self Customer) vs "REP_OTP" (REP Customer)
  const [authTab, setAuthTab] = useState<"PASSWORD" | "REP_OTP">("PASSWORD");

  // Self Customer Password Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // REP Customer OTP Form State
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Verification Flag for Logged In User Button
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(
    registered ? "Account created successfully! Please sign in below." : ""
  );

  useEffect(() => {
    if (code === "customer") {
      router.replace("/c/default/customer/login");
      return;
    }

    fetch(`/api/c/${code}/info`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.company) {
          setCompanyName(data.company.name);
          setLogoUrl(data.company.logoUrl);
        }
      })
      .catch((err) => console.error("Failed to fetch company info:", err));
  }, [code, router]);

  const [customerNameBadge, setCustomerNameBadge] = useState<string | null>(null);

  // Check if phone number belongs to a returning / verified REP customer
  useEffect(() => {
    if (!phone || phone.trim().length < 8) {
      setIsVerifiedUser(false);
      setCustomerNameBadge(null);
      return;
    }

    const cleanDigits = phone.replace(/\D/g, "");
    const localVerified = typeof window !== "undefined" && localStorage.getItem(`rep_verified_${cleanDigits}`);
    const cookieVerified = typeof document !== "undefined" && document.cookie.includes(`rep_verified_`);

    if (localVerified === "true" || cookieVerified) {
      setIsVerifiedUser(true);
    }

    fetch(`/api/c/${code}/customer/otp/check?phone=${encodeURIComponent(phone)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && (data.isVerifiedUser || localVerified === "true")) {
          setIsVerifiedUser(true);
          if (data.customerName) {
            setCustomerNameBadge(`${data.customerName} (${data.customerNo || "Verified"})`);
          }
        } else if (!localVerified && !cookieVerified) {
          setIsVerifiedUser(false);
          setCustomerNameBadge(null);
        }
      })
      .catch(() => {});
  }, [phone, code]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Self Customer Password Login
  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/c/${code}/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid email or password.");
      }

      window.location.href = data.redirectUrl || `/c/${code}/customer/dashboard`;
    } catch (err: any) {
      console.error("Customer password login error:", err);
      setError(err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  // Handle REP Customer Request SMS OTP
  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 8) {
      setError("Please enter a valid mobile phone number (e.g. 0771234567).");
      return;
    }

    if (loading) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/c/${code}/customer/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, error: text || "Invalid server response." };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP SMS.");
      }

      setOtpSent(true);
      setResendTimer(data.cooldownRemaining || 60);
      setSuccessMsg(data.message || `SMS OTP sent to ${phone}. Please enter the 6-digit verification code below.`);
      if (data.simulatedCode) {
        setSimulatedCode(data.simulatedCode);
      }
    } catch (err: any) {
      console.error("Request OTP error:", err);
      setError(err.message || "Failed to send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle REP Customer Verify OTP Login
  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit OTP code sent via SMS.");
      return;
    }

    if (loading) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch(`/api/c/${code}/customer/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpCode }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, error: text || "Invalid server response." };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid or expired OTP code.");
      }

      // Mark phone as verified in localStorage for future direct access
      const cleanDigits = phone.replace(/\D/g, "");
      if (typeof window !== "undefined") {
        localStorage.setItem(`rep_verified_${cleanDigits}`, "true");
      }

      window.location.href = data.redirectUrl || `/c/${code}/customer/dashboard`;
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "OTP verification failed.");
      setLoading(false);
    }
  };

  // Handle Direct Login for Returning Verified Users
  const handleDirectLogin = async () => {
    if (!phone || phone.trim().length < 8) {
      setError("Please enter your registered mobile phone number.");
      return;
    }

    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/c/${code}/customer/otp/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, error: text || "Invalid server response." };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to access dashboard directly.");
      }

      window.location.href = data.redirectUrl || `/c/${code}/customer/dashboard`;
    } catch (err: any) {
      console.error("Direct login error:", err);
      setError(err.message || "Failed to access dashboard directly.");
      setLoading(false);
    }
  };

  return (
    <main
      className="
        min-h-[100dvh]
        w-full
        overflow-x-hidden
        bg-[#e9e4f5]
        p-2
        sm:p-3
        md:p-4
        font-sans
      "
    >
      <div
        className="
          mx-auto
          flex
          min-h-[calc(100dvh-16px)]
          w-full
          max-w-[1400px]
          flex-col
          overflow-hidden
          rounded-[18px]
          bg-[#fafafa]
          shadow-[0_10px_40px_rgba(45,20,90,0.06)]
          lg:grid
          lg:min-h-[calc(100dvh-32px)]
          lg:grid-cols-[1.08fr_0.92fr]
        "
      >
        {/* LEFT COLUMN: BRAND & DUAL AUTHENTICATION LOGIN FORM */}
        <section
          className="
            relative
            flex
            min-h-[100dvh]
            items-center
            justify-center
            overflow-hidden
            bg-[#fafafa]
            px-5
            py-8
            sm:px-8
            md:px-10
            lg:min-h-0
            lg:px-12
            lg:py-5
            xl:px-16
          "
        >
          {/* Background Decorative Elements */}
          <div
            className="
              pointer-events-none
              absolute
              -left-20
              -top-20
              h-48
              w-72
              rotate-[25deg]
              rounded-[70px]
              border-[24px]
              border-[#f0f0f0]
              opacity-70
            "
          />

          <div className="relative z-10 w-full max-w-[460px] py-4">
            {/* Header Brand */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={companyName} className="h-[54px] w-[54px] object-contain rounded-full border border-purple-200" />
                ) : (
                  <PurpleLogo />
                )}
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">
                    {companyName}
                  </h1>
                  <p className="text-xs font-semibold text-[#5420d8] uppercase tracking-wider">
                    Customer Portal
                  </p>
                </div>
              </div>

              <div className="rounded-full bg-[#f3edff] px-3 py-1 text-[11px] font-semibold text-[#6a32e1]">
                Customer Sign In
              </div>
            </div>

            {/* 2-TAB AUTHENTICATION TYPE SELECTOR */}
            <div className="mb-6 bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("PASSWORD");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  authTab === "PASSWORD"
                    ? "bg-white text-purple-950 shadow-md border border-purple-200/50"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>Self Login (Password)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab("REP_OTP");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                  authTab === "REP_OTP"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>REP Customer (SMS OTP)</span>
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                {authTab === "PASSWORD" ? "Welcome back! 👋" : "REP Customer Portal Access"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {authTab === "PASSWORD"
                  ? `Enter your email & password to access your ${companyName} portal.`
                  : `Registered by a sales representative? Log in using your mobile phone & SMS OTP.`}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span>{successMsg}</span>
                  {simulatedCode && (
                    <div className="mt-2 p-2 bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-950 font-mono font-bold text-xs">
                      [Dev Mode Simulated OTP]: <strong>{simulatedCode}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 1: SELF CUSTOMER PASSWORD FORM */}
            {authTab === "PASSWORD" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="
                        w-full
                        h-12
                        pl-10
                        pr-4
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-sm
                        text-[#0f172a]
                        placeholder-slate-400
                        outline-none
                        focus:border-[#6a32e1]
                        focus:ring-4
                        focus:ring-[#5420d8]/10
                        transition
                      "
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="
                        w-full
                        h-12
                        pl-10
                        pr-10
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-sm
                        text-[#0f172a]
                        placeholder-slate-400
                        outline-none
                        focus:border-[#6a32e1]
                        focus:ring-4
                        focus:ring-[#5420d8]/10
                        transition
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    h-12
                    mt-2
                    rounded-xl
                    bg-[#5420d8]
                    hover:bg-[#4518bc]
                    text-white
                    font-bold
                    text-sm
                    shadow-[0_4px_14px_rgba(84,32,216,0.35)]
                    flex
                    items-center
                    justify-center
                    gap-2
                    transition
                    disabled:opacity-50
                    cursor-pointer
                  "
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Sign In to Customer Dashboard</span>
                  )}
                </button>
              </form>
            ) : (
              /* TAB 2: REP CUSTOMER SMS OTP FORM */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Registered Mobile Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0771234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="
                          w-full
                          h-12
                          pl-10
                          pr-4
                          rounded-xl
                          bg-white
                          border
                          border-[#e4dcf4]
                          text-sm
                          text-[#0f172a]
                          placeholder-slate-400
                          outline-none
                          focus:border-[#6a32e1]
                          focus:ring-4
                          focus:ring-[#5420d8]/10
                          transition
                        "
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleDirectLogin}
                      disabled={loading || !isVerifiedUser || !phone || phone.trim().length < 8}
                      className={`
                        px-4
                        h-12
                        rounded-xl
                        font-extrabold
                        text-xs
                        flex
                        items-center
                        gap-1.5
                        transition
                        shrink-0
                        ${
                          isVerifiedUser && phone.trim().length >= 8 && !loading
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/25 cursor-pointer opacity-100 ring-2 ring-emerald-500/50"
                            : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-50 shadow-none"
                        }
                      `}
                      title={
                        isVerifiedUser
                          ? "Logged in user: Click to access customer dashboard directly"
                          : "Not available for first-time OTP login"
                      }
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isVerifiedUser ? "text-emerald-200" : "text-slate-400"}`} />
                      <span>Logged In User</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || resendTimer > 0 || isVerifiedUser || !phone || phone.trim().length < 8}
                      className={`
                        px-4
                        h-12
                        rounded-xl
                        font-bold
                        text-xs
                        transition
                        shrink-0
                        flex
                        items-center
                        gap-1.5
                        ${
                          !isVerifiedUser && phone.trim().length >= 8 && !loading && resendTimer === 0
                            ? "bg-purple-900 hover:bg-purple-950 text-white shadow-md shadow-purple-900/25 cursor-pointer opacity-100"
                            : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-50 shadow-none"
                        }
                      `}
                      title={
                        isVerifiedUser
                          ? "Already logged in with SMS. Click 'Logged In User' to enter dashboard."
                          : "Click to send 6-digit SMS OTP"
                      }
                    >
                      {resendTimer > 0 ? (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5" /> {resendTimer}s
                        </span>
                      ) : (
                        <span>{otpSent ? "Resend OTP" : "Send SMS OTP"}</span>
                      )}
                    </button>
                  </div>

                  {customerNameBadge && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verified Customer Account: <strong>{customerNameBadge}</strong> (Click 'Logged In User' above to sign in)</span>
                    </div>
                  )}
                </div>

                {otpSent && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        6-Digit SMS Verification OTP Code
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                        <input
                          type="text"
                          maxLength={6}
                          required
                          placeholder="583214"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="
                            w-full
                            h-12
                            pl-10
                            pr-4
                            rounded-xl
                            bg-purple-50/60
                            border
                            border-purple-300
                            text-base
                            font-mono
                            font-black
                            tracking-widest
                            text-purple-950
                            placeholder-purple-300
                            outline-none
                            focus:border-purple-600
                            focus:ring-4
                            focus:ring-purple-600/10
                            transition
                          "
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        w-full
                        h-12
                        rounded-xl
                        bg-gradient-to-r
                        from-purple-700
                        to-indigo-700
                        hover:from-purple-800
                        hover:to-indigo-800
                        text-white
                        font-extrabold
                        text-sm
                        shadow-lg
                        shadow-purple-700/30
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition
                        disabled:opacity-50
                        cursor-pointer
                      "
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify OTP & Access Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <p>
                Don't have an account?{" "}
                <Link
                  href={`/c/${code}/customer/signup`}
                  className="text-[#5420d8] font-bold hover:underline transition"
                >
                  Sign Up Here
                </Link>
              </p>

              <Link
                href={`/c/${code}/login`}
                className="text-slate-500 hover:text-slate-800 text-[11px] font-medium transition"
              >
                Staff & Admin Login →
              </Link>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: ANIMATED VISUAL */}
        <section className="relative hidden p-2 lg:block">
          <PurpleVisual
            companyName={companyName}
            title={
              <>
                Welcome to {companyName}!
                <br />
                Sign in to access your orders,
                <br />
                live tracking & pickup schedules.
              </>
            }
          />
        </section>
      </div>
    </main>
  );
}
