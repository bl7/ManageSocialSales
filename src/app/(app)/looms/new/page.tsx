import { getProductCategories } from "@/lib/queries/categories";
import { ProductForm } from "@/components/forms/product-form";

export default async function NewProductPage() {
  const categories = await getProductCategories();
  return (
    <ProductForm
      categories={categories.map((c) => ({ id: c.id, label: c.name }))}
    />
  );
}
