"use client";

import React from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionLoading?: boolean;
  primaryActionVariant?: "primary" | "danger" | "success";
  secondaryActionLabel?: string;
  errorMessage?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionLoading = false,
  primaryActionVariant = "primary",
  secondaryActionLabel = "Cancel",
  errorMessage,
  size = "md",
}: BaseModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  const primaryBtnStyles = {
    primary: "bg-[#5420d8] hover:bg-[#4418b5] text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  }[primaryActionVariant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full overflow-hidden rounded-[24px] bg-white shadow-2xl transition-all ${sizeClasses}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#ece7f5] px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-[#17141f]">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#867f93]">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#8e879a] transition hover:bg-[#f3effa] hover:text-[#17141f]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banner if present */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 bg-rose-50 px-6 py-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#ece7f5] bg-[#faf9fc] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={primaryActionLoading}
            className="rounded-xl border border-[#e2ddec] bg-white px-4 py-2.5 text-xs font-semibold text-[#5a5268] transition hover:bg-[#f7f5fa] disabled:opacity-50"
          >
            {secondaryActionLabel}
          </button>

          {primaryActionLabel && onPrimaryAction && (
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={primaryActionLoading}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 ${primaryBtnStyles}`}
            >
              {primaryActionLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>{primaryActionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
