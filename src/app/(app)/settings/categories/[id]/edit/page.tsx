import { notFound } from "next/navigation";
import { getCategoryById, getCategoryProductCount } from "@/lib/queries/categories";
import { CategoryForm } from "@/components/forms/category-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSettingsCategoryPage({ params }: Props) {
  const { id } = await params;
  const [category, productCount] = await Promise.all([
    getCategoryById(id),
    getCategoryProductCount(id),
  ]);
  if (!category || !category.is_active) notFound();
  return (
    <CategoryForm category={{ id: category.id, name: category.name }} productCount={productCount} />
  );
}
