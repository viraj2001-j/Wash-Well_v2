'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Truck, CheckCircle, Calendar, Package, Plus, Minus, ChevronRight, Trash2 } from 'lucide-react';

// ── Time Slots ────────────────────────────────────────────────────────────────
const timeSlots = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
  '6:00 PM – 8:00 PM',
];

// ── Service → Items Mapping ───────────────────────────────────────────────────
const serviceItems: Record<string, string[]> = {
  'Wash & Fold':     ['Shirts', 'Pants', 'T-Shirts', 'Underwear', 'Socks', 'Towels', 'Bed Sheets'],
  'Dry Cleaning':    ['Suits', 'Dresses', 'Coats', 'Blazers', 'Silk Shirts', 'Formal Shirts'],
  'Ironing & Press': ['Shirts', 'Pants', 'Dresses', 'Skirts', 'Bed Sheets', 'Curtains'],
  'Express Service': ['Shirts', 'Pants', 'Suits', 'Dresses'],
  'Shoe Cleaning':   ['Sneakers', 'Leather Shoes', 'Boots', 'Sandals', 'Sports Shoes'],
  'Comforter Wash':  ['Single Comforter', 'Double Comforter', 'King Comforter', 'Pillows', 'Blankets'],
};

const allServices = Object.keys(serviceItems);

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const IconContact = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IconSchedule = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconItems = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a2 2 0 002 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
  </svg>
);

// ── ItemCounts type: { [service]: { [item]: count } } ─────────────────────────
type ItemCounts = Record<string, Record<string, number>>;

const inputClass =
  'w-full bg-[#f9f8fe] border border-[#e4e1fe] rounded-xl px-4 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all';

