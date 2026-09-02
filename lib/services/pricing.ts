import prisma from "@/lib/db";


export interface ItemCalculationInput {
  description: string;
  pricingType: "PER_KG" | "PER_ITEM";
  quantity: number;
  unitPrice: number;
  serviceId?: string;
  orderItemId?: string;
}

export interface CalculateInvoiceInput {
  companyId: string;
  orderId: string;
  items: ItemCalculationInput[];
  discount?: number;
  additionalCharges?: number;
}

export function calculateTotals(
  items: ItemCalculationInput[],
  discount: number = 0,
  additionalCharges: number = 0
) {
  let subtotal = 0;

  const processedItems = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const itemTotal = Number((qty * price).toFixed(2));
    subtotal += itemTotal;

    return {
      ...item,
      quantity: qty,
      unitPrice: price,
      total: itemTotal,
    };
  });

  const finalSubtotal = Number(subtotal.toFixed(2));
  const finalDiscount = Number(discount.toFixed(2));
  const finalAdditional = Number(additionalCharges.toFixed(2));
  const grandTotal = Math.max(0, Number((finalSubtotal + finalAdditional - finalDiscount).toFixed(2)));

  return {
    items: processedItems,
    subtotal: finalSubtotal,
    discount: finalDiscount,
    additionalCharges: finalAdditional,
    grandTotal,
  };
}

/**
 * Creates or updates an Invoice in a single database transaction based on actual items collected.
 */
export async function createOrUpdateInvoice(
  companyId: string,
  orderId: string,
  items: ItemCalculationInput[],
  discount: number = 0,
  additionalCharges: number = 0
) {
  const calc = calculateTotals(items, discount, additionalCharges);

  return await prisma.$transaction(async (tx) => {
    // 1. Check if invoice exists
    let invoice = await tx.invoice.findUnique({
      where: { orderId },
      include: { allocations: true },
    });

    const paidSum = invoice
      ? invoice.allocations.reduce((sum, a) => sum + Number(a.amount), 0)
      : 0;

    let invoiceStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" = "UNPAID";
    if (paidSum >= calc.grandTotal && calc.grandTotal > 0) {
      invoiceStatus = "PAID";
    } else if (paidSum > 0) {
      invoiceStatus = "PARTIALLY_PAID";
    }

    if (invoice) {
      // Delete old invoice items & recreate
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: invoice.id },
      });

      invoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: calc.subtotal,
          discount: calc.discount,
          additionalCharges: calc.additionalCharges,
          total: calc.grandTotal,
          status: invoiceStatus,
          items: {
            create: calc.items.map((i) => ({
              description: i.description,
              pricingType: i.pricingType,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.total,
              orderItemId: i.orderItemId || null,
            })),
          },
        },
        include: { allocations: true, items: true },
      });
    } else {
      // Create new invoice with auto invoice number
      const invoiceCount = await tx.invoice.count({ where: { companyId } });
      const invoiceNo = `INV-${(invoiceCount + 1).toString().padStart(5, "0")}`;

      invoice = await tx.invoice.create({
        data: {
          companyId,
          orderId,
          invoiceNo,
          subtotal: calc.subtotal,
          discount: calc.discount,
          additionalCharges: calc.additionalCharges,
          total: calc.grandTotal,
          status: invoiceStatus,
          items: {
            create: calc.items.map((i) => ({
              description: i.description,
              pricingType: i.pricingType,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              total: i.total,
              orderItemId: i.orderItemId || null,
            })),
          },
        },
        include: { allocations: true, items: true },
      });
    }

    // Update order grandTotal & subtotal as well
    await tx.order.update({
      where: { id: orderId },
      data: {
        subtotal: calc.subtotal,
        discount: calc.discount,
        additionalCharges: calc.additionalCharges,
        grandTotal: calc.grandTotal,
      },
    });

    return invoice;
  });
}
