'use client';

import Image from 'next/image';
import { Star, CheckCircle2, Heart } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

export interface TestimonialItem {
  id: number;
  name: string;
  role: string;
  rating: number;
  comment: string;
  image: string;
  location: string;
}

export const wallOfLoveTestimonials: TestimonialItem[] = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    role: 'Busy Mother of 3',
    rating: 5,
    comment: 'Go Clean is an absolute lifesaver! Doorstep pickup is fast and clothes return crisp, fresh, and folded.',
    image: '/rating_avatars.jpg',
    location: 'New York, NY',
  },
  {
    id: 2,
    name: 'David Miller',
    role: 'Corporate Executive',
    rating: 5,
    comment: 'My expensive suits are impeccably dry cleaned and pressed. Fantastic service every single week.',
    image: '/hero_professional.jpg',
    location: 'Brooklyn, NY',
  },
  {
    id: 3,
    name: 'Emily Watson',
    role: 'Fashion Designer',
    rating: 5,
    comment: 'Delicate silk dresses and designer gowns handled with complete care. 100% recommended!',
    image: '/hero_laundry_woman.jpg',
    location: 'Manhattan, NY',
  },
  {
    id: 4,
    name: 'Michael Chen',
    role: 'Software Engineer',
    rating: 5,
    comment: 'Saves me at least 4 hours of tedious laundry every weekend. The tracking portal is super smooth.',
    image: '/step1.jpg',
    location: 'Queens, NY',
  },
  {
    id: 5,
    name: 'Jessica Taylor',
    role: 'Fitness Instructor',
    rating: 5,
    comment: 'Eco-friendly detergent smells fresh without triggering my sensitive skin allergies. Top quality!',
    image: '/hero_woman_basket.jpg',
    location: 'Jersey City, NJ',
  },
  {
    id: 6,
    name: 'Robert Garcia',
    role: 'Architect',
    rating: 5,
    comment: 'Punctual driver, immaculate steam pressing, and zero hassle. Couldn’t ask for better service.',
    image: '/step2.jpg',
    location: 'Hoboken, NJ',
  },
  {
    id: 7,
    name: 'Amanda Lewis',
    role: 'Medical Doctor',
    rating: 5,
    comment: 'Super fast 24-hour express turnaround for my hospital lab coats and scrubs. Amazing work!',
    image: '/step3.jpg',
    location: 'Staten Island, NY',
  },
  {
    id: 8,
    name: 'James Wilson',
    role: 'Financial Analyst',
    rating: 5,
    comment: 'The subscription pricing plan is fantastic value. Easy online scheduling in seconds.',
    image: '/washing_machine_hero.jpg',
    location: 'Bronx, NY',
  },
  {
    id: 9,
    name: 'Sophia Martinez',
    role: 'Event Planner',
    rating: 5,
    comment: 'Stain removal on my silk blouse was a total miracle! Thought it was ruined forever.',
    image: '/realistic_washing_machine.jpg',
    location: 'White Plains, NY',
  },
  {
    id: 10,
    name: 'Daniel Anderson',
    role: 'University Professor',
    rating: 5,
    comment: 'Clear itemized rates with no hidden charges. Reliable, friendly, and consistently great.',
    image: '/hero_professional.jpg',
    location: 'Princeton, NJ',
  },
  {
    id: 11,
    name: 'Olivia Thomas',
    role: 'Interior Designer',
    rating: 5,
    comment: 'Neat folding and organized packaging every single time. My closet has never looked better.',
    image: '/hero_laundry_woman.jpg',
    location: 'Scarsdale, NY',
  },
  {
    id: 12,
    name: 'William Jackson',
    role: 'Hotel Manager',
    rating: 5,
    comment: 'We sent heavy bedding and duvets — returned fluffy, spotless, and smelling wonderful.',
    image: '/step1.jpg',
    location: 'Yonkers, NY',
  },
  {
    id: 13,
    name: 'Ava White',
    role: 'Marketing Director',
    rating: 5,
    comment: 'Real-time SMS & web portal updates let me know exactly when driver is arriving.',
    image: '/rating_avatars.jpg',
    location: 'Long Island, NY',
  },
  {
    id: 14,
    name: 'Alexander Harris',
    role: 'Sneaker Collector',
    rating: 5,
    comment: 'Shoe care & restoration brought my limited edition sneakers back to store-bought condition!',
    image: '/step2.jpg',
    location: 'Astoria, NY',
  },
  {
    id: 15,
    name: 'Charlotte Martin',
    role: 'Entrepreneur',
    rating: 5,
    comment: 'Outstanding customer service team! Resolved my special delivery request instantly.',
    image: '/hero_woman_basket.jpg',
    location: 'Greenwich, CT',
  },
  {
    id: 16,
    name: 'Benjamin Thompson',
    role: 'Lawyer',
    rating: 5,
    comment: 'Premier dry cleaning standards. Every collar and cuff is ironed to perfection.',
    image: '/hero_professional.jpg',
    location: 'Newark, NJ',
  },
  {
    id: 17,
    name: 'Mia Robinson',
    role: 'Photographer',
    rating: 5,
    comment: 'I will never step foot in a laundromat again. Doorstep service is a standard of living upgrade.',
    image: '/step3.jpg',
    location: 'Stamford, CT',
  },
  {
    id: 18,
    name: 'Lucas Clark',
    role: 'Accountant',
    rating: 5,
    comment: 'Reasonable prices, excellent quality control, and zero damaged garments ever.',
    image: '/washing_machine_hero.jpg',
    location: 'Flushing, NY',
  },
  {
    id: 19,
    name: 'Isabella Rodriguez',
    role: 'Real Estate Agent',
    rating: 5,
    comment: 'Driver arrived right on the dot at 7:00 AM. Fast, courteous, and highly dependable.',
    image: '/hero_laundry_woman.jpg',
    location: 'Upper East Side, NY',
  },
  {
    id: 20,
    name: 'Ethan Lewis',
    role: 'Consultant',
    rating: 5,
    comment: '5 stars across the board! Seamless booking and premium care for all my wardrobe items.',
    image: '/rating_avatars.jpg',
    location: 'SoHo, NY',
  },
];

