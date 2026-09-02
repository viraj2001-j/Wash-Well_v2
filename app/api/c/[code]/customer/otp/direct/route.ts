import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
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
    const { phone } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "Phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = formatPhoneNumber(phone);
    const rawDigits = phone.replace(/\D/g, "");

    // 1. Find Customer Record by phone
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
        { success: false, error: "No customer account found for this phone number." },
        { status: 404 }
      );
    }

    // Security Check: Customer MUST have completed initial SMS OTP verification (isPhoneVerified === true)
    if (customer.isPhoneVerified !== true) {
      return NextResponse.json(
        {
          success: false,
          error: "This phone number has not completed initial SMS OTP verification yet. Please click 'Send SMS OTP' to receive your verification code.",
        },
        { status: 403 }
      );
    }

    // 2. Resolve or provision dedicated Customer User
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

    // Link customer createdById to customerUser.id
    await prisma.customer.update({
      where: { id: customer.id },
      data: { createdById: customerUser.id },
    });

    // 3. Authenticate Supabase Session directly
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

    // 4. Attach cookies to response
    const cookieStore = await cookies();
    const response = NextResponse.json({
      success: true,
      message: "Direct Dashboard Access Successful",
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

    return response;
  } catch (error: any) {
    console.error("POST /api/c/[code]/customer/otp/direct error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in directly." },
      { status: 500 }
    );
  }
}

