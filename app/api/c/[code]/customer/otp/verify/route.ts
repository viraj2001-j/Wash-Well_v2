import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyOTP } from "@/lib/services/otp";
import { formatPhoneNumber } from "@/lib/services/sms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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
    const { phone, otp } = body;

    if (!phone || !phone.trim() || !otp || !otp.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number and 6-digit OTP code are required." },
        { status: 400 }
      );
    }

    // 1. Verify OTP Code
    const verifyResult = await verifyOTP(company.id, phone, otp);
    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || "Invalid OTP code." },
        { status: 400 }
      );
    }

    const cleanPhone = formatPhoneNumber(phone);
    const rawDigits = phone.replace(/\D/g, "");

    // 2. Find Customer Record
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
        { success: false, error: "Customer account record not found." },
        { status: 404 }
      );
    }

    // 3. Ensure dedicated User & Supabase Auth account exists for THIS customer
    const customerEmail =
      customer.email && customer.email.includes("@")
        ? customer.email
        : `customer_${customer.id}@washwell.local`;

    const defaultPassword = `OtpPass_${customer.id.substring(0, 8)}!#99`;

    let customerUser = await prisma.user.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { email: customerEmail },
          customer.phone ? { phone: customer.phone } : undefined,
          cleanPhone ? { phone: cleanPhone } : undefined,
        ].filter(Boolean) as any,
      },
    });

    const supabaseAdmin = createAdminClient();

    if (!customerUser) {
      let authUserId: string;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          fullName: customer.name,
          role: "CUSTOMER",
          companyCode: company.code,
          companyId: company.id,
          authType: "REP_OTP",
        },
      });

      if (authError || !authData.user) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUsers?.users?.find((u) => u.email === customerEmail);
        if (found) {
          authUserId = found.id;
          await supabaseAdmin.auth.admin.updateUserById(found.id, { password: defaultPassword });
        } else {
          return NextResponse.json(
            { success: false, error: authError?.message || "Failed to provision login user." },
            { status: 400 }
          );
        }
      } else {
        authUserId = authData.user.id;
      }

      let customerRole = await prisma.role.findFirst({
        where: { companyId: company.id, name: { equals: "CUSTOMER", mode: "insensitive" } },
      });

      if (!customerRole) {
        customerRole = await prisma.role.create({
          data: { companyId: company.id, name: "CUSTOMER", scope: "ORGANIZATION", isSystem: true },
        });
      }

      customerUser = await prisma.user.create({
        data: {
          supabaseUserId: authUserId,
          companyId: company.id,
          fullName: customer.name,
          email: customerEmail,
          phone: customer.phone || cleanPhone,
          isActive: true,
          termsAccepted: true,
          roles: {
            create: { roleId: customerRole.id },
          },
        },
      });
    }

    // Sync customerUser details with customer record
    await prisma.user.update({
      where: { id: customerUser.id },
      data: {
        fullName: customer.name,
        phone: customer.phone || cleanPhone,
      },
    });

    // Link customer's createdById to their customerUser.id and mark isPhoneVerified: true
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        createdById: customerUser.id,
        isPhoneVerified: true,
      },
    });

    // 4. Authenticate Supabase Session for Customer
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: customerEmail,
      password: defaultPassword,
    });

    if (signInError) {
      await supabaseAdmin.auth.admin.updateUserById(customerUser.supabaseUserId, { password: defaultPassword });
      await supabase.auth.signInWithPassword({
        email: customerEmail,
        password: defaultPassword,
      });
    }

    // 5. Copy cookies to NextResponse and flag rep_verified cookie
    const cookieStore = await cookies();
    const response = NextResponse.json({
      success: true,
      isAlreadyVerified: true,
      message: "REP Customer OTP Login Successful",
      redirectUrl: `/c/${company.code || code}/customer/dashboard`,
    });

    cookieStore.getAll().forEach((c) => {
      response.cookies.set(c.name, c.value, c);
    });

    response.cookies.set("customer_auth_type", "REP_OTP", {
      path: "/",
      httpOnly: false,
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });

    response.cookies.set(`rep_verified_${cleanPhone}`, "true", {
      path: "/",
      httpOnly: false,
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/c/[code]/customer/otp/verify error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
