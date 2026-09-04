'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Heart, ShieldCheck, Users, Award, Truck, Sparkles, Clock, Shield } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import WallOfLove from '@/components/ui/WallOfLove';

const values = [
  {
    icon: <Heart className="w-6 h-6 text-[#6052ff]" />,
    title: 'Care & Quality',
    desc: 'Every garment is individually inspected, spot-treated, and handled with fabric-safe techniques.',
  },
  {
    icon: <Clock className="w-6 h-6 text-[#6052ff]" />,
    title: 'Reliability & Speed',
    desc: 'Guaranteed doorstep collection and on-time delivery right to your door, every single time.',
  },
  {
    icon: <Users className="w-6 h-6 text-[#6052ff]" />,
    title: 'Community First',
    desc: 'Proudly serving local households, professionals, and businesses with friendly, local care.',
  },
  {
    icon: <Award className="w-6 h-6 text-[#6052ff]" />,
    title: 'Eco-Friendly Excellence',
    desc: 'Utilizing 100% biodegradable detergents and energy-efficient wash cycles for a sustainable clean.',
  },
];

const team = [
  { name: 'David Chen', role: 'Founder & CEO', image: '/step1.jpg' },
  { name: 'Maria Lopez', role: 'Head of Operations', image: '/step2.jpg' },
  { name: 'James Wright', role: 'Lead Cleaning Specialist', image: '/step3.jpg' },
  { name: 'Amara Patel', role: 'Customer Care Lead', image: '/hero_professional.jpg' },
];

export default function AboutPage() {
  return (
    <main className="bg-[#f5f4fe] min-h-screen font-sans">

      {/* ══════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════ */}
      <section className="bg-[#f5f4fe] py-16 sm:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <ScrollReveal variant="fade-up">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                  <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                    OUR STORY & MISSION
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black text-[#0f172a] leading-[1.1] tracking-tight">
                  We Started Because <span className="text-[#6052ff] italic font-black">Laundry</span> Shouldn&apos;t Be Hard
                </h1>

                <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-xl">
                  Founded with a vision for effortlessness, Go Clean transforms laundry day into a seamless doorstep experience. We handle collection, eco-washing, pressing, and delivery so you can focus on life.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(96,82,255,0.4)]"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Explore Services</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-[#0f172a] font-semibold text-[15px] px-7 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <span>Contact Us</span>
                    <ArrowRight className="w-4 h-4 text-[#6052ff]" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Hero Graphic Card */}
            <ScrollReveal variant="zoom-in" delay={150}>
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[460px] aspect-[4/4.5] rounded-[32px] overflow-hidden shadow-xl border border-white group">
                  <Image
                    src="/hero_laundry_woman.jpg"
                    alt="Go Clean Fabric Care"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c28]/90 via-transparent to-black/20" />
                  
                  {/* Floating Glassmorphic Stats */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-lg space-y-3">
                    <div className="flex items-center justify-between text-xs font-black text-[#0f172a]">
                      <span>GO CLEAN MILESTONES</span>
                      <span className="text-[#6052ff]">SINCE 2019</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center border-t border-gray-100 pt-3">
                      <div>
                        <p className="text-2xl font-black text-[#6052ff]">50K+</p>
                        <p className="text-[11px] text-gray-500 font-semibold">Orders Delivered</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-[#6052ff]">4.9★</p>
                        <p className="text-[11px] text-gray-500 font-semibold">User Rating</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OUR MISSION & STATS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Image Card */}
            <ScrollReveal variant="fade-right" className="lg:col-span-5">
              <div className="relative w-full aspect-square rounded-[32px] overflow-hidden shadow-lg border border-[#ebe7fe] group">
                <Image
                  src="/hero_laundry_woman.jpg"
                  alt="Professional Fabric Care"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c28]/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-[#6052ff] text-white flex items-center justify-center mb-3 shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-white">100% Quality Guaranteed</h3>
                  <p className="text-xs text-gray-200 mt-1">Inspected, spot-treated, and cleaned to perfection.</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Text Content */}
            <ScrollReveal variant="fade-left" delay={150} className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  WHY WE EXIST
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-black text-[#0f172a] tracking-tight leading-[1.15]">
                Clean Clothes For A <span className="text-[#6052ff] italic font-black">Busy World</span>
              </h2>

              <p className="text-gray-500 text-base leading-relaxed">
                We believe everyone deserves access to professional-grade laundry care without sacrificing personal time. Our mission is to eliminate laundry stress through transparent pricing, doorstep collection, eco-certified cleaning, and rapid turnaround.
              </p>

              <div className="grid sm:grid-cols-2 gap-3.5 pt-2">
                {[
                  '100% Eco-friendly solvents',
                  'Garment protection warranty',
                  'Same-day express turnaround',
                  'Dedicated customer support',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2.5 text-sm font-bold text-[#0f172a]">
                    <div className="w-5 h-5 rounded-full bg-[#e6e2fe] text-[#6052ff] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {point}
                  </div>
                ))}
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CORE VALUES
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          <ScrollReveal variant="fade-up">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  WHAT DRIVES US
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
                Our Core <span className="text-[#6052ff] italic font-black">Values</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon, title, desc }, idx) => (
              <ScrollReveal key={title} variant="fade-up" delay={idx * 120}>
                <div
                  className="bg-white rounded-[28px] border border-[#ebe7fe] p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#e6e2fe]/70 flex items-center justify-center mb-6">
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
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          MEET OUR TEAM
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          <ScrollReveal variant="fade-up">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  THE TEAM
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
                Meet the <span className="text-[#6052ff] italic font-black">People</span> Behind Go Clean
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(({ name, role, image }, idx) => (
              <ScrollReveal key={name} variant="scale-up" delay={idx * 120}>
                <div
                  className="bg-white rounded-[28px] border border-[#ebe7fe] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1.5 transition-all duration-300 text-center group"
                >
                  <div className="relative w-full aspect-square rounded-[22px] overflow-hidden mb-5 bg-[#e6e2fe]">
                    <Image
                      src={image}
                      alt={name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <h3 className="text-lg font-black text-[#0f172a] mb-1">{name}</h3>
                  <p className="text-[13px] font-bold text-[#6052ff]">{role}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          WALL OF LOVE - 20 TESTIMONIALS MARQUEE
      ══════════════════════════════════════════ */}
      <WallOfLove />

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ScrollReveal variant="zoom-in">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Join Our Growing Family</h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Experience the Go Clean difference today. Fresh, doorstep laundry service made simple.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/services" className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg hover:-translate-y-1">
                <Sparkles className="w-5 h-5" /> View All Services
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200 hover:-translate-y-1">
                Contact Us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}

