import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";
import { formatPhoneNumber } from "@/lib/services/sms";

// GET /api/c/[code]/customers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { company } = await verifyCompanyAccess(code);

    const customer = await prisma.customer.findFirst({
      where: { id, companyId: company.id },
      include: {
        contacts: true,
        addresses: true,
        businessTypeRef: true,
        routeLinks: { include: { route: true } },
        orders: {
          include: { invoice: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    console.error("GET /api/c/[code]/customers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[code]/customers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const body = await req.json().catch(() => ({}));

    const existing = await prisma.customer.findFirst({
      where: { id, companyId: company.id },
      include: { addresses: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    // Toggle active status if passed in body
    if (typeof body.isActive === "boolean") {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: { isActive: body.isActive },
        include: {
          contacts: true,
          addresses: true,
          businessTypeRef: true,
          routeLinks: { include: { route: true } },
          orders: { include: { invoice: true }, orderBy: { createdAt: "desc" } },
        },
      });

      await logActivity({
        companyId: company.id,
        userId: user.id,
        action: body.isActive ? "CUSTOMER_ACTIVATED" : "CUSTOMER_INACTIVATED",
        entityType: "CUSTOMER",
        entityId: existing.id,
        description: `${body.isActive ? "Activated" : "Inactivated"} customer ${existing.name} (${existing.customerNo})`,
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Customer '${existing.name}' ${body.isActive ? "activated" : "inactivated"} successfully!`,
      });
    }

    // Edit full customer details
    const {
      name,
      placeName,
      phone,
      email,
      paymentTerms,
      customerType,
      creditLimit,
      creditPeriodDays,
      businessTypeId,
      gpsLatitude,
      gpsLongitude,
      address,
      city,
      routeId,
    } = body;

    const updateData: any = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (placeName !== undefined) updateData.placeName = placeName ? placeName.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (email !== undefined) updateData.email = email ? email.trim() : null;

    const effectivePaymentTerms = paymentTerms || customerType;
    if (effectivePaymentTerms) updateData.paymentTerms = effectivePaymentTerms;

    if (creditLimit !== undefined) {
      updateData.creditLimit = creditLimit && !isNaN(parseFloat(creditLimit)) ? parseFloat(creditLimit) : null;
    }
    if (creditPeriodDays !== undefined) {
      updateData.creditPeriodDays = creditPeriodDays && !isNaN(parseInt(creditPeriodDays)) ? parseInt(creditPeriodDays) : null;
    }

    if (gpsLatitude !== undefined) updateData.gpsLatitude = gpsLatitude && !isNaN(parseFloat(gpsLatitude)) ? parseFloat(gpsLatitude) : null;
    if (gpsLongitude !== undefined) updateData.gpsLongitude = gpsLongitude && !isNaN(parseFloat(gpsLongitude)) ? parseFloat(gpsLongitude) : null;

    if (businessTypeId) updateData.businessTypeId = businessTypeId;

    const updatedCustomer = await prisma.$transaction(async (tx) => {
      const updated = await tx.customer.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          contacts: true,
          addresses: true,
          businessTypeRef: true,
          routeLinks: { include: { route: true } },
          orders: { include: { invoice: true }, orderBy: { createdAt: "desc" } },
        },
      });

      // Update primary address if provided
      if (address && address.trim()) {
        const primaryAddress = existing.addresses?.[0];
        if (primaryAddress) {
          await tx.customerAddress.update({
            where: { id: primaryAddress.id },
            data: { address: address.trim(), city: city ? city.trim() : null },
          });
        } else {
          await tx.customerAddress.create({
            data: { customerId: existing.id, address: address.trim(), city: city ? city.trim() : null, isPrimary: true },
          });
        }
      }

      // Update route link if provided
      if (routeId) {
        await tx.routeCustomer.deleteMany({ where: { customerId: existing.id } });
        await tx.routeCustomer.create({
          data: { customerId: existing.id, routeId, isActive: true },
        });
      }

      return updated;
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "CUSTOMER_UPDATED",
      entityType: "CUSTOMER",
      entityId: existing.id,
      description: `Updated customer ${updatedCustomer.name} (${updatedCustomer.customerNo})`,
    });

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: `Customer '${updatedCustomer.name}' updated successfully!`,
    });
  } catch (error: any) {
    console.error("PATCH /api/c/[code]/customers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update customer" },
      { status: 400 }
    );
  }
}

// DELETE /api/c/[code]/customers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const existing = await prisma.customer.findFirst({
      where: { id, companyId: company.id },
      include: { orders: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    // Check if customer has orders
    if (existing.orders && existing.orders.length > 0) {
      // Soft-delete / inactivate if customer has active orders to prevent foreign key errors
      await prisma.customer.update({
        where: { id: existing.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `Customer '${existing.name}' has existing order history so their account was inactivated.`,
      });
    }

    // Hard delete customer and related sub-records
    await prisma.$transaction(async (tx) => {
      await tx.routeCustomer.deleteMany({ where: { customerId: existing.id } });
      await tx.customerAddress.deleteMany({ where: { customerId: existing.id } });
      await tx.customerContact.deleteMany({ where: { customerId: existing.id } });
      await tx.customer.delete({ where: { id: existing.id } });
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "CUSTOMER_DELETED",
      entityType: "CUSTOMER",
      entityId: existing.id,
      description: `Deleted customer ${existing.name} (${existing.customerNo})`,
    });

    return NextResponse.json({
      success: true,
      message: `Customer '${existing.name}' deleted successfully!`,
    });
  } catch (error: any) {
    console.error("DELETE /api/c/[code]/customers/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete customer" },
      { status: 400 }
    );
  }
}
