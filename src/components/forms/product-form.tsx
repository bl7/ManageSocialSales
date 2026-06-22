"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveProductAction } from "@/actions/products";
import { quickCreateCategoryAction } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreatableSelect, type CreatableOption } from "@/components/ui/creatable-select";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

interface Variant {
  id?: string;
  size: string;
  color: string;
  default_cost_price: number;
  default_selling_price: number;
  reorder_level: number;
}

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    sku: string | null;
    category_id: string | null;
    brand: string | null;
    supplier: string | null;
    description: string | null;
  };
  variants?: Variant[];
  categories: CreatableOption[];
}

const emptyVariant = (): Variant => ({
  size: "",
  color: "",
  default_cost_price: 0,
  default_selling_price: 0,
  reorder_level: 5,
});

export function ProductForm({ product, variants: initialVariants, categories: initialCategories }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [categories, setCategories] = useState(initialCategories);
  const [variants, setVariants] = useState<Variant[]>(
    initialVariants?.length ? initialVariants : [emptyVariant()]
  );

  async function handleCreateCategory(name: string) {
    const result = await quickCreateCategoryAction(name);
    if ("success" in result && result.success === false) {
      toast.error(result.error);
      return null;
    }
    if ("id" in result) {
      toast.success(`Category "${result.name}" added`);
      return { id: result.id, label: result.name };
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("variants", JSON.stringify(variants));
    formData.set("category_id", categoryId);
    if (product?.id) formData.set("product_id", product.id);

    const result = await saveProductAction(null, formData);
    if (result && "id" in result && result.success) {
      toast.success("Product saved successfully");
      router.push(`/products/${result.id}?toast=product-saved`);
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(index: number) {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <PageHeader
        title={product ? "Edit Product" : "Add Product"}
        description="Product details and variants"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Product Details</h3>
          <FormGroup>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={product?.name} />
          </FormGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku || ""} />
            </FormGroup>
            <FormGroup>
              <Label>Category</Label>
              <CreatableSelect
                name="category_id"
                value={categoryId}
                onChange={setCategoryId}
                options={categories}
                onOptionsChange={setCategories}
                onCreate={handleCreateCategory}
                placeholder="Search or add category..."
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" defaultValue={product?.brand || ""} />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="supplier">Supplier</Label>
              <Input id="supplier" name="supplier" defaultValue={product?.supplier || ""} />
            </FormGroup>
          </div>
          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product?.description || ""} />
          </FormGroup>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Variants</h3>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>Add Variant</Button>
          </div>

          {variants.map((v, i) => (
            <div key={i} className="mb-4 rounded-lg border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Variant {i + 1}</span>
                {variants.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(i)}>Remove</Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormGroup>
                  <Label>Size *</Label>
                  <Input value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} required />
                </FormGroup>
                <FormGroup>
                  <Label>Color *</Label>
                  <Input value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} required />
                </FormGroup>
                <FormGroup>
                  <Label>Cost Price</Label>
                  <MoneyInput
                    value={v.default_cost_price}
                    onValueChange={(val) => updateVariant(i, "default_cost_price", val)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Selling Price</Label>
                  <MoneyInput
                    value={v.default_selling_price}
                    onValueChange={(val) => updateVariant(i, "default_selling_price", val)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Reorder Level</Label>
                  <Input type="number" min="0" value={v.reorder_level}
                    onChange={(e) => updateVariant(i, "reorder_level", parseInt(e.target.value) || 0)} />
                </FormGroup>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save Product"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
