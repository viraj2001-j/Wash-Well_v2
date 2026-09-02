import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // ==========================================
    // 1. Get Supabase authenticated user
    // ==========================================

    const supabase = await createClient();

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return NextResponse.json(
        {
          message: "Not authenticated",
        },
        {
          status: 401,
        },
      );
    }

    // ==========================================
    // 2. Find user in Prisma / Neon
    // ==========================================

    const user = await prisma.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },

      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Your account is not configured in the system.",
        },
        {
          status: 403,
        },
      );
    }

    // ==========================================
    // 3. Check user is active
    // ==========================================

    if (!user.isActive) {
      return NextResponse.json(
        {
          message: "Your account is inactive.",
        },
        {
          status: 403,
        },
      );
    }

    // ==========================================
    // 4. Check Platform Super Admin role
    // ==========================================

    const isSuperAdmin = user.roles.some(
      ({ role }) =>
        role.name === "SUPERADMIN" &&
        role.scope === "PLATFORM" &&
        role.companyId === null &&
        role.isActive === true,
    );

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          message:
            "You are not authorized as a Platform Super Admin.",
        },
        {
          status: 403,
        },
      );
    }

    // ==========================================
    // 5. IMPORTANT
    // Platform Super Admin must not belong
    // to an organization.
    // ==========================================

    if (user.companyId !== null) {
      return NextResponse.json(
        {
          message:
            "Invalid Super Admin configuration.",
        },
        {
          status: 403,
        },
      );
    }

    // ==========================================
    // 6. Success
    // ==========================================

    return NextResponse.json({
      authorized: true,

      user: {
        id: user.id,
        supabaseUserId: user.supabaseUserId,
        fullName: user.fullName,
        email: user.email,
      },

      role: {
        name: "SUPERADMIN",
        scope: "PLATFORM",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/auth/super-admin error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to verify Super Admin access.",
      },
      {
        status: 500,
      },
    );
  }
}