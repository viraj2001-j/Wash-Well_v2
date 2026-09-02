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

    const businessTypes = await prisma.businessTypeRecord.findMany({
      where: { companyId: company.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: businessTypes });
  } catch (error: any) {
    console.error("GET /api/c/[code]/business-types error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch business types" },
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
    const { company } = await verifyCompanyAccess(code);

    const body = await req.json().catch(() => ({}));
    const name = body?.name;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Business type name is required" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();

    // Check if business type already exists for company
    const existing = await prisma.businessTypeRecord.findFirst({
      where: {
        companyId: company.id,
        name: { equals: cleanName, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const created = await prisma.businessTypeRecord.create({
      data: {
        companyId: company.id,
        name: cleanName,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("POST /api/c/[code]/business-types error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create business type" },
      { status: 400 }
    );
  }
}
