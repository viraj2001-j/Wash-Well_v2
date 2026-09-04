'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Sparkles, Shirt, Flame, Droplets, Moon, Package, Truck, WashingMachine, Shield } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const services = [
  {
    image: '/step1.jpg',
    icon: <Package className="w-5 h-5 text-[#6052ff]" />,
    title: 'Wash & Fold',
    desc: 'We wash your clothes using premium eco-friendly detergents, then neatly fold and pack them for delivery. Perfect for everyday laundry.',
    price: 'From $2.50/lb',
    features: ['Sorted by color & fabric', 'Eco-friendly detergent', 'Neatly folded & packaged'],
  },
  {
    image: '/washing_machine_hero.jpg',
    icon: <Sparkles className="w-5 h-5 text-[#6052ff]" />,
    title: 'Dry Cleaning',
    desc: 'Professional dry cleaning for delicate fabrics, suits, dresses, and formal wear. Each item is individually inspected and treated.',
    price: 'From $8.00/item',
    features: ['Individual inspection', 'Eco-solvent cleaning', 'Protective garment bags'],
  },
  {
    image: '/hero_laundry_woman.jpg',
    icon: <Shirt className="w-5 h-5 text-[#6052ff]" />,
    title: 'Ironing & Press',
    desc: 'Crisp, perfectly pressed clothes ready for work or special occasions. We handle shirts, trousers, dresses, and formal suits.',
    price: 'From $3.00/item',
    features: ['Steam press finish', 'Hang or fold delivery', 'Safe for all fabric types'],
  },
  {
    image: '/hero_professional.jpg',
    icon: <Truck className="w-5 h-5 text-[#6052ff]" />,
    title: 'Express 24hr Service',
    desc: '24-hour rapid turnaround for urgent situations. Same pickup, same expert care — delivered back twice as fast.',
    price: 'From $15.00 flat fee',
    features: ['24hr turnaround', 'Priority route handling', 'Real-time GPS tracking'],
  },
  {
    image: '/step2.jpg',
    icon: <Shield className="w-5 h-5 text-[#6052ff]" />,
    title: 'Shoe Care & Restoration',
    desc: 'Restore your sneakers, leather shoes, and boots to near-new condition with our professional shoe cleaning service.',
    price: 'From $12.00/pair',
    features: ['Deep stain removal', 'Sole scrubbing & care', 'Conditioning & polish'],
  },
  {
    image: '/realistic_washing_machine.jpg',
    icon: <WashingMachine className="w-5 h-5 text-[#6052ff]" />,
    title: 'Comforters & Bedding',
    desc: 'Large item cleaning for duvets, comforters, pillows, and heavy blankets. Freshly cleaned and hygienically heat-dried.',
    price: 'From $20.00/item',
    features: ['Deep hygienic clean', 'Hypoallergenic certified', 'Large item commercial drums'],
  },
];

export default function ServicesPage() {
  return (
    <main className="bg-[#f5f4fe] min-h-screen font-sans">
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="bg-[#f5f4fe] py-16 sm:py-20 text-center">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <ScrollReveal variant="fade-down">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                OUR EXPERTISE
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#0f172a] mb-5 tracking-tight">
              Professional <span className="text-[#6052ff] italic font-black">Fabric Care Services</span>
            </h1>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Every service is tailored to give your garments, shoes, and bedding the exact commercial care they deserve.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICES GRID
      ══════════════════════════════════════════ */}
      <section className="pb-24 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(({ image, icon, title, desc, price, features }, idx) => (
              <ScrollReveal key={title} variant="fade-up" delay={idx * 120}>
                <div
                  className="bg-white rounded-[28px] border border-[#ebe7fe] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group overflow-hidden h-full"
                >
                  <div className="space-y-4">
                    {/* Service Card Image Header */}
                    <div className="relative w-full aspect-[16/10] rounded-[20px] overflow-hidden bg-slate-100 shadow-xs">
                      <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/90 text-[#6052ff] backdrop-blur-xs flex items-center justify-center shadow-md">
                        {icon}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-[#0f172a] mb-2 group-hover:text-[#6052ff] transition-colors">
                        {title}
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">
                        {desc}
                      </p>
                    </div>

                    <ul className="space-y-2 mb-6 border-t border-gray-100 pt-4">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-gray-600">
                          <div className="w-4 h-4 rounded-full bg-[#e6e2fe] text-[#6052ff] flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-[#6052ff] font-extrabold text-sm sm:text-base">{price}</span>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-px"
                    >
                      View Rates <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OUR PROCESS — FOUR SIMPLE STEPS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          <ScrollReveal variant="fade-up">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  OUR PROCESS
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
                Four Simple <span className="text-[#6052ff] italic font-black">Steps</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                image: '/step1.jpg',
                title: 'Schedule Pickup',
                desc: 'Choose a time that works for you online in seconds.',
              },
              {
                step: '02',
                image: '/step2.jpg',
                title: 'We Collect Clothes',
                desc: 'Our representative collects your garments right from your door.',
              },
              {
                step: '03',
                image: '/step3.jpg',
                title: 'Professional Clean',
                desc: 'Expert care, eco-washing, and steam pressing for every fabric.',
              },
              {
                step: '04',
                image: '/hero_professional.jpg',
                title: 'Fresh Delivery',
                desc: 'Clean garments returned to you fresh and ready to wear.',
              },
            ].map(({ step, image, title, desc }, idx) => (
              <ScrollReveal key={step} variant="scale-up" delay={idx * 120}>
                <div className="bg-white rounded-[28px] border border-[#ebe7fe] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(96,82,255,0.12)] hover:-translate-y-1.5 transition-all duration-300 group">
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#0e0c28] flex items-center justify-center shadow-md">
                      <span className="text-white text-[11px] font-black tracking-wide">{step}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-[16px] font-black text-[#0f172a] mb-1.5">{title}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff] text-center">
        <div className="max-w-2xl mx-auto px-4">
          <ScrollReveal variant="zoom-in">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Not Sure Which Service You Need?</h2>
            <p className="text-white/80 mb-8 text-base">Contact us and our team will help you choose the best option for your wardrobe.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all shadow-md hover:-translate-y-1">
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all hover:-translate-y-1">
                View Pricing
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}


