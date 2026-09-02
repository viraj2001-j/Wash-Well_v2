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

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search") || "";
    const routeId = searchParams.get("routeId");
    const driverId = searchParams.get("driverId");

    const db = prisma as any;

    const where: any = { companyId: company.id };

    if (routeId && routeId !== "ALL") where.routeId = routeId;
    if (driverId && driverId !== "ALL") where.driverId = driverId;

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      where.OR = [
        { loadNumber: { contains: q, mode: "insensitive" } },
        { vehicleNumber: { contains: q, mode: "insensitive" } },
        { driverName: { contains: q, mode: "insensitive" } },
        { routeName: { contains: q, mode: "insensitive" } },
        { remark: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    const loads = await db.laundryLoad.findMany({
      where,
      include: {
        route: { select: { id: true, name: true, code: true } },
        lorry: true,
        orders: {
          include: {
            order: {
              include: {
                customer: { select: { id: true, name: true, phone: true, placeName: true } },
                items: true,
                invoice: true,
              },
            },
          },
        },
        salesmen: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: loads });
  } catch (error: any) {
    console.error("GET Laundry Loads Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lorry loading sheets" },
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
    const {
      routeId,
      lorryId,
      vehicleNumber,
      driverId,
      driverName,
      orderIds,
      remark,
      notes,
      loadingDate,
    } = body;

    // 1. Mandatory Validations
    if (!routeId) {
      return NextResponse.json(
        { success: false, error: "Please select a route." },
        { status: 400 }
      );
    }

    if (!lorryId && !vehicleNumber) {
      return NextResponse.json(
        { success: false, error: "Please select a valid lorry." },
        { status: 400 }
      );
    }

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: "Please select a valid driver." },
        { status: 400 }
      );
    }

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please select at least one invoice to load." },
        { status: 400 }
      );
    }

    const db = prisma as any;

    // 2. Validate Driver Has DRIVER Role & Belongs to Company
    const driverUser = await db.user.findFirst({
      where: {
        id: driverId,
        companyId: company.id,
        isActive: true,
        roles: {
          some: {
            role: {
              name: { equals: "DRIVER", mode: "insensitive" },
              isActive: true,
            },
          },
        },
      },
    });

    if (!driverUser) {
      return NextResponse.json(
        { success: false, error: "Selected driver is invalid or inactive." },
        { status: 400 }
      );
    }

    // 3. Resolve Lorry/Vehicle Details
    let resolvedVehicleNo = vehicleNumber;
    let resolvedLorryId = lorryId;
    if (lorryId) {
      const lorryRec = await db.lorry.findFirst({
        where: { id: lorryId, companyId: company.id },
      });
      if (lorryRec) {
        resolvedVehicleNo = lorryRec.vehicleNumber;
      }
    }

    if (!resolvedVehicleNo) {
      return NextResponse.json(
        { success: false, error: "Selected lorry has no vehicle number." },
        { status: 400 }
      );
    }

    // 4. Resolve Route Details
    const routeRec = await db.route.findFirst({
      where: { id: routeId, companyId: company.id },
    });
    if (!routeRec) {
      return NextResponse.json(
        { success: false, error: "Invalid route specified for your company." },
        { status: 400 }
      );
    }

    // 5. Fetch all selected orders & invoices with customer route links
    const selectedOrders = await db.order.findMany({
      where: {
        id: { in: orderIds },
        companyId: company.id,
      },
      include: {
        customer: {
          include: {
            routeLinks: { where: { isActive: true } },
          },
        },
        items: true,
        invoice: true,
        createdBy: true,
        visit: { include: { ref: true } },
        laundryLoadOrders: {
          include: {
            load: { select: { id: true, loadNumber: true, status: true } },
          },
        },
      },
    });

    if (selectedOrders.length !== orderIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more selected invoices could not be found." },
        { status: 400 }
      );
    }

    // 6. MANDATORY SERVER-SIDE VALIDATION: ROUTE CONSISTENCY
    for (const ord of selectedOrders) {
      const customerRoutes = ord.customer?.routeLinks?.map((rl: any) => rl.routeId) || [];
      if (!customerRoutes.includes(routeId)) {
        const invNo = ord.invoice?.invoiceNo || ord.orderNo;
        return NextResponse.json(
          {
            success: false,
            error: `Invoice ${invNo} does not belong to selected route "${routeRec.name}". Cross-route loading is not allowed.`,
          },
          { status: 400 }
        );
      }
    }

    // 7. MANDATORY SERVER-SIDE VALIDATION: DUPLICATE ACTIVE LOADING CHECK
    for (const ord of selectedOrders) {
      const activeLoadLink = ord.laundryLoadOrders?.find(
        (llo: any) => llo.load && llo.load.status !== "CANCELLED"
      );
      if (activeLoadLink) {
        const invNo = ord.invoice?.invoiceNo || ord.orderNo;
        const activeLoadNo = activeLoadLink.load.loadNumber;
        return NextResponse.json(
          {
            success: false,
            error: `${invNo} is already loaded in ${activeLoadNo}.`,
          },
          { status: 400 }
        );
      }
    }

    // 8. Financial Totals & Rep aggregation
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    let calculatedGrandTotal = 0;
    let calculatedTotalItems = 0;

    const repUserIds = new Set<string>();

    selectedOrders.forEach((ord: any) => {
      const inv = ord.invoice;
      const sub = Number(inv?.subtotal || ord.subtotal || 0);
      const tax = Number(inv?.additionalCharges || ord.additionalCharges || (sub * 0.1));
      const gTot = Number(inv?.total || ord.grandTotal || (sub + tax));

      calculatedSubtotal += sub;
      calculatedTax += tax;
      calculatedGrandTotal += gTot;

      const itemsQty = ord.items?.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0) || 1;
      calculatedTotalItems += itemsQty;

      if (ord.visit?.ref?.id) {
        repUserIds.add(ord.visit.ref.id);
      } else if (ord.createdBy?.id) {
        repUserIds.add(ord.createdBy.id);
      }
    });

    // Generate Remark if not provided
    const invNumbers = selectedOrders.map((o: any) => o.invoice?.invoiceNo || o.orderNo).join(", ");
    const finalRemark = remark?.trim() || `Loaded for Invoice(s): ${invNumbers}`;

    // Generate AUTHORITATIVE Load Number: LOAD-YYYYMMDD-XXX
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const todayCount = await db.laundryLoad.count({
      where: {
        companyId: company.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    const loadNumber = `LOAD-${todayStr}-${String(todayCount + 1).padStart(3, "0")}`;

    // 9. ATOMIC DATABASE TRANSACTION
    const resultLoad = await db.$transaction(async (tx: any) => {
      const load = await tx.laundryLoad.create({
        data: {
          loadNumber,
          companyId: company.id,
          routeId,
          vehicleId: resolvedLorryId || null,
          driverId: driverUser.id,
          vehicleNumber: resolvedVehicleNo,
          driverName: driverUser.fullName,
          routeName: routeRec.name,
          loadingDate: loadingDate ? new Date(loadingDate) : new Date(),
          status: (body.status && ["DRAFT", "LOADED", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"].includes(body.status)) ? body.status : "LOADED",
          remark: finalRemark,
          notes: notes ? notes.trim() : finalRemark,
          subtotal: calculatedSubtotal,
          tax: calculatedTax,
          grandTotal: calculatedGrandTotal,
          totalOrders: selectedOrders.length,
          totalCustomers: new Set(selectedOrders.map((o: any) => o.customerId)).size,
          totalItems: calculatedTotalItems,
          totalValue: calculatedGrandTotal,
          createdById: user.id,
        },
      });

      // Attach Orders via LaundryLoadOrder
      for (const orderId of orderIds) {
        await tx.laundryLoadOrder.create({
          data: {
            loadId: load.id,
            orderId,
            loadedAt: new Date(),
          },
        });

        // Update Order Status to OUT_FOR_DELIVERY if ready
        await tx.order.update({
          where: { id: orderId },
          data: { status: "OUT_FOR_DELIVERY" },
        });
      }

      // Attach Salesmen / REFs via LaundryLoadSalesman
      for (const repId of Array.from(repUserIds)) {
        await tx.laundryLoadSalesman.create({
          data: {
            loadId: load.id,
            userId: repId,
          },
        });
      }

      return load;
    });

    // 10. Audit Activity Logging
    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "LORRY_LOAD_CREATED",
      entityType: "LAUNDRY_LOAD",
      entityId: resultLoad.id,
      description: `Saved lorry loading ${resultLoad.loadNumber} for vehicle "${resolvedVehicleNo}" and driver "${driverUser.fullName}" (${selectedOrders.length} invoices, total LKR ${calculatedGrandTotal.toLocaleString()})`,
    });

    return NextResponse.json({
      success: true,
      message: `Lorry loading ${resultLoad.loadNumber} created successfully.`,
      data: resultLoad,
    });
  } catch (error: any) {
    console.error("POST Lorry Loading Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save lorry loading" },
      { status: 400 }
    );
  }
}
