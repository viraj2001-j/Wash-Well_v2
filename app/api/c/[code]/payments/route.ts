import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess, getUserRoleType } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, company } = await verifyCompanyAccess(code);
    const roleType = getUserRoleType(user);

    if (!roleType.isAdminOrManager) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    // 1. Fetch all payments with order and invoice allocation details
    const payments = await prisma.payment.findMany({
      where: { companyId: company.id },
      include: {
        order: {
          include: {
            customer: true,
            invoice: true,
          },
        },
        createdBy: true,
        allocations: {
          include: {
            invoice: {
              include: {
                order: {
                  include: { customer: true },
                },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    // 2. Fetch all Unpaid / Partially Paid Invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        order: { companyId: company.id },
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      include: {
        order: {
          include: { customer: true },
        },
        allocations: {
          include: { payment: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch all Customers with Credit settings & Outstanding Balances
    const creditCustomers = await prisma.customer.findMany({
      where: { companyId: company.id },
      include: {
        orders: {
          where: {
            invoice: {
              status: { in: ["UNPAID", "PARTIALLY_PAID"] },
            },
          },
          include: {
            invoice: {
              include: { allocations: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pendingInvoices,
        creditCustomers,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payments data" },
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
    const roleType = getUserRoleType(user);

    if (!roleType.isAdminOrManager) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { invoiceId, orderId, amount, method, reference, notes, chequeBank, chequeDate } = body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    let targetInvoice: any = null;
    let targetOrderId = orderId;

    if (invoiceId) {
      targetInvoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, order: { companyId: company.id } },
        include: { allocations: true, order: true },
      });
      if (targetInvoice) {
        targetOrderId = targetInvoice.orderId;
      }
    } else if (orderId) {
      const ord = await prisma.order.findFirst({
        where: { id: orderId, companyId: company.id },
        include: { invoice: { include: { allocations: true } } },
      });
      if (ord && ord.invoice) {
        targetInvoice = ord.invoice;
      }
    }

    // Determine initial payment status (CHEQUE can be PENDING or COMPLETED)
    const initialStatus = method === "CHEQUE" ? "PENDING" : "COMPLETED";

    const paymentNote = [
      notes,
      chequeBank ? `Bank: ${chequeBank}` : null,
      chequeDate ? `Cheque Date: ${chequeDate}` : null,
    ].filter(Boolean).join(" | ");

    const createdPayment = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          companyId: company.id,
          orderId: targetOrderId || null,
          amount: payAmount,
          method: method || "CASH",
          status: initialStatus,
          reference: reference || null,
          notes: paymentNote || null,
          createdById: user.id,
          allocations: targetInvoice ? {
            create: {
              invoiceId: targetInvoice.id,
              amount: payAmount,
            },
          } : undefined,
        },
        include: {
          order: { include: { customer: true } },
          allocations: { include: { invoice: true } },
          createdBy: true,
        },
      });

      // If payment is completed immediately, update invoice status
      if (targetInvoice && initialStatus === "COMPLETED") {
        const existingPaid = (targetInvoice.allocations || []).reduce(
          (sum: number, a: any) => sum + Number(a.amount || 0),
          0
        );
        const totalPaid = existingPaid + payAmount;
        const invoiceTotal = Number(targetInvoice.total || 0);

        const newInvoiceStatus = totalPaid >= invoiceTotal ? "PAID" : "PARTIALLY_PAID";

        await tx.invoice.update({
          where: { id: targetInvoice.id },
          data: { status: newInvoiceStatus },
        });
      }

      return payment;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PAYMENT_RECORDED",
      entityType: "PAYMENT",
      entityId: createdPayment.id,
      description: `Recorded payment of LKR ${payAmount.toLocaleString()} via ${method}`,
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully recorded!",
      data: createdPayment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, company } = await verifyCompanyAccess(code);
    const roleType = getUserRoleType(user);

    if (!roleType.isAdminOrManager) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, status, note } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: "Payment ID and target status are required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, companyId: company.id },
      include: { allocations: { include: { invoice: true } } },
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 400 });
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: status,
          notes: note ? `${payment.notes || ""} | ${note}` : payment.notes,
        },
        include: {
          order: { include: { customer: true } },
          allocations: { include: { invoice: true } },
          createdBy: true,
        },
      });

      // Recalculate invoice statuses for allocations
      for (const alloc of payment.allocations) {
        const inv = await tx.invoice.findUnique({
          where: { id: alloc.invoiceId },
          include: {
            allocations: {
              include: { payment: true },
            },
          },
        });

        if (inv) {
          const completedAllocSum = inv.allocations
            .filter((a) => a.payment.status === "COMPLETED")
            .reduce((sum, a) => sum + Number(a.amount || 0), 0);

          const invTotal = Number(inv.total || 0);
          const newStatus =
            completedAllocSum >= invTotal
              ? "PAID"
              : completedAllocSum > 0
              ? "PARTIALLY_PAID"
              : "UNPAID";

          await tx.invoice.update({
            where: { id: inv.id },
            data: { status: newStatus },
          });
        }
      }

      return p;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PAYMENT_STATUS_UPDATED",
      entityType: "PAYMENT",
      entityId: paymentId,
      description: `Updated payment status to ${status}`,
    });

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${status}`,
      data: updatedPayment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update payment status" },
      { status: 400 }
    );
  }
}
