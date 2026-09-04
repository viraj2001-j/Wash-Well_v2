import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireCompanyAccess } from "@/lib/auth/require-company-access";
import ProcessingClient from "./ProcessingClient";

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const company = await prisma.company.findUnique({ where: { code } });
  if (!company) notFound();

  await requireCompanyAccess(company.id);

  const processings = await prisma.processing.findMany({
    where: { order: { companyId: company.id } },
    include: {
      order: {
        include: {
          customer: true,
          pickup: { include: { items: true } },
          invoice: true,
        },
      },
      createdBy: true,
      history: { include: { performedBy: true }, orderBy: { startedAt: "desc" } },
    },
    orderBy: { startedAt: "desc" },
  });

  const ordersCollected = await prisma.order.findMany({
    where: {
      companyId: company.id,
      status: { in: ["COLLECTED", "RECEIVED_AT_LAUNDRY", "PROCESSING"] },
    },
    include: {
      customer: true,
      pickup: { include: { items: true } },
      processing: true,
    },
  });

  return (
    <ProcessingClient
      companyCode={code}
      companyId={company.id}
      initialProcessings={JSON.parse(JSON.stringify(processings))}
      ordersCollected={JSON.parse(JSON.stringify(ordersCollected))}
    />
  );
}
