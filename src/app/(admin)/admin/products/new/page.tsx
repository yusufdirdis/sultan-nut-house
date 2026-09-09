import { listCategoriesForAdmin, listModifierGroupsForAdmin } from "@/server/actions/admin-product-actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, modifierGroups] = await Promise.all([listCategoriesForAdmin(), listModifierGroupsForAdmin()]);

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Add product</h1>
      <div className="mt-8">
        <ProductForm categories={categories} modifierGroups={modifierGroups} />
      </div>
    </div>
  );
}
