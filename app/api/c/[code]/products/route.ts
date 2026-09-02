import { NextRequest, NextResponse } from "next/server";
import { verifyCompanyAccess } from "@/lib/services/security";
import { logActivity } from "@/lib/services/activity";
import prisma from "@/lib/db";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getProductModel() {
  const db = prisma as any;
  if (db && (db.product || db.Product)) {
    return db.product || db.Product;
  }
  const dbUrl = (process.env.DATABASE_URL || "").replace("sslmode=require", "sslmode=verify-full");
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const freshClient = new PrismaClient({ adapter }) as any;
  return freshClient.product || freshClient.Product;
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
    const category = searchParams.get("category") || "";
    const subcategory = searchParams.get("subcategory") || "";
    const status = searchParams.get("status") || "";
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const whereClause: any = {
      companyId: company.id,
    };

    if (search) {
      whereClause.OR = [
        { productName: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (subcategory && subcategory !== "ALL") {
      whereClause.subcategory = subcategory;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const productModel = getProductModel();

    if (!productModel) {
      return NextResponse.json({ success: true, data: [] });
    }

    let products = await productModel.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    if (lowStockOnly) {
      products = products.filter(
        (p: any) =>
          p.trackInventory &&
          p.reorderLevel !== null &&
          Number(p.currentStock) <= Number(p.reorderLevel)
      );
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("GET Products Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
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
      openingStock,
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

    if (!productCode || !productName || !category || !unitOfMeasure || buyingPrice === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Product Code, Product Name, Category, Unit of Measure, and Buying Price are required",
        },
        { status: 400 }
      );
    }

    const productModel = getProductModel();

    if (!productModel) {
      return NextResponse.json(
        { success: false, error: "Product model not initialized" },
        { status: 500 }
      );
    }

    // Check duplicate code
    const existing = await productModel.findUnique({
      where: {
        companyId_productCode: {
          companyId: company.id,
          productCode: productCode.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Product Code "${productCode}" already exists for this company` },
        { status: 400 }
      );
    }

    const numBuyingPrice = Number(buyingPrice) || 0;
    const numPackageSize = packageSize ? Number(packageSize) : null;
    const computedCostPerUnit =
      numPackageSize && numPackageSize > 0
        ? Number((numBuyingPrice / numPackageSize).toFixed(2))
        : null;

    const numOpeningStock = openingStock !== undefined && openingStock !== null ? Number(openingStock) : 0;

    const product = await productModel.create({
      data: {
        companyId: company.id,
        productCode: productCode.trim(),
        productName: productName.trim(),
        category: category.trim(),
        subcategory: subcategory ? subcategory.trim() : null,
        brand: brand ? brand.trim() : null,
        productForm: productForm ? productForm.trim() : null,

        unitOfMeasure: unitOfMeasure.trim(),
        packageSize: numPackageSize,
        packageUnit: packageUnit ? packageUnit.trim() : null,

        buyingPrice: numBuyingPrice,
        sellingPrice: sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== "" ? Number(sellingPrice) : null,
        costPerUnit: computedCostPerUnit,

        openingStock: numOpeningStock,
        currentStock: numOpeningStock,
        reorderLevel: reorderLevel !== undefined && reorderLevel !== null && reorderLevel !== "" ? Number(reorderLevel) : null,
        maxStockLevel: maxStockLevel !== undefined && maxStockLevel !== null && maxStockLevel !== "" ? Number(maxStockLevel) : null,
        lowStockAlert: lowStockAlert !== undefined ? Boolean(lowStockAlert) : true,

        chemicalType: chemicalType ? chemicalType.trim() : null,
        usagePurpose: usagePurpose ? usagePurpose.trim() : null,
        dosage: dosage !== undefined && dosage !== null && dosage !== "" ? Number(dosage) : null,
        dosageUnit: dosageUnit ? dosageUnit.trim() : null,

        isExpirable: Boolean(isExpirable),
        expiryDate: isExpirable && expiryDate ? new Date(expiryDate) : null,
        batchNumber: batchNumber ? batchNumber.trim() : null,
        storageInstructions: storageInstructions ? storageInstructions.trim() : null,
        safetyInstructions: safetyInstructions ? safetyInstructions.trim() : null,

        barcode: barcode ? barcode.trim() : null,
        sku: sku ? sku.trim() : productCode.trim(),
        imageUrl: imageUrl || null,

        status: status || "ACTIVE",
        trackInventory: trackInventory !== undefined ? Boolean(trackInventory) : true,
      },
    });

    await logActivity({
      companyId: company.id,
      userId: user.id,
      action: "PRODUCT_CREATED",
      entityType: "PRODUCT",
      entityId: product.id,
      description: `Created product ${product.productName} (${product.productCode})`,
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("POST Product Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 400 }
    );
  }
}
