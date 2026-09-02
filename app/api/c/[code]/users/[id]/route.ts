import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;

    const company = await prisma.company.findUnique({ where: { code } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const currentUser = await requireCompanyAccess(company.id);

    const body = await request.json();
    const { action } = body;

    if (action === "toggleStatus") {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
      });

      await prisma.activityLog.create({
        data: {
          companyId: company.id,
          userId: currentUser.id,
          action: "TOGGLED_USER_STATUS",
          entityType: "USER",
          entityId: id,
          description: `${updatedUser.isActive ? "Activated" : "Inactivated"} user: ${updatedUser.fullName}`,
        },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === "updateDetails") {
      const {
        fullName, username, phone, salary, commission,
        address1, address2, city, zip, state,
        accountName, accountNumber, accountType, bankName, bankBranch,
        ifscCode, swiftCode, notes, roleId
      } = body;

      const updatedUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id },
          data: {
            fullName: fullName || undefined,
            username: username || null,
            phone: phone || null,
            salary: salary !== "" && salary !== null && salary !== undefined ? parseFloat(salary) : null,
            commission: commission !== "" && commission !== null && commission !== undefined ? parseFloat(commission) : null,
            address1: address1 || null,
            address2: address2 || null,
            city: city || null,
            zip: zip || null,
            state: state || null,
            accountName: accountName || null,
            accountNumber: accountNumber || null,
            accountType: accountType || null,
            bankName: bankName || null,
            bankBranch: bankBranch || null,
            ifscCode: ifscCode || null,
            swiftCode: swiftCode || null,
            notes: notes || null,
          },
        });

        if (roleId) {
          await tx.userRole.deleteMany({ where: { userId: id } });
          await tx.userRole.create({ data: { userId: id, roleId } });
        }

        await tx.activityLog.create({
          data: {
            companyId: company.id,
            userId: currentUser.id,
            action: "UPDATED_USER",
            entityType: "USER",
            entityId: id,
            description: `Updated user details for: ${user.fullName}`,
          },
        });

        return user;
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
