import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/services/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Strict Company Resolution by Code (No fallback to other companies)
    let company = await prisma.company.findUnique({
      where: { code },
    });

    if (!company) {
      // Automatically provision new company record if code does not exist in DB yet
      company = await prisma.company.create({
        data: {
          name: (code || "Company").toUpperCase(),
          code: code || "default",
          isActive: true,
        },
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      phone,
      address,
      city,
      placeName,
      customerType = "INDIVIDUAL",
      businessTypeId,
    } = body;

    // Validations
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already registered under this specific company or user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        companyId: company.id,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `An account with this email address already exists for ${company.name}. Please sign in instead.` },
        { status: 400 }
      );
    }

    // Ensure CUSTOMER role exists for this specific company
    let customerRole = await prisma.role.findFirst({
      where: {
        companyId: company.id,
        name: { equals: "CUSTOMER", mode: "insensitive" },
      },
    });

    if (!customerRole) {
      customerRole = await prisma.role.create({
        data: {
          companyId: company.id,
          name: "CUSTOMER",
          scope: "ORGANIZATION",
          description: "Customer Portal User Role",
          isSystem: true,
        },
      });
    }

    // 1. Create Auth User via Supabase Admin
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        fullName: fullName.trim(),
        role: "CUSTOMER",
        companyCode: company.code,
        companyId: company.id,
      },
    });

    if (authError || !authData.user) {
      console.error("Supabase user creation error:", authError);
      return NextResponse.json(
        { success: false, error: authError?.message || "Failed to create authentication account." },
        { status: 400 }
      );
    }

    const supabaseUserId = authData.user.id;

    // 2. Atomic creation of User + UserRole + Customer in Prisma for THIS company
    const customerCount = await prisma.customer.count({ where: { companyId: company.id } });
    const customerNo = `CUST-${(customerCount + 1).toString().padStart(5, "0")}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create User strictly assigned to company.id
      const newUser = await tx.user.create({
        data: {
          supabaseUserId,
          companyId: company.id,
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: phone ? phone.trim() : null,
          address1: address ? address.trim() : null,
          city: city ? city.trim() : null,
          isActive: true,
          termsAccepted: true,
        },
      });

      // Assign Customer Role
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: customerRole.id,
        },
      });

      // Create Customer Entity strictly assigned to company.id
      const newCustomer = await tx.customer.create({
        data: {
          companyId: company.id,
          customerNo,
          name: fullName.trim(),
          placeName: placeName ? placeName.trim() : null,
          phone: phone ? phone.trim() : null,
          email: cleanEmail,
          customerType: customerType === "BUSINESS" ? "BUSINESS" : "INDIVIDUAL",
          paymentTerms: "Cash",
          createdById: newUser.id,
          businessTypeId: businessTypeId || null,
          addresses: address && address.trim()
            ? {
                create: {
                  address: address.trim(),
                  city: city ? city.trim() : null,
                  isPrimary: true,
                },
              }
            : undefined,
        },
        include: {
          addresses: true,
        },
      });

      return { newUser, newCustomer };
    });

    await logActivity({
      companyId: company.id,
      userId: result.newUser.id,
      action: "CUSTOMER_REGISTERED",
      entityType: "CUSTOMER",
      entityId: result.newCustomer.id,
      description: `New customer self-registered for ${company.name}: ${result.newCustomer.name} (${result.newCustomer.customerNo})`,
    });

    return NextResponse.json({
      success: true,
      message: `Customer account created successfully for ${company.name}!`,
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
      },
      user: {
        id: result.newUser.id,
        fullName: result.newUser.fullName,
        email: result.newUser.email,
      },
      customer: {
        id: result.newCustomer.id,
        customerNo: result.newCustomer.customerNo,
        name: result.newCustomer.name,
      },
    });
  } catch (error: any) {
    console.error("POST /api/c/[code]/customer/signup error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register customer account." },
      { status: 500 }
    );
  }
}
