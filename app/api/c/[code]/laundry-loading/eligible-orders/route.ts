import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get("routeId");
    const invoiceDate = searchParams.get("date"); // YYYY-MM-DD or "ALL" / null
    const searchQuery = searchParams.get("search") || "";

    const db = prisma as any;

    // 1. Fetch route-linked customer IDs if routeId is provided
    let customerIdsForRoute: string[] | null = null;
    let selectedRouteInfo: any = null;

    if (routeId && routeId !== "ALL") {
      const routeRec = await db.route.findUnique({
        where: { id: routeId },
        select: { id: true, name: true, code: true },
      });
      if (routeRec) selectedRouteInfo = routeRec;

      const routeCustomers = await db.routeCustomer.findMany({
        where: {
          routeId,
          isActive: true,
        },
        select: { customerId: true },
      });
      customerIdsForRoute = routeCustomers.map((rc: any) => rc.customerId);
    }

    // 2. Build Order Query Filter
    const orderWhere: any = {
      companyId: company.id,
      status: {
        in: [
          "APPROVED",
          "ASSIGNED",
          "READY_FOR_PICKUP",
          "COLLECTED",
          "RECEIVED_AT_LAUNDRY",
          "PROCESSING",
          "READY_FOR_DELIVERY",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
          "COMPLETED",
        ],
      },
    };

    // Strict route filter
    if (customerIdsForRoute !== null) {
      orderWhere.customerId = { in: customerIdsForRoute };
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      orderWhere.OR = [
        { orderNo: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { invoice: { invoiceNo: { contains: q, mode: "insensitive" } } },
      ];
    }

    // Fetch candidate orders with customer, items, invoice, createdBy, visit, and active load links
    const candidateOrders = await db.order.findMany({
      where: orderWhere,
      include: {
        customer: {
          include: {
            routeLinks: {
              where: { isActive: true },
              include: { route: true },
            },
          },
        },
        items: {
          include: {
            service: true,
          },
        },
        invoice: {
          include: {
            items: true,
          },
        },
        createdBy: {
          select: { id: true, fullName: true, username: true },
        },
        visit: {
          include: {
            ref: { select: { id: true, fullName: true, username: true } },
          },
        },
        laundryLoadOrders: {
          include: {
            load: {
              select: {
                id: true,
                loadNumber: true,
                status: true,
                vehicleNumber: true,
                driverName: true,
                loadingDate: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format & filter by Invoice Date if date filter is set
    const formattedList = candidateOrders
      .map((ord: any) => {
        const inv = ord.invoice;
        const invNo = inv?.invoiceNo || `INV-${ord.orderNo.replace(/\D/g, "") || ord.id.slice(-6)}`;
        
        // Exact invoice date or order created date
        const actualInvoiceDateObj = inv?.createdAt ? new Date(inv.createdAt) : new Date(ord.createdAt);
        const formattedDateStr = actualInvoiceDateObj.toISOString().split("T")[0];

        // Check if date filter applies
        if (invoiceDate && invoiceDate !== "ALL" && invoiceDate.trim() !== "") {
          if (formattedDateStr !== invoiceDate.trim()) {
            return null;
          }
        }

        // Active Lorry Loading check
        const activeLoadOrder = ord.laundryLoadOrders?.find(
          (llo: any) => llo.load && llo.load.status !== "CANCELLED"
        );
        const alreadyLoaded = Boolean(activeLoadOrder);
        const activeLoadInfo = activeLoadOrder?.load
          ? {
              loadNumber: activeLoadOrder.load.loadNumber,
              vehicleNumber: activeLoadOrder.load.vehicleNumber || "N/A",
              driverName: activeLoadOrder.load.driverName || "N/A",
              loadingDate: activeLoadOrder.load.loadingDate
                ? new Date(activeLoadOrder.load.loadingDate).toISOString().split("T")[0]
                : "N/A",
              status: activeLoadOrder.load.status,
            }
          : null;

        // Determine Rep / REF
        const repName = ord.visit?.ref?.fullName || ord.createdBy?.fullName || "General Staff";
        const repId = ord.visit?.ref?.id || ord.createdBy?.id || "rep-default";

        // Route Name
        const routeObj = ord.customer?.routeLinks?.[0]?.route || selectedRouteInfo;
        const routeName = routeObj?.name || "Main Route";
        const routeCode = routeObj?.code || "RT";

        // Financial calculations
        const subtotal = Number(inv?.subtotal || ord.subtotal || 0);
        const discount = Number(inv?.discount || ord.discount || 0);
        const tax = Number(inv?.additionalCharges || ord.additionalCharges || (subtotal * 0.1));
        const grandTotal = Number(inv?.total || ord.grandTotal || (subtotal + tax - discount));

        // Items list
        const items = ord.items?.map((item: any) => ({
          id: item.id,
          name: item.service?.name || item.description || "Laundry Service",
          service: item.service?.name || "Wash & Iron",
          pricingType: item.pricingType || "PER_ITEM",
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          total: Number(item.total) || 0,
        })) || [];

        const totalItemsQty = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);

        const cust = ord.customer;
        const formattedAddressParts = [cust?.address1, cust?.address2, cust?.city, cust?.district]
          .filter(Boolean)
          .join(", ");
        const customerAddress = formattedAddressParts || cust?.deliveryAddress || "Address N/A";

        return {
          id: ord.id,
          invoiceId: inv?.id || ord.id,
          invoiceNo: invNo,
          orderNo: ord.orderNo,
          orderId: ord.id,
          customerId: ord.customerId,
          customerName: cust?.name || "Customer",
          customerPlaceName: cust?.placeName || null,
          customerPhone: cust?.phone || "N/A",
          customerAddress,
          routeId: routeObj?.id || routeId,
          routeName,
          routeCode,
          invoiceDate: formattedDateStr,
          orderDate: new Date(ord.createdAt).toISOString().split("T")[0],
          repName,
          repId,
          subtotal,
          discount,
          tax,
          grandTotal,
          totalItemsQty,
          items,
          alreadyLoaded,
          activeLoadInfo,
          orderStatus: ord.status,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: formattedList,
      count: formattedList.length,
    });
  } catch (error: any) {
    console.error("GET Eligible Completed Orders Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch eligible orders" },
      { status: 400 }
    );
  }
}
