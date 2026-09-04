import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireAdminRole } from "@/lib/auth/require-company-access";
import UsersClient from "./UsersClient";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireAdminRole(company.id);

  // Fetch all users with their roles, branch, route assignments, and customer count
  const usersRaw = await prisma.user.findMany({
    where: { companyId: company.id },
    include: {
      roles: {
        include: { role: true }
      },
      branch: true,
      _count: {
        select: { createdCustomers: true }
      },
      refAssignments: {
        include: { route: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      driverAssignments: {
        include: { route: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch available roles
  const availableRoles = await prisma.role.findMany({
    where: { companyId: company.id }
  });

  // Fetch total customers count for company
  const totalCustomers = await prisma.customer.count({
    where: { companyId: company.id }
  });

  // Calculate KPIs for the cards
  const kpis = {
    total: usersRaw.length,
    active: usersRaw.filter(u => u.isActive).length,
    inactive: usersRaw.filter(u => !u.isActive).length,
    totalCustomers,
    admins: usersRaw.filter(u => u.roles.some(r => r.role.name === "ORG_ADMIN")).length,
    refs: usersRaw.filter(u => u.roles.some(r => r.role.name === "REF")).length,
    drivers: usersRaw.filter(u => u.roles.some(r => r.role.name === "DRIVER")).length,
  };

  // Serialize dates & decimals for Client Component
  const users = usersRaw.map(u => ({
    ...u,
    salary: u.salary ? Number(u.salary) : null,
    commission: u.commission ? Number(u.commission) : null,
    createdAt: u.createdAt.toISOString(),
    assignedRoute: u.refAssignments[0]?.route || u.driverAssignments[0]?.route || null,
    customerCount: u._count.createdCustomers,
  }));

  return <UsersClient companyCode={code} initialUsers={users} roles={availableRoles} kpis={kpis} />;
}