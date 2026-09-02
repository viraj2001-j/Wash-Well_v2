import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { code, id } = resolvedParams;
    const { user, company } = await verifyCompanyAccess(code);

    const body = await req.json();
    const {
      routeId,
      workDate,
      endDate,
      refId,
      driverId,
      status,
      notes,
    } = body;

    // Find assignment by assignment ID, routeId, refId, or driverId
    const existing = await prisma.dailyRouteAssignment.findFirst({
      where: {
        OR: [
          { id },
          { routeId: id },
          { refId: id },
          { driverId: id },
        ],
        companyId: company.id,
      },
      include: { route: true },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Route assignment not found" },
        { status: 404 }
      );
    }

    const targetAssignmentId = existing.id;
    const targetRouteId = routeId || existing.routeId;
    const targetStatus = status !== undefined ? status : existing.status;
    const targetRefId = refId !== undefined ? (refId || null) : existing.refId;
    const targetDriverId = driverId !== undefined ? (driverId || null) : existing.driverId;

    // Check worker conflict if setting assignment to ACTIVE or PLANNED
    if (targetStatus === "ACTIVE" || targetStatus === "PLANNED") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if REF is assigned to another active assignment
      if (targetRefId) {
        const activeRefConflicts = await prisma.dailyRouteAssignment.findMany({
          where: {
            companyId: company.id,
            id: { not: targetAssignmentId },
            refId: targetRefId,
            status: { in: ["ACTIVE", "PLANNED"] },
            routeId: { not: targetRouteId },
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

      // Check if Driver is assigned to another active assignment
      if (targetDriverId) {
        const activeDriverConflicts = await prisma.dailyRouteAssignment.findMany({
          where: {
            companyId: company.id,
            id: { not: targetAssignmentId },
            driverId: targetDriverId,
            status: { in: ["ACTIVE", "PLANNED"] },
            routeId: { not: targetRouteId },
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
    }

    const updated = await prisma.dailyRouteAssignment.update({
      where: { id: targetAssignmentId },
      data: {
        routeId: routeId || undefined,
        workDate: workDate ? new Date(workDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        refId: refId !== undefined ? (refId || null) : undefined,
        driverId: driverId !== undefined ? (driverId || null) : undefined,
        status: status || undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
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
      action: "ROUTE_ASSIGNMENT_UPDATED",
      entityType: "ROUTE_ASSIGNMENT",
      entityId: updated.id,
      description: `Updated Assignment for Route ${updated.route.code} - ${updated.route.name}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update assignment" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { code, id } = resolvedParams;
    const { user, company } = await verifyCompanyAccess(code);

    // Look up assignment by assignment ID, routeId, refId, or driverId
    const existing = await prisma.dailyRouteAssignment.findFirst({
      where: {
        OR: [
          { id },
          { routeId: id },
          { refId: id },
          { driverId: id },
        ],
        companyId: company.id,
      },
      include: { route: true },
      orderBy: { createdAt: "desc" },
    });

    if (!existing) {
      // Gracefully handle if record was already deleted or removed
      return NextResponse.json(
        { success: true, message: "Assignment already deleted or removed." },
        { status: 200 }
      );
    }

    await prisma.dailyRouteAssignment.delete({
      where: { id: existing.id },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "ROUTE_ASSIGNMENT_DELETED",
      entityType: "ROUTE_ASSIGNMENT",
      entityId: existing.id,
      description: `Deleted Assignment for Route ${existing.route?.code || existing.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete assignment" },
      { status: 400 }
    );
  }
}
