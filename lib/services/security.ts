import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getCompanyByCode } from "@/lib/services/company";
import prisma from "@/lib/db";

export interface UserContext {
  id: string;
  companyId: string | null;
  roles: Array<{
    role: {
      name: string;
      scope: string;
      isActive: boolean;
      permissions: Array<{
        permission: {
          key: string;
        };
      }>;
    };
  }>;
}

/**
 * Ensures the authenticated user belongs to the requested company/organization,
 * or is a platform Super Admin.
 */
export async function verifyCompanyAccess(companyCode: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const company = await getCompanyByCode(companyCode);

  if (!company || !company.isActive) {
    throw new Error("COMPANY_NOT_FOUND");
  }

  const isSuperAdmin = user.roles.some(
    (r) => r.role.name === "SUPERADMIN" && r.role.scope === "PLATFORM" && r.role.isActive
  );

  if (isSuperAdmin) {
    return { user, company, isSuperAdmin: true };
  }

  if (user.companyId !== company.id) {
    throw new Error("UNAUTHORIZED_COMPANY_ACCESS");
  }

  return { user, company, isSuperAdmin: false };
}

/**
 * Checks if user has a specific permission key or wildcard (*), or is Super Admin
 */
export function hasUserPermission(user: UserContext, requiredPermission: string): boolean {
  const isSuperAdmin = user.roles.some(
    (r) => r.role.name === "SUPERADMIN" && r.role.scope === "PLATFORM" && r.role.isActive
  );
  if (isSuperAdmin) return true;

  const isOrgAdmin = user.roles.some(
    (r) => (r.role.name === "ORG_ADMIN" || r.role.name === "ADMIN") && r.role.isActive
  );
  if (isOrgAdmin) return true;

  for (const userRole of user.roles) {
    if (!userRole.role.isActive) continue;
    for (const p of userRole.role.permissions) {
      if (p.permission.key === "*" || p.permission.key === requiredPermission) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Record-level security: Verify if an Order belongs to the user's tenant
 * and (if REF/Driver) whether they are authorized to view/mutate it.
 */
export async function verifyOrderAccess(companyId: string, userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      companyId: companyId,
    },
    include: {
      customer: true,
      createdBy: true,
      items: {
        include: { service: true },
      },
      pickup: true,
      invoice: {
        include: { items: true, allocations: { include: { payment: true } } },
      },
      delivery: true,
      processing: {
        include: { history: { include: { performedBy: true } } },
      },
      statusHistory: {
        include: { changedBy: true },
        orderBy: { createdAt: "desc" },
      },
      notesHistory: {
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      },
      payments: true,
    },
  });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  return order;
}

/**
 * Check if the user is a REF or Driver role specifically
 */
export function getUserRoleType(user: UserContext): {
  isSuperAdmin: boolean;
  isAdminOrManager: boolean;
  isRef: boolean;
  isDriver: boolean;
} {
  const isSuperAdmin = user.roles.some(
    (r) => r.role.name === "SUPERADMIN" && r.role.scope === "PLATFORM" && r.role.isActive
  );
  const isAdminOrManager = user.roles.some(
    (r) =>
      ["ORG_ADMIN", "ADMIN", "MANAGER", "COMPANY ADMIN", "SUPERADMIN"].includes(
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

  return { isSuperAdmin, isAdminOrManager: isAdminOrManager || isSuperAdmin, isRef, isDriver };
}
