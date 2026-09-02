import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    let company = await prisma.company.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
        logoUrl: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
      },
    });

    if (!company) {
      company = await prisma.company.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          logoUrl: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
        },
      });
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch company info" },
      { status: 500 }
    );
  }
}

