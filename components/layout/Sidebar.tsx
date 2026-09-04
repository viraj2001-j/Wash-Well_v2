import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCompanyByCode } from "@/lib/services/company";
import SidebarClient from "./SidebarClient";

export default async function Sidebar({ companyCode }: { companyCode: string }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const company = await getCompanyByCode(companyCode);

  let primaryRole = "STAFF";
  let roleCategory: "ADMIN_MANAGER" | "REF" | "DRIVER" = "ADMIN_MANAGER";

  const isSuperAdmin = user.roles.some(
    (r) => r.role.name.toUpperCase() === "SUPERADMIN" && r.role.isActive
  );
  const isOrgAdmin = user.roles.some(
    (r) =>
      ["ORG_ADMIN", "ADMIN", "MANAGER", "COMPANY ADMIN"].includes(
        r.role.name.toUpperCase()
      ) && r.role.isActive
  );
  const isRef = user.roles.some(
    (r) =>
      (r.role.name.toUpperCase() === "REF" ||
        r.role.name.toUpperCase() === "ROUTE_REP" ||
        r.role.name.toUpperCase().includes("REP") ||
        r.role.name.toUpperCase().includes("REF")) &&
      r.role.isActive
  );
  const isDriver = user.roles.some(
    (r) =>
      (r.role.name.toUpperCase() === "DRIVER" ||
        r.role.name.toUpperCase().includes("DRIVER")) &&
      r.role.isActive
  );

  if (isSuperAdmin) {
    primaryRole = "SUPER ADMIN";
    roleCategory = "ADMIN_MANAGER";
  } else if (isOrgAdmin) {
    primaryRole = "COMPANY ADMIN";
    roleCategory = "ADMIN_MANAGER";
  } else if (isRef && !isOrgAdmin && !isSuperAdmin) {
    primaryRole = "ROUTE REP";
    roleCategory = "REF";
  } else if (isDriver && !isOrgAdmin && !isSuperAdmin) {
    primaryRole = "DRIVER";
    roleCategory = "DRIVER";
  }

  let allowedPermissions: string[] = [];
  if (isSuperAdmin || isOrgAdmin) {
    allowedPermissions = ["*"];
  } else {
    user.roles.forEach((userRole) => {
      if (userRole.role.isActive) {
        userRole.role.permissions.forEach((p) => {
          allowedPermissions.push(p.permission.key);
        });
      }
    });
  }

  return (
    <SidebarClient
      companyCode={companyCode}
      companyName={company?.name}
      companyLogoUrl={company?.logoUrl || undefined}
      userName={user.fullName}
      userRole={primaryRole}
      roleCategory={roleCategory}
      allowedPermissions={allowedPermissions}
    />
  );
}