// ── Count Stepper ─────────────────────────────────────────────────────────────
function CountStepper({ value, onDecrement, onIncrement }: { value: number; onDecrement: () => void; onIncrement: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onDecrement}
        className="w-7 h-7 rounded-full bg-[#e6e2fe] text-[#6052ff] flex items-center justify-center hover:bg-[#6052ff] hover:text-white transition-all"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-7 text-center text-[14px] font-black text-[#0f172a]">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-7 h-7 rounded-full bg-[#e6e2fe] text-[#6052ff] flex items-center justify-center hover:bg-[#6052ff] hover:text-white transition-all"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function PickupForm() {
  useSearchParams();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    date: '', timeSlot: '', notes: '',
  });

  // Step 3 state
  const [activeService, setActiveService] = useState<string>(allServices[0]);
  const [itemCounts, setItemCounts] = useState<ItemCounts>({});
  // Mutable list of items per service (starts from defaults, supports add/delete)
  const [serviceItemsList, setServiceItemsList] = useState<Record<string, string[]>>(
    () => Object.fromEntries(Object.entries(serviceItems).map(([k, v]) => [k, [...v]]))
  );
  const [newItemInput, setNewItemInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const setCount = (service: string, item: string, delta: number) => {
    setItemCounts(prev => {
      const current = prev[service]?.[item] ?? 0;
      const next = Math.max(0, current + delta);
      return {
        ...prev,
        [service]: { ...(prev[service] ?? {}), [item]: next },
      };
    });
  };

  const getCount = (service: string, item: string) =>
    itemCounts[service]?.[item] ?? 0;

  const addItemToService = () => {
    const name = newItemInput.trim();
    if (!name || serviceItemsList[activeService]?.includes(name)) return;
    setServiceItemsList(prev => ({
      ...prev,
      [activeService]: [...(prev[activeService] ?? []), name],
    }));
    setNewItemInput('');
  };

  const deleteItemFromService = (service: string, item: string) => {
    setServiceItemsList(prev => ({
      ...prev,
      [service]: (prev[service] ?? []).filter(i => i !== item),
    }));
    // clear its count
    setItemCounts(prev => {
      const updated = { ...(prev[service] ?? {}) };
      delete updated[item];
      return { ...prev, [service]: updated };
    });
  };

  // All selected items flattened for summary
  const orderLines = allServices.flatMap(svc =>
    (serviceItemsList[svc] ?? [])
      .filter(item => (itemCounts[svc]?.[item] ?? 0) > 0)
      .map(item => ({ service: svc, item, count: itemCounts[svc][item] }))
  );

  const totalItems = orderLines.reduce((s, l) => s + l.count, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="bg-[#f5f4fe] border border-[#ebe7fe] rounded-[32px] p-10 sm:p-14 text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="w-20 h-20 rounded-full bg-[#6052ff] flex items-center justify-center mx-auto mb-6 shadow-[0_8px_24px_rgba(96,82,255,0.3)]">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-black text-[#0f172a] mb-3">Pickup Confirmed!</h2>
        <p className="text-gray-500 text-base mb-1">
          Your order will be picked up on <span className="font-black text-[#0f172a]">{form.date}</span>
        </p>
        <p className="text-gray-500 text-base mb-7">
          between <span className="font-black text-[#0f172a]">{form.timeSlot}</span>.
        </p>

        {/* Order summary */}
        <div className="bg-white border border-[#ebe7fe] rounded-2xl p-5 mb-8 text-left shadow-sm">
          <p className="text-[11px] font-bold text-[#6052ff] tracking-wider uppercase mb-3">Order Summary</p>
          {orderLines.length === 0 ? (
            <p className="text-gray-400 text-sm">No items selected.</p>
          ) : (
            <div className="space-y-2">
              {orderLines.map(({ service, item, count }) => (
                <div key={`${service}-${item}`} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-[#0f172a] font-semibold">{item}</span>
                    <span className="text-gray-400 text-[12px] ml-1.5">({service})</span>
                  </div>
                  <span className="text-[#6052ff] font-black">× {count}</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-[#f0effe] mt-3 pt-3 text-[13px] text-gray-400">
            Confirmation sent to <span className="text-[#0f172a] font-semibold">{form.email}</span>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold px-8 py-4 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-px"
        >
          <Truck className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  // ── STEP INDICATOR ────────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: 'Contact', Icon: IconContact },
    { num: 2, label: 'Schedule', Icon: IconSchedule },
    { num: 3, label: 'Items', Icon: IconItems },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Stepper */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-full max-w-xs mx-auto">
          {steps.map(({ num, Icon }, i) => (
            <div key={num} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 flex-shrink-0 ${
                step > num
                  ? 'bg-[#6052ff] text-white'
                  : step === num
                    ? 'bg-[#6052ff] text-white shadow-[0_4px_16px_rgba(96,82,255,0.35)]'
                    : 'bg-[#e6e2fe] text-[#6052ff]'
              }`}>
                {step > num ? <CheckCircle className="w-5 h-5" /> : <Icon />}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-1 rounded-full transition-all duration-300 ${
                  step > num ? 'bg-[#6052ff]' : 'bg-[#e4e1fe]'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-start justify-center w-full max-w-xs mx-auto">
          {steps.map(({ num, label }, i) => (
            <div key={num} className="flex items-center">
              <span className={`w-10 text-center text-[11px] font-bold tracking-wide ${
                step >= num ? 'text-[#6052ff]' : 'text-gray-400'
              }`}>{label}</span>
              {i < steps.length - 1 && <div className="w-[72px]" />}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Contact ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white border border-[#ebe7fe] rounded-[28px] p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 bg-[#f5f4fe] border border-[#e4e1fe] rounded-full px-4 py-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#6052ff]" />
              <span className="text-[11px] font-bold text-[#6052ff] tracking-wider uppercase">Step 1 of 3</span>
            </div>
            <h2 className="text-xl font-black text-[#0f172a]">Your Contact Details</h2>
            <p className="text-gray-400 text-sm mt-1">We'll use this to confirm your pickup.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Full Name</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your full name" required className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Email Address</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Pickup Address</label>
            <input type="text" value={form.address} onChange={e => update('address', e.target.value)} placeholder="123 Main St, New York, NY" required className={inputClass} />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-[15px] py-4 rounded-full transition-all duration-200 shadow-[0_6px_20px_rgba(96,82,255,0.3)] hover:-translate-y-px mt-2"
          >
            Next: Schedule <Calendar className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Schedule ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="bg-white border border-[#ebe7fe] rounded-[28px] p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
          <div className="mb-2">
            <div className="inline-flex items-center gap-2 bg-[#f5f4fe] border border-[#e4e1fe] rounded-full px-4 py-1.5 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#6052ff]" />
              <span className="text-[11px] font-bold text-[#6052ff] tracking-wider uppercase">Step 2 of 3</span>
            </div>
            <h2 className="text-xl font-black text-[#0f172a]">Choose a Date & Time</h2>
            <p className="text-gray-400 text-sm mt-1">Select when you'd like us to collect your laundry.</p>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2">Preferred Date</label>
            <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required className={inputClass} />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#0f172a] mb-3">Preferred Time Slot</label>
            <div className="grid sm:grid-cols-2 gap-3">
              {timeSlots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => update('timeSlot', slot)}
                  className={`p-3.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    form.timeSlot === slot
                      ? 'bg-[#6052ff] border-[#6052ff] text-white shadow-[0_4px_14px_rgba(96,82,255,0.3)]'
                      : 'bg-[#f9f8fe] border-[#e4e1fe] text-[#0f172a] hover:border-[#6052ff] hover:text-[#6052ff]'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setStep(1)} className="flex-1 inline-flex items-center justify-center bg-white border border-[#e4e1fe] text-[#0f172a] font-bold text-[14px] py-3.5 rounded-full transition-all hover:border-[#6052ff] hover:text-[#6052ff]">Back</button>
            <button type="button" onClick={() => setStep(3)} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-[14px] py-3.5 rounded-full transition-all shadow-[0_4px_16px_rgba(96,82,255,0.3)] hover:-translate-y-px">
              Next: Items <Package className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Items ────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">

          {/* Card header */}
          <div className="bg-white border border-[#ebe7fe] rounded-[28px] p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-[#f5f4fe] border border-[#e4e1fe] rounded-full px-4 py-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#6052ff]" />
                <span className="text-[11px] font-bold text-[#6052ff] tracking-wider uppercase">Step 3 of 3</span>
              </div>
              <h2 className="text-xl font-black text-[#0f172a]">Select Service & Items</h2>
              <p className="text-gray-400 text-sm mt-1">Pick a service, then set the count for each item.</p>
            </div>

            {/* ── 1. Service Selector ── */}
            <div className="mb-6">
              <p className="text-[13px] font-bold text-[#0f172a] mb-3">1. Choose a Service</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {allServices.map(svc => {
                  const qty = Object.values(itemCounts[svc] ?? {}).reduce((a, b) => a + b, 0);
                  return (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => setActiveService(svc)}
                      className={`relative flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border text-[13px] font-bold text-left transition-all duration-200 ${
                        activeService === svc
                          ? 'bg-[#6052ff] border-[#6052ff] text-white shadow-[0_4px_14px_rgba(96,82,255,0.25)]'
                          : 'bg-[#f9f8fe] border-[#e4e1fe] text-[#0f172a] hover:border-[#6052ff] hover:text-[#6052ff]'
                      }`}
                    >
                      <span className="leading-tight">{svc}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {qty > 0 && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            activeService === svc ? 'bg-white/25 text-white' : 'bg-[#e6e2fe] text-[#6052ff]'
                          }`}>{qty}</span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${activeService === svc ? 'text-white' : 'text-[#6052ff]'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── 2. Items for active service ── */}
            <div>
              <p className="text-[13px] font-bold text-[#0f172a] mb-3">
                2. Set quantity — <span className="text-[#6052ff]">{activeService}</span>
              </p>
              <div className="space-y-2">
                {(serviceItemsList[activeService] ?? []).map(item => {
                  const count = getCount(activeService, item);
                  return (
                    <div
                      key={item}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                        count > 0
                          ? 'bg-[#f5f4fe] border-[#b5aff5]'
                          : 'bg-[#f9f8fe] border-[#e4e1fe]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {count > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#6052ff] flex-shrink-0" />
                        )}
                        <span className={`text-[14px] font-semibold truncate ${count > 0 ? 'text-[#0f172a]' : 'text-gray-500'}`}>
                          {item}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <CountStepper
                          value={count}
                          onDecrement={() => setCount(activeService, item, -1)}
                          onIncrement={() => setCount(activeService, item, 1)}
                        />
                        <button
                          type="button"
                          onClick={() => deleteItemFromService(activeService, item)}
                          className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all ml-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add custom item row */}
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={newItemInput}
                  onChange={e => setNewItemInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItemToService(); } }}
                  placeholder="Add a custom item..."
                  className="flex-1 bg-[#f9f8fe] border border-dashed border-[#b5aff5] rounded-xl px-4 py-2.5 text-[13px] text-[#0f172a] placeholder-gray-300 focus:outline-none focus:border-[#6052ff] focus:ring-2 focus:ring-[#6052ff]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={addItemToService}
                  disabled={!newItemInput.trim()}
                  className="w-10 h-10 rounded-full bg-[#6052ff] text-white flex items-center justify-center hover:bg-[#4f3eff] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_4px_12px_rgba(96,82,255,0.3)] flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── 3. Order Summary ── */}
          {totalItems > 0 && (
            <div className="bg-white border border-[#ebe7fe] rounded-[22px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <p className="text-[11px] font-bold text-[#6052ff] tracking-wider uppercase mb-3">
                Order Summary · {totalItems} item{totalItems !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {orderLines.map(({ service, item, count }) => (
                  <div key={`${service}-${item}`} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-[#0f172a] font-semibold">{item}</span>
                      <span className="text-gray-400 text-[12px] ml-1.5">({service})</span>
                    </div>
                    <span className="text-[#6052ff] font-black">× {count}</span>
                  </div>
                ))}
              </div>
              {form.date && (
                <div className="border-t border-[#f0effe] mt-3 pt-3 text-[13px] text-gray-400">
                  Pickup on <span className="text-[#0f172a] font-bold">{form.date}</span>
                  {form.timeSlot && <> · <span className="text-[#0f172a] font-bold">{form.timeSlot}</span></>}
                </div>
              )}
            </div>
          )}

          {/* ── Notes ── */}
          <div className="bg-white border border-[#ebe7fe] rounded-[22px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <label className="block text-[13px] font-bold text-[#0f172a] mb-2">
              Special Instructions <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Any specific instructions for our team..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* ── Nav buttons ── */}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="flex-1 inline-flex items-center justify-center bg-white border border-[#e4e1fe] text-[#0f172a] font-bold text-[14px] py-3.5 rounded-full transition-all hover:border-[#6052ff] hover:text-[#6052ff]">Back</button>
            <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-[#6052ff] hover:bg-[#4f3eff] text-white font-bold text-[14px] py-3.5 rounded-full transition-all shadow-[0_4px_16px_rgba(96,82,255,0.3)] hover:-translate-y-px">
              <Truck className="w-4 h-4" /> Confirm Pickup
            </button>
          </div>

        </div>
      )}

    </form>
  );
}

export default function PickupPage() {
  return (
    <main className="bg-[#f5f4fe] min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-[#f5f4fe] py-20 text-center">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4 py-1.5 shadow-sm mb-5">
            <span className="w-2 h-2 rounded-full bg-[#6052ff] flex-shrink-0" />
            <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">DOORSTEP SERVICE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-black text-[#0f172a] leading-[1.12] tracking-tight mb-5">
            Request a <span className="text-[#6052ff] italic font-black">Pickup</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
            Fill in the form below and we'll be at your door right on schedule.
          </p>
        </div>
      </section>

      {/* ── Form ── */}
      <section className="pb-24 bg-[#f5f4fe]">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <Suspense fallback={<div className="text-center py-10 text-gray-400">Loading...</div>}>
            <PickupForm />
          </Suspense>
        </div>
      </section>

    </main>
  );
}
