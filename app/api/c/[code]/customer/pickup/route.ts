import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { logActivity } from "@/lib/services/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let company = await prisma.company.findUnique({ where: { code } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: (code || "Company").toUpperCase(),
          code: code || "default",
          isActive: true,
        },
      });
    }

    let customer = await prisma.customer.findFirst({
      where: {
        companyId: company.id,
        OR: [{ createdById: user.id }, { email: user.email }],
      },
    });

    if (!customer) {
      const count = await prisma.customer.count({ where: { companyId: company.id } });
      const customerNo = `CUST-${(count + 1).toString().padStart(5, "0")}`;
      customer = await prisma.customer.create({
        data: {
          companyId: company.id,
          customerNo,
          name: user.fullName || "Valued Customer",
          email: user.email,
          phone: user.phone || null,
          createdById: user.id,
        },
      });
    }

    const body = await req.json();
    const {
      addressId,
      customAddress,
      pickupDate,
      timeSlot,
      collectionMode = "BOTH",
      actualKg = 0,
      kgRate = 250,
      items = [],
      discount = 0,
      isPriority = false,
      expressFee = 300,
      upfrontPayment = 0,
      careNotes = "",
    } = body;

    if (!pickupDate) {
      return NextResponse.json({ success: false, error: "Pickup date is required" }, { status: 400 });
    }

    // Default service anchor for items without explicit DB serviceId
    let defaultService = await prisma.service.findFirst({
      where: { companyId: company.id },
    });

    if (!defaultService) {
      defaultService = await prisma.service.create({
        data: {
          companyId: company.id,
          code: "GEN01",
          name: "General Laundry Service",
          pricingType: "PER_KG",
        },
      });
    }

    let subtotal = 0;
    const orderItemsData: any[] = [];

    // 1. Add Weight Item if KG mode active
    const numKg = Number(actualKg) || 0;
    const numKgRate = Number(kgRate) || 250;
    if ((collectionMode === "KG" || collectionMode === "BOTH") && numKg > 0) {
      const kgTotal = numKg * numKgRate;
      subtotal += kgTotal;
      orderItemsData.push({
        serviceId: defaultService.id,
        pricingType: "PER_KG",
        quantity: numKg,
        unitPrice: numKgRate,
        total: kgTotal,
        description: `Washing & Cleaning (${numKg} KG @ LKR ${numKgRate}/KG)`,
      });
    }

    // 2. Add Item / Garment / Treatment Catalog items
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item: any) => {
        const qty = Number(item.quantity) || 1;
        const uPrice = Number(item.unitPrice) || 0;
        const itemTotal = qty * uPrice;
        subtotal += itemTotal;

        orderItemsData.push({
          serviceId: item.serviceId || defaultService.id,
          pricingType: item.pricingType || "PER_ITEM",
          quantity: qty,
          unitPrice: uPrice,
          total: itemTotal,
          description: item.description || "Custom Item",
        });
      });
    }

    const additionalCharges = isPriority ? Number(expressFee) || 300 : 0;
    const discountVal = Number(discount) || 0;
    const grandTotal = Math.max(0, subtotal + additionalCharges - discountVal);

    // Generate Order Number for THIS company
    const orderCount = await prisma.order.count({ where: { companyId: company.id } });
    const orderNo = `ORD-${(orderCount + 1).toString().padStart(6, "0")}`;

    // Get primary or selected address string
    let finalAddress = customAddress;
    if (addressId) {
      const savedAddr = await prisma.customerAddress.findUnique({ where: { id: addressId } });
      if (savedAddr) {
        finalAddress = `${savedAddr.label ? `[${savedAddr.label}] ` : ""}${savedAddr.address}${savedAddr.city ? `, ${savedAddr.city}` : ""}`;
      }
    }

    const priorityPrefix = isPriority ? "⚡ [URGENT / EXPRESS ORDER] " : "";
    const notesSummary = `${priorityPrefix}Scheduled Pickup for ${pickupDate} (${timeSlot || "Standard Slot"}). Collection Mode: ${collectionMode}.${numKg > 0 ? ` Weight: ${numKg} KG.` : ""} Care Notes: ${careNotes || "None"}. Pickup Address: ${finalAddress || "Primary Address"}.`;

    // Save Order into Prisma Orders table with PENDING_APPROVAL status
    const newOrder = await prisma.order.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        createdById: user.id,
        orderNo,
        status: "PENDING_APPROVAL",
        requestedPickupDate: new Date(pickupDate),
        subtotal,
        discount: discountVal,
        additionalCharges,
        grandTotal,
        notes: notesSummary,
        items: {
          create: orderItemsData,
        },
        statusHistory: {
          create: {
            toStatus: "PENDING_APPROVAL",
            changedById: user.id,
            note: isPriority
              ? `⚡ Urgent Express Pickup Request submitted by Customer ${customer.name}`
              : `Online Pickup Request submitted by Customer ${customer.name}`,
          },
        },
      },
      include: {
        customer: true,
        items: { include: { service: true } },
      },
    });

    // Handle Upfront Payment if > 0
    const numPayment = Number(upfrontPayment) || 0;
    if (numPayment > 0) {
      await prisma.payment.create({
        data: {
          companyId: company.id,
          orderId: newOrder.id,
          amount: numPayment,
          method: "CASH",
          notes: isPriority ? "Urgent Express Upfront Payment" : "Customer Upfront Payment at Pickup Request",
          createdById: user.id,
        },
      });
    }

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PICKUP_REQUEST_SUBMITTED",
      entityType: "ORDER",
      entityId: newOrder.id,
      description: `New ${isPriority ? "Urgent Express " : ""}Pickup Scheduled by customer ${customer.name} for ${pickupDate}`,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
    });
  } catch (error: any) {
    console.error("POST /api/c/[code]/customer/pickup error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to schedule pickup" }, { status: 500 });
  }
}
