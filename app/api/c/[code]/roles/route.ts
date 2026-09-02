import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const company = await prisma.company.findUnique({ where: { code } });
    
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    await requireCompanyAccess(company.id);

    const body = await request.json();
    const { name, description } = body;

    const newRole = await prisma.role.create({
      data: {
        companyId: company.id,
        name: name,
        description: description,
        scope: "ORGANIZATION",
        isActive: true,
      }
    });

    return NextResponse.json({ success: true, role: newRole }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create role." }, { status: 500 });
  }
}