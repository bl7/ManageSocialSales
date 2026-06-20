"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveExpenseCategoryAction, deleteExpenseCategoryAction } from "@/actions/expense-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage, FormGroup, Label } from "@/components/ui/page";

export function ExpenseCategoryForm({ category }: { category?: { id: string; name: string } }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    if (category?.id) formData.set("category_id", category.id);
    const result = await saveExpenseCategoryAction(null, formData);
    if (result && "id" in result && result.success) {
      toast.success("Category saved");
      router.push("/settings?tab=expense-categories");
      return;
    }
    if (result && !result.success) { setError(result.error); setPending(false); }
  }

  async function handleDelete() {
    if (!category || !confirm(`Delete "${category.name}"?`)) return;
    const result = await deleteExpenseCategoryAction(category.id);
    if (result.success) {
      toast.success("Category deleted");
      router.push("/settings?tab=expense-categories");
    } else toast.error(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error && <ErrorMessage message={error} />}
      <FormGroup>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" required defaultValue={category?.name} />
      </FormGroup>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        {category && (
          <Button type="button" variant="outline" className="text-danger" onClick={handleDelete}>Delete</Button>
        )}
      </div>
    </form>
  );
}
