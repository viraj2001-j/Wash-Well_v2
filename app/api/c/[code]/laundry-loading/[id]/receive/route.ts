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

    const body = await req.json();
    const { receivedBags, receivedWeight, varianceReason } = body;

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
      return NextResponse.json({ success: false, error: "Cannot receive a cancelled load" }, { status: 400 });
    }

    const expectedBags = existingLoad.totalBags || 0;
    const expectedWeight = Number(existingLoad.totalWeight) || 0;

    const actualBags = Number(receivedBags) >= 0 ? Number(receivedBags) : expectedBags;
    const actualWeight = Number(receivedWeight) >= 0 ? Number(receivedWeight) : expectedWeight;

    const varianceWeight = Number((actualWeight - expectedWeight).toFixed(2));
    const bagDiff = actualBags - expectedBags;

    // If there is significant variance, require variance reason
    if ((varianceWeight !== 0 || bagDiff !== 0) && (!varianceReason || !varianceReason.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: `Weight/Bag discrepancy detected (${varianceWeight > 0 ? "+" : ""}${varianceWeight} KG, ${bagDiff > 0 ? "+" : ""}${bagDiff} Bags). A variance reason is required.`,
        },
        { status: 400 }
      );
    }

    // Atomic receiving transaction
    const updatedLoad = await db.$transaction(async (tx: any) => {
      const updated = await tx.laundryLoad.update({
        where: { id },
        data: {
          status: "RECEIVED",
          receivedById: user.id,
          receivedAt: new Date(),
          receivedBags: actualBags,
          receivedWeight: actualWeight,
          varianceWeight,
          varianceReason: varianceReason ? varianceReason.trim() : null,
        },
      });

      // Update order statuses to RECEIVED_AT_LAUNDRY
      for (const lo of existingLoad.orders) {
        await tx.order.update({
          where: { id: lo.orderId },
          data: { status: "RECEIVED_AT_LAUNDRY" },
        });
      }

      return updated;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "LOAD_RECEIVED_BY_LAUNDRY",
      entityType: "LAUNDRY_LOAD",
      entityId: updatedLoad.id,
      description: `Laundry team received load ${updatedLoad.loadNumber} (Expected: ${expectedWeight} KG / ${expectedBags} Bags, Received: ${actualWeight} KG / ${actualBags} Bags, Variance: ${varianceWeight} KG)`,
    });

    return NextResponse.json({ success: true, data: updatedLoad });
  } catch (error: any) {
    console.error("POST Receive Load Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to receive load" },
      { status: 400 }
    );
  }
}
