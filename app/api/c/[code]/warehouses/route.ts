import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getWarehouseModel() {
  const db = prisma as any;
  if (db && (db.warehouseLocation || db.WarehouseLocation)) {
    return db.warehouseLocation || db.WarehouseLocation;
  }
  const dbUrl = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=verify-full");
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const freshClient = new PrismaClient({ adapter }) as any;
  return freshClient.warehouseLocation || freshClient.WarehouseLocation;
}

const DEFAULT_WAREHOUSES = [
  { name: "Main Laundry Store", storageArea: "Chemical Storage A", rackShelf: "Rack A-01" },
  { name: "Chemical Store", storageArea: "Chemical Storage B", rackShelf: "Rack B-02" },
  { name: "Packaging Store", storageArea: "General Storage", rackShelf: "Shelf C-01" },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const warehouseModel = getWarehouseModel();

    if (!warehouseModel) {
      return NextResponse.json({ success: true, data: [] });
    }

    let warehouses = await warehouseModel.findMany({
      where: { companyId: company.id },
      orderBy: { name: "asc" },
    });

    // Seed default warehouses if empty
    if (warehouses.length === 0) {
      for (const w of DEFAULT_WAREHOUSES) {
        try {
          await warehouseModel.create({
            data: {
              companyId: company.id,
              name: w.name,
              storageArea: w.storageArea,
              rackShelf: w.rackShelf,
            },
          });
        } catch (e) {
          // ignore duplicate race
        }
      }
      warehouses = await warehouseModel.findMany({
        where: { companyId: company.id },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ success: true, data: warehouses });
  } catch (error: any) {
    console.error("GET Warehouses Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch warehouses" },
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
    const { name, storageArea, rackShelf } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Warehouse name is required" },
        { status: 400 }
      );
    }

    const warehouseModel = getWarehouseModel();

    if (!warehouseModel) {
      return NextResponse.json(
        { success: false, error: "Warehouse model not initialized" },
        { status: 500 }
      );
    }

    const trimmedName = name.trim();

    // Check duplicate
    const existing = await warehouseModel.findFirst({
      where: {
        companyId: company.id,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing, existed: true });
    }

    const warehouse = await warehouseModel.create({
      data: {
        companyId: company.id,
        name: trimmedName,
        storageArea: storageArea ? storageArea.trim() : "Chemical Storage A",
        rackShelf: rackShelf ? rackShelf.trim() : "Rack A-01",
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "WAREHOUSE_CREATED",
      entityType: "WAREHOUSE",
      entityId: warehouse.id,
      description: `Created warehouse location: "${warehouse.name}"`,
    });

    return NextResponse.json({ success: true, data: warehouse });
  } catch (error: any) {
    console.error("POST Warehouse Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create warehouse" },
      { status: 400 }
    );
  }
}
