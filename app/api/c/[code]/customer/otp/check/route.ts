import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { formatPhoneNumber } from "@/lib/services/sms";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || phone.trim().length < 7) {
      return NextResponse.json({ success: true, exists: false, isVerifiedUser: false });
    }

    let company = await prisma.company.findUnique({ where: { code } });
    if (!company) {
      company = await prisma.company.findFirst({ where: { isActive: true } });
    }

    if (!company) {
      return NextResponse.json({ success: true, exists: false, isVerifiedUser: false });
    }

    const cleanPhone = formatPhoneNumber(phone);
    const rawDigits = phone.replace(/\D/g, "");

    // Search if customer exists with this phone
    const customer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { phone: { contains: rawDigits } },
          { phone: { contains: cleanPhone } },
          { phone2: { contains: rawDigits } },
          { contacts: { some: { phone: { contains: rawDigits } } } },
        ],
      },
    });

    if (!customer) {
      return NextResponse.json({ success: true, exists: false, isVerifiedUser: false });
    }

    const isVerified = customer.isPhoneVerified === true;

    return NextResponse.json({
      success: true,
      exists: true,
      isVerifiedUser: isVerified,
      customerName: customer.name,
      customerNo: customer.customerNo,
    });
  } catch (error: any) {
    console.error("GET /api/c/[code]/customer/otp/check error:", error);
    return NextResponse.json({ success: true, exists: false, isVerifiedUser: false });
  }
}
