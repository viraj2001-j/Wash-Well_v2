import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default async function SuperAdminPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // No Supabase login
  if (!authUser) {
    redirect("/super-admin/login");
  }

  // Find user in Prisma
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

  // User does not exist in our application database
  if (!user) {
    redirect("/super-admin/login?error=unauthorized");
  }

  // Check platform Super Admin role
  const isSuperAdmin = user.roles.some(
    (userRole) =>
      userRole.role.name === "SUPERADMIN" &&
      userRole.role.scope === "PLATFORM" &&
      userRole.role.isActive,
  );

  if (!isSuperAdmin || !user.isActive) {
    redirect("/super-admin/login?error=unauthorized");
  }

  redirect("/super-admin/organizations");
}