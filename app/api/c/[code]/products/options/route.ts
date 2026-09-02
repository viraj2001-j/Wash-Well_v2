import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getOptionModel() {
  const db = prisma as any;
  if (db && (db.productOption || db.ProductOption)) {
    return db.productOption || db.ProductOption;
  }
  // Fallback to fresh client if singleton cache was stale
  const dbUrl = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=verify-full");
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const freshClient = new PrismaClient({ adapter }) as any;
  return freshClient.productOption || freshClient.ProductOption;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const optionModel = getOptionModel();

    if (!optionModel) {
      return NextResponse.json({ success: true, data: [] });
    }

    const options = await optionModel.findMany({
      where: { companyId: company.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: options });
  } catch (error: any) {
    console.error("GET Product Options Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch options" },
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
    const { type, name, parentCategory } = body;

    if (!type || !name) {
      return NextResponse.json(
        { success: false, error: "Option Type and Name are required" },
        { status: 400 }
      );
    }

    const trimmedType = type.trim().toUpperCase();
    const trimmedName = name.trim();

    const optionModel = getOptionModel();

    if (!optionModel) {
      return NextResponse.json(
        { success: false, error: "ProductOption model not initialized" },
        { status: 500 }
      );
    }

    // Check duplicate
    const existing = await optionModel.findFirst({
      where: {
        companyId: company.id,
        type: trimmedType,
        name: { equals: trimmedName, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, data: existing, existed: true });
    }

    const createdOption = await optionModel.create({
      data: {
        companyId: company.id,
        type: trimmedType,
        name: trimmedName,
        parentCategory: parentCategory ? parentCategory.trim() : null,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PRODUCT_OPTION_CREATED",
      entityType: "PRODUCT_OPTION",
      entityId: createdOption.id,
      description: `Created dynamic ${trimmedType} option: "${trimmedName}"`,
    });

    return NextResponse.json({ success: true, data: createdOption });
  } catch (error: any) {
    console.error("POST Product Option Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add option" },
      { status: 400 }
    );
  }
}
