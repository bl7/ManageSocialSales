import type { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { withTransaction } from "@/lib/db";
import { T } from "@/lib/tables";
import {
  addPartyLedgerEntryClient,
  derivePaymentStatus,
  reserveInvoiceNumberClient,
} from "@/lib/queries/parties";
import {
  addAccountLedgerEntryClient,
  resolveAccountIdForSaleClient,
  resolveAccountIdForOutflowClient,
} from "@/lib/queries/accounts";
import { todayISODate } from "@/lib/date-ranges";

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
  accountId?: string;
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
    const accountId = await resolveAccountIdForOutflowClient(client, options.accountId, amountPaid);

    await client.query(
      `INSERT INTO ${T.purchases}
       (id, purchase_date, supplier, party_id, notes, total_amount, payment_status, amount_paid, due_date, account_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
        accountId,
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

    if (accountId && amountPaid > 0) {
      await addAccountLedgerEntryClient(client, {
        accountId,
        entryDate: purchaseDate,
        entryType: "purchase_paid",
        amount: -amountPaid,
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
    const accountId = await resolveAccountIdForSaleClient(client, options.paymentMethodId, amountPaid);

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

    if (accountId && amountPaid > 0) {
      await addAccountLedgerEntryClient(client, {
        accountId,
        entryDate: saleDate,
        entryType: "sale_received",
        amount: amountPaid,
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

export async function voidSale(saleId: string, voidReason: string): Promise<void> {
  return withTransaction(async (client) => {
    const saleResult = await client.query(
      `SELECT * FROM ${T.sales} WHERE id = $1 FOR UPDATE`,
      [saleId]
    );
    const sale = saleResult.rows[0];
    if (!sale) throw new Error("Sale not found");
    if (sale.status === "voided") throw new Error("Sale is already voided");

    const items = await client.query(
      `SELECT * FROM ${T.saleItems} WHERE sale_id = $1`,
      [saleId]
    );

    for (const item of items.rows) {
      const currentStock = await getVariantStockClient(client, item.variant_id);
      const stockAfter = currentStock + item.quantity;

      await client.query(
        `INSERT INTO ${T.inventoryLedger}
         (id, variant_id, movement_type, reference_type, reference_id,
          quantity_change, stock_after, unit_sale_price, notes)
         VALUES ($1, $2, 'sale_void', 'sale_void', $3, $4, $5, $6, $7)`,
        [
          uuidv4(),
          item.variant_id,
          saleId,
          item.quantity,
          stockAfter,
          item.unit_sale_price,
          `Void sale: ${voidReason}`,
        ]
      );
    }

    const totalAmount = Number(sale.total_amount);
    const amountPaid = Number(sale.amount_paid ?? 0);
    const creditDue = Math.max(0, totalAmount - amountPaid);

    if (sale.party_id && creditDue > 0) {
      await addPartyLedgerEntryClient(client, {
        partyId: sale.party_id,
        entryDate: todayISODate(),
        entryType: "sale_void",
        amount: creditDue,
        referenceType: "sale",
        referenceId: saleId,
        notes: `Void sale: ${voidReason}`,
      });
    }

    if (amountPaid > 0) {
      const accountId = await resolveAccountIdForSaleClient(
        client,
        sale.payment_method_id as string | null,
        amountPaid
      );
      if (accountId) {
        await addAccountLedgerEntryClient(client, {
          accountId,
          entryDate: todayISODate(),
          entryType: "sale_void",
          amount: -amountPaid,
          referenceType: "sale",
          referenceId: saleId,
          notes: `Void sale: ${voidReason}`,
        });
      }
    }

    await client.query(
      `UPDATE ${T.sales} SET status = 'voided', voided_at = NOW(), void_reason = $1 WHERE id = $2`,
      [voidReason, saleId]
    );
  });
}

export async function voidPurchase(purchaseId: string, voidReason: string): Promise<void> {
  return withTransaction(async (client) => {
    const purchaseResult = await client.query(
      `SELECT * FROM ${T.purchases} WHERE id = $1 FOR UPDATE`,
      [purchaseId]
    );
    const purchase = purchaseResult.rows[0];
    if (!purchase) throw new Error("Purchase not found");
    if (purchase.status === "voided") throw new Error("Purchase is already voided");

    const items = await client.query(
      `SELECT * FROM ${T.purchaseItems} WHERE purchase_id = $1`,
      [purchaseId]
    );

    for (const item of items.rows) {
      const currentStock = await getVariantStockClient(client, item.variant_id);
      const stockAfter = currentStock - item.quantity;
      if (stockAfter < 0) {
        throw new Error(
          `Cannot void purchase: would make stock negative for a variant. Available: ${currentStock}, need to remove: ${item.quantity}`
        );
      }

      await client.query(
        `INSERT INTO ${T.inventoryLedger}
         (id, variant_id, movement_type, reference_type, reference_id,
          quantity_change, stock_after, unit_cost, notes)
         VALUES ($1, $2, 'purchase_void', 'purchase_void', $3, $4, $5, $6, $7)`,
        [
          uuidv4(),
          item.variant_id,
          purchaseId,
          -item.quantity,
          stockAfter,
          item.unit_cost,
          `Void purchase: ${voidReason}`,
        ]
      );
    }

    const totalAmount = Number(purchase.total_amount);
    const amountPaid = Number(purchase.amount_paid ?? 0);
    const creditDue = Math.max(0, totalAmount - amountPaid);

    if (purchase.party_id && creditDue > 0) {
      await addPartyLedgerEntryClient(client, {
        partyId: purchase.party_id,
        entryDate: todayISODate(),
        entryType: "purchase_void",
        amount: creditDue,
        referenceType: "purchase",
        referenceId: purchaseId,
        notes: `Void purchase: ${voidReason}`,
      });
    }

    if (amountPaid > 0) {
      const accountId = await resolveAccountIdForOutflowClient(
        client,
        purchase.account_id as string | null,
        amountPaid
      );
      if (accountId) {
        await addAccountLedgerEntryClient(client, {
          accountId,
          entryDate: todayISODate(),
          entryType: "purchase_void",
          amount: amountPaid,
          referenceType: "purchase",
          referenceId: purchaseId,
          notes: `Void purchase: ${voidReason}`,
        });
      }
    }

    await client.query(
      `UPDATE ${T.purchases} SET status = 'voided', voided_at = NOW(), void_reason = $1 WHERE id = $2`,
      [voidReason, purchaseId]
    );
  });
}
