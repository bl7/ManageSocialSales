import type { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { withTransaction } from "@/lib/db";
import { T } from "@/lib/tables";
import {
  addPartyLedgerEntryClient,
  derivePaymentStatus,
  reserveInvoiceNumberClient,
} from "@/lib/queries/parties";

async function getVariantStockClient(
  client: PoolClient,
  variantId: string
): Promise<number> {
  const result = await client.query(
    `SELECT COALESCE(SUM(quantity_change), 0)::int AS stock
     FROM ${T.inventoryLedger} WHERE variant_id = $1`,
    [variantId]
  );
  return Number(result.rows[0]?.stock ?? 0);
}

export interface PurchaseItemInput {
  variant_id: string;
  quantity: number;
  unit_cost: number;
}

export interface PurchaseOptions {
  partyId?: string;
  amountPaid?: number;
  dueDate?: string;
}

export async function recordPurchase(
  purchaseDate: string,
  supplier: string | undefined,
  notes: string | undefined,
  items: PurchaseItemInput[],
  options: PurchaseOptions = {}
): Promise<string> {
  return withTransaction(async (client) => {
    const purchaseId = uuidv4();
    let totalAmount = 0;

    for (const item of items) {
      totalAmount += item.quantity * item.unit_cost;
    }

    const amountPaid = options.amountPaid ?? totalAmount;
    const paymentStatus = derivePaymentStatus(totalAmount, amountPaid);
    const creditDue = Math.max(0, totalAmount - amountPaid);

    await client.query(
      `INSERT INTO ${T.purchases}
       (id, purchase_date, supplier, party_id, notes, total_amount, payment_status, amount_paid, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        purchaseId,
        purchaseDate,
        supplier || null,
        options.partyId || null,
        notes || null,
        totalAmount,
        paymentStatus,
        amountPaid,
        options.dueDate || null,
      ]
    );

    for (const item of items) {
      const itemId = uuidv4();
      const lineTotal = item.quantity * item.unit_cost;
      const currentStock = await getVariantStockClient(client, item.variant_id);
      const stockAfter = currentStock + item.quantity;

      await client.query(
        `INSERT INTO ${T.purchaseItems} (id, purchase_id, variant_id, quantity, unit_cost, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, purchaseId, item.variant_id, item.quantity, item.unit_cost, lineTotal]
      );

      await client.query(
        `INSERT INTO ${T.inventoryLedger}
         (id, variant_id, movement_type, reference_type, reference_id,
          quantity_change, stock_after, unit_cost, notes)
         VALUES ($1, $2, 'purchase', 'purchase_item', $3, $4, $5, $6, $7)`,
        [
          uuidv4(),
          item.variant_id,
          itemId,
          item.quantity,
          stockAfter,
          item.unit_cost,
          notes || null,
        ]
      );
    }

    if (options.partyId && creditDue > 0) {
      await addPartyLedgerEntryClient(client, {
        partyId: options.partyId,
        entryDate: purchaseDate,
        entryType: "purchase",
        amount: creditDue,
        referenceType: "purchase",
        referenceId: purchaseId,
        notes: notes || undefined,
      });
    }

    return purchaseId;
  });
}

export interface SaleItemInput {
  variant_id: string;
  quantity: number;
  unit_sale_price: number;
}

export interface SaleOptions {
  partyId?: string;
  paymentMethodId?: string;
  deliveryCharge?: number;
  amountPaid?: number;
  dueDate?: string;
}

export async function recordSale(
  saleDate: string,
  platform: string,
  notes: string | undefined,
  items: SaleItemInput[],
  options: SaleOptions = {}
): Promise<string> {
  return withTransaction(async (client) => {
    for (const item of items) {
      const currentStock = await getVariantStockClient(client, item.variant_id);
      if (item.quantity > currentStock) {
        throw new Error(
          `Insufficient stock for variant. Available: ${currentStock}, requested: ${item.quantity}`
        );
      }
    }

    const saleId = uuidv4();
    let subtotal = 0;

    for (const item of items) {
      subtotal += item.quantity * item.unit_sale_price;
    }

    const deliveryCharge = options.deliveryCharge ?? 0;
    const totalAmount = subtotal + deliveryCharge;
    const amountPaid = options.amountPaid ?? totalAmount;
    const paymentStatus = derivePaymentStatus(totalAmount, amountPaid);
    const creditDue = Math.max(0, totalAmount - amountPaid);
    const invoiceNumber = await reserveInvoiceNumberClient(client);

    await client.query(
      `INSERT INTO ${T.sales}
       (id, sale_date, platform, party_id, payment_method_id, delivery_charge, notes,
        total_amount, payment_status, amount_paid, due_date, invoice_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        saleId,
        saleDate,
        platform,
        options.partyId || null,
        options.paymentMethodId || null,
        deliveryCharge,
        notes || null,
        totalAmount,
        paymentStatus,
        amountPaid,
        options.dueDate || null,
        invoiceNumber,
      ]
    );

    for (const item of items) {
      const itemId = uuidv4();
      const lineTotal = item.quantity * item.unit_sale_price;
      const currentStock = await getVariantStockClient(client, item.variant_id);
      const stockAfter = currentStock - item.quantity;

      await client.query(
        `INSERT INTO ${T.saleItems} (id, sale_id, variant_id, quantity, unit_sale_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, saleId, item.variant_id, item.quantity, item.unit_sale_price, lineTotal]
      );

      await client.query(
        `INSERT INTO ${T.inventoryLedger}
         (id, variant_id, movement_type, reference_type, reference_id,
          quantity_change, stock_after, unit_sale_price, notes)
         VALUES ($1, $2, 'sale', 'sale_item', $3, $4, $5, $6, $7)`,
        [
          uuidv4(),
          item.variant_id,
          itemId,
          -item.quantity,
          stockAfter,
          item.unit_sale_price,
          notes || null,
        ]
      );
    }

    if (options.partyId && creditDue > 0) {
      await addPartyLedgerEntryClient(client, {
        partyId: options.partyId,
        entryDate: saleDate,
        entryType: "sale",
        amount: creditDue,
        referenceType: "sale",
        referenceId: saleId,
        notes: notes || undefined,
      });
    }

    return saleId;
  });
}

export async function recordAdjustment(
  adjustmentDate: string,
  variantId: string,
  quantityChange: number,
  reason: string,
  notes: string | undefined
): Promise<string> {
  return withTransaction(async (client) => {
    const currentStock = await getVariantStockClient(client, variantId);
    const stockAfter = currentStock + quantityChange;

    if (stockAfter < 0) {
      throw new Error(
        `Adjustment would result in negative stock. Current: ${currentStock}, change: ${quantityChange}`
      );
    }

    const adjustmentId = uuidv4();

    await client.query(
      `INSERT INTO ${T.stockAdjustments}
       (id, adjustment_date, variant_id, quantity_change, reason, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adjustmentId, adjustmentDate, variantId, quantityChange, reason, notes || null]
    );

    await client.query(
      `INSERT INTO ${T.inventoryLedger}
       (id, variant_id, movement_type, reference_type, reference_id,
        quantity_change, stock_after, notes)
       VALUES ($1, $2, 'adjustment', 'stock_adjustment', $3, $4, $5, $6)`,
      [uuidv4(), variantId, adjustmentId, quantityChange, stockAfter, reason]
    );

    return adjustmentId;
  });
}
