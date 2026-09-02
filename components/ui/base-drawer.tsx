"use client";

import React from "react";
import { X, Clock, User, Calendar, Tag, ShieldAlert } from "lucide-react";

export interface DrawerTab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  status?: string;
}

interface BaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: { label: string; variant?: "success" | "warning" | "error" | "info" | "neutral" | "purple" | "active" };
  tabs?: DrawerTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

export function BaseDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  tabs = [],
  activeTabId,
  onTabChange,
  children,
  footerActions,
}: BaseDrawerProps) {
  if (!isOpen) return null;

  const badgeStyles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-[#f2ecff] text-[#5420d8] border-[#e1d3ff]",
    neutral: "bg-[#f2ecff] text-[#5420d8] border-[#e1d3ff]",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-2xl flex-col bg-white shadow-2xl transition-all sm:rounded-l-3xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[#ece7f5] px-6 py-5">
            <div className="min-w-0 flex-1 pr-4">
              <div className="flex items-center gap-3">
                <h2 className="truncate text-lg font-bold tracking-[-0.02em] text-[#17141f]">
                  {title}
                </h2>
                {badge && (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${
                      badgeStyles[badge.variant || "neutral"]
                    }`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="mt-1 truncate text-xs font-medium text-[#888194]">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#8f889c] transition-all hover:bg-[#f3effa] hover:text-[#17141f]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs if provided */}
          {tabs.length > 0 && (
            <div className="flex shrink-0 border-b border-[#ece7f5] bg-[#faf9fc] px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange && onTabChange(tab.id)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
                      isActive
                        ? "border-[#5420d8] text-[#5420d8]"
                        : "border-transparent text-[#837b91] hover:text-[#2a2436]"
                    }`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer Actions */}
          {footerActions && (
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#ece7f5] bg-[#faf9fc] px-6 py-4">
              {footerActions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DrawerTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e7e1f2]">
      {events.map((event) => (
        <div key={event.id} className="relative flex items-start gap-4 pl-9">
          <div className="absolute left-2.5 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-[#5420d8] ring-2 ring-[#e7e1f2]" />
          <div className="flex-1 rounded-2xl border border-[#ece7f5] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#17141f]">
                {event.title}
              </span>
              <span className="text-[10px] font-medium text-[#9790a3]">
                {event.timestamp}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#625b6e]">{event.description}</p>
            {event.actor && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-[#5420d8]">
                <User className="h-3 w-3" />
                <span>{event.actor}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
