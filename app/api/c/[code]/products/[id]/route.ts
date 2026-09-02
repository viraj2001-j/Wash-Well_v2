import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { company } = await verifyCompanyAccess(code);

    const db = prisma as any;
    const productModel = db.product || db.Product;

    if (!productModel) {
      return NextResponse.json(
        { success: false, error: "Product model not initialized" },
        { status: 500 }
      );
    }

    const product = await productModel.findFirst({
      where: { id, companyId: company.id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch product" },
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

    const db = prisma as any;
    const productModel = db.product || db.Product;

    if (!productModel) {
      return NextResponse.json(
        { success: false, error: "Product model not initialized" },
        { status: 500 }
      );
    }

    const existingProduct = await productModel.findFirst({
      where: { id, companyId: company.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const {
      productCode,
      productName,
      category,
      subcategory,
      brand,
      productForm,
      unitOfMeasure,
      packageSize,
      packageUnit,
      buyingPrice,
      sellingPrice,
      reorderLevel,
      maxStockLevel,
      lowStockAlert,
      chemicalType,
      usagePurpose,
      dosage,
      dosageUnit,
      isExpirable,
      expiryDate,
      batchNumber,
      storageInstructions,
      safetyInstructions,
      barcode,
      sku,
      imageUrl,
      status,
      trackInventory,
    } = body;

    const numBuyingPrice = buyingPrice !== undefined ? Number(buyingPrice) : Number(existingProduct.buyingPrice);
    const numPackageSize = packageSize !== undefined ? (packageSize ? Number(packageSize) : null) : (existingProduct.packageSize ? Number(existingProduct.packageSize) : null);

    const computedCostPerUnit =
      numPackageSize && numPackageSize > 0
        ? Number((numBuyingPrice / numPackageSize).toFixed(2))
        : null;

    const updatedProduct = await productModel.update({
      where: { id: existingProduct.id },
      data: {
        productCode: productCode ? productCode.trim() : existingProduct.productCode,
        productName: productName ? productName.trim() : existingProduct.productName,
        category: category ? category.trim() : existingProduct.category,
        subcategory: subcategory !== undefined ? (subcategory ? subcategory.trim() : null) : existingProduct.subcategory,
        brand: brand !== undefined ? (brand ? brand.trim() : null) : existingProduct.brand,
        productForm: productForm !== undefined ? (productForm ? productForm.trim() : null) : existingProduct.productForm,

        unitOfMeasure: unitOfMeasure ? unitOfMeasure.trim() : existingProduct.unitOfMeasure,
        packageSize: numPackageSize,
        packageUnit: packageUnit !== undefined ? (packageUnit ? packageUnit.trim() : null) : existingProduct.packageUnit,

        buyingPrice: numBuyingPrice,
        sellingPrice: sellingPrice !== undefined ? (sellingPrice !== null && sellingPrice !== "" ? Number(sellingPrice) : null) : existingProduct.sellingPrice,
        costPerUnit: computedCostPerUnit,

        reorderLevel: reorderLevel !== undefined ? (reorderLevel !== null && reorderLevel !== "" ? Number(reorderLevel) : null) : existingProduct.reorderLevel,
        maxStockLevel: maxStockLevel !== undefined ? (maxStockLevel !== null && maxStockLevel !== "" ? Number(maxStockLevel) : null) : existingProduct.maxStockLevel,
        lowStockAlert: lowStockAlert !== undefined ? Boolean(lowStockAlert) : existingProduct.lowStockAlert,

        chemicalType: chemicalType !== undefined ? (chemicalType ? chemicalType.trim() : null) : existingProduct.chemicalType,
        usagePurpose: usagePurpose !== undefined ? (usagePurpose ? usagePurpose.trim() : null) : existingProduct.usagePurpose,
        dosage: dosage !== undefined ? (dosage !== null && dosage !== "" ? Number(dosage) : null) : existingProduct.dosage,
        dosageUnit: dosageUnit !== undefined ? (dosageUnit ? dosageUnit.trim() : null) : existingProduct.dosageUnit,

        isExpirable: isExpirable !== undefined ? Boolean(isExpirable) : existingProduct.isExpirable,
        expiryDate: isExpirable && expiryDate ? new Date(expiryDate) : isExpirable === false ? null : existingProduct.expiryDate,
        batchNumber: batchNumber !== undefined ? (batchNumber ? batchNumber.trim() : null) : existingProduct.batchNumber,
        storageInstructions: storageInstructions !== undefined ? (storageInstructions ? storageInstructions.trim() : null) : existingProduct.storageInstructions,
        safetyInstructions: safetyInstructions !== undefined ? (safetyInstructions ? safetyInstructions.trim() : null) : existingProduct.safetyInstructions,

        barcode: barcode !== undefined ? (barcode ? barcode.trim() : null) : existingProduct.barcode,
        sku: sku !== undefined ? (sku ? sku.trim() : null) : existingProduct.sku,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : existingProduct.imageUrl,

        status: status || existingProduct.status,
        trackInventory: trackInventory !== undefined ? Boolean(trackInventory) : existingProduct.trackInventory,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PRODUCT_UPDATED",
      entityType: "PRODUCT",
      entityId: updatedProduct.id,
      description: `Updated product ${updatedProduct.productName} (${updatedProduct.productCode})`,
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error("PUT Product Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
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

    const db = prisma as any;
    const productModel = db.product || db.Product;

    if (!productModel) {
      return NextResponse.json(
        { success: false, error: "Product model not initialized" },
        { status: 500 }
      );
    }

    const existingProduct = await productModel.findFirst({
      where: { id, companyId: company.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    await productModel.delete({
      where: { id: existingProduct.id },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PRODUCT_DELETED",
      entityType: "PRODUCT",
      entityId: existingProduct.id,
      description: `Deleted product ${existingProduct.productName} (${existingProduct.productCode})`,
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 400 }
    );
  }
}
