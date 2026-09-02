"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Inbox, Eye, Edit2, CheckCircle2, XCircle, MoreVertical } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

interface DataTableViewProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
  };
}

export function DataTableView<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyTitle = "No records found",
  emptySubtitle = "Try adjusting your search query or filters.",
  pagination,
}: DataTableViewProps<T>) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#ebe7f2] bg-white shadow-[0_4px_20px_rgba(35,20,70,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-[#ece7f5] bg-[#faf9fc]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-5 py-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[#7d758c] ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#f2eeea]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div className="h-4 w-3/4 rounded bg-[#eee8f7]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2ecff] text-[#5420d8]">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-[#17141f]">
                    {emptyTitle}
                  </h4>
                  <p className="mt-1 text-xs text-[#8c8599]">{emptySubtitle}</p>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`group transition-colors hover:bg-[#fbfafd] ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-4 text-xs font-medium text-[#2d2638] ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : ((row as any)[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#ece7f5] bg-[#faf9fc] px-6 py-3.5">
          <span className="text-xs font-medium text-[#7d758c]">
            Showing Page{" "}
            <span className="font-bold text-[#17141f]">
              {pagination.currentPage}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[#17141f]">
              {pagination.totalPages}
            </span>
            {pagination.totalItems !== undefined && (
              <span> ({pagination.totalItems} items total)</span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() =>
                pagination.onPageChange(pagination.currentPage - 1)
              }
              className="flex h-8 items-center gap-1 rounded-xl border border-[#e2ddec] bg-white px-3 text-xs font-semibold text-[#524a60] transition hover:bg-[#f4f0fa] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                pagination.onPageChange(pagination.currentPage + 1)
              }
              className="flex h-8 items-center gap-1 rounded-xl border border-[#e2ddec] bg-white px-3 text-xs font-semibold text-[#524a60] transition hover:bg-[#f4f0fa] disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
  variant,
}: {
  status: string;
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "purple" | "active" | "pending";
}) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-[#f2ecff] text-[#5420d8] border-[#e1d3ff]",
    neutral: "bg-[#f4f2f7] text-[#6b6377] border-[#e2ddec]",
  }[variant || "neutral"];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${styles}`}
    >
      {status}
    </span>
  );
}
