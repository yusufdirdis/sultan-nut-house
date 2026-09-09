import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await db.category.findUnique({ where: { slug } });
  if (!category || !category.isVisible) notFound();

  const products = await db.product.findMany({
    where: {
      categoryId: category.id,
      status: "ACTIVE",
      fulfillmentType: { in: ["SHIPPING_ONLY", "BOTH"] },
    },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true },
    orderBy: { name: "asc" },
  });

  return (
    <Container className="py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Shop Sultan</p>
      <h1 className="font-display mt-3 text-4xl text-espresso">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-2xl text-espresso-soft">{category.description}</p>}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
        {products.length === 0 && <p className="text-espresso-soft">No products in this category yet.</p>}
      </div>
    </Container>
  );
}
