import Link from "next/link";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Order Pickup" };

export default async function OrderMenuPage() {
  const categories = await db.category.findMany({
    where: {
      kind: "MENU",
      isVisible: true,
      products: { some: { status: "ACTIVE", fulfillmentType: { in: ["PICKUP_ONLY", "BOTH"] } } },
    },
    include: {
      products: {
        where: { status: "ACTIVE", fulfillmentType: { in: ["PICKUP_ONLY", "BOTH"] } },
        include: { variants: true, images: { take: 1, orderBy: { position: "asc" } } },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });

  return (
    <Container className="py-12">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Order ahead</p>
        <h1 className="font-display mt-3 text-4xl text-espresso">Pickup at Plantation</h1>
        <p className="mt-3 text-espresso-soft">1836 N University Dr, Plantation, FL 33322 — ready when you arrive.</p>
      </div>

      <div className="mt-10 flex flex-col gap-14">
        {categories.map((category) => (
          <section key={category.id} id={category.slug}>
            <h2 className="font-display text-2xl text-espresso">{category.name}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.products.map((product) => {
                const prices = product.variants.map((v) => v.priceCents);
                return (
                  <Link
                    key={product.id}
                    href={`/order/item/${product.slug}`}
                    className="flex gap-4 rounded-2xl border border-line bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                      {product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-espresso">{product.name}</p>
                      {product.description && <p className="mt-1 line-clamp-2 text-sm text-espresso-soft">{product.description}</p>}
                      <p className="mt-1 text-sm font-medium text-brass">
                        {prices.length > 0 && `$${(Math.min(...prices) / 100).toFixed(2)}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
        {categories.length === 0 && <p className="text-espresso-soft">The menu is being updated — check back soon.</p>}
      </div>
    </Container>
  );
}
