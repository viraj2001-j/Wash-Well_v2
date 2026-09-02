import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import prisma from "@/lib/db";
import { logActivity } from "@/lib/services/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { code },
    });

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    // Find associated customer record for logged in user
    let customer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { createdById: user.id },
          { email: user.email },
        ],
      },
    });

    if (!customer) {
      // Fallback: create customer entity if user signed in but didn't have customer record yet
      const count = await prisma.customer.count({ where: { companyId: company.id } });
      const customerNo = `CUST-${(count + 1).toString().padStart(5, "0")}`;

      customer = await prisma.customer.create({
        data: {
          companyId: company.id,
          customerNo,
          name: user.fullName || "Valued Customer",
          email: user.email,
          phone: user.phone || null,
          createdById: user.id,
        },
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { notes, pickupDate, itemsDescription } = body;

    // Generate Order Number
    const orderCount = await prisma.order.count({ where: { companyId: company.id } });
    const orderNo = `ORD-${(orderCount + 1).toString().padStart(6, "0")}`;

    const order = await prisma.order.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        orderNo,
        status: "PENDING_APPROVAL",
        createdById: user.id,
        notes: notes ? `Customer Pickup Request: ${notes}` : "Customer Online Pickup Request",
        ...(itemsDescription ? { specialInstructions: itemsDescription } : {}),
      },
      include: {
        customer: true,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PICKUP_REQUESTED",
      entityType: "ORDER",
      entityId: order.id,
      description: `Customer ${customer.name} requested laundry pickup (${order.orderNo})`,
    });

    return NextResponse.json({
      success: true,
      message: "Pickup request submitted successfully!",
      order,
    });
  } catch (error: any) {
    console.error("POST /api/c/[code]/customer/pickup-request error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit pickup request" },
      { status: 500 }
    );
  }
}
