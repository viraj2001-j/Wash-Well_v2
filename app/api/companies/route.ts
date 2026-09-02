import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, companies });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
