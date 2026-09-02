import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { transitionOrderStatus } from "@/lib/services/orders";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const processings = await prisma.processing.findMany({
      where: {
        order: { companyId: company.id },
      },
      include: {
        order: {
          include: {
            customer: true,
            pickup: true,
            invoice: true,
          },
        },
        createdBy: true,
        history: {
          include: { performedBy: true },
          orderBy: { startedAt: "desc" },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: processings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch processing records" },
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
    const { orderId, processingStatus, step, note } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const now = new Date();

    const processing = await prisma.$transaction(async (tx) => {
      let record = await tx.processing.findUnique({
        where: { orderId },
      });

      if (!record) {
        record = await tx.processing.create({
          data: {
            orderId,
            status: processingStatus || "RECEIVED",
            currentStep: step || null,
            startedAt: now,
            createdById: user.id,
          },
        });
      } else {
        record = await tx.processing.update({
          where: { orderId },
          data: {
            status: processingStatus || record.status,
            currentStep: step || record.currentStep,
            completedAt: processingStatus === "READY" ? now : record.completedAt,
          },
        });
      }

      if (step) {
        await tx.processingHistory.create({
          data: {
            processingId: record.id,
            step,
            status: "COMPLETED",
            performedById: user.id,
            notes: note || null,
            startedAt: now,
            completedAt: now,
          },
        });
      }

      return record;
    });

    // Update order status if marked READY
    if (processingStatus === "READY") {
      await transitionOrderStatus({
        companyId: company.id,
        orderId,
        userId: user.id,
        toStatus: "READY_FOR_DELIVERY",
        note: "Laundry processing completed & marked ready for delivery",
      });
    } else {
      await transitionOrderStatus({
        companyId: company.id,
        orderId,
        userId: user.id,
        toStatus: "PROCESSING",
        note: `Processing stage: ${processingStatus || step}`,
      });
    }

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PROCESSING_UPDATE",
      entityType: "ORDER",
      entityId: orderId,
      description: `Order processing moved to ${processingStatus || step}`,
    });

    return NextResponse.json({ success: true, data: processing });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update processing state" },
      { status: 400 }
    );
  }
}
