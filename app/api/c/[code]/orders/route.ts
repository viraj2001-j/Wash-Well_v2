import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import prisma from "@/lib/db";
import { logActivity } from "@/lib/services/activity";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const routeId = searchParams.get("routeId");
    const refId = searchParams.get("refId");
    const driverId = searchParams.get("driverId");

    const where: any = {
      companyId: company.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (routeId) {
      where.customer = {
        routeLinks: {
          some: { routeId, isActive: true },
        },
      };
    }

    if (refId) {
      where.createdById = refId;
    }

    if (driverId) {
      where.pickup = {
        collectedById: driverId,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        createdBy: true,
        approvedBy: true,
        items: { include: { service: true } },
        pickup: { include: { collectedBy: true } },
        invoice: { include: { allocations: true } },
        delivery: { include: { completedBy: true } },
        processing: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: error.message === "UNAUTHENTICATED" ? 401 : 400 }
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
    const { customerId, requestedPickupDate, items, notes } = body;

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID is required" }, { status: 400 });
    }

    const orderCount = await prisma.order.count({ where: { companyId: company.id } });
    const orderNo = `ORD-${(orderCount + 1).toString().padStart(5, "0")}`;

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          companyId: company.id,
          orderNo,
          customerId,
          createdById: user.id,
          requestedPickupDate: requestedPickupDate ? new Date(requestedPickupDate) : null,
          status: "PENDING_APPROVAL",
          notes: notes || null,
          items: {
            create: (items || []).map((item: any) => ({
              serviceId: item.serviceId,
              description: item.description || null,
              pricingType: item.pricingType || "PER_KG",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              total: (item.quantity || 1) * (item.unitPrice || 0),
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: createdOrder.id,
          toStatus: "PENDING_APPROVAL",
          changedById: user.id,
          note: "Order created and pending approval",
        },
      });

      return createdOrder;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "ORDER_CREATED",
      entityType: "ORDER",
      entityId: order.id,
      description: `Order ${order.orderNo} created for customer ${order.customer.name}`,
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 400 }
    );
  }
}
