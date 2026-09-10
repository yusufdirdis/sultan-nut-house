"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { saveProduct } from "@/server/actions/admin-product-actions";
import { uploadProductImageAction } from "@/server/actions/admin-upload-actions";
import type { ProductInput } from "@/validation/admin-product";

interface CategoryOption {
  id: string;
  name: string;
  kind: "MENU" | "SHOP";
}

interface ModifierGroupOption {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: CategoryOption[];
  modifierGroups: ModifierGroupOption[];
  initialProduct?: ProductInput & { id: string };
}

type VariantRow = ProductInput["variants"][number] & { priceDollars: string; compareAtDollars: string };
type ImageRow = ProductInput["images"][number];

function centsToDollars(cents: number | null | undefined) {
  return cents === null || cents === undefined ? "" : (cents / 100).toFixed(2);
}

function dollarsToCents(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function emptyVariant(isDefault: boolean): VariantRow {
  return { sku: "", name: "", priceCents: 0, priceDollars: "", compareAtDollars: "", isDefault, isAvailable: true };
}

export function ProductForm({ categories, modifierGroups, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState(initialProduct?.name ?? "");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [fulfillmentType, setFulfillmentType] = useState<ProductInput["fulfillmentType"]>(
    initialProduct?.fulfillmentType ?? "PICKUP_ONLY",
  );
  const [status, setStatus] = useState<ProductInput["status"]>(initialProduct?.status ?? "DRAFT");
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId ?? "");
  const [allergenInfo, setAllergenInfo] = useState(initialProduct?.allergenInfo ?? "");
  const [ingredients, setIngredients] = useState(initialProduct?.ingredients ?? "");
  const [storageInstructions, setStorageInstructions] = useState(initialProduct?.storageInstructions ?? "");

  const [variants, setVariants] = useState<VariantRow[]>(
    initialProduct && initialProduct.variants.length > 0
      ? initialProduct.variants.map((variant) => ({
          ...variant,
          priceDollars: centsToDollars(variant.priceCents),
          compareAtDollars: centsToDollars(variant.compareAtPriceCents),
        }))
      : [emptyVariant(true)],
  );

  const [images, setImages] = useState<ImageRow[]>(initialProduct?.images ?? []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedModifierGroupIds, setSelectedModifierGroupIds] = useState<string[]>(
    initialProduct?.modifierGroupIds ?? [],
  );

  const [formMessage, setStatusMessage] = useState<{ type: "idle" | "error" | "success"; message?: string }>({
    type: "idle",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const relevantModifierGroups = fulfillmentType === "SHIPPING_ONLY" ? [] : modifierGroups;

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function setDefaultVariant(index: number) {
    setVariants((rows) => rows.map((row, i) => ({ ...row, isDefault: i === index })));
  }

  function removeVariant(index: number) {
    setVariants((rows) => rows.filter((_, i) => i !== index));
  }

  function addVariant() {
    setVariants((rows) => [...rows, emptyVariant(rows.length === 0)]);
  }

  function updateImage(index: number, patch: Partial<ImageRow>) {
    setImages((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeImage(index: number) {
    setImages((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadProductImageAction(formData);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!result.success || !result.url) {
      setUploadError(result.message ?? "Upload failed.");
      return;
    }

    setImages((rows) => [...rows, { url: result.url!, altText: "" }]);
  }

  function toggleModifierGroup(id: string) {
    setSelectedModifierGroupIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage({ type: "idle" });

    const payload: ProductInput = {
      id: initialProduct?.id,
      slug,
      name,
      description,
      fulfillmentType,
      status,
      categoryId: categoryId || null,
      allergenInfo,
      ingredients,
      storageInstructions,
      variants: variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
        priceCents: dollarsToCents(variant.priceDollars),
        compareAtPriceCents: variant.compareAtDollars ? dollarsToCents(variant.compareAtDollars) : null,
        weightGrams: variant.weightGrams ?? null,
        isDefault: variant.isDefault,
        isAvailable: variant.isAvailable,
      })),
      images,
      modifierGroupIds: fulfillmentType === "SHIPPING_ONLY" ? [] : selectedModifierGroupIds,
    };

    const result = await saveProduct(payload);
    setIsSubmitting(false);

    if (!result.success) {
      setStatusMessage({ type: "error", message: result.message });
      return;
    }

    setStatusMessage({ type: "success", message: result.message });
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <section className="grid gap-5 rounded-2xl border border-line bg-white p-6 sm:grid-cols-2">
        <TextField
          id="product-name"
          label="Name"
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
        <TextField
          id="product-slug"
          label="Slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
        />

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-espresso" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base text-espresso outline-none focus:border-brass"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-espresso" htmlFor="fulfillmentType">
            Fulfillment
          </label>
          <select
            id="fulfillmentType"
            value={fulfillmentType}
            onChange={(event) => setFulfillmentType(event.target.value as ProductInput["fulfillmentType"])}
            className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
          >
            <option value="PICKUP_ONLY">Pickup only (cafe)</option>
            <option value="SHIPPING_ONLY">Shipping only (shop)</option>
            <option value="BOTH">Both pickup and shipping</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-espresso" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductInput["status"])}
            className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
          >
            <option value="DRAFT">Draft (hidden from customers)</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-espresso" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-12 rounded-xl border border-espresso/20 bg-white px-4 text-base text-espresso outline-none focus:border-brass"
          >
            <option value="">No category</option>
            <optgroup label="Cafe menu">
              {categories.filter((c) => c.kind === "MENU").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Shop">
              {categories.filter((c) => c.kind === "SHOP").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-espresso">Variants</h2>
          <Button type="button" variant="outline" onClick={addVariant}>
            Add variant
          </Button>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          {variants.map((variant, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <TextField
                  id={`variant-${index}-name`}
                  label="Variant name"
                  required
                  value={variant.name}
                  onChange={(event) => updateVariant(index, { name: event.target.value })}
                />
              </div>
              <TextField
                id={`variant-${index}-sku`}
                label="SKU"
                required
                value={variant.sku}
                onChange={(event) => updateVariant(index, { sku: event.target.value })}
              />
              <TextField
                id={`variant-${index}-price`}
                label="Price ($)"
                required
                inputMode="decimal"
                value={variant.priceDollars}
                onChange={(event) => updateVariant(index, { priceDollars: event.target.value })}
              />
              <TextField
                id={`variant-${index}-weight`}
                label="Weight (g)"
                inputMode="numeric"
                value={variant.weightGrams?.toString() ?? ""}
                onChange={(event) =>
                  updateVariant(index, { weightGrams: event.target.value ? Number(event.target.value) : null })
                }
              />
              <div className="flex items-end justify-between gap-2 sm:col-span-1">
                <label className="flex items-center gap-2 text-sm text-espresso-soft">
                  <input type="radio" name="defaultVariant" checked={variant.isDefault} onChange={() => setDefaultVariant(index)} />
                  Default
                </label>
              </div>
              <div className="flex items-center justify-between sm:col-span-6">
                <label className="flex items-center gap-2 text-sm text-espresso-soft">
                  <input
                    type="checkbox"
                    checked={variant.isAvailable}
                    onChange={(event) => updateVariant(index, { isAvailable: event.target.checked })}
                  />
                  Available for purchase
                </label>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(index)} className="text-sm font-medium text-red-600">
                    Remove variant
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-espresso">Images</h2>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileSelected}
              disabled={isUploading}
              className="hidden"
              id="image-upload-input"
            />
            <Button
              type="button"
              variant="brass"
              disabled={isUploading}
              className="disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? "Uploading…" : "Upload image"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setImages((rows) => [...rows, { url: "", altText: "" }])}>
              Add URL instead
            </Button>
          </div>
        </div>
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        <p className="mt-1 text-sm text-espresso-soft">
          Upload a file directly, or paste a hosted image URL (e.g. from the current site).
        </p>
        <div className="mt-5 flex flex-col gap-3">
          {images.map((image, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
              <TextField
                id={`image-${index}-url`}
                label="Image URL"
                required
                value={image.url}
                onChange={(event) => updateImage(index, { url: event.target.value })}
              />
              <TextField
                id={`image-${index}-alt`}
                label="Alt text"
                value={image.altText ?? ""}
                onChange={(event) => updateImage(index, { altText: event.target.value })}
              />
              <button type="button" onClick={() => removeImage(index)} className="h-12 text-sm font-medium text-red-600">
                Remove
              </button>
            </div>
          ))}
          {images.length === 0 && <p className="text-sm text-espresso-soft">No images yet.</p>}
        </div>
      </section>

      {fulfillmentType !== "SHIPPING_ONLY" && (
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl text-espresso">Modifiers</h2>
          <p className="mt-1 text-sm text-espresso-soft">
            Attach reusable modifier groups (size, milk, extras, etc). Manage the groups themselves under Modifiers.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {relevantModifierGroups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-espresso has-[:checked]:border-brass has-[:checked]:bg-brass/10"
              >
                <input
                  type="checkbox"
                  checked={selectedModifierGroupIds.includes(group.id)}
                  onChange={() => toggleModifierGroup(group.id)}
                />
                {group.name}
              </label>
            ))}
            {relevantModifierGroups.length === 0 && (
              <p className="text-sm text-espresso-soft">No modifier groups yet — create one under Modifiers.</p>
            )}
          </div>
        </section>
      )}

      {fulfillmentType !== "BOTH" && fulfillmentType === "PICKUP_ONLY" && (
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl text-espresso">Food information</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextareaField label="Ingredients" value={ingredients} onChange={setIngredients} />
            <TextareaField label="Allergen info" value={allergenInfo} onChange={setAllergenInfo} />
          </div>
        </section>
      )}

      {(fulfillmentType === "SHIPPING_ONLY" || fulfillmentType === "BOTH") && (
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl text-espresso">Shipping product information</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextareaField label="Ingredients" value={ingredients} onChange={setIngredients} />
            <TextareaField label="Allergen info" value={allergenInfo} onChange={setAllergenInfo} />
            <TextareaField label="Storage instructions" value={storageInstructions} onChange={setStorageInstructions} />
          </div>
        </section>
      )}

      {formMessage.type === "error" && <p className="text-sm text-red-600">{formMessage.message}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" variant="brass" disabled={isSubmitting} className="disabled:opacity-60">
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-espresso">{label}</label>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base text-espresso outline-none focus:border-brass"
      />
    </div>
  );
}
