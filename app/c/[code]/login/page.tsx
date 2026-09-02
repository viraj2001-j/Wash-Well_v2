"use client";

import { useState, use, useEffect, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { PurpleLogo, PurpleVisual } from "@/components/auth/WashingMachineVisual";

export default function OrganizationLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { code } = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  const errorParam = typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : undefined;

  const [companyName, setCompanyName] = useState<string>(code.toUpperCase());
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch dynamic company info
    fetch(`/api/c/${code}/info`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.company) {
          setCompanyName(data.company.name);
          setLogoUrl(data.company.logoUrl);
          setTargetCompanyId(data.company.id);
        }
      })
      .catch((err) => console.error("Failed to fetch company info:", err));
  }, [code]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === "unauthorized" ? "You are not authorized to access this organization." : ""
  );

  const supabase = createClient();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Check current user's assigned company via /api/auth/me
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        const userObj = meData?.user;

        if (userObj) {
          const isSuperAdmin = userObj.roles?.some(
            (r: any) =>
              (r.role?.name || r.name || "").toUpperCase() === "SUPERADMIN" &&
              (r.role?.scope || r.scope) === "PLATFORM"
          );

          // Tenant Lock Check: Non-SuperAdmins must belong to target company
          if (!isSuperAdmin && targetCompanyId && userObj.companyId && userObj.companyId !== targetCompanyId) {
            await supabase.auth.signOut();
            throw new Error(
              `Access Denied: Your staff account belongs to a different company. Please log into your designated company portal.`
            );
          }

          // Security check: password change required
          const requiresChange = data.user?.user_metadata?.requires_password_change;
          if (requiresChange) {
            window.location.href = `/c/${code}/set-password`;
            return;
          }

          // Determine role-specific dashboard redirection
          let targetUrl = `/c/${code}/dashboard`;

          if (userObj.roles) {
            const roleNames: string[] = userObj.roles.map((r: any) =>
              (r.role?.name || r.name || "").toUpperCase()
            );

            const isAdmin = roleNames.some((r) =>
              ["ADMIN", "ORG_ADMIN", "MANAGER", "COMPANY ADMIN", "SUPERADMIN"].includes(r)
            );
            const isRef = roleNames.some(
              (r) => r === "REF" || r === "ROUTE_REP" || r.includes("REP") || r.includes("REF")
            );
            const isDriver = roleNames.some(
              (r) => r === "DRIVER" || r.includes("DRIVER")
            );

            if (isRef && !isAdmin) {
              targetUrl = `/c/${code}/ref/route`;
            } else if (isDriver && !isAdmin) {
              targetUrl = `/c/${code}/driver/assignment`;
            } else {
              targetUrl = `/c/${code}/dashboard`;
            }
          }

          window.location.href = targetUrl;
          return;
        }
      }

      window.location.href = `/c/${code}/dashboard`;
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password.");
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
              backgroundImage:
                "radial-gradient(#d5d5d5 1px, transparent 1px)",
              backgroundSize: "11px 11px",
              maskImage:
                "linear-gradient(to left, black, transparent)",
            }}
          />

          <div
            className="
              relative
              z-10
              w-full
              max-w-[370px]
              sm:max-w-[390px]
              xl:max-w-[410px]
            "
          >
            <div className="mb-4 flex justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-[54px] w-[54px] object-contain rounded-full border border-purple-200" />
              ) : (
                <PurpleLogo />
              )}
            </div>

            <div className="text-center">
              <h1
                className="
                  text-[29px]
                  font-bold
                  leading-none
                  tracking-[-0.04em]
                  text-[#101010]
                  sm:text-[31px]
                "
              >
                Welcome Back
              </h1>

              <p
                className="
                  mt-2.5
                  text-[11px]
                  text-[#888]
                  sm:text-[12px]
                  font-medium
                "
              >
                Sign in to access <strong className="text-[#5420d8]">{companyName}</strong> staff workspace
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-7 w-full">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[11px] font-medium text-[#292929]"
                >
                  Work Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                  disabled={loading}
                  placeholder="Your Work Email"
                  className="
                    h-[46px]
                    w-full
                    rounded-full
                    border border-[#e5e5e5]
                    bg-white
                    px-5
                    text-[12px]
                    text-[#222]
                    outline-none
                    transition
                    placeholder:text-[#c8c8c8]
                    focus:border-[#5420d8]
                    focus:ring-2
                    focus:ring-[#5420d8]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="password"
                  className="mb-2 block text-[11px] font-medium text-[#292929]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    placeholder="Your password"
                    className="
                      h-[46px]
                      w-full
                      rounded-full
                      border border-[#e5e5e5]
                      bg-white
                      px-5
                      pr-12
                      text-[12px]
                      text-[#222]
                      outline-none
                      transition
                      placeholder:text-[#c8c8c8]
                      focus:border-[#5420d8]
                      focus:ring-2
                      focus:ring-[#5420d8]/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="
                      absolute
                      right-5
                      top-1/2
                      -translate-y-1/2
                      text-[#888]
                      transition
                      hover:text-[#5420d8]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      cursor-pointer
                    "
                  >
                    {showPassword ? (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.88c6 0 9.5 6 9.5 6a16.72 16.72 0 0 1-3.06 3.62" />
                        <path d="M6.61 6.61C4.36 8.16 2.5 10.88 2.5 10.88s3.5 6 9.5 6c1.42 0 2.7-.3 3.84-.75" />
                      </svg>
                    ) : (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        aria-hidden="true"
                      >
                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[11px] font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-5
                  h-[46px]
                  w-full
                  rounded-full
                  bg-[#5420d8]
                  text-[12px]
                  font-semibold
                  text-white
                  shadow-[0_7px_18px_rgba(84,32,216,0.22)]
                  transition
                  hover:bg-[#4618bf]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  cursor-pointer
                "
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </section>

        <section
          className="
            relative
            w-full
            bg-[#fafafa]
            p-2
            sm:p-3
            lg:min-h-0
          "
        >
          <PurpleVisual companyName={companyName} />
        </section>
      </div>
    </main>
  );
}