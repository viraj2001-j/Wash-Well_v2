// import { getCurrentUser } from "./get-current-user";

// export async function hasPermission(
//   permission: string,
// ) {
//   const user = await getCurrentUser();

//   if (!user) {
//     return false;
//   }

//   for (const userRole of user.roles) {
//     for (const rolePermission of userRole.role.permissions) {
//       const key = rolePermission.permission.key;

//       if (key === "*" || key === permission) {
//         return true;
//       }
//     }
//   }

//   return false;
// }


import { getCurrentUser } from "./get-current-user";

export async function hasPermission(permission: string) {
  const user = await getCurrentUser();
  if (!user) return false;

  // 1. SUPERADMIN OVERRIDE: Platform admins can access everything
  const isSuperAdmin = user.roles.some(
    ({ role }) => role.name === "SUPERADMIN" && role.scope === "PLATFORM" && role.isActive
  );
  if (isSuperAdmin) return true;

  // 2. STANDARD CHECK
  for (const userRole of user.roles) {
    if (!userRole.role.isActive) continue; // Skip inactive roles
    
    for (const rolePermission of userRole.role.permissions) {
      const key = rolePermission.permission.key;
      // Grant if they have a wildcard (*) or the exact permission key
      if (key === "*" || key === permission) {
        return true;
      }
    }
  }

  return false;
}