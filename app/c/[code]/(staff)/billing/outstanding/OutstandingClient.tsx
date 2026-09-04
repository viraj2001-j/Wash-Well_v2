"use client";

import { useState } from "react";
import { CircleDollarSign, AlertTriangle, Clock, Calendar } from "lucide-react";

interface OutstandingClientProps {
  companyCode: string;
  companyId: string;
  initialInvoices: any[];
}

export default function OutstandingClient({
  companyCode,
  companyId,
  initialInvoices,
}: OutstandingClientProps) {
  const now = new Date();

  // Categorize invoices into aging brackets: 0-7 days, 8-30 days, 31-60 days, 60+ days
  const categorized = initialInvoices.map((inv) => {
    const paidSum = (inv.allocations || []).reduce((sum: number, a: any) => sum + Number(a.amount), 0);
    const balance = Math.max(0, Number(inv.total) - paidSum);
    const ageInDays = Math.floor((now.getTime() - new Date(inv.createdAt).getTime()) / (1000 * 3600 * 24));

    let bracket = "0-7 Days";
    if (ageInDays > 60) bracket = "60+ Days";
    else if (ageInDays > 30) bracket = "31-60 Days";
    else if (ageInDays > 7) bracket = "8-30 Days";

    return {
      ...inv,
      paidSum,
      balance,
      ageInDays,
      bracket,
    };
  });

  const totalOutstanding = categorized.reduce((sum, i) => sum + i.balance, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outstanding Balances & Aging Report</h1>
          <p className="text-xs text-gray-500 mt-1">Track unpaid customer balances categorized by age</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-2xl text-rose-900 font-bold text-sm">
          Total Outstanding: Rs.{totalOutstanding.toLocaleString()}
        </div>
      </div>

      {/* OUTSTANDING AGING CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["0-7 Days", "8-30 Days", "31-60 Days", "60+ Days"].map((bKey) => {
          const itemsInBracket = categorized.filter((c) => c.bracket === bKey);
          const bracketTotal = itemsInBracket.reduce((sum, c) => sum + c.balance, 0);

          return (
            <div key={bKey} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{bKey}</span>
              <p className="text-2xl font-bold text-gray-900">Rs.{bracketTotal.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 font-medium">{itemsInBracket.length} Unpaid Invoices</p>
            </div>
          );
        })}
      </div>

      {/* OUTSTANDING INVOICES TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Invoice Date</th>
                <th className="py-3.5 px-4">Days Overdue</th>
                <th className="py-3.5 px-4 text-right">Invoice Total</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right font-bold">Balance Owed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorized.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    No outstanding customer balances! 🎉
                  </td>
                </tr>
              ) : (
                categorized.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{inv.order?.customer?.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-purple-900">{inv.invoiceNo}</td>
                    <td className="py-3.5 px-4 text-gray-500" suppressHydrationWarning>{new Date(inv.createdAt).toLocaleDateString("en-US")}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {inv.ageInDays} Days ({inv.bracket})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-gray-600" suppressHydrationWarning>Rs.{Number(inv.total).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold" suppressHydrationWarning>
                      Rs.{inv.paidSum.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      Rs.{inv.balance.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
