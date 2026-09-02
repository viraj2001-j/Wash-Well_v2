import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getModels() {
  const db = prisma as any;
  if (db && (db.grn || db.GRN)) {
    return {
      grn: db.grn || db.GRN,
      grnItem: db.gRNItem || db.grnItem || db.GRNItem,
      supplier: db.supplier || db.Supplier,
      warehouse: db.warehouseLocation || db.WarehouseLocation,
      product: db.product || db.Product,
    };
  }
  const dbUrl = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=verify-full");
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const freshClient = new PrismaClient({ adapter }) as any;
  return {
    grn: freshClient.grn || freshClient.GRN,
    grnItem: freshClient.gRNItem || freshClient.grnItem || freshClient.GRNItem,
    supplier: freshClient.supplier || freshClient.Supplier,
    warehouse: freshClient.warehouseLocation || freshClient.WarehouseLocation,
    product: freshClient.product || freshClient.Product,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { company } = await verifyCompanyAccess(code);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const { grn, supplier, warehouse, product } = getModels();

    if (!grn) {
      return NextResponse.json({ success: true, data: [] });
    }

    const whereClause: any = { companyId: company.id };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { grnNo: { contains: search, mode: "insensitive" } },
        { invoiceNo: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    let grns = await grn.findMany({
      where: whereClause,
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { receivedDate: "desc" },
    });

    // Seed sample GRN records if database is empty
    if (grns.length === 0 && !search && (!status || status === "ALL")) {
      const existingSuppliers = await supplier.findMany({ where: { companyId: company.id } });
      const existingWarehouses = await warehouse.findMany({ where: { companyId: company.id } });
      const existingProducts = await product.findMany({ where: { companyId: company.id } });

      if (existingSuppliers.length > 0 && existingWarehouses.length > 0) {
        const sup1 = existingSuppliers[0];
        const sup2 = existingSuppliers[1] || existingSuppliers[0];
        const wh1 = existingWarehouses[0];
        const prod1 = existingProducts[0];

        try {
          await grn.create({
            data: {
              companyId: company.id,
              grnNo: "GRN-000421",
              invoiceNo: "INV-2026-00852",
              supplierId: sup1.id,
              receivedDate: new Date("2026-08-28"),
              source: "Supplier Purchase",
              warehouseId: wh1.id,
              storageArea: "Chemical Storage A",
              rackShelf: "Rack A-02",
              qcStatus: "PASSED",
              status: "ACCEPTED",
              expectedQty: 10,
              receivedQty: 10,
              damagedQty: 0,
              rejectedQty: 0,
              qcNotes: "All containers inspected and accepted.",
              subtotal: 125000,
              discount: 0,
              tax: 0,
              otherCharges: 0,
              grandTotal: 125000,
              notes: "Chemical drums received in good condition.",
              items: prod1
                ? {
                    create: [
                      {
                        productId: prod1.id,
                        productName: prod1.productName,
                        quantity: 10,
                        purchaseUnit: "25 L Drum",
                        unitSize: 25,
                        unitSizeUnit: "L",
                        totalQuantity: 250,
                        purchasePrice: 8500,
                        amount: 85000,
                        batchNumber: "BATCH-2026-0828",
                        manufacturingDate: new Date("2026-08-01"),
                        expiryDate: new Date("2028-08-01"),
                        trackExpiry: true,
                      },
                    ],
                  }
                : undefined,
            },
          });

          await grn.create({
            data: {
              companyId: company.id,
              grnNo: "GRN-000420",
              invoiceNo: "INV-2026-00811",
              supplierId: sup2.id,
              receivedDate: new Date("2026-08-27"),
              source: "Supplier Purchase",
              warehouseId: wh1.id,
              storageArea: "Chemical Storage B",
              rackShelf: "Rack B-01",
              qcStatus: "PASSED",
              status: "ACCEPTED",
              expectedQty: 5,
              receivedQty: 5,
              damagedQty: 0,
              rejectedQty: 0,
              qcNotes: "Inspected by QC team.",
              subtotal: 48500,
              discount: 0,
              tax: 0,
              otherCharges: 0,
              grandTotal: 48500,
            },
          });

          await grn.create({
            data: {
              companyId: company.id,
              grnNo: "GRN-000419",
              invoiceNo: "INV-2026-00790",
              supplierId: sup1.id,
              receivedDate: new Date("2026-08-26"),
              source: "Supplier Purchase",
              warehouseId: wh1.id,
              storageArea: "Chemical Storage A",
              rackShelf: "Rack A-01",
              qcStatus: "PENDING",
              status: "PENDING",
              expectedQty: 4,
              receivedQty: 4,
              damagedQty: 0,
              rejectedQty: 0,
              qcNotes: "Awaiting inspection",
              subtotal: 32750,
              discount: 0,
              tax: 0,
              otherCharges: 0,
              grandTotal: 32750,
            },
          });

          grns = await grn.findMany({
            where: whereClause,
            include: {
              supplier: true,
              warehouse: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
            orderBy: { receivedDate: "desc" },
          });
        } catch (e) {
          console.error("Error seeding sample GRNs:", e);
        }
      }
    }

    return NextResponse.json({ success: true, data: grns });
  } catch (error: any) {
    console.error("GET GRN Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch GRN records" },
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
      grnNo,
      invoiceNo,
      supplierId,
      invoiceDate,
      dueDate,
      receivedDate,
      source,
      warehouseId,
      storageArea,
      rackShelf,
      qcStatus,
      status,
      expectedQty,
      receivedQty,
      damagedQty,
      rejectedQty,
      qcNotes,
      subtotal,
      discount,
      tax,
      otherCharges,
      grandTotal,
      notes,
      items, // array of GRN items
    } = body;

    if (!supplierId || !warehouseId) {
      return NextResponse.json(
        { success: false, error: "Supplier and Warehouse/Location are required" },
        { status: 400 }
      );
    }

    const { grn, product } = getModels();

    if (!grn) {
      return NextResponse.json(
        { success: false, error: "GRN model not initialized" },
        { status: 500 }
      );
    }

    const finalGrnNo = grnNo || `GRN-${Math.floor(100000 + Math.random() * 900000)}`;

    const grnRecord = await grn.create({
      data: {
        companyId: company.id,
        grnNo: finalGrnNo,
        invoiceNo: invoiceNo ? invoiceNo.trim() : null,
        supplierId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
        source: source || "Supplier Purchase",
        warehouseId,
        storageArea: storageArea ? storageArea.trim() : null,
        rackShelf: rackShelf ? rackShelf.trim() : null,
        qcStatus: qcStatus || "PENDING",
        status: status || "PENDING", // DRAFT, PENDING, IN_PROGRESS, ACCEPTED, REJECTED
        expectedQty: Number(expectedQty) || 0,
        receivedQty: Number(receivedQty) || 0,
        damagedQty: Number(damagedQty) || 0,
        rejectedQty: Number(rejectedQty) || 0,
        qcNotes: qcNotes ? qcNotes.trim() : null,
        subtotal: Number(subtotal) || 0,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        otherCharges: Number(otherCharges) || 0,
        grandTotal: Number(grandTotal) || 0,
        notes: notes ? notes.trim() : null,
        createdById: user.id,
        items: items && Array.isArray(items) && items.length > 0
          ? {
              create: items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName || "Chemical Item",
                quantity: Number(item.quantity) || 1,
                purchaseUnit: item.purchaseUnit || "Drum",
                unitSize: Number(item.unitSize) || 1,
                unitSizeUnit: item.unitSizeUnit || "L",
                totalQuantity: Number(item.totalQuantity) || (Number(item.quantity) * Number(item.unitSize)),
                purchasePrice: Number(item.purchasePrice) || 0,
                discountPercent: Number(item.discountPercent) || 0,
                taxPercent: Number(item.taxPercent) || 0,
                amount: Number(item.amount) || 0,
                batchNumber: item.batchNumber || null,
                manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate) : null,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                trackExpiry: Boolean(item.trackExpiry),
              })),
            }
          : undefined,
      },
      include: {
        supplier: true,
        warehouse: true,
        items: true,
      },
    });

    // INVENTORY STOCK INCREMENT LOGIC:
    // Only update inventory stock when GRN status is ACCEPTED! (Drafts & Rejected do NOT alter stock)
    if (grnRecord.status === "ACCEPTED" && items && Array.isArray(items)) {
      for (const item of items) {
        if (item.productId) {
          try {
            const targetProd = await product.findUnique({ where: { id: item.productId } });
            if (targetProd) {
              const addedQty = Number(item.totalQuantity) || (Number(item.quantity) * Number(item.unitSize));
              const newStock = Number(targetProd.currentStock) + addedQty;
              await product.update({
                where: { id: item.productId },
                data: { currentStock: newStock },
              });
            }
          } catch (err) {
            console.error(`Failed to update stock for product ${item.productId}:`, err);
          }
        }
      }
    }

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "GRN_CREATED",
      entityType: "GRN",
      entityId: grnRecord.id,
      description: `Created GRN ${grnRecord.grnNo} (Status: ${grnRecord.status})`,
    });

    return NextResponse.json({ success: true, data: grnRecord });
  } catch (error: any) {
    console.error("POST GRN Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create GRN record" },
      { status: 400 }
    );
  }
}
