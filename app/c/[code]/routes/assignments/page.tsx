import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireAdminRole } from "@/lib/auth/require-company-access";
import AssignmentsClient from "@/app/c/[code]/routes/assignments/AssignmentsClient";

export default async function AssignmentsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireAdminRole(company.id);

  const [assignments, routesData, allStaffUsers] = await Promise.all([
    prisma.dailyRouteAssignment.findMany({
      where: { companyId: company.id },
      include: { route: true, ref: true, driver: true },
      orderBy: { workDate: "desc" },
    }),
    prisma.route.findMany({
      where: { companyId: company.id },
      include: {
        customers: {
          where: { isActive: true },
          include: { customer: { include: { addresses: true } } },
        },
        customerAddresses: {
          include: { customer: true },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.user.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        roles: {
          none: {
            role: {
              name: { equals: "CUSTOMER", mode: "insensitive" },
            },
          },
        },
      },
      include: {
        roles: { include: { role: true } },
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  // Filter Sales Representatives (REFs / Reps) - MUST have a REP / REF / SALES role
  const refs = allStaffUsers
    .filter((u) => {
      if (!u.roles || u.roles.length === 0) return false;
      return u.roles.some((r: any) => {
        const roleName = (r.role?.name || "").toUpperCase();
        return (
          roleName === "REF" ||
          roleName === "REP" ||
          roleName.includes("REP") ||
          roleName.includes("REF") ||
          roleName.includes("SALES")
        );
      });
    })
    .map((u) => ({ id: u.id, fullName: u.fullName, phone: u.phone }));

  // Filter Drivers - MUST have a DRIVER role
  const drivers = allStaffUsers
    .filter((u) => {
      if (!u.roles || u.roles.length === 0) return false;
      return u.roles.some((r: any) => {
        const roleName = (r.role?.name || "").toUpperCase();
        return (
          roleName === "DRIVER" ||
          roleName.includes("DRIVER")
        );
      });
    })
    .map((u) => ({ id: u.id, fullName: u.fullName, phone: u.phone }));

  // Combine both CustomerRouteLink records AND CustomerAddress route links into route customers list
  const formattedRoutes = routesData.map((route) => {
    const customerMap = new Map();

    (route.customers || []).forEach((link: any) => {
      if (link.customer) {
        const cust = link.customer;
        const primaryAddr = cust.addresses?.find((a: any) => a.isPrimary) || cust.addresses?.[0];
        customerMap.set(cust.id, {
          id: link.id,
          customer: {
            id: cust.id,
            code: cust.customerNo || cust.code || "",
            name: cust.name,
            shopName: cust.shopName || null,
            phone: cust.phone || null,
            address1: primaryAddr?.address || cust.address1 || null,
            city: primaryAddr?.city || cust.city || null,
          },
        });
      }
    });

    (route.customerAddresses || []).forEach((addr: any) => {
      if (addr.customer && !customerMap.has(addr.customer.id)) {
        const cust = addr.customer;
        customerMap.set(cust.id, {
          id: `addr-link-${addr.id}`,
          customer: {
            id: cust.id,
            code: cust.customerNo || cust.code || "",
            name: cust.name,
            shopName: cust.shopName || null,
            phone: cust.phone || null,
            address1: addr.address || cust.address1 || null,
            city: addr.city || cust.city || null,
          },
        });
      }
    });

    return {
      id: route.id,
      code: route.code,
      name: route.name,
      district: route.district,
      area: route.area,
      province: route.province,
      customers: Array.from(customerMap.values()),
    };
  });

  return (
    <AssignmentsClient
      companyCode={code}
      companyId={company.id}
      initialAssignments={JSON.parse(JSON.stringify(assignments))}
      routes={JSON.parse(JSON.stringify(formattedRoutes))}
      refs={JSON.parse(JSON.stringify(refs))}
      drivers={JSON.parse(JSON.stringify(drivers))}
    />
  );
}
