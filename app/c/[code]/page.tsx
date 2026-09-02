import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import CompanyHomePageClient from "./CompanyHomePageClient";

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  let company = await prisma.company.findUnique({
    where: { code },
  });

  if (!company) {
    // If specific company code not found in DB, try finding by fallback or return 404
    const firstActive = await prisma.company.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (firstActive) {
      company = firstActive;
    } else {
      notFound();
    }
  }

  return (
    <CompanyHomePageClient
      company={{
        id: company.id,
        code: company.code,
        name: company.name,
        logoUrl: company.logoUrl,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        country: company.country,
      }}
    />
  );
}

