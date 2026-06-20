import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Color is required"),
  default_cost_price: z.coerce.number().min(0, "Cost cannot be negative"),
  default_selling_price: z.coerce.number().min(0, "Price cannot be negative"),
  reorder_level: z.coerce.number().int().min(0, "Reorder level cannot be negative"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  description: z.string().optional(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

export const purchaseItemSchema = z.object({
  variant_id: z.string().uuid("Select a variant"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unit_cost: z.coerce.number().min(0, "Cost cannot be negative"),
});

export const purchaseSchema = z.object({
  purchase_date: z.string().min(1, "Date is required"),
  supplier: z.string().optional(),
  party_id: z.string().uuid().optional().or(z.literal("")),
  amount_paid: z.coerce.number().min(0).optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "Add at least one item"),
});

export const saleItemSchema = z.object({
  variant_id: z.string().uuid("Select a variant"),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unit_sale_price: z.coerce.number().min(0, "Price cannot be negative"),
});

export const saleSchema = z.object({
  sale_date: z.string().min(1, "Date is required"),
  platform: z.string().default("Instagram"),
  party_id: z.string().uuid().optional().or(z.literal("")),
  payment_method_id: z.string().uuid().optional().or(z.literal("")),
  delivery_charge: z.coerce.number().min(0, "Delivery charge cannot be negative").default(0),
  amount_paid: z.coerce.number().min(0).optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
});

export const salePaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const partySchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  party_type: z.enum(["customer", "supplier", "both"]),
  opening_balance: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  party_id: z.string().uuid("Select a party"),
  payment_date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  direction: z.enum(["received", "paid"]),
  payment_method: z.string().default("cash"),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  expense_date: z.string().min(1, "Date is required"),
  category_id: z.string().uuid("Select a category"),
  amount: z.coerce.number().positive("Amount must be positive"),
  party_id: z.string().uuid().optional().or(z.literal("")),
  payment_method: z.string().default("cash"),
  notes: z.string().optional(),
});

export const investmentSchema = z.object({
  investor_name: z.string().min(1, "Investor name is required"),
  investment_date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().optional(),
});

export const productCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
});

export const adjustmentSchema = z.object({
  adjustment_date: z.string().min(1, "Date is required"),
  variant_id: z.string().uuid("Select a variant"),
  quantity_change: z.coerce
    .number()
    .int()
    .refine((v) => v !== 0, "Quantity change cannot be zero"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

export const settingsSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  currency: z.string().min(1, "Currency is required"),
  low_stock_default: z.coerce.number().int().min(0),
  phone: z.string().optional(),
  address: z.string().optional(),
  business_email: z.string().email("Invalid email").optional().or(z.literal("")),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  invoice_prefix: z.string().optional(),
});

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(", ");
}
