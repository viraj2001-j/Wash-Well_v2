import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const company = await prisma.company.findUnique({ where: { code } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    
    const currentUser = await requireCompanyAccess(company.id);

    const body = await request.json();
    const { 
      name, email, password, roleId, username, idNumber, phone, workingPhone,
      salary, commission, address1, address2, city, zip, state,
      accountName, accountNumber, accountType, bankName, bankBranch, 
      ifscCode, swiftCode, notes, termsAccepted
    } = body;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, requires_password_change: true }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          supabaseUserId: authData.user.id,
          companyId: company.id,
          fullName: name,
          username: username || null,
          email,
          phone: phone || null,
          salary: salary !== "" && salary !== null && salary !== undefined ? parseFloat(salary) : null,
          commission: commission !== "" && commission !== null && commission !== undefined ? parseFloat(commission) : null,
          address1: address1 || null,
          address2: address2 || null,
          city: city || null,
          zip: zip || null,
          state: state || null,
          accountName: accountName || null,
          accountNumber: accountNumber || null,
          accountType: accountType || null,
          bankName: bankName || null,
          bankBranch: bankBranch || null,
          ifscCode: ifscCode || null,
          swiftCode: swiftCode || null,
          notes: notes || null,
          termsAccepted: termsAccepted || false,
          isActive: true,
        }
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: roleId }
      });

      await tx.activityLog.create({
        data: {
          companyId: company.id,
          userId: currentUser.id,
          action: "CREATED_USER",
          entityType: "USER",
          entityId: user.id,
          description: `Created new user: ${name}`,
        }
      });

      return user;
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });

  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email or ID already in use." }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const company = await prisma.company.findUnique({ where: { code } });
    if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });

    await requireCompanyAccess(company.id);

    const users = await prisma.user.findMany({
      where: { companyId: company.id, isActive: true },
      include: {
        roles: {
          include: { role: true },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch users" }, { status: 400 });
  }
}