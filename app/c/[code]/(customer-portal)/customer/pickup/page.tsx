import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import CustomerPickupClient from "./CustomerPickupClient";

export default async function CustomerPickupPage({
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
      redirect(`/c/${userCompany.code}/customer/pickup`);
    }
  }

  // Fetch customer record
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
        orderBy: [{ isPrimary: "desc" }, { id: "desc" }],
      },
    },
  });

  // Fetch real services from DB for this company
  let services = await prisma.service.findMany({
    where: { companyId: company.id, isActive: true },
    include: {
      prices: {
        where: { isActive: true },
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  if (services.length === 0) {
    // Provision default company services if none exist in DB yet
    const defaultServices = [
      { code: "WF01", name: "Wash & Fold", description: "Everyday clothes, t-shirts, towels & bedding", pricingType: "PER_KG" as const, price: 1200 },
      { code: "IP01", name: "Ironing & Pressing", description: "Crisp steam pressing for shirts, suits & dresses", pricingType: "PER_PIECE" as const, price: 500 },
      { code: "DC01", name: "Dry Cleaning", description: "Delicate fabrics, wool, silk, suits & jackets", pricingType: "PER_PIECE" as const, price: 2500 },
      { code: "CB01", name: "Comforter & Bedding", description: "Large comforters, blankets, pillows & curtains", pricingType: "FIXED" as const, price: 3500 },
    ];

    for (const srv of defaultServices) {
      const created = await prisma.service.create({
        data: {
          companyId: company.id,
          code: srv.code,
          name: srv.name,
          description: srv.description,
          pricingType: srv.pricingType as any,
          prices: {
            create: {
              companyId: company.id,
              price: srv.price,
              effectiveFrom: new Date(),
            },
          },
        },
        include: {
          prices: {
            orderBy: { effectiveFrom: "desc" },
            take: 1,
          },
        },
      });
      services.push(created as any);
    }
  }

  return (
    <CustomerPickupClient
      companyCode={company.code || code}
      customer={customer ? JSON.parse(JSON.stringify(customer)) : null}
      addresses={customer?.addresses ? JSON.parse(JSON.stringify(customer.addresses)) : []}
      services={JSON.parse(JSON.stringify(services))}
    />
  );
}
