import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getSupplierModel() {
  const db = prisma as any;
  if (db && (db.supplier || db.Supplier)) {
    return db.supplier || db.Supplier;
  }
  const dbUrl = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=verify-full");
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const freshClient = new PrismaClient({ adapter }) as any;
  return freshClient.supplier || freshClient.Supplier;
}

const DEFAULT_SUPPLIERS = [
  { supplierNo: "SUP-001", name: "ABC Chemicals", supplierType: "Chemical Supplier" },
  { supplierNo: "SUP-002", name: "CleanPro Lanka", supplierType: "Chemical Supplier" },
  { supplierNo: "SUP-003", name: "XYZ Supplies", supplierType: "Packaging Supplier" },
  { supplierNo: "SUP-004", name: "Lanka Laundry Equipment", supplierType: "Equipment Supplier" },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const supplierModel = getSupplierModel();

    if (!supplierModel) {
      return NextResponse.json({ success: true, data: [] });
    }

    let suppliers = await supplierModel.findMany({
      where: { companyId: company.id },
      orderBy: { name: "asc" },
    });

    // Seed defaults if empty
    if (suppliers.length === 0) {
      for (const s of DEFAULT_SUPPLIERS) {
        try {
          await supplierModel.create({
            data: {
              companyId: company.id,
              supplierNo: s.supplierNo,
              name: s.name,
              supplierType: s.supplierType,
            },
          });
        } catch (e) {
          // ignore duplicate race
        }
      }
      suppliers = await supplierModel.findMany({
        where: { companyId: company.id },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    console.error("GET Suppliers Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch suppliers" },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const body = await req.json();
    const { name, supplierType, email, phone, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Supplier name is required" },
        { status: 400 }
      );
    }

    const supplierModel = getSupplierModel();

    if (!supplierModel) {
      return NextResponse.json(
        { success: false, error: "Supplier model not initialized" },
        { status: 500 }
      );
    }

    const trimmedName = name.trim();

    // Check duplicate
    const existing = await supplierModel.findFirst({
      where: {
        companyId: company.id,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing, existed: true });
    }

    const supplierNo = `SUP-${Math.floor(100 + Math.random() * 900)}`;

    const supplier = await supplierModel.create({
      data: {
        companyId: company.id,
        supplierNo,
        name: trimmedName,
        supplierType: supplierType || "Chemical Supplier",
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "SUPPLIER_CREATED",
      entityType: "SUPPLIER",
      entityId: supplier.id,
      description: `Created supplier: "${supplier.name}" (${supplier.supplierNo})`,
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: any) {
    console.error("POST Supplier Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create supplier" },
      { status: 400 }
    );
  }
}
