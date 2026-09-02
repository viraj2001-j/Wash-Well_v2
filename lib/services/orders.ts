import prisma from "@/lib/db";
import { OrderStatus } from "@/app/generated/prisma/client";
import { logActivity } from "./activity";

export interface UpdateOrderStatusInput {
  companyId: string;
  orderId: string;
  userId: string;
  toStatus: OrderStatus;
  note?: string;
}

export async function transitionOrderStatus({
  companyId,
  orderId,
  userId,
  toStatus,
  note,
}: UpdateOrderStatusInput) {
  return await prisma.$transaction(async (tx) => {
    const currentOrder = await tx.order.findFirst({
      where: { id: orderId, companyId },
    });

    if (!currentOrder) {
      throw new Error("Order not found or access denied.");
    }

    const fromStatus = currentOrder.status;

    // Update order status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        approvedById: toStatus === "APPROVED" ? userId : currentOrder.approvedById,
      },
      include: {
        customer: {
          include: {
            addresses: true,
            routeLinks: true,
          },
        },
      },
    });

    // Auto-link CustomerRouteLink if customer address has a routeId upon approval
    if (toStatus === "APPROVED" && updatedOrder.customer) {
      const primaryAddress =
        updatedOrder.customer.addresses.find((a) => a.isPrimary) ||
        updatedOrder.customer.addresses[0];

      if (primaryAddress && primaryAddress.routeId) {
        const existingLink = await tx.routeCustomer.findFirst({
          where: {
            customerId: updatedOrder.customerId,
            routeId: primaryAddress.routeId,
          },
        });

        if (!existingLink) {
          await tx.routeCustomer.create({
            data: {
              customerId: updatedOrder.customerId,
              routeId: primaryAddress.routeId,
              isActive: true,
            },
          });
        }
      }
    }

    // Record status history
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus,
        toStatus,
        changedById: userId,
        note: note || `Status changed from ${fromStatus} to ${toStatus}`,
      },
    });

    // Log Activity
    await logActivity({
      companyId,
      userId,
      action: `ORDER_STATUS_${toStatus}`,
      entityType: "ORDER",
      entityId: orderId,
      description: `Order ${currentOrder.orderNo} status changed to ${toStatus}`,
      metadata: { fromStatus, toStatus, note },
    });

    return updatedOrder;
  });
}
