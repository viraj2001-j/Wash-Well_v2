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
      include: { orders: true },
    });

    if (!existingLoad || existingLoad.companyId !== company.id) {
      return NextResponse.json({ success: false, error: "Load record not found" }, { status: 404 });
    }

    if (existingLoad.status === "RECEIVED") {
      return NextResponse.json({ success: false, error: "Cannot cancel a load that has already been received by laundry team." }, { status: 400 });
    }

    // Atomic cancel transaction
    const updatedLoad = await db.$transaction(async (tx: any) => {
      const updated = await tx.laundryLoad.update({
        where: { id },
        data: {
          status: "CANCELLED",
        },
      });

      // Release orders back to APPROVED / READY status
      for (const lo of existingLoad.orders) {
        await tx.order.update({
          where: { id: lo.orderId },
          data: { status: "APPROVED" },
        });
      }

      return updated;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "LOAD_CANCELLED",
      entityType: "LAUNDRY_LOAD",
      entityId: updatedLoad.id,
      description: `Cancelled vehicle load ${updatedLoad.loadNumber} and released associated orders.`,
    });

    return NextResponse.json({ success: true, data: updatedLoad });
  } catch (error: any) {
    console.error("POST Cancel Load Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel load" },
      { status: 400 }
    );
  }
}
