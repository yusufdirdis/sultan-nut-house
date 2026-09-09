import Link from "next/link";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";

export const metadata = { title: "Shop" };

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", fulfillmentType: { in: ["SHIPPING_ONLY", "BOTH"] } },
      include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({ where: { kind: "SHOP", isVisible: true }, orderBy: { position: "asc" } }),
  ]);

  return (
    <Container className="py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Shop Sultan</p>
        <h1 className="font-display mt-3 text-4xl text-espresso">Nuts, sweets &amp; specialty goods</h1>
        <p className="mt-3 text-espresso-soft">Packed fresh and shipped anywhere in the US.</p>
      </div>

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/collections/${category.slug}`}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-espresso-soft transition-colors hover:border-brass hover:text-espresso"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {products.length === 0 && <p className="text-espresso-soft">No products yet — check back soon.</p>}
      </div>
    </Container>
  );
}
