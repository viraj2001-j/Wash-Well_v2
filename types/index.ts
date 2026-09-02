export interface Service {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  iconName: string;
  category: string;
  turnaroundTime: string;
}

export interface PricePlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  category: string;
}

export interface Testimonial {
  id: string;
  author: string;
  text: string;
  role: string;
  rating: number;
  avatarUrl: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}
