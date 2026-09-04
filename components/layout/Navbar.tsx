'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, UserCheck, UserPlus, Building2, ChevronRight } from 'lucide-react';

const navLinks = [
  { href: '/c/mob', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Prices' },
  { href: '/contact', label: 'Contact Us' },
];

const publicHomepageRoutes = [
  '/',
  '/c/mob',
  '/about',
  '/services',
  '/pricing',
  '/contact',
];

interface CompanyItem {
  id: string;
  code: string;
  name: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [targetAction, setTargetAction] = useState<'login' | 'signup'>('login');
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanyCode, setSelectedCompanyCode] = useState('default');
  const [customCode, setCustomCode] = useState('');

  useEffect(() => {
    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.companies) && data.companies.length > 0) {
          setCompanies(data.companies);
          
          // Pre-select company code if on a company route (e.g. /c/mob)
          const parts = pathname.split('/').filter(Boolean);
          if (parts.length >= 2 && parts[0] === 'c') {
            setSelectedCompanyCode(parts[1]);
          } else {
            setSelectedCompanyCode(data.companies[0].code);
          }
        }
      })
      .catch((err) => console.error('Failed to fetch companies:', err));
  }, [pathname]);

  const isPublicRoute = publicHomepageRoutes.includes(pathname);
  const isCompanyHomepage =
    pathname.startsWith('/c/') &&
    pathname.split('/').filter(Boolean).length === 2;

  const shouldHideNavbar = !(isPublicRoute || isCompanyHomepage);

  if (shouldHideNavbar) {
    return null;
  }

  const openPortalModal = (action: 'login' | 'signup') => {
    // If already on a company homepage like /c/mob, proceed directly or offer modal
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'c') {
      const currentCode = parts[1];
      if (action === 'signup') {
        router.push(`/c/${currentCode}/customer/signup`);
      } else {
        router.push(`/c/${currentCode}/customer/login`);
      }
      return;
    }

    setTargetAction(action);
    setShowCompanyModal(true);
  };

  const handleProceedToCompany = () => {
    const finalCode = customCode.trim() || selectedCompanyCode || 'default';
    setShowCompanyModal(false);
    if (targetAction === 'signup') {
      router.push(`/c/${finalCode}/customer/signup`);
    } else {
      router.push(`/c/${finalCode}/customer/login`);
    }
  };

  return (
    <>
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* ── Desktop layout: 3-column grid ── */}
          <div className="hidden md:grid grid-cols-[auto_1fr_auto] items-center h-[70px] gap-4">
            {/* Col 1 — Logo (left) */}
            <Link href="/c/mob" className="flex items-center gap-2.5 select-none flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#5c52e5] flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-black text-[18px] leading-none">G</span>
              </div>

              <div className="leading-[1.15]">
                <span className="block text-[18px] font-black text-[#181838] tracking-tight">
                  Go
                </span>
                <span className="block text-[18px] font-black text-[#181838] tracking-tight">
                  Clean
                </span>
              </div>
            </Link>

            {/* Col 2 — Nav (center) */}
            <nav className="flex items-center justify-center gap-6 lg:gap-8">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href || (href === '/c/mob' && (pathname === '/' || pathname === '/c/mob'));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-[15px] font-medium whitespace-nowrap transition-colors duration-150 ${
                      isActive
                        ? 'text-[#5c52e5] font-semibold'
                        : 'text-[#3d3d5c] hover:text-[#5c52e5]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Col 3 — CTA Buttons (right) */}
            <div className="flex items-center justify-end gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => openPortalModal('login')}
                className="inline-flex items-center gap-1.5 border border-[#5c52e5]/30 bg-[#5c52e5]/5 hover:bg-[#5c52e5]/10 text-[#5c52e5] font-semibold text-[13px] px-3.5 py-2 rounded-full transition-all duration-200 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Customer Login</span>
              </button>

              <button
                type="button"
                onClick={() => openPortalModal('signup')}
                className="inline-flex items-center gap-2 bg-[#5c52e5] hover:bg-[#4b41d0] text-white font-semibold text-[14px] px-5 py-2 rounded-full transition-all duration-200 shadow-[0_4px_16px_rgba(92,82,229,0.30)] hover:shadow-[0_6px_22px_rgba(92,82,229,0.42)] hover:-translate-y-px whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Request Pickup</span>
              </button>
            </div>
          </div>

          {/* ── Mobile layout ── */}
          <div className="flex md:hidden items-center justify-between h-[64px]">
            {/* Logo */}
            <Link href="/c/mob" className="flex items-center gap-2 select-none">
              <div className="w-9 h-9 rounded-full bg-[#5c52e5] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-[16px] leading-none">G</span>
              </div>

              <div className="leading-[1.15]">
                <span className="block text-[16px] font-black text-[#181838] tracking-tight">
                  Go
                </span>
                <span className="block text-[16px] font-black text-[#181838] tracking-tight">
                  Clean
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openPortalModal('login')}
                className="inline-flex items-center gap-1 bg-[#5c52e5] text-white font-semibold text-[12px] px-3.5 py-1.5 rounded-full whitespace-nowrap"
              >
                Login
              </button>

              {/* Hamburger */}
              <button
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5 text-[#181838]" />
                ) : (
                  <Menu className="w-5 h-5 text-[#181838]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 sm:px-6 pb-6 pt-2 shadow-lg">
            <nav className="flex flex-col">
              {navLinks.map(({ href, label }) => {
                const isActive = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`text-[15px] font-medium py-3.5 border-b border-gray-100 transition-colors ${
                      isActive
                        ? 'text-[#5c52e5] font-semibold'
                        : 'text-[#3d3d5c] hover:text-[#5c52e5]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="pt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openPortalModal('login');
                  }}
                  className="inline-flex items-center justify-center gap-2 border border-[#5c52e5] text-[#5c52e5] font-semibold text-[14px] px-5 py-2.5 rounded-full"
                >
                  <UserCheck className="w-4 h-4" />
                  Customer Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    openPortalModal('signup');
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-[#5c52e5] text-white font-semibold text-[14px] px-5 py-2.5 rounded-full shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  Request Pickup / Signup
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Select Company Organization Portal Modal ── */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5c52e5] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Company Portal</h3>
                  <p className="text-[11px] text-slate-500">Each company customer has their own dedicated portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {companies.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Select Laundry Organization
                  </label>
                  <select
                    value={selectedCompanyCode}
                    onChange={(e) => setSelectedCompanyCode(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:border-[#5c52e5] transition"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name} ({c.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Or Enter Custom Company Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. test or default"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono outline-none focus:border-[#5c52e5] transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Customers can only log into the specific company portal they registered for.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToCompany}
                  className="px-5 py-2.5 rounded-xl bg-[#5c52e5] hover:bg-[#4b41d0] text-white font-bold flex items-center gap-1.5 transition shadow-md shadow-[#5c52e5]/20"
                >
                  <span>Proceed to {targetAction === 'signup' ? 'Signup' : 'Login'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}