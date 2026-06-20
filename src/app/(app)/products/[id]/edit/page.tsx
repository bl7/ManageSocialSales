import { notFound } from "next/navigation";
import { getProductById, getProductVariants } from "@/lib/queries/products";
import { ProductForm } from "@/components/forms/product-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, variants] = await Promise.all([
    getProductById(id),
    getProductVariants(id, false),
  ]);

  if (!product) notFound();

  const p = product as Record<string, unknown>;

  return (
    <ProductForm
      product={{
        id: p.id as string,
        name: p.name as string,
        sku: p.sku as string | null,
        category: p.category as string | null,
        brand: p.brand as string | null,
        supplier: p.supplier as string | null,
        description: p.description as string | null,
      }}
      variants={variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        default_cost_price: parseFloat(v.default_cost_price),
        default_selling_price: parseFloat(v.default_selling_price),
        reorder_level: v.reorder_level,
      }))}
    />
  );
}
