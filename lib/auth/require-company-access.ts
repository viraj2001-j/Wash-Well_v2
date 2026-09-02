import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./get-current-user";
import prisma from "@/lib/db";

export const resolveCompanyAccessInfo = cache(async (companyIdOrCode: string) => {
  if (!companyIdOrCode) return null;
  return await prisma.company.findFirst({
    where: {
      OR: [{ id: companyIdOrCode }, { code: companyIdOrCode }],
    },
    select: { id: true, code: true },
  });
});

export async function requireCompanyAccess(companyIdOrCode: string) {
  const user = await getCurrentUser();

  const company = await resolveCompanyAccessInfo(companyIdOrCode);

  if (!user) {
    if (company?.code) {
      redirect(`/c/${company.code}/login`);
    }
    redirect("/super-admin/login");
  }

  // 1. SUPERADMIN can access every company's dashboard
  const isSuperAdmin = user.roles.some(
    ({ role }) =>
      role.name.toUpperCase() === "SUPERADMIN" &&
      role.scope === "PLATFORM" &&
      role.isActive
  );

  if (isSuperAdmin) {
    return user;
  }

  // 2. Normal organization users must match the requested companyId or company.id
  const userMatchesCompany =
    user.companyId &&
    (user.companyId === companyIdOrCode || (company && user.companyId === company.id));

  if (!userMatchesCompany) {
    if (company?.code) {
      redirect(`/c/${company.code}/login?error=unauthorized`);
    }
    redirect("/super-admin/login");
  }

  return user;
}

/**
  * Guard function for Admin-only pages.
  * If a REF or DRIVER attempts to access an admin page directly, redirect them to their workspace.
  */
export async function requireAdminRole(companyIdOrCode: string) {
  const user = await requireCompanyAccess(companyIdOrCode);

  const isSuperAdmin = user.roles.some(
    ({ role }) => role.name.toUpperCase() === "SUPERADMIN" && role.isActive
  );
  const isAdminOrManager = user.roles.some(
    ({ role }) =>
      ["ORG_ADMIN", "ADMIN", "MANAGER", "COMPANY ADMIN"].includes(role.name.toUpperCase()) &&
      role.isActive
  );

  if (isSuperAdmin || isAdminOrManager) {
    return user;
  }

  // Find company code for redirection
  const company = await resolveCompanyAccessInfo(companyIdOrCode);
  const code = company?.code || companyIdOrCode;

  const isRef = user.roles.some(
    ({ role }) =>
      (role.name.toUpperCase() === "REF" ||
        role.name.toUpperCase() === "ROUTE_REP" ||
        role.name.toUpperCase().includes("REP") ||
        role.name.toUpperCase().includes("REF")) &&
      role.isActive
  );
  const isDriver = user.roles.some(
    ({ role }) =>
      (role.name.toUpperCase() === "DRIVER" || role.name.toUpperCase().includes("DRIVER")) &&
      role.isActive
  );

  if (isRef) {
    redirect(`/c/${code}/ref/route`);
  }
  if (isDriver) {
    redirect(`/c/${code}/driver/assignment`);
  }

  redirect(`/c/${code}/login?error=unauthorized`);
}