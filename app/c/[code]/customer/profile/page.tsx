import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import CustomerProfileClient from "./CustomerProfileClient";

export default async function CustomerProfilePage({
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
      redirect(`/c/${userCompany.code}/customer/profile`);
    }
  }

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
  });

  return (
    <CustomerProfileClient
      companyCode={company.code || code}
      user={{
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || "",
      }}
      customer={customer ? JSON.parse(JSON.stringify(customer)) : null}
    />
  );
}
