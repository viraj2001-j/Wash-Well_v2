"use client";

import Link from "next/link";
import { useState } from "react";
import {
  WashingMachine,
  Truck,
  Package,
  Star,
  CheckCircle,
  Clock,
  Shield,
  Leaf,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Sparkles,
  Shirt,
  Sparkle,
  Award,
  Menu,
  X,
  LogIn,
  UserPlus,
} from "lucide-react";

interface CompanyData {
  id: string;
  code: string;
  name: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

const steps = [
  {
    num: "01",
    title: "Schedule Pickup",
    desc: "Choose a time that works for you online in seconds.",
    icon: <Package className="w-8 h-8 text-[#6052ff]" />,
    gradient: "from-[#e6e2fe] to-[#dcd6fc]",
  },
  {
    num: "02",
    title: "We Collect Clothes",
    desc: "Our route rep collects your garments directly from your door.",
    icon: <Truck className="w-8 h-8 text-[#6052ff]" />,
    gradient: "from-[#dcd6fc] to-[#ceb9ff]",
  },
  {
    num: "03",
    title: "Professional Clean",
    desc: "Expert eco-washing, stain removal, and steam pressing.",
    icon: <WashingMachine className="w-8 h-8 text-[#6052ff]" />,
    gradient: "from-[#ceb9ff] to-[#bfa3ff]",
  },
  {
    num: "04",
    title: "Fresh Delivery",
    desc: "Clean, fresh garments returned directly back to you.",
    icon: <Sparkles className="w-8 h-8 text-[#6052ff]" />,
    gradient: "from-[#bfa3ff] to-[#a985ff]",
  },
];

const expertiseServices = [
  {
    title: "Dry Cleaning",
    desc: "Professional dry cleaning for suits, dresses, coats, and delicate garments.",
    icon: <Sparkle className="w-5 h-5 text-[#6052ff]" />,
  },
  {
    title: "Delicate Fabrics",
    desc: "Gentle care for silk, wool, cashmere, and fine linen fabrics.",
    icon: <Shirt className="w-5 h-5 text-[#6052ff]" />,
  },
  {
    title: "Steam Pressing",
    desc: "Wrinkle-free steam finishing for crisp, ready-to-wear garments.",
    icon: <WashingMachine className="w-5 h-5 text-[#6052ff]" />,
  },
  {
    title: "Stain Removal",
    desc: "Tough stains treated gently with specialized spot-cleaning solutions.",
    icon: <Shield className="w-5 h-5 text-[#6052ff]" />,
  },
];

const avatars = ["S", "J", "A", "K"];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-white ${
        open
          ? "border-[#6052ff]/40 shadow-[0_6px_24px_rgba(96,82,255,0.08)]"
          : "border-[#ebe7fe] hover:border-[#6052ff]/30 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
      }`}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 px-6 sm:px-7 py-5 text-left transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-black text-[#0f172a] text-[16px] sm:text-[17px] leading-snug">
          {q}
        </span>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            open ? "bg-[#6052ff] text-white" : "bg-[#e6e2fe]/70 text-[#6052ff]"
          }`}
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {open && (
        <div className="px-6 sm:px-7 pb-6 text-gray-500 text-[14px] leading-relaxed border-t border-[#f4f2ff] pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function CompanyHomePageClient({ company }: { company: CompanyData }) {
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0);
  const [pickupFormSubmitted, setPickupFormSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const companyName = company.name || "Laundry Care";
  const companyCode = company.code;
  const companyEmail = company.email || `support@${companyCode}.lk`;
  const companyPhone = company.phone || "+94 11 234 5678";
  const companyAddress = company.address
    ? `${company.address}${company.city ? `, ${company.city}` : ""}`
    : `${company.city || "Colombo"}, ${company.country || "Sri Lanka"}`;

  const whyUs = [
    {
      title: "Doorstep Pickup & Delivery",
      desc: `We collect and return your clothes right at your front door for ${companyName}.`,
      icon: <Truck className="w-5 h-5 text-[#6052ff]" />,
    },
    {
      title: "Professional Fabric Care",
      desc: "Every garment is inspected and treated with expert dry cleaning standards.",
      icon: <Award className="w-5 h-5 text-[#6052ff]" />,
    },
    {
      title: "On-Time Guaranteed Service",
      desc: "Reliable scheduling with real-time status updates.",
      icon: <Clock className="w-5 h-5 text-[#6052ff]" />,
    },
    {
      title: "Safe & Eco-Friendly Solvents",
      desc: "100% biodegradable, gentle cleaning chemicals safe for sensitive skin.",
      icon: <Leaf className="w-5 h-5 text-[#6052ff]" />,
    },
  ];

  const clientFeedbacks = [
    {
      title: "Spotless & Hassle-Free",
      text: `"${companyName} picked up my clothes right from my doorstep and returned them perfectly clean, fresh, and neatly packed. Highly recommend!"`,
      name: "Sarah M.",
      location: company.city || "Colombo",
    },
    {
      title: "Always On-Time & Reliable",
      text: `"${companyName} handles all my laundry and dry cleaning with great care and speed. The customer portal makes tracking so easy!"`,
      name: "James K.",
      location: company.city || "Rajagiriya",
    },
    {
      title: "Incredible Quality & Care",
      text: `"${companyName} delivered exceptional cleaning quality. My garments came back looking brand new!"`,
      name: "Aisha R.",
      location: company.city || "Nugegoda",
    },
  ];

  const tickerItems = Array(10).fill(`${companyName} • Clean & Fresh`);

  return (
    <main className="bg-[#f5f4fe] min-h-screen font-sans selection:bg-[#6052ff] selection:text-white">

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="bg-[#f5f4fe] overflow-hidden pt-8 pb-14 lg:pt-12 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
                <span className="text-[12.5px] font-bold text-[#6052ff] tracking-wider uppercase">
                  {companyName} • LAUNDRY & FABRIC CARE
                </span>
              </div>

              <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.6rem] font-black text-[#0f172a] leading-[1.08] tracking-tight">
                We Pick Up Your <span className="text-[#6052ff]">Clothes.</span> You Get Them Back Clean.
              </h1>

              <p className="text-[15.5px] text-gray-500 leading-relaxed max-w-[440px]">
                Book doorstep pickups with {companyName} anytime. We handle everything from collection to professional eco-washing and fresh delivery back to you.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  href={`/c/${companyCode}/customer/signup`}
                  className="inline-flex items-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-semibold text-[15px] px-6 py-3.5 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.35)] hover:-translate-y-px"
                >
                  <Package className="w-4 h-4" />
                  <span>Request Laundry Pickup</span>
                </Link>

                <Link
                  href={`/c/${companyCode}/customer/login`}
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-[#0f172a] font-semibold text-[15px] px-6 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-px"
                >
                  <UserCheck className="w-4 h-4 text-[#6052ff]" />
                  <span>Customer Sign In</span>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-3.5 pt-2">
                <div className="flex -space-x-2">
                  {avatars.map((label) => (
                    <div
                      key={label}
                      className="w-8 h-8 rounded-full bg-[#e6e2fe] border-2 border-white flex items-center justify-center text-[#6052ff] font-bold text-[12px] shadow-sm"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-[#6052ff] text-[#6052ff]" />
                    ))}
                  </div>
                  <span className="font-bold text-[#0f172a] text-[15px]">4.9★</span>
                  <span className="text-[12px] text-gray-400 ml-1">Trusted by 5,000+ clients</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Graphic */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[420px] lg:max-w-[470px]">
                <div className="bg-gradient-to-br from-[#dcd6fc] via-[#e6e2fe] to-[#f4f2ff] rounded-[32px] overflow-hidden w-full aspect-[4/4.6] relative shadow-lg p-8 flex flex-col justify-between border border-white">
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#6052ff] text-white flex items-center justify-center shadow-lg shadow-purple-500/30 font-black text-2xl">
                      {companyName.charAt(0)}
                    </div>

                    <div className="space-y-1">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#10b981]/20 text-[#10b981]">
                        {companyName.toUpperCase()} SERVICE
                      </span>
                      <h3 className="text-2xl font-black text-[#0f172a]">Doorstep Fabric Care</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Track order status live, manage invoices, and schedule instant pickups directly through your {companyName} portal.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0f172a]">
                      <span>Order #ORD-00042</span>
                      <span className="text-[#6052ff]">IN WASHING</span>
                    </div>

                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-[#6052ff] rounded-full" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Pickup: Collected</span>
                      <span>Delivery: Expected Today</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE TICKER BANNER */}
      <div className="bg-[#0e0c28] py-5 overflow-hidden border-t border-b border-[#1c1947]">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
          {tickerItems.concat(tickerItems).map((item, i) => (
            <div key={i} className="flex items-center gap-8 px-4 flex-shrink-0">
              <span className="text-white font-black text-xl md:text-2xl tracking-wider uppercase">
                {item}
              </span>
              <span className="text-[#6052ff] text-xl font-light">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                HOW IT WORKS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
              How {companyName} <span className="text-[#6052ff] italic">Pickup</span> Works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc, icon, gradient }) => (
              <div
                key={num}
                className="bg-white rounded-[26px] border border-[#ebe7fe] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(96,82,255,0.08)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className={`w-full aspect-[4/3] rounded-[20px] bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                    {icon}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#0e0c28] text-white font-bold text-[12px] flex items-center justify-center shadow-md">
                      {num}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[17px] font-black text-[#0f172a] mb-2 leading-snug">
                      {title}
                    </h3>
                    <p className="text-[13.5px] text-gray-500 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-20 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                OUR EXPERTISE
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
              Professional <span className="text-[#6052ff] italic">Fabric Care</span> Services
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {expertiseServices.map(({ title, desc, icon }) => (
              <div
                key={title}
                className="bg-white rounded-[28px] border border-[#ebe7fe] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.09)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#e6e2fe]/70 flex items-center justify-center mb-6">
                    {icon}
                  </div>

                  <h3 className="text-[18px] font-black text-[#0f172a] mb-2.5 leading-snug">
                    {title}
                  </h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed mb-6">
                    {desc}
                  </p>
                </div>

                <div>
                  <Link
                    href={`/c/${companyCode}/customer/signup`}
                    className="inline-flex items-center justify-center bg-white border border-gray-200 text-[#0f172a] hover:bg-[#6052ff] hover:text-white hover:border-[#6052ff] text-[13px] font-bold px-5 py-2 rounded-full transition-all duration-200"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="why-choose-us" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Graphic Box */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[440px] aspect-square rounded-[32px] bg-gradient-to-br from-[#e6e2fe] to-[#dcd6fc] p-8 flex flex-col justify-center items-center text-center space-y-4 shadow-sm border border-[#ebe7fe]">
                <div className="w-20 h-20 rounded-3xl bg-[#6052ff] text-white flex items-center justify-center shadow-xl shadow-purple-500/30">
                  <Shield className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#0f172a]">100% Quality Guarantee</h3>
                <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                  Every order at {companyName} is inspected, spot-treated, and washed to exact commercial fabric care standards.
                </p>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  WHY {companyName.toUpperCase()}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight leading-[1.15]">
                Why Customers <span className="text-[#6052ff] italic">Choose</span> {companyName}
              </h2>

              <div className="space-y-3.5 pt-2">
                {whyUs.map(({ title, desc, icon }) => (
                  <div
                    key={title}
                    className="bg-white rounded-2xl border border-[#ebe7fe] p-4 flex items-center gap-4 hover:border-[#6052ff]/40 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#e6e2fe]/70 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <h3 className="text-[15.5px] font-black text-[#0f172a] mb-0.5">{title}</h3>
                      <p className="text-[13px] text-gray-500 leading-snug">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="py-20 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  WHAT CUSTOMERS SAY
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
                Real <span className="text-[#6052ff] italic">Feedback</span> From Our Clients
              </h2>

              <p className="text-[15px] text-gray-500 leading-relaxed">
                Hear from customers who love our doorstep dry cleaning service and online tracking.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentFeedbackIndex(
                      (prev) => (prev - 1 + clientFeedbacks.length) % clientFeedbacks.length
                    )
                  }
                  className="w-11 h-11 rounded-full bg-white border border-gray-200 text-[#0f172a] hover:text-[#6052ff] flex items-center justify-center transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentFeedbackIndex((prev) => (prev + 1) % clientFeedbacks.length)
                  }
                  className="w-11 h-11 rounded-full bg-[#6052ff] text-white flex items-center justify-center transition"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-[#ede9fe] rounded-[32px] p-8 sm:p-10 relative border border-[#e4dcfe] space-y-6">
                <h3 className="text-xl sm:text-2xl font-black text-[#0f172a]">
                  {clientFeedbacks[currentFeedbackIndex].title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {clientFeedbacks[currentFeedbackIndex].text}
                </p>
                <div>
                  <h4 className="font-black text-[#0f172a]">
                    {clientFeedbacks[currentFeedbackIndex].name}
                  </h4>
                  <p className="text-gray-500 text-xs">
                    {clientFeedbacks[currentFeedbackIndex].location}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & SCHEDULE FORM */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                BOOK YOUR PICKUP
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
              Schedule Your <span className="text-[#6052ff] italic">Laundry</span> Pickup
            </h2>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-lg font-black text-[#0f172a]">Contact {companyName}</h3>
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-[#ebe7fe] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#e6e2fe]/70 flex items-center justify-center text-[#6052ff]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] text-gray-400">Phone</p>
                    <p className="text-[15px] font-black text-[#0f172a]">{companyPhone}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#ebe7fe] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#e6e2fe]/70 flex items-center justify-center text-[#6052ff]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] text-gray-400">Email</p>
                    <p className="text-[15px] font-black text-[#0f172a]">{companyEmail}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#ebe7fe] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#e6e2fe]/70 flex items-center justify-center text-[#6052ff]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11.5px] text-gray-400">Address</p>
                    <p className="text-[15px] font-black text-[#0f172a]">{companyAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-[28px] border border-[#ebe7fe] p-7 sm:p-9 shadow-sm">
                {pickupFormSubmitted ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-[#e6e2fe] text-[#6052ff] flex items-center justify-center mx-auto">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a]">Request Received!</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Thank you! Please create or log into your {companyName} Customer Account to view order status.
                    </p>
                    <Link
                      href={`/c/${companyCode}/customer/signup`}
                      className="inline-flex items-center gap-2 bg-[#6052ff] text-white font-semibold text-xs px-5 py-2.5 rounded-full"
                    >
                      Create Customer Account
                    </Link>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setPickupFormSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <h3 className="text-xl font-black text-[#0f172a]">Quick Pickup Inquiry</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Full Name"
                          className="w-full px-4 py-3 rounded-xl bg-[#f9f8fe] border border-gray-100 text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="+94 77 123 4567"
                          className="w-full px-4 py-3 rounded-xl bg-[#f9f8fe] border border-gray-100 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Address / City</label>
                      <input
                        type="text"
                        required
                        placeholder="Pickup location"
                        className="w-full px-4 py-3 rounded-xl bg-[#f9f8fe] border border-gray-100 text-sm outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-sm rounded-xl transition"
                    >
                      Submit Pickup Inquiry
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0e0c28] border-t border-[#1c1947] py-12 px-6 lg:px-12 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <WashingMachine className="w-5 h-5 text-[#10b981]" />
              <span className="font-bold text-white text-base">{companyName}</span>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              {companyName} Operations & Customer Portal. Premier fabric care & laundry services.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Customer Portal</h4>
            <ul className="space-y-1.5">
              <li><Link href={`/c/${companyCode}/customer/login`} className="hover:text-white transition">Customer Sign In</Link></li>
              <li><Link href={`/c/${companyCode}/customer/signup`} className="hover:text-white transition">Register Account</Link></li>
              <li><Link href={`/c/${companyCode}/customer/dashboard`} className="hover:text-white transition">My Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Staff & Admin</h4>
            <ul className="space-y-1.5">
              <li><Link href={`/c/${companyCode}/login`} className="hover:text-white transition">Staff & Driver Login</Link></li>
              <li><Link href="/super-admin/login" className="hover:text-white transition">Platform Super Admin</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Contact</h4>
            <p>Phone: {companyPhone}</p>
            <p>Email: {companyEmail}</p>
            <p>Location: {companyAddress}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <p className="text-gray-500">{companyName} Workspace ({companyCode})</p>
        </div>
      </footer>
    </main>
  );
}
