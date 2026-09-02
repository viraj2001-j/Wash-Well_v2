import { Service, PricePlan, Testimonial, FAQ } from '../types';

export const SERVICES: Service[] = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    description: 'Everyday laundry washed, dried, and neatly folded. Perfect for t-shirts, jeans, undergarments, and bedsheets.',
    priceLabel: 'From $1.75/lb',
    iconName: 'WashingMachine',
    category: 'wash-fold',
    turnaroundTime: '24 Hours'
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    description: 'Specialized chemical cleaning for delicate items like suits, coats, dresses, and silk shirts. Restores color and fabric quality.',
    priceLabel: 'From $5.50/item',
    iconName: 'Shirt',
    category: 'dry-cleaning',
    turnaroundTime: '48 Hours'
  },
  {
    id: 'ironing-pressing',
    name: 'Ironing & Pressing',
    description: 'Professional steam pressing to remove wrinkles and provide a crisp finish for your shirts, trousers, and formal wear.',
    priceLabel: 'From $2.20/item',
    iconName: 'Sparkles',
    category: 'ironing-pressing',
    turnaroundTime: '24 Hours'
  },
  {
    id: 'stain-removal',
    name: 'Stain Treatment',
    description: 'Targeted pre-treatment and specialized washing methods to remove tough stains like coffee, wine, ink, and grease.',
    priceLabel: 'From $4.00/item',
    iconName: 'Droplet',
    category: 'special-care',
    turnaroundTime: '48 Hours'
  },
  {
    id: 'express-laundry',
    name: 'Express Delivery',
    description: 'Urgent laundry need? Get your clothes washed, dried, folded, or ironed with priority queue and delivery in under 12 hours.',
    priceLabel: '+50% Service Fee',
    iconName: 'Zap',
    category: 'wash-fold',
    turnaroundTime: '12 Hours'
  },
  {
    id: 'leather-care',
    name: 'Leather & Suede Care',
    description: 'Gentle, professional treatment for leather jackets, suede bags, and luxury outerwear to clean and restore texture.',
    priceLabel: 'From $25.00/item',
    iconName: 'Shield',
    category: 'special-care',
    turnaroundTime: '72 Hours'
  }
];

export const PRICING_PLANS: PricePlan[] = [
  {
    id: 'plan-basic',
    name: 'Everyday Wash & Fold',
    price: '$29.99',
    period: 'per bag (up to 15 lbs)',
    description: 'Perfect for single individuals and weekly essentials.',
    features: [
      'Washed with premium eco-detergent',
      'Neatly folded and sorted by type',
      'Free standard pickup and delivery',
      '24-hour standard turnaround'
    ],
    popular: false,
    category: 'package'
  },
  {
    id: 'plan-premium',
    name: 'Premium Clean & Press',
    price: '$49.99',
    period: 'per bag + 5 pressed items',
    description: 'Our most popular plan for busy professionals who need formal pressed wear.',
    features: [
      'Washed, dried, and folded (up to 20 lbs)',
      '5 shirts or trousers custom steam pressed',
      'Priority pickup scheduling',
      'Stain inspection & pre-treatment',
      'Eco-friendly packaging'
    ],
    popular: true,
    category: 'package'
  },
  {
    id: 'plan-family',
    name: 'Family Saver Pack',
    price: '$79.99',
    period: 'per bag (up to 45 lbs)',
    description: 'Designed to handle the weekly laundry load for active families.',
    features: [
      'Giant load wash, dry, and fold',
      'Hypoallergenic detergent options',
      'Free home pickup & drop-off',
      'Same-day express upgrade eligible',
      'Sorting and pairing of socks'
    ],
    popular: false,
    category: 'package'
  }
];

export const INDIVIDUAL_PRICING = [
  { category: 'Dry Cleaning', items: [
    { name: 'Suit (2-Piece)', price: '$15.50' },
    { name: 'Dress / Gown', price: '$12.00' },
    { name: 'Winter Coat / Jacket', price: '$18.00' },
    { name: 'Shirt / Blouse', price: '$5.50' },
    { name: 'Trousers / Skirt', price: '$6.00' }
  ]},
  { category: 'Wash & Press', items: [
    { name: 'Shirt (Hung)', price: '$3.50' },
    { name: 'Dress Shirt (Pressed)', price: '$4.20' },
    { name: 'Bed Sheets (Single)', price: '$8.00' },
    { name: 'Duvet / Comforter', price: '$22.00' }
  ]}
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    author: 'Sarah M.',
    text: 'LaundryExpress is an absolute lifesaver! Their pickup was right on time, and my clothes returned smelling fresher than ever, neatly folded. Highly recommend the premium plan!',
    role: 'Marketing Executive',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'test-2',
    author: 'David K.',
    text: 'As a busy entrepreneur, laundry was taking up 4 hours of my weekend. This service changed everything. The delivery is punctual, and the ironing quality is top-notch.',
    role: 'Tech Founder',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'test-3',
    author: 'Emma L.',
    text: 'Sent two delicate wool coats and a silk dress for dry cleaning. I was nervous, but they came back looking brand new and with zero chemical odor. Very professional team.',
    role: 'Interior Designer',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  }
];

export const FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'How does the free pickup and delivery service work?',
    answer: 'It is simple! You schedule a pickup date and time slot using our pickup request form. A driver will arrive to collect your laundry. Once processed, we deliver it back to your doorstep within your chosen turnaround window.'
  },
  {
    id: 'faq-2',
    question: 'Do I need to separate my laundry before pickup?',
    answer: 'No, you do not need to separate colors or fabrics. Our professional laundry team inspects and sorts all garments by color, fabric, and washing instructions prior to cleaning.'
  },
  {
    id: 'faq-3',
    question: 'What detergent options do you provide?',
    answer: 'We use high-quality, eco-friendly detergents that are tough on stains but gentle on clothes and the environment. We also offer hypoallergenic, unscented detergent options upon request (feel free to add a note in special instructions).'
  },
  {
    id: 'faq-4',
    question: 'What is your turnaround time for standard orders?',
    answer: 'Our standard turnaround is 24 hours for Wash & Fold and Pressing services. Dry Cleaning and special care items like leather require up to 48-72 hours. Express 12-hour turnaround is also available for an additional fee.'
  },
  {
    id: 'faq-5',
    question: 'How do I pay for the service?',
    answer: 'Currently, you can pay via credit card, cash, or digital wallets at the time of delivery. Once our full Supabase customer portal is launched, you will be able to save payment methods and pay securely online through your dashboard.'
  }
];
