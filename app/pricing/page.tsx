'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ArrowRight, Truck } from 'lucide-react';

const plans = [
  {
    name: 'Basic',
    price: 29,
    desc: 'Perfect for individuals with occasional laundry needs.',
    features: ['Up to 15 lbs / week', 'Wash & Fold only', '48hr turnaround', '1 pickup/week', 'Standard detergent'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Standard',
    price: 59,
    desc: 'Our most popular plan for busy professionals.',
    features: ['Up to 30 lbs / week', 'Wash & Fold + Ironing', '24hr turnaround', '2 pickups/week', 'Premium detergent', 'Free express once/month'],
    cta: 'Most Popular',
    highlight: true,
  },
  {
    name: 'Premium',
    price: 99,
    desc: 'Full-service plan for families and heavy laundry users.',
    features: ['Unlimited weight', 'All services included', 'Same-day available', 'Unlimited pickups', 'Eco-certified products', 'Dedicated agent', 'Priority support'],
    cta: 'Go Premium',
    highlight: false,
  },
];

const laundryRates = [
  { service: 'Wash & Fold', unit: 'per lb', rate: 2.50 },
  { service: 'Dry Cleaning — Shirt', unit: 'per item', rate: 8.00 },
  { service: 'Dry Cleaning — Suit', unit: 'per item', rate: 22.00 },
  { service: 'Ironing', unit: 'per item', rate: 3.00 },
  { service: 'Shoe Cleaning', unit: 'per pair', rate: 12.00 },
  { service: 'Comforter', unit: 'per item', rate: 20.00 },
];

export default function PricingPage() {
  const [weight, setWeight] = useState(10);
  const estimated = (weight * 2.50).toFixed(2);

  return (
    <main className="bg-[#f5f4fe] min-h-screen">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="bg-[#f5f4fe] py-20 text-center">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">

          {/* Tag Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-5">
            <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
            <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
              SIMPLE & TRANSPARENT
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-[#0f172a] leading-[1.12] tracking-tight mb-5">
            Clear <span className="text-[#6052ff] italic font-black">Pricing,</span> No Surprises
          </h1>
          <p className="text-gray-500 text-base sm:text-lg">
            Choose a subscription plan or pay as you go.
          </p>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          PLANS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                SUBSCRIPTION PLANS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
              Choose Your <span className="text-[#6052ff] italic font-black">Plan</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map(({ name, price, desc, features, cta, highlight }) => (
              <div
                key={name}
                className={`rounded-[32px] p-8 flex flex-col transition-all duration-300 ${
                  highlight
                    ? 'bg-gradient-to-br from-[#6052ff] to-[#7c6fff] border-0 text-white shadow-[0_16px_48px_rgba(96,82,255,0.3)] scale-105'
                    : 'bg-white border border-[#ebe7fe] text-[#0f172a] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.09)]'
                }`}
              >
                {highlight && (
                  <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 w-fit tracking-wider uppercase">
                    ✨ MOST POPULAR
                  </div>
                )}

                <h2 className={`text-2xl font-black mb-1.5 ${highlight ? 'text-white' : 'text-[#0f172a]'}`}>
                  {name}
                </h2>
                <p className={`text-sm mb-6 leading-relaxed ${highlight ? 'text-white/80' : 'text-gray-500'}`}>
                  {desc}
                </p>

                <div className="mb-7">
                  <span className={`text-5xl font-black ${highlight ? 'text-white' : 'text-[#0f172a]'}`}>
                    ${price}
                  </span>
                  <span className={`text-sm ml-1.5 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>/month</span>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        highlight ? 'bg-white/20' : 'bg-[#e6e2fe]'
                      }`}>
                        <Check className={`w-3 h-3 ${highlight ? 'text-white' : 'text-[#6052ff]'}`} />
                      </div>
                      <span className={highlight ? 'text-white/90' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pickup"
                  className={`w-full text-center py-3.5 rounded-full font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                    highlight
                      ? 'bg-white text-[#6052ff] hover:bg-gray-100 shadow-sm'
                      : 'bg-[#6052ff] text-white hover:bg-[#4f3eff] shadow-[0_4px_16px_rgba(96,82,255,0.3)]'
                  }`}
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          RATE TABLE
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-[#f5f4fe]">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                PAY AS YOU GO
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
              Individual <span className="text-[#6052ff] italic font-black">Service Rates</span>
            </h2>
          </div>

          {/* Rate Rows */}
          <div className="bg-white rounded-[28px] border border-[#ebe7fe] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            {laundryRates.map(({ service, unit, rate }, i) => (
              <div
                key={service}
                className={`flex items-center justify-between px-8 py-5 transition-colors hover:bg-[#f5f4fe] ${
                  i !== laundryRates.length - 1 ? 'border-b border-[#f0effe]' : ''
                }`}
              >
                <span className="font-black text-[#0f172a] text-[15px]">{service}</span>
                <div className="flex items-center gap-6">
                  <span className="text-gray-400 text-sm font-medium">{unit}</span>
                  <span className="text-[#6052ff] font-black text-lg">${rate.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          CALCULATOR
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6 lg:px-12 text-center">

          {/* Header */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
            <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
              ESTIMATE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight mb-10">
            Laundry Cost <span className="text-[#6052ff] italic font-black">Calculator</span>
          </h2>

          <div className="bg-[#f5f4fe] border border-[#ebe7fe] rounded-[32px] p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">

            <label className="block text-sm font-bold text-[#0f172a] mb-3">
              Estimated weight:{' '}
              <span className="text-[#6052ff]">{weight} lbs</span>
            </label>

            <input
              type="range"
              min={1}
              max={50}
              value={weight}
              onChange={e => setWeight(Number(e.target.value))}
              className="w-full accent-[#6052ff] mb-8 cursor-pointer"
            />

            <div className="bg-white rounded-[22px] border border-[#ebe7fe] p-7 shadow-sm mb-6">
              <p className="text-gray-400 text-sm font-medium mb-2">Estimated cost (Wash &amp; Fold)</p>
              <p className="text-6xl font-black text-[#6052ff]">${estimated}</p>
            </div>

            <Link
              href="/pickup"
              className="inline-flex items-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-semibold text-[15px] px-8 py-4 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-px"
            >
              <Truck className="w-4 h-4" /> Book Now
            </Link>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Ready for Cleaner Clothes?</h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Book your first pickup today and get 20% off your first order.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pickup" className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg hover:-translate-y-0.5">
              <Truck className="w-5 h-5" /> Schedule a Pickup
            </Link>
            <Link href="/services" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5">
              View Services
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
