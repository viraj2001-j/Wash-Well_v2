import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Zap, Sparkles, Shirt, Flame, Droplets, Moon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Services — Go Clean',
  description: 'Explore all laundry and dry cleaning services offered by Go Clean.',
};

const services = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
      </svg>
    ),
    title: 'Wash & Fold',
    desc: 'We wash your clothes using premium eco-friendly detergents, then neatly fold and pack them for delivery. Perfect for everyday laundry.',
    price: 'From $2.50/lb',
    features: ['Sorted by color & fabric', 'Eco-friendly detergent', 'Neatly folded & packaged'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2z" />
        <circle cx="6" cy="19" r="1.5" fill="#6052ff" />
      </svg>
    ),
    title: 'Dry Cleaning',
    desc: 'Professional dry cleaning for delicate fabrics, suits, dresses, and formal wear. Each item is individually inspected and treated.',
    price: 'From $8.00/item',
    features: ['Individual inspection', 'Eco-solvent cleaning', 'Protective garment bags'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5a4.5 4.5 0 014.5 4.5c0 3-4.5 6.5-4.5 6.5S7.5 10 7.5 7A4.5 4.5 0 0112 2.5z" />
        <path d="M5 19.5c0-1.5 3.1-2.5 7-2.5s7 1 7 2.5" />
      </svg>
    ),
    title: 'Ironing & Press',
    desc: 'Crisp, perfectly pressed clothes ready for work or special occasions. We handle shirts, trousers, dresses, and more.',
    price: 'From $3.00/item',
    features: ['Steam press finish', 'Hang or fold delivery', 'All fabric types'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Express Service',
    desc: '24-hour turnaround for urgent situations. Same pickup, same care — just faster.',
    price: 'From $15.00 flat fee',
    features: ['24hr turnaround', 'Priority handling', 'Real-time tracking'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
        <circle cx="10" cy="14" r="1.5" fill="#6052ff" />
      </svg>
    ),
    title: 'Shoe Cleaning',
    desc: 'Restore your sneakers, leather shoes, and boots to near-new condition with our professional shoe care service.',
    price: 'From $12.00/pair',
    features: ['Deep stain removal', 'Sole scrubbing', 'Conditioning & polish'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4v16h20V4H2zm4 4h12v8H6V8z" />
        <path d="M6 12h12" />
      </svg>
    ),
    title: 'Comforter & Bedding',
    desc: 'Large item cleaning for duvets, comforters, pillows, and blankets. Freshly cleaned and hygienically dried.',
    price: 'From $20.00/item',
    features: ['Deep clean cycle', 'Hypoallergenic safe', 'Large item handling'],
  },
];

export default function ServicesPage() {
  return (
    <main className="bg-[#f5f4fe] min-h-screen">
      {/* Hero */}
      <section className="bg-[#f5f4fe] py-20 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
            <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
              OUR SERVICES
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0f172a] mb-5 tracking-tight">
            Professional <span className="text-[#6052ff] italic font-black">Laundry Services</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Every service is crafted to give your clothes the care they deserve.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-24 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(({ icon, title, desc, price, features }) => (
              <div
                key={title}
                className="bg-white rounded-[28px] border border-[#ebe7fe] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.09)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Soft lavender squircle icon container matching home page */}
                  <div className="w-12 h-12 rounded-2xl bg-[#e6e2fe]/70 flex items-center justify-center mb-6">
                    {icon}
                  </div>
                  <h2 className="text-xl font-black text-[#0f172a] mb-3 group-hover:text-[#6052ff] transition-colors">
                    {title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    {desc}
                  </p>
                  <ul className="space-y-2.5 mb-8 border-t border-gray-100 pt-5">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-600">
                        <Check className="w-4 h-4 text-[#6052ff] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[#6052ff] font-bold text-sm">{price}</span>
                  <Link
                    href="/pickup"
                    className="inline-flex items-center gap-1.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 shadow-sm"
                  >
                    Book Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OUR PROCESS — FOUR SIMPLE STEPS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-[#f5f4fe]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
              <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                OUR PROCESS
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-[#0f172a] tracking-tight">
              Four simple <span className="text-[#6052ff] italic font-black">steps</span>
            </h2>
          </div>

          {/* 4 Step Cards */}
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
                desc: 'Our team collects your clothes right from your home.',
              },
              {
                step: '03',
                image: '/step3.jpg',
                title: 'Professional Clean',
                desc: 'Expert care and deep clean for every fabric.',
              },
              {
                step: '04',
                image: '/hero_professional.jpg',
                title: 'Fresh Delivery',
                desc: 'Clean clothes returned to you fresh and pressed.',
              },
            ].map(({ step, image, title, desc }) => (
              <div key={step} className="bg-white rounded-[28px] border border-[#ebe7fe] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.09)] transition-all duration-300 group">

                {/* Image + Step Badge */}
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Dark navy step badge */}
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#0e0c28] flex items-center justify-center">
                    <span className="text-white text-[11px] font-black tracking-wide">{step}</span>
                  </div>
                </div>

                {/* Text */}
                <div className="p-5">
                  <h3 className="text-[16px] font-black text-[#0f172a] mb-1.5">{title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff] text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Not Sure Which Service?</h2>
          <p className="text-white/80 mb-8 text-base">Contact us and we'll help you choose the best option for your needs.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all shadow-md">
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
