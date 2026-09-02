import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get("routeId");
    const dateStr = searchParams.get("date");

    // Fetch all active company users with DRIVER role
    const allDrivers = await prisma.user.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        roles: {
          some: {
            role: {
              name: { equals: "DRIVER", mode: "insensitive" },
              isActive: true,
            },
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
      },
      orderBy: { fullName: "asc" },
    });

    let assignedDriverIds = new Set<string>();
    let routeName = "";

    if (routeId) {
      const routeRec = await prisma.route.findUnique({
        where: { id: routeId },
        select: { id: true, name: true, code: true },
      });
      if (routeRec) routeName = routeRec.name;

      // Find DailyRouteAssignment for route & date
      const whereCond: any = {
        companyId: company.id,
        routeId: routeId,
      };

      if (dateStr && dateStr !== "ALL" && dateStr.trim() !== "") {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          whereCond.workDate = dateObj;
        }
      }

      const assignments = await prisma.dailyRouteAssignment.findMany({
        where: whereCond,
        include: {
          driver: true,
          members: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { workDate: "desc" },
        take: 5,
      });

      assignments.forEach((asg) => {
        if (asg.driverId) assignedDriverIds.add(asg.driverId);
        asg.members?.forEach((mem) => {
          if (mem.userId) assignedDriverIds.add(mem.userId);
        });
      });
    }

    // Format drivers with working route assignment tags
    const formattedDrivers = allDrivers.map((driver) => {
      const isAssignedToRoute = assignedDriverIds.has(driver.id);
      return {
        ...driver,
        isAssignedToRoute,
        assignedRouteName: isAssignedToRoute ? routeName : null,
        displayName: isAssignedToRoute
          ? `${driver.fullName} ⭐ (Assigned Driver for ${routeName || "Route"})`
          : driver.fullName,
      };
    });

    // Sort so assigned working drivers for the route appear at the top!
    formattedDrivers.sort((a, b) => {
      if (a.isAssignedToRoute && !b.isAssignedToRoute) return -1;
      if (!a.isAssignedToRoute && b.isAssignedToRoute) return 1;
      return a.fullName.localeCompare(b.fullName);
    });

    return NextResponse.json({ success: true, data: formattedDrivers });
  } catch (error: any) {
    console.error("GET Drivers Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch drivers" },
      { status: 400 }
    );
  }
}
