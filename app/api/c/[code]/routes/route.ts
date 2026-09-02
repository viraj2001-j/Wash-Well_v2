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

    const routes = await prisma.route.findMany({
      where: { companyId: company.id },
      include: {
        customers: {
          where: { isActive: true },
          include: { customer: true },
        },
        assignments: {
          take: 1,
          orderBy: { workDate: "desc" },
          include: { ref: true, driver: true },
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ success: true, data: routes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch routes" },
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
    const { routeCode, name, district, area, province, notes, isActive, frequency, targetCalls } = body;

    if (!name || !routeCode) {
      return NextResponse.json({ success: false, error: "Route Code and Name are required" }, { status: 400 });
    }

    const route = await prisma.route.create({
      data: {
        companyId: company.id,
        code: routeCode,
        name,
        district: district || null,
        area: area || null,
        province: province || null,
        notes: notes || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        frequency: frequency || "DAILY",
        targetCalls: targetCalls ? Number(targetCalls) : null,
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
      action: "ROUTE_CREATED",
      entityType: "ROUTE",
      entityId: route.id,
      description: `Created Route ${route.code} - ${route.name}`,
    });

    return NextResponse.json({ success: true, data: route });
  } catch (error: any) {
    let status = 400;
    let message = error.message || "Failed to create route";

    if (error.code === "P2002") {
      status = 400;
      message = "A route with this Route Code already exists for your organization.";
    } else if (error.message === "UNAUTHENTICATED") {
      status = 401;
      message = "You must be logged in to create a route.";
    } else if (error.message === "COMPANY_NOT_FOUND") {
      status = 404;
      message = "Company organization not found.";
    } else if (error.message === "UNAUTHORIZED_COMPANY_ACCESS") {
      status = 403;
      message = "You do not have permission to modify routes for this company.";
    }

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
