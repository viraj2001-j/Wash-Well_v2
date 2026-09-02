import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { createOrUpdateInvoice } from "@/lib/services/pricing";
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

    const collections = await prisma.pickup.findMany({
      where: {
        order: { companyId: company.id },
      },
      include: {
        order: {
          include: {
            customer: true,
            invoice: { include: { allocations: true } },
          },
        },
        collectedBy: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: collections });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch collections" },
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
    const {
      orderId,
      actualKg,
      kgRate,
      items, // array of { description, pricingType, quantity, unitPrice }
      discount,
      additionalCharges,
      payment, // optional payment: { amount, method, reference, notes }
      notes,
    } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId: company.id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 400 });
    }

    // Build calculation items array
    const calcItems: any[] = [];
    if (actualKg && Number(actualKg) > 0) {
      calcItems.push({
        description: `Washing & Cleaning (${actualKg} KG)`,
        pricingType: "PER_KG",
        quantity: Number(actualKg),
        unitPrice: Number(kgRate) || 0,
      });
    }

    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        if (Number(item.quantity) > 0) {
          calcItems.push({
            description: item.description,
            pricingType: item.pricingType || "PER_ITEM",
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice) || 0,
          });
        }
      });
    }

    const now = new Date();

    // Execute Collection & Invoice creation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update Pickup record
      const pickup = await tx.pickup.upsert({
        where: { orderId },
        create: {
          orderId,
          createdById: user.id,
          collectedById: user.id,
          status: "COLLECTED",
          arrivedAt: now,
          collectedAt: now,
          notes: notes || null,
          items: {
            create: calcItems.map((ci) => ({
              description: ci.description,
              pricingType: ci.pricingType,
              quantity: ci.quantity,
              unitPrice: ci.unitPrice,
              total: Number((ci.quantity * ci.unitPrice).toFixed(2)),
            })),
          },
        },
        update: {
          collectedById: user.id,
          status: "COLLECTED",
          collectedAt: now,
          notes: notes || null,
        },
        include: { items: true },
      });

      // 2. Generate/Update Invoice server-side
      const invoice = await createOrUpdateInvoice(
        company.id,
        orderId,
        calcItems,
        Number(discount) || 0,
        Number(additionalCharges) || 0
      );

      // 3. Process optional upfront payment
      if (payment && Number(payment.amount) > 0) {
        const payAmount = Number(payment.amount);
        const paymentRecord = await tx.payment.create({
          data: {
            companyId: company.id,
            orderId,
            amount: payAmount,
            method: payment.method || "CASH",
            status: "COMPLETED",
            reference: payment.reference || null,
            notes: payment.notes || "Recorded during collection",
            createdById: user.id,
            allocations: {
              create: {
                invoiceId: invoice.id,
                amount: payAmount,
              },
            },
          },
        });

        // Re-check invoice paid status
        const totalPaid = (invoice.allocations || []).reduce((sum, a) => sum + Number(a.amount), 0) + payAmount;
        let newInvStatus: any = "PARTIALLY_PAID";
        if (totalPaid >= Number(invoice.total)) {
          newInvStatus = "PAID";
        }
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: newInvStatus },
        });
      }

      return { pickup, invoice };
    });

    // 4. Update Order status to COLLECTED
    await transitionOrderStatus({
      companyId: company.id,
      orderId,
      userId: user.id,
      toStatus: "COLLECTED",
      note: `Collection recorded by ${user.fullName}. Actual KG: ${actualKg || 0}`,
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "COLLECTION_RECORDED",
      entityType: "ORDER",
      entityId: orderId,
      description: `Collection completed for Order ${order.orderNo}. KG: ${actualKg || 0}`,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record collection" },
      { status: 400 }
    );
  }
}
