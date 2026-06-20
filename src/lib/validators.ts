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
  category: z.string().optional(),
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
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Add at least one item"),
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
});

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(", ");
}
