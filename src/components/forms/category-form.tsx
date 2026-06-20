"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCategoryAction, deleteCategoryAction } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, ErrorMessage, FormGroup, Label } from "@/components/ui/page";

interface CategoryFormProps {
  category?: { id: string; name: string };
  productCount?: number;
}

export function CategoryForm({ category, productCount = 0 }: CategoryFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (category?.id) formData.set("category_id", category.id);

    const result = await saveCategoryAction(null, formData);
    if (result && "id" in result && result.success) {
      toast.success("Category saved");
      router.push("/settings?tab=categories");
      return;
    }
    if (result && !result.success) {
      setError(result.error);
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!category || !confirm(`Delete "${category.name}"? Products will be uncategorized.`)) return;
    setDeleting(true);
    const result = await deleteCategoryAction(category.id);
    if (result.success) {
      toast.success("Category deleted");
      router.push("/settings?tab=categories");
      return;
    }
    toast.error(result.error);
    setDeleting(false);
  }

  return (
    <div>
      <PageHeader
        title={category ? "Edit Category" : "Add Category"}
        description="Product categories for clothing"
      />

      <form onSubmit={handleSubmit} className="max-w-lg">
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        <fieldset disabled={pending || deleting} className="rounded-xl border border-border bg-card p-5 space-y-4 disabled:opacity-60">
          <FormGroup>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={category?.name} />
          </FormGroup>
          {category && productCount > 0 && (
            <p className="text-sm text-muted">{productCount} product(s) use this category.</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit">{pending ? "Saving..." : "Save Category"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            {category && (
              <Button type="button" variant="outline" className="text-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </div>
  );
}
