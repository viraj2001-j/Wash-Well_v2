"use client";

interface HeaderProps {
  companyName?: string;
  companyCode?: string;
  userName?: string;
  userRole?: string;
}

export default function Header({}: HeaderProps) {
  // Top navbar removed from all portal pages per user configuration
  return null;
}
