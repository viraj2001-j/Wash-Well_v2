import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Heart, ShieldCheck, Users, Award, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Go Clean',
  description: 'Learn about Go Clean, our mission, our team, and why we are the most trusted laundry service in the city.',
};

const values = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    title: 'Care & Quality',
    desc: 'Every garment is individually inspected, treated, and delivered with extreme care.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Reliability',
    desc: 'Guaranteed doorstep pickup and on-time delivery right to your door, every single time.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: 'Community First',
    desc: 'Proudly serving local neighborhoods with eco-friendly cleaning standards.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: 'Excellence',
    desc: 'Utilizing modern eco-friendly solvents and fabric-safe techniques for pristine results.',
  },
];

const team = [
  { name: 'David Chen', role: 'Founder & CEO', image: '/step1.jpg' },
  { name: 'Maria Lopez', role: 'Head of Operations', image: '/step2.jpg' },
  { name: 'James Wright', role: 'Lead Cleaning Expert', image: '/step3.jpg' },
  { name: 'Amara Patel', role: 'Customer Success Manager', image: '/hero_professional.jpg' },
];

export default function AboutPage() {
  return (
    <main className="bg-[#f5f4fe] min-h-screen">

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="bg-[#f5f4fe] py-20 text-center">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">

          {/* Tag Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-5">
            <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
            <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
              OUR STORY
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-[#0f172a] leading-[1.12] tracking-tight mb-6">
            We Started Because <span className="text-[#6052ff] italic font-black">Laundry</span> Shouldn't Be Hard
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Founded in 2019, Go Clean was born from a simple mission: to make fresh, clean clothes effortless through technology, care, and reliable doorstep service.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-3.5">
            <Link
              href="/pickup"
              className="inline-flex items-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-px"
            >
              <Truck className="w-4 h-4" />
              Schedule a Pickup
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-[#0f172a] font-semibold text-[15px] px-7 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-px"
            >
              Explore Services
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          OUR MISSION & STATS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tag Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  OUR MISSION
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-black text-[#0f172a] tracking-tight leading-[1.15]">
                Clean Clothes For A <span className="text-[#6052ff] italic font-black">Busy World</span>
              </h2>

              <p className="text-gray-500 text-base leading-relaxed">
                We believe everyone deserves access to professional-grade laundry care without the hassle. Our mission is to eliminate laundry day stress through seamless doorstep collection, eco-certified cleaning, and fast turnaround.
              </p>

              <p className="text-gray-500 text-base leading-relaxed">
                From our fabric-safe biodegradable detergents to our careful garment tracking system, every decision we make is guided by our commitment to quality, speed, and environmental sustainability.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Eco-friendly detergents',
                  'Garment protection policy',
                  'Same-day pickup available',
                  '100% satisfaction guarantee',
                ].map(point => (
                  <div key={point} className="flex items-center gap-2.5 text-sm font-semibold text-[#0f172a]">
                    <div className="w-5 h-5 rounded-full bg-[#e6e2fe] text-[#6052ff] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {point}
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column (5 cols) — Stats Card Container */}
            <div className="lg:col-span-5">
              <div className="bg-gradient-to-br from-[#6052ff] to-[#7c6fff] rounded-[32px] p-8 sm:p-10 text-white shadow-[0_8px_32px_rgba(96,82,255,0.25)] relative overflow-hidden">
                <div className="grid grid-cols-2 gap-8 text-center relative z-10">
                  <div>
                    <div className="text-4xl sm:text-5xl font-black mb-1">2019</div>
                    <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Year Founded</div>
                  </div>
                  <div>
                    <div className="text-4xl sm:text-5xl font-black mb-1">10K+</div>
                    <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Happy Clients</div>
                  </div>
                  <div>
                    <div className="text-4xl sm:text-5xl font-black mb-1">50K+</div>
                    <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Orders Delivered</div>
                  </div>
                  <div>
                    <div className="text-4xl sm:text-5xl font-black mb-1">4.9★</div>
                    <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CORE VALUES
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                WHAT DRIVES US
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
              Our Core <span className="text-[#6052ff] italic font-black">Values</span>
            </h2>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon, title, desc }) => (
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
                  <p className="text-[13.5px] text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          MEET OUR TEAM
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                THE TEAM
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
              Meet the <span className="text-[#6052ff] italic font-black">People</span> Behind Go Clean
            </h2>
          </div>

          {/* Team Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(({ name, role, image }) => (
              <div
                key={name}
                className="bg-white rounded-[28px] border border-[#ebe7fe] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.09)] transition-all duration-300 text-center group"
              >
                <div className="relative w-full aspect-square rounded-[22px] overflow-hidden mb-5 bg-[#e6e2fe]">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-lg font-black text-[#0f172a] mb-1">{name}</h3>
                <p className="text-[13px] font-semibold text-[#6052ff]">{role}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Join Our Growing Family</h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Experience the Go Clean difference today. Fresh, doorstep laundry service made simple.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pickup" className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg hover:-translate-y-0.5">
              <Truck className="w-5 h-5" /> Book Your First Pickup
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5">
              View Prices
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
