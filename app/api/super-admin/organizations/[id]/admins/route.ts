// app/api/super-admin/organizations/[id]/admins/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = currentUser.roles.some(
      ({ role }) => role.name === "SUPERADMIN" && role.scope === "PLATFORM" && role.isActive
    );

    if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: companyId } = await params;
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: name,
        requires_password_change: true
       }
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    let orgAdminRole = await prisma.role.findFirst({
      where: { companyId, name: "ORG_ADMIN" }
    });

    if (!orgAdminRole) {
      orgAdminRole = await prisma.role.create({
        data: {
          companyId,
          name: "ORG_ADMIN",
          scope: "ORGANIZATION",
          description: "Full administrative access for the organization.",
        }
      });
    }

    const newUser = await prisma.user.create({
      data: {
        supabaseUserId: authData.user.id,
        companyId: companyId,
        fullName: name,
        email: email,
        phone: phone || null,
        roles: { create: { roleId: orgAdminRole.id } }
      }
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });

  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email is already in use." }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}