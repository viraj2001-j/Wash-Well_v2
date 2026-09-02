import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateAndSendOTP } from "@/lib/services/otp";
import { formatPhoneNumber } from "@/lib/services/sms";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    let company = await prisma.company.findUnique({ where: { code } });
    if (!company) {
      company = await prisma.company.findFirst({ where: { isActive: true } });
    }

    if (!company) {
      return NextResponse.json(
        { success: false, error: `Company organization '${code}' not found.` },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { phone } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer mobile phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = formatPhoneNumber(phone);
    const rawDigits = phone.replace(/\D/g, "");

    // Search customer by phone, phone2, or contacts
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
      return NextResponse.json(
        {
          success: false,
          error: `No customer account found for phone '${phone}' at ${company.name}. Please contact your sales representative or register as a self customer.`,
        },
        { status: 404 }
      );
    }

    // Generate & Dispatch SMS OTP via SMSAPI.LK
    const otpResult = await generateAndSendOTP(
      company.id,
      company.name,
      phone,
      customer.id
    );

    if (!otpResult.success) {
      // If OTP was sent recently (cooldown active), enable OTP input box with cooldown timer
      if (otpResult.cooldownRemaining) {
        return NextResponse.json({
          success: true,
          otpAlreadySent: true,
          cooldownRemaining: otpResult.cooldownRemaining,
          message: `An OTP code was recently sent to ${phone}. Please check your SMS and enter the code below, or wait ${otpResult.cooldownRemaining}s to resend.`,
        });
      }

      return NextResponse.json(
        { success: false, error: otpResult.error || "Failed to send OTP via SMS." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP verification code sent via SMS to ${phone}.`,
      simulatedCode: otpResult.simulatedCode,
      cooldownRemaining: 60,
    });
  } catch (error: any) {
    console.error("POST /api/c/[code]/customer/otp/send error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send OTP SMS." },
      { status: 500 }
    );
  }
}