export default function WallOfLove() {
  // Duplicate array so marquee wraps seamlessly
  const row1 = wallOfLoveTestimonials.slice(0, 10);
  const row2 = wallOfLoveTestimonials.slice(10, 20);

  return (
    <section className="pt-8 pb-16 bg-[#f5f4fe] text-[#0f172a] overflow-hidden relative">
      {/* Background Subtle Lavender Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#6052ff]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center mb-8 relative z-10">
        <ScrollReveal variant="fade-down">
          <div className="inline-flex items-center gap-2 bg-white border border-[#e4e1fe] rounded-full px-4.5 py-1.5 shadow-xs mb-4">
            <Heart className="w-4 h-4 text-[#ff4b72] fill-[#ff4b72] animate-pulse" />
            <span className="text-[12px] font-bold text-[#6052ff] tracking-wider uppercase">
              WALL OF LOVE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[2.8rem] font-black text-[#0f172a] tracking-tight">
            Loved by <span className="text-[#6052ff] italic font-black">Thousands</span> of Customers
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto mt-3">
            Read genuine 5-star reviews from clients who trust Go Clean with their weekly fabric care.
          </p>
        </ScrollReveal>
      </div>

      {/* Row 1 — Moving Right to Left (Slower 65s speed) */}
      <div className="flex overflow-hidden py-3 group">
        <div className="flex gap-6 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]" style={{ animationDuration: '65s' }}>
          {row1.concat(row1).map((item, idx) => (
            <div
              key={`row1-${item.id}-${idx}`}
              className="w-[340px] sm:w-[380px] flex-shrink-0 bg-white border border-[#ebe7fe] rounded-[28px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:border-[#6052ff]/50 hover:shadow-[0_16px_36px_rgba(96,82,255,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#6052ff] flex-shrink-0 shadow-sm">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[#0f172a] font-black text-[15px] leading-tight flex items-center gap-1.5">
                        {item.name}
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] fill-[#10b981]/20" />
                      </h4>
                      <p className="text-gray-400 text-[12px] font-semibold">{item.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#6052ff] text-[#6052ff]" />
                  ))}
                </div>

                <p className="text-gray-600 text-[13.5px] leading-relaxed whitespace-normal text-left">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f0effe] flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                <span>Verified Customer</span>
                <span className="text-[#6052ff] font-bold">{item.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 2 — Moving Right to Left (Slower 75s speed) */}
      <div className="flex overflow-hidden py-3 mt-2 group">
        <div className="flex gap-6 animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]" style={{ animationDuration: '75s' }}>
          {row2.concat(row2).map((item, idx) => (
            <div
              key={`row2-${item.id}-${idx}`}
              className="w-[340px] sm:w-[380px] flex-shrink-0 bg-white border border-[#ebe7fe] rounded-[28px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:border-[#6052ff]/50 hover:shadow-[0_16px_36px_rgba(96,82,255,0.14)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#6052ff] flex-shrink-0 shadow-sm">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <h4 className="text-[#0f172a] font-black text-[15px] leading-tight flex items-center gap-1.5">
                        {item.name}
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] fill-[#10b981]/20" />
                      </h4>
                      <p className="text-gray-400 text-[12px] font-semibold">{item.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#6052ff] text-[#6052ff]" />
                  ))}
                </div>

                <p className="text-gray-600 text-[13.5px] leading-relaxed whitespace-normal text-left">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f0effe] flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                <span>Verified Customer</span>
                <span className="text-[#6052ff] font-bold">{item.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

