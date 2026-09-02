import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { Building2, Users, ShoppingBag, ArrowLeft, CheckCircle2, XCircle, MapPin, Mail, Phone, ExternalLink, ShieldCheck, Layers, Package, Settings, Users2 } from "lucide-react";

export default async function OrganizationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          branches: true,
          users: true,
          customers: true,
          orders: true,
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <Link href="/super-admin/organizations" className="hover:text-[#7C3AED] flex items-center gap-1 transition">
              <ArrowLeft size={14} />
              <span>Organizations</span>
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-extrabold">{company.name}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3 mt-1">
            {company.name}
            {company.isActive ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                ACTIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                INACTIVE
              </span>
            )}
          </h1>
          <p className="text-xs font-mono text-purple-900 font-bold bg-purple-50 inline-block px-2.5 py-0.5 rounded-lg border border-purple-100">
            Code: /c/{company.code}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/c/${company.code}/dashboard`}
            target="_blank"
            className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-extrabold text-xs shadow-md transition flex items-center gap-2"
          >
            <span>Access Portal</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-xs font-bold text-gray-500">Branches</span>
            <Building2 className="w-5 h-5 p-1 bg-purple-50 rounded-lg text-[#7C3AED]" />
          </div>
          <p className="text-2xl font-black text-gray-900">{company._count.branches}</p>
          <p className="text-[10px] text-gray-400 font-medium">Active branch locations</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold text-gray-500">Staff & Admins</span>
            <Users className="w-5 h-5 p-1 bg-indigo-50 rounded-lg text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{company._count.users}</p>
          <p className="text-[10px] text-gray-400 font-medium">Registered organization users</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-sky-700">
            <span className="text-xs font-bold text-gray-500">Customers</span>
            <Users2 className="w-5 h-5 p-1 bg-sky-50 rounded-lg text-sky-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{company._count.customers}</p>
          <p className="text-[10px] text-gray-400 font-medium">Linked customer profiles</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold text-gray-500">Total Orders</span>
            <ShoppingBag className="w-5 h-5 p-1 bg-emerald-50 rounded-lg text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{company._count.orders}</p>
          <p className="text-[10px] text-emerald-700 font-bold">Processed laundry orders</p>
        </div>
      </div>

      {/* MAIN DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Contact & Info Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#7C3AED]" />
              <span>Contact Information</span>
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Email Address</span>
                <span className="font-extrabold text-gray-900 text-xs">{company.email || "Not provided"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Phone Number</span>
                <span className="font-extrabold text-gray-900 text-xs">{company.phone || "Not provided"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Registered Date</span>
                <span className="font-extrabold text-gray-900 text-xs">{new Date(company.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-6 space-y-4 text-xs">
            <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7C3AED]" />
              <span>Location Details</span>
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Address</span>
                <span className="font-extrabold text-gray-900 text-xs">{company.address || "Not provided"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">City</span>
                <span className="font-extrabold text-gray-900 text-xs">{company.city || "Not provided"}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Country</span>
                <span className="font-extrabold text-gray-900 text-xs">{company.country}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules & Direct Links */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs p-6 space-y-4">
            <h3 className="font-extrabold text-gray-900 text-sm border-b border-gray-100 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7C3AED]" />
              <span>Organization Modules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <Link
                href={`/c/${company.code}/routes`}
                target="_blank"
                className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition group space-y-1"
              >
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#7C3AED] transition">Branches & Routes</h4>
                <p className="text-gray-500">Manage locations and routing zones for this company.</p>
              </Link>

              <Link
                href={`/c/${company.code}/users`}
                target="_blank"
                className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition group space-y-1"
              >
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#7C3AED] transition">User Accounts & Staff</h4>
                <p className="text-gray-500">Manage staff, drivers, and sales reps assigned to this company.</p>
              </Link>

              <Link
                href={`/c/${company.code}/products`}
                target="_blank"
                className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition group space-y-1"
              >
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#7C3AED] transition">Services & Catalog</h4>
                <p className="text-gray-500">Manage laundry services, pricing options, and products.</p>
              </Link>

              <Link
                href={`/c/${company.code}/orders`}
                target="_blank"
                className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition group space-y-1"
              >
                <h4 className="font-extrabold text-gray-900 group-hover:text-[#7C3AED] transition">Orders & Invoices</h4>
                <p className="text-gray-500">View live tenant orders, active pickups, and payments.</p>
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}