import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let company = await prisma.company.findUnique({ where: { code } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: (code || "Company").toUpperCase(),
          code: code || "default",
          isActive: true,
        },
      });
    }

    let customer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        OR: [{ createdById: user.id }, { email: user.email }],
      },
    });

    const body = await req.json();
    const { fullName, phone, placeName, customerType } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ success: false, error: "Full name is required" }, { status: 400 });
    }

    // Update Prisma User
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
      },
    });

    // Update Customer record if exists
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: fullName.trim(),
          phone: phone ? phone.trim() : null,
          placeName: placeName ? placeName.trim() : null,
          customerType: customerType === "BUSINESS" ? "BUSINESS" : "INDIVIDUAL",
        },
      });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
