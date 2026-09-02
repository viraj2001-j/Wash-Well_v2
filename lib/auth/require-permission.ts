import { getCurrentUser } from "./get-current-user";
import { hasPermission } from "./permissions";

export async function requirePermission(
  permission: string,
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const allowed = await hasPermission(permission);

  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  return user;
}