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
      product: db.product || db.Product,
    };
  }
  const dbUrl = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=verify-full");
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const freshClient = new PrismaClient({ adapter }) as any;
  return {
    grn: freshClient.grn || freshClient.GRN,
    grnItem: freshClient.gRNItem || freshClient.grnItem || freshClient.GRNItem,
    product: freshClient.product || freshClient.Product,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { company } = await verifyCompanyAccess(code);

    const { grn } = getModels();

    if (!grn) {
      return NextResponse.json(
        { success: false, error: "GRN model not initialized" },
        { status: 500 }
      );
    }

    const record = await grn.findFirst({
      where: { id, companyId: company.id },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: "GRN record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch GRN record" },
      { status: 400 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const { grn, product } = getModels();

    if (!grn) {
      return NextResponse.json(
        { success: false, error: "GRN model not initialized" },
        { status: 500 }
      );
    }

    const existing = await grn.findFirst({
      where: { id, companyId: company.id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "GRN record not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const {
      status,
      qcStatus,
      qcNotes,
      invoiceNo,
      supplierId,
      warehouseId,
      storageArea,
      rackShelf,
      receivedDate,
      subtotal,
      discount,
      tax,
      otherCharges,
      grandTotal,
      notes,
    } = body;

    const oldStatus = existing.status;
    const newStatus = status || existing.status;

    const updated = await grn.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        qcStatus: qcStatus || existing.qcStatus,
        qcNotes: qcNotes !== undefined ? (qcNotes ? qcNotes.trim() : null) : existing.qcNotes,
        invoiceNo: invoiceNo !== undefined ? (invoiceNo ? invoiceNo.trim() : null) : existing.invoiceNo,
        supplierId: supplierId || existing.supplierId,
        warehouseId: warehouseId || existing.warehouseId,
        storageArea: storageArea !== undefined ? (storageArea ? storageArea.trim() : null) : existing.storageArea,
        rackShelf: rackShelf !== undefined ? (rackShelf ? rackShelf.trim() : null) : existing.rackShelf,
        receivedDate: receivedDate ? new Date(receivedDate) : existing.receivedDate,
        subtotal: subtotal !== undefined ? Number(subtotal) : existing.subtotal,
        discount: discount !== undefined ? Number(discount) : existing.discount,
        tax: tax !== undefined ? Number(tax) : existing.tax,
        otherCharges: otherCharges !== undefined ? Number(otherCharges) : existing.otherCharges,
        grandTotal: grandTotal !== undefined ? Number(grandTotal) : existing.grandTotal,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
      },
      include: {
        supplier: true,
        warehouse: true,
        items: true,
      },
    });

    // INVENTORY STOCK INCREMENT LOGIC:
    // If status transitioned from non-ACCEPTED to ACCEPTED, increase inventory stock!
    if (oldStatus !== "ACCEPTED" && newStatus === "ACCEPTED" && existing.items) {
      for (const item of existing.items) {
        if (item.productId) {
          try {
            const targetProd = await product.findUnique({ where: { id: item.productId } });
            if (targetProd) {
              const addedQty = Number(item.totalQuantity);
              const newStock = Number(targetProd.currentStock) + addedQty;
              await product.update({
                where: { id: item.productId },
                data: { currentStock: newStock },
              });
            }
          } catch (err) {
            console.error(`Failed to increment inventory stock for product ${item.productId}:`, err);
          }
        }
      }
    }

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "GRN_UPDATED",
      entityType: "GRN",
      entityId: updated.id,
      description: `Updated GRN ${updated.grnNo} (Status: ${updated.status})`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT GRN Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update GRN record" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { user, company } = await verifyCompanyAccess(code);

    const { grn } = getModels();

    if (!grn) {
      return NextResponse.json(
        { success: false, error: "GRN model not initialized" },
        { status: 500 }
      );
    }

    const existing = await grn.findFirst({
      where: { id, companyId: company.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "GRN record not found" },
        { status: 404 }
      );
    }

    await grn.delete({
      where: { id: existing.id },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "GRN_DELETED",
      entityType: "GRN",
      entityId: existing.id,
      description: `Deleted GRN ${existing.grnNo}`,
    });

    return NextResponse.json({ success: true, message: "GRN deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete GRN record" },
      { status: 400 }
    );
  }
}
