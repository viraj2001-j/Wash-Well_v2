import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

const DEFAULT_LORRIES = [
  {
    vehicleNumber: "WP CAB-1234",
    model: "Isuzu NPR",
    capacity: "5 Ton",
    status: "ACTIVE",
    notes: "Main laundry delivery truck",
  },
  {
    vehicleNumber: "WP GB-1204",
    model: "Mitsubishi Fuso",
    capacity: "3.5 Ton",
    status: "ACTIVE",
    notes: "Secondary route distribution",
  },
  {
    vehicleNumber: "WP CAD-8830",
    model: "Tata Super Ace",
    capacity: "1.5 Ton",
    status: "MAINTENANCE",
    notes: "Engine maintenance scheduled",
  },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const db = prisma as any;
    let lorries = await db.lorry.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    });

    // Seed default lorries in DB if none exist for this company
    if (lorries.length === 0) {
      for (const item of DEFAULT_LORRIES) {
        try {
          await db.lorry.create({
            data: {
              companyId: company.id,
              ...item,
            },
          });
        } catch (e) {
          // Ignore unique constraint race conditions
        }
      }
      lorries = await db.lorry.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ success: true, data: lorries });
  } catch (error: any) {
    console.error("GET Lorries Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lorries" },
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
    const { vehicleNumber, model, capacity, status, notes } = body;

    if (!vehicleNumber || !vehicleNumber.trim()) {
      return NextResponse.json(
        { success: false, error: "Vehicle / Lorry Number is required" },
        { status: 400 }
      );
    }

    const trimmedVehicleNo = vehicleNumber.trim();
    const trimmedModel = model ? model.trim() : "Isuzu NPR";
    const trimmedCapacity = capacity ? capacity.trim() : "5 Ton";
    const lorryStatus = status ? status.toUpperCase().trim() : "ACTIVE";
    const lorryNotes = notes ? notes.trim() : "";

    const db = prisma as any;

    // Check duplicate vehicle number within company
    const existing = await db.lorry.findFirst({
      where: {
        companyId: company.id,
        vehicleNumber: { equals: trimmedVehicleNo, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Lorry with vehicle number "${trimmedVehicleNo}" already exists.` },
        { status: 400 }
      );
    }

    const newLorry = await db.lorry.create({
      data: {
        companyId: company.id,
        vehicleNumber: trimmedVehicleNo,
        model: trimmedModel,
        capacity: trimmedCapacity,
        status: lorryStatus,
        notes: lorryNotes,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "LORRY_CREATED",
      entityType: "LORRY",
      entityId: newLorry.id,
      description: `Added new lorry: "${newLorry.vehicleNumber}" (${newLorry.model})`,
    });

    return NextResponse.json({ success: true, data: newLorry });
  } catch (error: any) {
    console.error("POST Lorry Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create lorry" },
      { status: 400 }
    );
  }
}
