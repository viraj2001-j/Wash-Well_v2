'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Truck, ChevronDown, ChevronUp, Sparkles, MessageSquare } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const contactInfo = [
  {
    icon: <Mail className="w-5 h-5 text-[#6052ff]" />,
    label: 'Email Support',
    value: 'hello@goclean.com',
  },
  {
    icon: <Phone className="w-5 h-5 text-[#6052ff]" />,
    label: 'Phone Hotline',
    value: '+1 (555) 123-4567',
  },
  {
    icon: <MapPin className="w-5 h-5 text-[#6052ff]" />,
    label: 'Main Office',
    value: '123 Clean Street, New York, NY 10001',
  },
  {
    icon: <Clock className="w-5 h-5 text-[#6052ff]" />,
    label: 'Operating Hours',
    value: 'Mon–Sat 7am – 9pm · Sun 9am – 6pm',
  },
];

const faqs = [
  {
    q: 'How does doorstep pickup and delivery work?',
    a: 'Simply fill out the inquiry form or book a pickup. Our route representative will collect your garments at your specified time and return them fresh, clean, and pressed.',
  },
  {
    q: 'What is your average turnaround time?',
    a: 'Our standard turnaround is 24 to 48 hours. Express 24-hour service is available for urgent laundry needs.',
  },
  {
    q: 'Are your detergents safe for sensitive skin and delicate fabrics?',
    a: 'Yes! We use 100% eco-friendly, biodegradable, and hypoallergenic detergents designed for gentle fabric care.',
  },
  {
    q: 'Can I track my laundry order online?',
    a: 'Absolutely. Customers registered under a company organization portal can view real-time status updates from pickup to wash and final delivery.',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
                GET IN TOUCH
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-[#0f172a] leading-[1.12] tracking-tight mb-5">
              We&apos;d Love to <span className="text-[#6052ff] italic font-black">Hear From You</span>
            </h1>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Questions about our services, pickup schedules, or custom pricing? Our team is ready to help.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACT INFO + FORM
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">

            {/* Left Column — Contact Info Cards */}
            <ScrollReveal variant="fade-right" className="lg:col-span-5 space-y-5">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                  <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                    CONTACT DETAILS
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
                  Reach Us <span className="text-[#6052ff] italic font-black">Anytime</span>
                </h2>
              </div>

              {contactInfo.map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#ebe7fe] p-4.5 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_28px_rgba(96,82,255,0.08)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#e6e2fe]/70 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-[15px] font-black text-[#0f172a] leading-snug">{value}</p>
                  </div>
                </div>
              ))}

              {/* Location Image Card */}
              <div className="relative w-full aspect-[16/10] rounded-[24px] overflow-hidden shadow-md border border-[#ebe7fe] group mt-4">
                <Image
                  src="/hero_professional.jpg"
                  alt="Go Clean Operations Center"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c28]/90 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[#6052ff]" />
                    <span className="text-sm font-black">New York Operations Center</span>
                  </div>
                  <p className="text-xs text-gray-300">123 Clean Street, New York, NY 10001</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Column — Contact Form */}
            <ScrollReveal variant="fade-left" delay={150} className="lg:col-span-7">
              {submitted ? (
                <div className="bg-[#f5f4fe] border border-[#ebe7fe] rounded-[32px] p-12 flex flex-col items-center justify-center text-center shadow-sm min-h-[480px]">
                  <div className="w-16 h-16 rounded-full bg-[#6052ff] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30 animate-bounce">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0f172a] mb-2">Message Received!</h3>
                  <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                    Thank you for reaching out to Go Clean. Our care team will respond within 24 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-8 inline-flex items-center gap-2 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-sm px-7 py-3 rounded-full transition-all duration-200 shadow-md hover:-translate-y-px"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#ebe7fe] rounded-[32px] p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(96,82,255,0.08)] transition-all">

                  <div className="mb-7">
                    <div className="inline-flex items-center gap-2 bg-[#f5f4fe] border border-[#e4e1fe] rounded-full px-4 py-1.5 mb-3">
                      <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                      <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                        SEND A MESSAGE
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-[#0f172a]">
                      How Can We <span className="text-[#6052ff] italic font-black">Help?</span>
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4.5">

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#0f172a] mb-1.5">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your Name"
                          required
                          className="w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-[#0f172a] mb-1.5">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          required
                          className="w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-[#0f172a] mb-1.5">Subject</label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all"
                      >
                        <option value="">Select a topic</option>
                        <option>General Pickup Inquiry</option>
                        <option>Service &amp; Pricing Info</option>
                        <option>Billing &amp; Invoices</option>
                        <option>Corporate Partnership</option>
                        <option>Other Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-[#0f172a] mb-1.5">Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can assist you..."
                        required
                        rows={5}
                        className="w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-[15px] py-3.5 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(96,82,255,0.4)]"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </button>

                  </form>
                </div>
              )}
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FREQUENTLY ASKED QUESTIONS
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-[#f5f4fe]">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">

          <ScrollReveal variant="fade-up">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                  NEED QUICK ANSWERS?
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tight">
                Frequently Asked <span className="text-[#6052ff] italic font-black">Questions</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {faqs.map(({ q, a }, idx) => {
              const isOpen = openFaq === idx;
              return (
                <ScrollReveal key={q} variant="fade-up" delay={idx * 100}>
                  <div
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-white ${
                      isOpen
                        ? "border-[#6052ff]/40 shadow-[0_6px_24px_rgba(96,82,255,0.08)]"
                        : "border-[#ebe7fe] hover:border-[#6052ff]/30 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-4 px-6 sm:px-7 py-5 text-left transition-colors"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span className="font-black text-[#0f172a] text-[16px] sm:text-[17px] leading-snug">
                        {q}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isOpen ? "bg-[#6052ff] text-white rotate-180" : "bg-[#e6e2fe]/70 text-[#6052ff]"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-6 sm:px-7 pb-6 text-gray-500 text-[14px] leading-relaxed border-t border-[#f4f2ff] pt-4 animate-fade-in">
                        {a}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ScrollReveal variant="zoom-in">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Ready to Get Started?</h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
              Experience effortless doorstep laundry care with Go Clean today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg hover:-translate-y-1"
              >
                <Truck className="w-5 h-5" /> View Pricing &amp; Plans
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200 hover:-translate-y-1"
              >
                Explore Services
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}


