import Link from "next/link";
import { listAdminProducts } from "@/server/actions/admin-product-actions";
import { Button } from "@/components/ui/Button";
import { ProductRowActions } from "@/components/admin/ProductRowActions";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-pistachio/15 text-pistachio",
  DRAFT: "bg-brass/15 text-brass",
  ARCHIVED: "bg-espresso/10 text-espresso-soft",
};

const fulfillmentLabels: Record<string, string> = {
  PICKUP_ONLY: "Pickup only",
  SHIPPING_ONLY: "Shipping only",
  BOTH: "Pickup + Shipping",
};

function formatPriceRange(variants: { priceCents: number }[]) {
  if (variants.length === 0) return "No variants";
  const prices = variants.map((v) => v.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const format = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  return min === max ? format(min) : `${format(min)}–${format(max)}`;
}

export default async function AdminProductsPage() {
  const products = await listAdminProducts();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-espresso">Products</h1>
          <p className="mt-1 text-sm text-espresso-soft">Cafe menu items and shippable goods, all in one place.</p>
        </div>
        <Button href="/admin/products/new" variant="brass">
          Add product
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-cream text-xs uppercase tracking-wide text-espresso-soft">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Fulfillment</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((product) => (
              <tr key={product.id} className="align-top">
                <td className="px-5 py-4">
                  <Link href={`/admin/products/${product.id}/edit`} className="font-medium text-espresso hover:text-brass">
                    {product.name}
                  </Link>
                  <p className="text-xs text-espresso-soft">/{product.slug}</p>
                </td>
                <td className="px-5 py-4 text-espresso-soft">{product.category?.name ?? "—"}</td>
                <td className="px-5 py-4 text-espresso-soft">{fulfillmentLabels[product.fulfillmentType]}</td>
                <td className="px-5 py-4 text-espresso-soft">{formatPriceRange(product.variants)}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[product.status]}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <ProductRowActions productId={product.id} status={product.status} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-espresso-soft">
                  No products yet.{" "}
                  <Link href="/admin/products/new" className="text-brass hover:underline">
                    Add your first one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
