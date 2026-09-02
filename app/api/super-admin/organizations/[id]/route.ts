import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.roles.some(
      ({ role }) => role.name === "SUPERADMIN" && role.scope === "PLATFORM" && role.isActive
    );

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // 1. Handle Inactivate / Activate Toggle
    if (body.action === "toggleStatus") {
      const company = await prisma.company.findUnique({ where: { id } });
      if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const updatedCompany = await prisma.company.update({
        where: { id },
        data: { isActive: !company.isActive },
      });

      // Optional: Log the reason in ActivityLog
      if (body.reason) {
        await prisma.activityLog.create({
          data: {
            companyId: id,
            userId: user.id,
            action: updatedCompany.isActive ? "ACTIVATED_COMPANY" : "DEACTIVATED_COMPANY",
            entityType: "COMPANY",
            entityId: id,
            description: `Status changed. Reason: ${body.reason}`,
          }
        });
      }

      return NextResponse.json({ success: true, company: updatedCompany });
    }

    // 2. Handle Details Update
    if (body.action === "updateDetails") {
      const updatedCompany = await prisma.company.update({
        where: { id },
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          address: body.address,
          city: body.city,
        },
      });

      return NextResponse.json({ success: true, company: updatedCompany });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}