"use client";

import { useState, use, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Building,
  Eye,
  EyeOff,
  ShieldAlert,
} from "lucide-react";
import { PurpleLogo, PurpleVisual } from "@/components/auth/WashingMachineVisual";

export default function CustomerSignupPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [companyName, setCompanyName] = useState<string>("Customer Signup");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (code === "customer") {
      router.replace("/c/default/customer/signup");
      return;
    }

    // Fetch dynamic company details
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/c/${code}/customer/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          address,
          city,
          placeName,
          customerType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create account.");
      }

      // Successful signup -> redirect to customer login with success message
      router.push(`/c/${code}/customer/login?registered=true`);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Something went wrong during signup.");
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
        {/* LEFT COLUMN: BRAND & SIGNUP FORM */}
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
          {/* Background Rings */}
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

          <div
            className="
              pointer-events-none
              absolute
              -bottom-24
              -right-24
              h-56
              w-80
              rounded-[80px]
              border-[26px]
              border-[#f0f0f0]
              opacity-70
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              right-0
              top-1/3
              h-48
              w-44
              opacity-25
            "
            style={{
              backgroundImage: "radial-gradient(#d5d5d5 1px, transparent 1px)",
              backgroundSize: "11px 11px",
              maskImage: "linear-gradient(to left, black, transparent)",
            }}
          />

          <div className="relative z-10 w-full max-w-[500px] py-4">
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
                    Customer Signup
                  </p>
                </div>
              </div>

              <div
                className="
                  rounded-full
                  bg-[#f3edff]
                  px-3
                  py-1
                  text-[11px]
                  font-semibold
                  text-[#6a32e1]
                "
              >
                Create Account
              </div>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                Register Account ✨
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Fill in your details below to register with {companyName} for doorstep laundry pickup.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-3.5">
              {/* Account Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCustomerType("INDIVIDUAL")}
                    className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                      customerType === "INDIVIDUAL"
                        ? "bg-[#5420d8] border-[#5420d8] text-white shadow-md shadow-[#5420d8]/20"
                        : "bg-white border-[#e4dcf4] text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Individual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomerType("BUSINESS")}
                    className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                      customerType === "BUSINESS"
                        ? "bg-[#5420d8] border-[#5420d8] text-white shadow-md shadow-[#5420d8]/20"
                        : "bg-white border-[#e4dcf4] text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Hotel / Business</span>
                  </button>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="
                        w-full
                        h-11
                        pl-10
                        pr-3
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-xs
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+94 77 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="
                        w-full
                        h-11
                        pl-10
                        pr-3
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-xs
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
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="
                      w-full
                      h-11
                      pl-10
                      pr-3
                      rounded-xl
                      bg-white
                      border
                      border-[#e4dcf4]
                      text-xs
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

              {/* Place Name & City */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Hotel / Shop Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Grand City Hotel"
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      className="
                        w-full
                        h-11
                        pl-10
                        pr-3
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-xs
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    City / Area
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Colombo 03"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="
                        w-full
                        h-11
                        pl-10
                        pr-3
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-xs
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
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="No. 123, Galle Road, Colombo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="
                    w-full
                    h-11
                    px-3.5
                    rounded-xl
                    bg-white
                    border
                    border-[#e4dcf4]
                    text-xs
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

              {/* Password & Confirm */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="
                        w-full
                        h-11
                        pl-10
                        pr-9
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-xs
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="
                        w-full
                        h-11
                        pl-10
                        pr-3
                        rounded-xl
                        bg-white
                        border
                        border-[#e4dcf4]
                        text-xs
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
                "
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create Customer Account</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-slate-600">
              Already registered?{" "}
              <Link
                href={`/c/${code}/customer/login`}
                className="text-[#5420d8] font-bold hover:underline transition"
              >
                Sign In to Your Customer Account
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
                Join {companyName} today!
                <br />
                Doorstep pickup & delivery,
                <br />
                live order tracking & care.
              </>
            }
          />
        </section>
      </div>
    </main>
  );
}
