"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { deleteCategory, moveCategory, saveCategory } from "@/server/actions/admin-category-actions";
import { uploadCategoryImageAction } from "@/server/actions/admin-upload-actions";
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

const emptyDraft: CategoryInput = {
  kind: "MENU",
  slug: "",
  name: "",
  description: "",
  imageUrl: "",
  position: 0,
  isVisible: true,
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<CategoryInput>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const menuCategories = categories.filter((c) => c.kind === "MENU").sort((a, b) => a.position - b.position);
  const shopCategories = categories.filter((c) => c.kind === "SHOP").sort((a, b) => a.position - b.position);

  function startEdit(category: Category) {
    setEditingId(category.id);
    setDraft(category);
    setError(null);
    setUploadError(null);
  }

  function resetForm() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
    setUploadError(null);
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

  async function handleMove(id: string, direction: "up" | "down") {
    await moveCategory(id, direction);
    router.refresh();
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadCategoryImageAction(formData);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!result.success || !result.url) {
      setUploadError(result.message ?? "Upload failed.");
      return;
    }

    setDraft((d) => ({ ...d, imageUrl: result.url }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        <CategoryList title="Cafe menu categories" categories={menuCategories} onEdit={startEdit} onDelete={handleDelete} onMove={handleMove} />
        <CategoryList title="Shop categories" categories={shopCategories} onEdit={startEdit} onDelete={handleDelete} onMove={handleMove} />
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

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-espresso" htmlFor="category-description">
              Description
            </label>
            <textarea
              id="category-description"
              rows={3}
              value={draft.description}
              onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
              className="rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base text-espresso outline-none focus:border-brass"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-espresso">Image</p>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                {draft.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileSelected}
                disabled={isUploading}
                className="hidden"
                id="category-image-upload"
              />
              <Button type="button" variant="outline" disabled={isUploading} className="disabled:opacity-60" onClick={() => fileInputRef.current?.click()}>
                {isUploading ? "Uploading…" : "Upload"}
              </Button>
              {draft.imageUrl && (
                <button type="button" onClick={() => setDraft((d) => ({ ...d, imageUrl: "" }))} className="text-sm text-red-600">
                  Remove
                </button>
              )}
            </div>
            {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
            <div className="mt-3">
              <TextField
                id="category-image-url"
                label="or paste an image URL"
                value={draft.imageUrl}
                onChange={(event) => setDraft((d) => ({ ...d, imageUrl: event.target.value }))}
              />
            </div>
          </div>

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
  onMove,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-5 py-3">
        <h2 className="font-display text-lg text-espresso">{title}</h2>
      </div>
      <ul className="divide-y divide-line">
        {categories.map((category, index) => (
          <li key={category.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                {category.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>
              <div>
                <p className="font-medium text-espresso">{category.name}</p>
                <p className="text-xs text-espresso-soft">
                  /{category.slug} {!category.isVisible && "· Hidden"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => onMove(category.id, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="text-espresso-soft hover:text-espresso disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => onMove(category.id, "down")}
                  disabled={index === categories.length - 1}
                  aria-label="Move down"
                  className="text-espresso-soft hover:text-espresso disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
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
