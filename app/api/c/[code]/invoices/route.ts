import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess, getUserRoleType } from "@/lib/services/security";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const invoices = await prisma.invoice.findMany({
      where: { companyId: company.id },
      include: {
        order: {
          include: {
            customer: {
              include: {
                addresses: true,
                routeLinks: { include: { route: true } },
              },
            },
            createdBy: true,
          },
        },
        items: true,
        allocations: {
          include: {
            payment: {
              include: { createdBy: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch invoices" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company, user } = await verifyCompanyAccess(code);

    const roleType = getUserRoleType(user);
    if (!roleType.isAdminOrManager) {
      return NextResponse.json(
        { success: false, error: "Only admin or manager can update invoices" },
        { status: 403 }
      );
    }

    const { invoiceId, status } = await req.json();
    if (!invoiceId || !status) {
      return NextResponse.json(
        { success: false, error: "Invoice ID and status are required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId, companyId: company.id },
      data: { status },
      include: {
        order: {
          include: {
            customer: {
              include: {
                addresses: true,
                routeLinks: { include: { route: true } },
              },
            },
            createdBy: true,
          },
        },
        items: true,
        allocations: {
          include: {
            payment: { include: { createdBy: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update invoice" },
      { status: 400 }
    );
  }
}
