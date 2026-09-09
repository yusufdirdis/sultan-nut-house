import { notFound } from "next/navigation";
import {
  getAdminProduct,
  listCategoriesForAdmin,
  listModifierGroupsForAdmin,
} from "@/server/actions/admin-product-actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, modifierGroups] = await Promise.all([
    getAdminProduct(id),
    listCategoriesForAdmin(),
    listModifierGroupsForAdmin(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Edit {product.name}</h1>
      <div className="mt-8">
        <ProductForm
          categories={categories}
          modifierGroups={modifierGroups}
          initialProduct={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            description: product.description ?? "",
            fulfillmentType: product.fulfillmentType,
            status: product.status,
            categoryId: product.categoryId,
            allergenInfo: product.allergenInfo ?? "",
            ingredients: product.ingredients ?? "",
            storageInstructions: product.storageInstructions ?? "",
            variants: product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              name: variant.name,
              priceCents: variant.priceCents,
              compareAtPriceCents: variant.compareAtPriceCents,
              weightGrams: variant.weightGrams,
              isDefault: variant.isDefault,
              isAvailable: variant.isAvailable,
            })),
            images: product.images.map((image) => ({ id: image.id, url: image.url, altText: image.altText ?? "" })),
            modifierGroupIds: product.modifierGroups.map((link) => link.modifierGroupId),
          }}
        />
      </div>
    </div>
  );
}
