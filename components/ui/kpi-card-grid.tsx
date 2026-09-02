"use client";

import React from "react";
import {
  PackageCheck,
  Truck,
  WashingMachine,
  DollarSign,
  Scale,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Route,
  UserCheck,
  CreditCard,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Store,
  User,
  PieChart,
  UserCog,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  PackageCheck,
  Truck,
  WashingMachine,
  DollarSign,
  Scale,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Route,
  UserCheck,
  CreditCard,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Store,
  User,
  PieChart,
  UserCog,
  ShieldCheck,
};

export interface KPICard {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  icon?: any; // String name or Component
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  status?: "active" | "pending" | "warning" | "error" | "info" | "purple";
  color?: string;
}

interface KPICardGridProps {
  cards: KPICard[];
  columns?: 2 | 3 | 4;
}

export function KPICardGrid({ cards, columns = 4 }: KPICardGridProps) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid gap-4.5 ${gridCols}`}>
      {cards.map((card) => {
        let IconComponent: LucideIcon | null = null;
        if (typeof card.icon === "string") {
          IconComponent = ICON_MAP[card.icon] || null;
        } else if (card.icon) {
          IconComponent = card.icon;
        }
        
        return (
          <div
            key={card.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#ebe7f2] bg-white p-5 shadow-[0_4px_20px_rgba(35,20,70,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(35,20,70,0.06)]"
          >
            {/* Top Row: Label & Icon */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-[#7c7589]">
                {card.label}
              </span>
              
              {IconComponent && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f2ecff] text-[#5420d8] transition-colors group-hover:bg-[#5420d8] group-hover:text-white">
                  <IconComponent className="h-4.5 w-4.5" strokeWidth={1.8} />
                </div>
              )}
            </div>

            {/* Middle Row: Big Metric Value */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[26px] font-bold tracking-[-0.03em] text-[#17141f]">
                {card.value}
              </span>

              {card.change && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
                    card.changeType === "increase"
                      ? "text-emerald-600"
                      : card.changeType === "decrease"
                      ? "text-rose-600"
                      : "text-[#888194]"
                  }`}
                >
                  {card.changeType === "increase" && (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {card.changeType === "decrease" && (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {card.change}
                </span>
              )}
            </div>

            {/* Bottom Row: Description or Status Badge */}
            {card.description && (
              <p className="mt-2 text-[10px] text-[#9b94a7] truncate">
                {card.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
