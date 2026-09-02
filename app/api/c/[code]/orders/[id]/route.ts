import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess, verifyOrderAccess } from "@/lib/services/security";
import { transitionOrderStatus } from "@/lib/services/orders";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);
    const order = await verifyOrderAccess(company.id, user.id, id);

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order details" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const body = await req.json();
    const { action, note, reason } = body;

    let toStatus: any;
    let transitionNote = note;

    if (action === "APPROVE") {
      toStatus = "APPROVED";
      transitionNote = note || "Approved by Admin/Manager";
    } else if (action === "REJECT") {
      toStatus = "REJECTED";
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "A rejection reason is required." },
          { status: 400 }
        );
      }
      transitionNote = `Rejected: ${reason}`;
    } else if (action === "CANCEL") {
      toStatus = "CANCELLED";
      transitionNote = note || "Order cancelled";
    } else if (body.toStatus) {
      toStatus = body.toStatus;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action specified." },
        { status: 400 }
      );
    }

    const updatedOrder = await transitionOrderStatus({
      companyId: company.id,
      orderId: id,
      userId: user.id,
      toStatus,
      note: transitionNote,
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order status" },
      { status: 400 }
    );
  }
}
