import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const db = prisma as any;

    const existingLoad = await db.laundryLoad.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!existingLoad || existingLoad.companyId !== company.id) {
      return NextResponse.json({ success: false, error: "Load record not found" }, { status: 404 });
    }

    if (existingLoad.status === "CANCELLED") {
      return NextResponse.json({ success: false, error: "Cannot confirm a cancelled load" }, { status: 400 });
    }

    // Atomic confirmation transaction
    const updatedLoad = await db.$transaction(async (tx: any) => {
      // 1. Update LaundryLoad status to WITH_DRIVER / CONFIRMED
      const updated = await tx.laundryLoad.update({
        where: { id },
        data: {
          status: "WITH_DRIVER",
          confirmedById: user.id,
          confirmedAt: new Date(),
        },
      });

      // 2. Update order statuses to OUT_FOR_DELIVERY
      for (const lo of existingLoad.orders) {
        await tx.order.update({
          where: { id: lo.orderId },
          data: { status: "OUT_FOR_DELIVERY" },
        });
      }

      return updated;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "LOAD_CONFIRMED",
      entityType: "LAUNDRY_LOAD",
      entityId: updatedLoad.id,
      description: `Confirmed vehicle load ${updatedLoad.loadNumber} and assigned to driver "${updatedLoad.driverName}"`,
    });

    return NextResponse.json({ success: true, data: updatedLoad });
  } catch (error: any) {
    console.error("POST Confirm Load Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm load" },
      { status: 400 }
    );
  }
}
