'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, Mail, Phone, MapPin } from 'lucide-react';

// Pages where the public footer should NOT appear
const hiddenFooterRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/unauthorized',
];

// Inline SVG social icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className ?? 'w-4 h-4'}
    fill="currentColor"
  >
    <path d="M13.5 21v-8h2.75l.4-3h-3.15V8.08c0-.87.24-1.46 1.5-1.46h1.75V3.95c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.22 1.52-4.22 4.31V10H7.17v3h2.83v8h3.5Z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className ?? 'w-4 h-4'}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle
      cx="17.5"
      cy="6.5"
      r="0.5"
      fill="currentColor"
    />
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className ?? 'w-4 h-4'}
    fill="currentColor"
  >
    <path d="M15.5 3c.35 1.9 1.43 3.08 3.5 3.2v3.1c-1.2.12-2.3-.28-3.45-1v6.05c0 3.65-2.55 5.65-5.4 5.65-2.78 0-5.15-1.9-5.15-4.75 0-3.1 2.7-5.05 5.9-4.3v3.15c-1.65-.42-2.65.25-2.65 1.25 0 .8.7 1.45 1.65 1.45 1.15 0 2.05-.78 2.05-2.35V3h3.55Z" />
  </svg>
);

const footerLinks = {
  explore: [
    { label: 'Home', href: '/c/mob' },
    { label: 'About Us', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ],

  services: [
    { label: 'Wash & Fold', href: '/services' },
    { label: 'Dry Cleaning', href: '/services' },
    { label: 'Ironing & Press', href: '/services' },
    { label: 'Express Service', href: '/services' },
    { label: 'Shoe Cleaning', href: '/services' },
  ],
};

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on specific pages
  const shouldHideFooter =
    hiddenFooterRoutes.includes(pathname) ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    /^\/c\/[^/]+\/dashboard(?:\/.*)?$/.test(pathname) ||
    /^\/c\/[^/]+\/login$/.test(pathname) ||
    /^\/c\/[^/]+\/members$/.test(pathname) ||
/^\/c\/[^/]+\/rep(?:\/.*)?$/.test(pathname) ||
/^\/c\/[^/]+\/londary-details(?:\/.*)?$/.test(pathname) ||
      /^\/c\/[^/]+\/retail-shops(?:\/.*)?$/.test(pathname) ||
            /^\/c\/[^/]+\/routes(?:\/.*)?$/.test(pathname) ||
                      /^\/c\/[^/]+\/route-assignments(?:\/.*)?$/.test(pathname);

  if (shouldHideFooter) {
    return null;
  }

  return (
    <footer
      className="bg-brand-dark-slate text-white"
      style={{ backgroundColor: '#0c162d' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12">

        {/* Main Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">

            <Link
              href="/c/mob"
              className="flex items-center gap-2.5 mb-4"
            >
              <div className="w-10 h-10 rounded-full bg-[#6052ff] flex items-center justify-center">
                <span className="text-white font-black text-lg">
                  G
                </span>
              </div>

              <span className="text-2xl font-black text-white">
                Go Clean
              </span>
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              Professional laundry pickup and delivery service.
              We handle your clothes with care so you can focus
              on what matters.
            </p>

            <div className="space-y-3 text-sm text-gray-400">

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#6052ff] flex-shrink-0" />
                hello@goclean.com
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#6052ff] flex-shrink-0" />
                +1 (555) 123-4567
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6052ff] flex-shrink-0" />
                123 Clean Street, NY 10001
              </div>

            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-bold mb-4 text-base">
              Explore
            </h4>

            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4 text-base">
              Services
            </h4>

            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="text-white font-bold mb-4 text-base">
              Follow Us
            </h4>

            <div className="flex gap-3">

              {[
                {
                  Icon: FacebookIcon,
                  label: 'Facebook',
                },
                {
                  Icon: InstagramIcon,
                  label: 'Instagram',
                },
                {
                  Icon: TiktokIcon,
                  label: 'TikTok',
                },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#6052ff] flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-4 h-4 text-white" />
                </a>
              ))}

            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">

          <p>
            © {new Date().getFullYear()} Go Clean. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#6052ff]" />

            <span>
              Fast, fresh, professional laundry service
            </span>
          </div>

        </div>

      </div>
    </footer>
  );
}