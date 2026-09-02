'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Truck } from 'lucide-react';

const contactInfo = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: 'Email',
    value: 'hello@goclean.com',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.05 1.19 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
    label: 'Phone',
    value: '+1 (555) 123-4567',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: 'Address',
    value: '123 Clean Street, New York, NY 10001',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#6052ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: 'Working Hours',
    value: 'Mon–Sat 7am – 9pm · Sun 9am – 6pm',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
              GET IN TOUCH
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-[#0f172a] leading-[1.12] tracking-tight mb-5">
            We&apos;d Love to <span className="text-[#6052ff] italic font-black">Hear From You</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Questions, feedback, or just want to say hi? Our team is ready to help you out.
          </p>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACT INFO + FORM
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">

            {/* Left — Contact Info Cards */}
            <div className="lg:col-span-5 space-y-5">

              {/* Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
                  <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                    CONTACT INFO
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
                  Reach Us <span className="text-[#6052ff] italic font-black">Anytime</span>
                </h2>
              </div>

              {/* Info Cards */}
              {contactInfo.map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#ebe7fe] p-5 flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_28px_rgba(96,82,255,0.08)] transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#e6e2fe]/70 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-[15px] font-black text-[#0f172a] leading-snug">{value}</p>
                  </div>
                </div>
              ))}

              {/* Map Placeholder */}
              <div className="rounded-[22px] bg-[#e6e2fe]/40 border border-[#ddd8f7] h-48 flex items-center justify-center mt-2">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#6052ff] flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <p className="text-[#0f172a] font-black text-sm">123 Clean Street, NY</p>
                  <p className="text-gray-400 text-xs mt-1">New York, NY 10001</p>
                </div>
              </div>

            </div>

            {/* Right — Contact Form */}
            <div className="lg:col-span-7">
              {submitted ? (
                <div className="bg-[#f5f4fe] border border-[#ebe7fe] rounded-[32px] p-14 flex flex-col items-center justify-center text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] min-h-[480px]">
                  <div className="w-16 h-16 rounded-full bg-[#6052ff] flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0f172a] mb-3">Message Sent!</h3>
                  <p className="text-gray-500 text-base max-w-xs">We'll get back to you within 24 hours. Thanks for reaching out!</p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-8 inline-flex items-center gap-2 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-semibold text-sm px-7 py-3 rounded-full transition-all duration-200 shadow-[0_4px_16px_rgba(96,82,255,0.3)] hover:-translate-y-px"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#ebe7fe] rounded-[32px] p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">

                  {/* Form Header */}
                  <div className="mb-7">
                    <div className="inline-flex items-center gap-2 bg-[#f5f4fe] border border-[#e4e1fe] rounded-full px-4 py-1.5 mb-3">
                      <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
                      <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
                        SEND A MESSAGE
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-[#0f172a]">
                      How can we <span className="text-[#6052ff] italic">help?</span>
                    </h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Name + Email row */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Full Name</label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                          className="w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Email Address</label>
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

                    {/* Subject */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Subject</label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all appearance-none"
                      >
                        <option value="">Select a topic</option>
                        <option>General Inquiry</option>
                        <option>Pickup Scheduling</option>
                        <option>Billing &amp; Payments</option>
                        <option>Feedback</option>
                        <option>Other</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        required
                        rows={5}
                        className="w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all resize-none"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-[15px] py-4 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-px"
                    >
                      <Send className="w-4 h-4" />
                      Send Message
                    </button>

                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-[#6052ff] to-[#7c6fff]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5">Ready to Get Started?</h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Book your first pickup today and experience effortless laundry care.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/pickup"
              className="inline-flex items-center gap-2 bg-white text-[#6052ff] font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              <Truck className="w-5 h-5" /> Schedule a Pickup
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200 hover:-translate-y-0.5"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
