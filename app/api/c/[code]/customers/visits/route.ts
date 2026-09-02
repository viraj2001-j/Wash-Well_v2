import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const visits = await prisma.customerVisit.findMany({
      where: { companyId: company.id },
      include: {
        customer: true,
        ref: true,
        route: true,
        orderCreated: true,
      },
      orderBy: { visitDate: "desc" },
    });

    return NextResponse.json({ success: true, data: visits });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer visits" },
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
    const { customerId, routeId, visitType, outcome, notes, orderCreatedId } = body;

    if (!customerId) {
      return NextResponse.json({ success: false, error: "Customer ID is required" }, { status: 400 });
    }

    const visit = await prisma.customerVisit.create({
      data: {
        companyId: company.id,
        customerId,
        refId: user.id,
        routeId: routeId || null,
        visitType: visitType || "REGULAR_VISIT",
        outcome: outcome || "NO_ORDER",
        notes: notes || null,
        orderCreatedId: orderCreatedId || null,
      },
      include: {
        customer: true,
        ref: true,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "CUSTOMER_VISIT_RECORDED",
      entityType: "CUSTOMER_VISIT",
      entityId: visit.id,
      description: `Logged visit for ${visit.customer.name} with outcome: ${visit.outcome}`,
    });

    return NextResponse.json({ success: true, data: visit });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record visit" },
      { status: 400 }
    );
  }
}
