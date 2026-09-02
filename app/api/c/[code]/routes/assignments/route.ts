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

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const workDate = dateStr ? new Date(dateStr) : new Date();

    const assignments = await prisma.dailyRouteAssignment.findMany({
      where: {
        companyId: company.id,
      },
      include: {
        route: {
          include: {
            customers: { where: { isActive: true }, include: { customer: true } },
          },
        },
        ref: true,
        driver: true,
        members: { include: { user: true } },
      },
      orderBy: { workDate: "desc" },
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch assignments" },
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
    const { routeId, workDate, endDate, refId, driverId, notes } = body;

    if (!routeId || !workDate) {
      return NextResponse.json({ success: false, error: "Route ID and Work Date are required" }, { status: 400 });
    }

    const dateObj = new Date(workDate);
    const endDateObj = endDate ? new Date(endDate) : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Conflict Check 1: Representative (REF) conflict
    if (refId) {
      const activeRefConflicts = await prisma.dailyRouteAssignment.findMany({
        where: {
          companyId: company.id,
          refId,
          status: { in: ["ACTIVE", "PLANNED"] },
          routeId: { not: routeId },
        },
        include: { route: true, ref: true },
      });

      const activeRefConflict = activeRefConflicts.find((asg) => {
        const checkDate = asg.endDate || asg.route?.endDate || asg.workDate;
        if (!checkDate) return true;
        const d = new Date(checkDate);
        d.setHours(23, 59, 59, 999);
        return d >= today;
      });

      if (activeRefConflict) {
        const workerName = activeRefConflict.ref?.fullName || "Representative";
        const conflictingRoute = `${activeRefConflict.route?.code} - ${activeRefConflict.route?.name}`;
        return NextResponse.json(
          {
            success: false,
            error: `Representative "${workerName}" is currently assigned to Route ${conflictingRoute}. They cannot be assigned to another route until that assignment is inactivated, deleted, or expired.`,
          },
          { status: 400 }
        );
      }
    }

    // Conflict Check 2: Driver conflict
    if (driverId) {
      const activeDriverConflicts = await prisma.dailyRouteAssignment.findMany({
        where: {
          companyId: company.id,
          driverId,
          status: { in: ["ACTIVE", "PLANNED"] },
          routeId: { not: routeId },
        },
        include: { route: true, driver: true },
      });

      const activeDriverConflict = activeDriverConflicts.find((asg) => {
        const checkDate = asg.endDate || asg.route?.endDate || asg.workDate;
        if (!checkDate) return true;
        const d = new Date(checkDate);
        d.setHours(23, 59, 59, 999);
        return d >= today;
      });

      if (activeDriverConflict) {
        const driverName = activeDriverConflict.driver?.fullName || "Driver";
        const conflictingRoute = `${activeDriverConflict.route?.code} - ${activeDriverConflict.route?.name}`;
        return NextResponse.json(
          {
            success: false,
            error: `Driver "${driverName}" is currently assigned to Route ${conflictingRoute}. They cannot be assigned to another route until that assignment is inactivated, deleted, or expired.`,
          },
          { status: 400 }
        );
      }
    }

    const assignment = await prisma.dailyRouteAssignment.upsert({
      where: {
        routeId_workDate: {
          routeId,
          workDate: dateObj,
        },
      },
      create: {
        companyId: company.id,
        routeId,
        workDate: dateObj,
        endDate: endDateObj,
        refId: refId || null,
        driverId: driverId || null,
        status: "ACTIVE",
        notes: notes || null,
      },
      update: {
        endDate: endDateObj,
        refId: refId || null,
        driverId: driverId || null,
        notes: notes || null,
        status: "ACTIVE",
      },
      include: {
        route: {
          include: {
            customers: { where: { isActive: true }, include: { customer: true } },
          },
        },
        ref: true,
        driver: true,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "DAILY_ASSIGNMENT_UPDATED",
      entityType: "ROUTE_ASSIGNMENT",
      entityId: assignment.id,
      description: `Assigned workers for Route ${assignment.route.code} on ${workDate}`,
    });

    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save daily assignment" },
      { status: 400 }
    );
  }
}
