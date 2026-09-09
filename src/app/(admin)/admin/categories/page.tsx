import { listCategoriesForAdmin } from "@/server/actions/admin-product-actions";
import { CategoryManager } from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesForAdmin();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Categories</h1>
      <p className="mt-1 text-sm text-espresso-soft">Organize cafe menu items and shop products.</p>
      <div className="mt-8">
        <CategoryManager
          categories={categories.map((c) => ({
            id: c.id,
            kind: c.kind,
            slug: c.slug,
            name: c.name,
            description: c.description ?? "",
            isVisible: c.isVisible,
          }))}
        />
      </div>
    </div>
  );
}
