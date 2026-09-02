import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const body = await req.json();
    const { routeCode, name, district, area, province, notes, isActive } = body;

    const existing = await prisma.route.findFirst({
      where: { id, companyId: company.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Route not found" }, { status: 404 });
    }

    const updated = await prisma.route.update({
      where: { id },
      data: {
        code: routeCode || undefined,
        name: name || undefined,
        district: district !== undefined ? (district || null) : undefined,
        area: area !== undefined ? (area || null) : undefined,
        province: province !== undefined ? (province || null) : undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        customers: {
          where: { isActive: true },
          include: { customer: true },
        },
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "ROUTE_UPDATED",
      entityType: "ROUTE",
      entityId: updated.id,
      description: `Updated Route ${updated.code} - ${updated.name}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    let status = 400;
    let message = error.message || "Failed to update route";

    if (error.code === "P2002") {
      status = 400;
      message = "A route with this Route Code already exists for your organization.";
    }

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const existing = await prisma.route.findFirst({
      where: { id, companyId: company.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Route not found" }, { status: 404 });
    }

    await prisma.route.delete({
      where: { id },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "ROUTE_DELETED",
      entityType: "ROUTE",
      entityId: id,
      description: `Deleted Route ${existing.code} - ${existing.name}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete route" },
      { status: 400 }
    );
  }
}
