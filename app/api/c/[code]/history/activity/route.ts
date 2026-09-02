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

    const activities = await prisma.activityLog.findMany({
      where: { companyId: company.id },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch activity logs" },
      { status: 400 }
    );
  }
}
