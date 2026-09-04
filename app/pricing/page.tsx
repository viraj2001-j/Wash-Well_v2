'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Check, ArrowRight, Truck, Shield, Sparkles, Calculator } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const plans = [
  {
    name: 'Basic',
    price: 29,
    desc: 'Perfect for individuals with occasional laundry needs.',
    features: ['Up to 15 lbs / week', 'Wash & Fold only', '48hr turnaround', '1 pickup/week', 'Standard eco detergent'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Standard',
    price: 59,
    desc: 'Our most popular plan for busy professionals.',
    features: ['Up to 30 lbs / week', 'Wash & Fold + Steam Press', '24hr turnaround', '2 pickups/week', 'Premium eco detergent', '1 Free express/month'],
    cta: 'Most Popular',
    highlight: true,
  },
  {
    name: 'Premium',
    price: 99,
    desc: 'Full-service plan for families and heavy laundry users.',
    features: ['Unlimited weight capacity', 'All services included', 'Same-day turnaround option', 'Unlimited doorstep pickups', 'Eco-certified products', 'Dedicated care rep', 'Priority support'],
    cta: 'Go Premium',
    highlight: false,
  },
];

const laundryRates = [
  { service: 'Wash & Fold', unit: 'per lb', rate: 2.50 },
  { service: 'Dry Cleaning — Shirt / Top', unit: 'per item', rate: 8.00 },
  { service: 'Dry Cleaning — Suit / Coat', unit: 'per item', rate: 22.00 },
  { service: 'Steam Pressing & Ironing', unit: 'per item', rate: 3.00 },
  { service: 'Shoe Care & Restoration', unit: 'per pair', rate: 12.00 },
  { service: 'Comforter & Heavy Bedding', unit: 'per item', rate: 20.00 },
];

