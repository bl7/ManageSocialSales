/** All Shree Inventory tables use the bij_ prefix (shared database). */
export const T = {
  appUser: "bij_app_user",
  products: "bij_products",
  productVariants: "bij_product_variants",
  purchases: "bij_purchases",
  purchaseItems: "bij_purchase_items",
  sales: "bij_sales",
  saleItems: "bij_sale_items",
  stockAdjustments: "bij_stock_adjustments",
  inventoryLedger: "bij_inventory_ledger",
  settings: "bij_settings",
} as const;
