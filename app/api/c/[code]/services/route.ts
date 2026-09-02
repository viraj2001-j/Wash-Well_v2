import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const services = await prisma.service.findMany({
      where: { companyId: company.id },
      include: {
        prices: {
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch services" },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const body = await req.json();
    const { serviceCode, name, description, pricingType, defaultPrice } = body;

    if (!name || !serviceCode) {
      return NextResponse.json({ success: false, error: "Service Code and Name are required" }, { status: 400 });
    }

    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.service.create({
        data: {
          companyId: company.id,
          code: serviceCode,
          name,
          description: description || null,
          pricingType: pricingType || "PER_KG",
        },
      });

      if (defaultPrice !== undefined && defaultPrice !== null) {
        await tx.servicePrice.create({
          data: {
            companyId: company.id,
            serviceId: created.id,
            price: Number(defaultPrice),
            effectiveFrom: new Date(),
          },
        });
      }

      return created;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "SERVICE_CREATED",
      entityType: "SERVICE",
      entityId: service.id,
      description: `Created service ${service.name} (${service.code})`,
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create service" },
      { status: 400 }
    );
  }
}
