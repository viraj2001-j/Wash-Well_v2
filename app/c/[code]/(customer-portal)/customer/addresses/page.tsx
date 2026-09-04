import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import CustomerAddressesClient from "./CustomerAddressesClient";

export default async function CustomerAddressesPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/c/${code}/customer/login`);
  }

  let company = await prisma.company.findUnique({ where: { code } });
  if (!company) {
    company = await prisma.company.findFirst({ where: { isActive: true } });
  }

  if (!company) {
    redirect(`/c/${code}/customer/login`);
  }

  // Multi-Tenant Isolation Check
  const isSuperAdmin = user.roles?.some(
    ({ role }: any) =>
      role?.name?.toUpperCase() === "SUPERADMIN" &&
      role?.scope === "PLATFORM"
  );

  if (!isSuperAdmin && user.companyId && user.companyId !== company.id) {
    const userCompany = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { code: true },
    });
    if (userCompany?.code) {
      redirect(`/c/${userCompany.code}/customer/addresses`);
    }
  }

  // 1. Fetch customer addresses with route relation
  let customer = await prisma.customer.findFirst({
    where: {
      companyId: company.id,
      OR: [
        { createdById: user.id },
        user.email && user.email.includes("@") && !user.email.endsWith("@washwell.local")
          ? { email: user.email }
          : undefined,
      ].filter(Boolean) as any,
    },
    include: {
      addresses: {
        include: {
          route: {
            select: {
              id: true,
              code: true,
              name: true,
              district: true,
              area: true,
            },
          },
        },
        orderBy: [{ isPrimary: "desc" }, { id: "desc" }],
      },
    },
  });

  // 2. Fetch admin routes created for company
  let routes = await prisma.route.findMany({
    where: { companyId: company.id },
    select: {
      id: true,
      code: true,
      name: true,
      district: true,
      area: true,
    },
    orderBy: { name: "asc" },
  });

  if (routes.length === 0) {
    routes = await prisma.route.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        district: true,
        area: true,
      },
      orderBy: { name: "asc" },
    });
  }

  return (
    <CustomerAddressesClient
      companyCode={company.code || code}
      initialAddresses={customer?.addresses ? JSON.parse(JSON.stringify(customer.addresses)) : []}
      availableRoutes={JSON.parse(JSON.stringify(routes))}
    />
  );
}