export default function PricingPage() {
  const [weight, setWeight] = useState(15);
  const estimated = (weight * 2.50).toFixed(2);

  return (
    <main className="bg-[#f5f4fe] min-h-screen font-sans">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="bg-[#f5f4fe] py-16 sm:py-20 text-center">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <ScrollReveal variant="fade-down">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-5">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                SIMPLE & TRANSPARENT
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-[#0f172a] leading-[1.12] tracking-tight mb-5">
              Clear <span className="text-[#6052ff] italic font-black">Pricing,</span> No Surprises
            </h1>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Choose a monthly subscription plan or pay as you go with individual itemized rates.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SUBSCRIPTION PLANS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          <ScrollReveal variant="fade-up">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  SUBSCRIPTION PLANS
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
                Choose Your <span className="text-[#6052ff] italic font-black">Plan</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {plans.map(({ name, price, desc, features, cta, highlight }, idx) => (
              <ScrollReveal key={name} variant="scale-up" delay={idx * 150}>
                <div
                  className={`rounded-[32px] p-8 flex flex-col justify-between transition-all duration-300 h-full ${
                    highlight
                      ? 'bg-gradient-to-br from-[#6052ff] to-[#7c6fff] border-0 text-white shadow-[0_16px_48px_rgba(96,82,255,0.35)] hover:-translate-y-2'
                      : 'bg-white border border-[#ebe7fe] text-[#0f172a] shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1.5'
                  }`}
                >
                  <div>
                    {highlight && (
                      <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-5 tracking-wider uppercase">
                        ✨ MOST POPULAR
                      </div>
                    )}

                    <h2 className={`text-2xl font-black mb-1.5 ${highlight ? 'text-white' : 'text-[#0f172a]'}`}>
                      {name}
                    </h2>
                    <p className={`text-sm mb-6 leading-relaxed ${highlight ? 'text-white/85' : 'text-gray-500'}`}>
                      {desc}
                    </p>

                    <div className="mb-7">
                      <span className={`text-5xl font-black ${highlight ? 'text-white' : 'text-[#0f172a]'}`}>
                        ${price}
                      </span>
                      <span className={`text-sm ml-1.5 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>/month</span>
                    </div>

                    <ul className="space-y-3.5 mb-8">
                      {features.map((f) => (
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
                  </div>

                  <Link
                    href="/contact"
                    className={`w-full text-center py-3.5 rounded-full font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                      highlight
                        ? 'bg-white text-[#6052ff] hover:bg-gray-100 shadow-sm'
                        : 'bg-[#6052ff] text-white hover:bg-[#4f3eff] shadow-[0_4px_16px_rgba(96,82,255,0.3)]'
                    }`}
                  >
                    {cta}
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          PAY AS YOU GO RATE TABLE & GUARANTEE CARD
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left Image Card */}
            <ScrollReveal variant="fade-right" className="lg:col-span-5">
              <div className="relative w-full aspect-square rounded-[32px] overflow-hidden shadow-xl border border-white group">
                <Image
                  src="/realistic_washing_machine.jpg"
                  alt="Quality Guarantee"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c28]/90 via-[#0e0c28]/40 to-transparent flex flex-col justify-end p-8 text-white space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#6052ff] text-white flex items-center justify-center shadow-lg border border-white/20">
                    <Shield className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-white">100% Price & Quality Guarantee</h3>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    No hidden fees or unexpected charges. You only pay for what we weigh or clean.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Rate Table */}
            <ScrollReveal variant="fade-left" delay={150} className="lg:col-span-7 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                  <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                    PAY AS YOU GO
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
                  Individual <span className="text-[#6052ff] italic font-black">Service Rates</span>
                </h2>
              </div>

              <div className="bg-white rounded-[28px] border border-[#ebe7fe] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                {laundryRates.map(({ service, unit, rate }, i) => (
                  <div
                    key={service}
                    className={`flex items-center justify-between px-7 py-4.5 transition-colors hover:bg-[#f5f4fe] ${
                      i !== laundryRates.length - 1 ? 'border-b border-[#f0effe]' : ''
                    }`}
                  >
                    <span className="font-black text-[#0f172a] text-[15px]">{service}</span>
                    <div className="flex items-center gap-6">
                      <span className="text-gray-400 text-xs font-semibold">{unit}</span>
                      <span className="text-[#6052ff] font-black text-lg">${rate.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COST CALCULATOR
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">

          <ScrollReveal variant="zoom-in">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                ESTIMATE YOUR ORDER
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight mb-10">
              Laundry Cost <span className="text-[#6052ff] italic font-black">Calculator</span>
            </h2>

            <div className="bg-[#f5f4fe] border border-[#ebe7fe] rounded-[32px] p-8 sm:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.08)] transition-all">

              <label className="block text-base font-extrabold text-[#0f172a] mb-4">
                Estimated Weight:{' '}
                <span className="text-[#6052ff] text-xl font-black">{weight} lbs</span>
              </label>

              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full accent-[#6052ff] mb-8 cursor-pointer h-2 bg-[#e6e2fe] rounded-lg"
              />

              <div className="bg-white rounded-[24px] border border-[#ebe7fe] p-8 shadow-sm mb-8">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Estimated Wash &amp; Fold Cost</p>
                <p className="text-5xl sm:text-6xl font-black text-[#6052ff] transition-all duration-300">${estimated}</p>
                <p className="text-gray-400 text-xs mt-2">Includes doorstep collection, eco-wash, fold &amp; delivery</p>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-[15px] px-9 py-4 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(96,82,255,0.4)]"
              >
                <Truck className="w-4 h-4" /> Book Pickup Now
              </Link>

            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ScrollReveal variant="zoom-in">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Ready for Cleaner Clothes?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Contact us or select your plan to get started with fast doorstep laundry care.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg hover:-translate-y-1">
                <Truck className="w-5 h-5" /> Schedule a Pickup
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200 hover:-translate-y-1">
                Explore Services
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}


