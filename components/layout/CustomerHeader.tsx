"use client";

interface CustomerHeaderProps {
  companyCode: string;
  companyName?: string;
  customerName: string;
}

export default function CustomerHeader({}: CustomerHeaderProps) {
  // Top navbar removed from all customer portal pages per user configuration
  return null;
}
