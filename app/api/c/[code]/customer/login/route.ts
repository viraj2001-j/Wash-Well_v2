import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Strict Company Resolution by Code
    let company = await prisma.company.findUnique({ where: { code } });
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: `Company organization '${code}' not found.` },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Authenticate credentials with Supabase
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Invalid email or password." },
        { status: 401 }
      );
    }

    // 2. Multi-Tenant Check: Verify Customer record belongs to THIS company
    const customer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { createdById: authData.user.id },
          { email: cleanEmail },
        ],
      },
    });

    if (!customer) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error:
            `Access Denied: Your account is not registered with ${company.name}. Other company customers cannot log into this company portal.`,
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      redirectUrl: `/c/${company.code || code}/customer/dashboard`,
    });

    response.cookies.set("customer_auth_type", "PASSWORD", {
      path: "/",
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/c/[code]/customer/login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Login failed." },
      { status: 500 }
    );
  }
}
