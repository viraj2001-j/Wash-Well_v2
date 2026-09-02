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

    const deliveries = await prisma.delivery.findMany({
      where: {
        order: { companyId: company.id },
      },
      include: {
        order: {
          include: {
            customer: true,
            invoice: { include: { allocations: { include: { payment: true } } } },
            payments: true,
          },
        },
        createdBy: true,
        completedBy: true,
        items: true,
      },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json({ success: true, data: deliveries });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch deliveries" },
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
    const { orderId, action, driverId, scheduledDate, notes, payment } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: company.id },
      include: {
        invoice: { include: { allocations: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 400 });
    }

    const now = new Date();

    if (action === "START_DELIVERY") {
      if (order.status !== "READY_FOR_DELIVERY") {
        return NextResponse.json(
          { success: false, error: "Order is not ready for delivery." },
          { status: 400 }
        );
      }

      await prisma.delivery.upsert({
        where: { orderId },
        create: {
          orderId,
          createdById: user.id,
          status: "OUT_FOR_DELIVERY",
          scheduledDate: scheduledDate ? new Date(scheduledDate) : now,
          notes: notes || null,
        },
        update: {
          status: "OUT_FOR_DELIVERY",
          notes: notes || null,
        },
      });

      await transitionOrderStatus({
        companyId: company.id,
        orderId,
        userId: user.id,
        toStatus: "OUT_FOR_DELIVERY",
        note: `Out for delivery by driver ${user.fullName}`,
      });

      await logActivity({
        companyId: company.id,
        userId: user.id,
        action: "DELIVERY_STARTED",
        entityType: "ORDER",
        entityId: orderId,
        description: `Order ${order.orderNo} is out for delivery.`,
      });

      return NextResponse.json({ success: true, message: "Delivery started" });
    }

    if (action === "COMPLETE_DELIVERY") {
      if (order.status !== "OUT_FOR_DELIVERY") {
        return NextResponse.json(
          { success: false, error: "Order must be OUT_FOR_DELIVERY to complete delivery." },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Record balance payment if submitted
        if (payment && Number(payment.amount) > 0 && order.invoice) {
          const payAmount = Number(payment.amount);

          await tx.payment.create({
            data: {
              companyId: company.id,
              orderId,
              amount: payAmount,
              method: payment.method || "CASH",
              status: "COMPLETED",
              reference: payment.reference || null,
              notes: payment.notes || "Balance collected on delivery",
              createdById: user.id,
              allocations: {
                create: {
                  invoiceId: order.invoice.id,
                  amount: payAmount,
                },
              },
            },
          });

          // Check if fully paid
          const currentPaid = (order.invoice.allocations || []).reduce(
            (sum, a) => sum + Number(a.amount),
            0
          );
          const totalPaid = currentPaid + payAmount;
          const newStatus = totalPaid >= Number(order.invoice.total) ? "PAID" : "PARTIALLY_PAID";

          await tx.invoice.update({
            where: { id: order.invoice.id },
            data: { status: newStatus },
          });
        }

        await tx.delivery.update({
          where: { orderId },
          data: {
            status: "DELIVERED",
            deliveredAt: now,
            completedById: user.id,
            notes: notes || null,
          },
        });
      });

      await transitionOrderStatus({
        companyId: company.id,
        orderId,
        userId: user.id,
        toStatus: "DELIVERED",
        note: `Delivered by ${user.fullName}`,
      });

      await transitionOrderStatus({
        companyId: company.id,
        orderId,
        userId: user.id,
        toStatus: "COMPLETED",
        note: `Order flow completed successfully`,
      });

      await logActivity({
        companyId: company.id,
        userId: user.id,
        action: "DELIVERY_COMPLETED",
        entityType: "ORDER",
        entityId: orderId,
        description: `Order ${order.orderNo} delivered and completed.`,
      });

      return NextResponse.json({ success: true, message: "Delivery completed successfully" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process delivery action" },
      { status: 400 }
    );
  }
}
