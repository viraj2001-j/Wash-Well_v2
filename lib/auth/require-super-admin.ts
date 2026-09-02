import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/super-admin/login");
  }

  const isSuperAdmin = user.roles.some(
    ({ role }) =>
      role.name === "SUPERADMIN" &&
      role.scope === "PLATFORM" &&
      role.isActive,
  );

  if (!isSuperAdmin) {
    redirect("/unauthorized");
  }

  return user;
}