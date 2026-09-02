import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          user: null,
          message: "Not authenticated",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,

        supabaseUserId: user.supabaseUserId,

        fullName: user.fullName,

        email: user.email,

        username: user.username,

        company: user.company
          ? {
              id: user.company.id,
              name: user.company.name,
              code: user.company.code,
            }
          : null,

        branch: user.branch
          ? {
              id: user.branch.id,
              name: user.branch.name,
              code: user.branch.code,
            }
          : null,

        roles: user.roles.map(({ role }) => ({
          id: role.id,
          name: role.name,
          scope: role.scope,
        })),

        permissions: user.roles.flatMap(({ role }) =>
          role.permissions.map(
            ({ permission }) => permission.key,
          ),
        ),
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);

    return NextResponse.json(
      {
        message: "Unable to load current user",
      },
      {
        status: 500,
      },
    );
  }
}