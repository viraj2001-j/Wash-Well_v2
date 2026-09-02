"use client";

import React from "react";
import { Search, Filter, RotateCcw, Download, Calendar } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  startDate?: string;
  endDate?: string;
  onDateChange?: (start: string, end: string) => void;
  onResetFilters?: () => void;
  onExportCsv?: () => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  startDate,
  endDate,
  onDateChange,
  onResetFilters,
  onExportCsv,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-[#ebe7f2] bg-white p-4 shadow-[0_4px_20px_rgba(35,20,70,0.02)] lg:flex-row lg:items-center lg:justify-between">
      {/* Left Column: Search & Dropdowns */}
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a39cb0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-[#e2ddec] bg-[#fbfafd] pl-10 pr-4 text-xs font-medium text-[#2d2638] placeholder-[#aaa4b5] transition-all focus:border-[#5420d8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5420d8]/10"
          />
        </div>

        {/* Dropdown Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="relative">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="h-10 cursor-pointer appearance-none rounded-xl border border-[#e2ddec] bg-[#fbfafd] px-3.5 pr-8 text-xs font-semibold text-[#484054] transition-all hover:bg-white focus:border-[#5420d8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5420d8]/10"
            >
              <option value="">All {filter.label}s</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a39cb0]" />
          </div>
        ))}

        {/* Date Inputs */}
        {onDateChange && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a39cb0]" />
              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => onDateChange(e.target.value, endDate || "")}
                className="h-10 rounded-xl border border-[#e2ddec] bg-[#fbfafd] pl-9 pr-3 text-xs font-medium text-[#484054] focus:border-[#5420d8] focus:bg-white focus:outline-none"
              />
            </div>
            <span className="text-xs text-[#aaa4b5]">-</span>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#a39cb0]" />
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => onDateChange(startDate || "", e.target.value)}
                className="h-10 rounded-xl border border-[#e2ddec] bg-[#fbfafd] pl-9 pr-3 text-xs font-medium text-[#484054] focus:border-[#5420d8] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Reset & Export */}
      <div className="flex items-center gap-2 self-end lg:self-auto">
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[#e2ddec] bg-white px-3.5 text-xs font-semibold text-[#665e75] transition-all hover:border-[#d4cce2] hover:bg-[#faf9fc] active:scale-95"
            title="Reset Filters"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#888196]" />
            <span>Reset</span>
          </button>
        )}

        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-[#5420d8] px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4318b5] active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>
    </div>
  );
}
