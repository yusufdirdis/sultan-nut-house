"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { deleteCategory, saveCategory } from "@/server/actions/admin-category-actions";
import type { CategoryInput } from "@/validation/admin-category";

interface Category extends CategoryInput {
  id: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const emptyDraft: CategoryInput = { kind: "MENU", slug: "", name: "", description: "", isVisible: true };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<CategoryInput>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const menuCategories = categories.filter((c) => c.kind === "MENU");
  const shopCategories = categories.filter((c) => c.kind === "SHOP");

  function startEdit(category: Category) {
    setEditingId(category.id);
    setDraft(category);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    const result = await saveCategory({ ...draft, id: editingId ?? undefined });
    setIsSaving(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    resetForm();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const result = await deleteCategory(id);
    if (!result.success) alert(result.message);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        <CategoryList title="Cafe menu categories" categories={menuCategories} onEdit={startEdit} onDelete={handleDelete} />
        <CategoryList title="Shop categories" categories={shopCategories} onEdit={startEdit} onDelete={handleDelete} />
      </div>

      <div className="h-fit rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg text-espresso">{editingId ? "Edit category" : "Add category"}</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-espresso">Type</label>
            <select
              value={draft.kind}
              onChange={(event) => setDraft((d) => ({ ...d, kind: event.target.value as "MENU" | "SHOP" }))}
              className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
            >
              <option value="MENU">Cafe menu</option>
              <option value="SHOP">Shop</option>
            </select>
          </div>
          <TextField
            id="category-name"
            label="Name"
            value={draft.name}
            onChange={(event) => {
              const name = event.target.value;
              setDraft((d) => ({ ...d, name, slug: editingId ? d.slug : slugify(name) }));
            }}
          />
          <TextField
            id="category-slug"
            label="Slug"
            value={draft.slug}
            onChange={(event) => setDraft((d) => ({ ...d, slug: slugify(event.target.value) }))}
          />
          <label className="flex items-center gap-2 text-sm text-espresso-soft">
            <input
              type="checkbox"
              checked={draft.isVisible}
              onChange={(event) => setDraft((d) => ({ ...d, isVisible: event.target.checked }))}
            />
            Visible to customers
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="brass" onClick={handleSave} disabled={isSaving || !draft.name || !draft.slug}>
              {isSaving ? "Saving…" : editingId ? "Save" : "Add"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryList({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-5 py-3">
        <h2 className="font-display text-lg text-espresso">{title}</h2>
      </div>
      <ul className="divide-y divide-line">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="font-medium text-espresso">{category.name}</p>
              <p className="text-xs text-espresso-soft">
                /{category.slug} {!category.isVisible && "· Hidden"}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <button type="button" onClick={() => onEdit(category)} className="font-medium text-espresso-soft hover:text-espresso">
                Edit
              </button>
              <button type="button" onClick={() => onDelete(category.id)} className="font-medium text-red-600 hover:text-red-700">
                Delete
              </button>
            </div>
          </li>
        ))}
        {categories.length === 0 && <li className="px-5 py-6 text-sm text-espresso-soft">None yet.</li>}
      </ul>
    </div>
  );
}
