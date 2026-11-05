import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { CategoryStrip } from "@/components/shop/CategoryStrip";

// Built on first visit and served from cache — refreshed at most hourly, and
// immediately on any admin catalog change (see revalidateStorefront).
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

async function getCategory(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  return { title: category.name, description: category.description ?? undefined };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const category = await getCategory(slug);
  if (!category || !category.isVisible) notFound();

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        categoryId: category.id,
        status: "ACTIVE",
        fulfillmentType: { in: ["SHIPPING_ONLY", "BOTH"] },
      },
      include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({ where: { kind: "SHOP", isVisible: true }, orderBy: { position: "asc" } }),
  ]);

  // The category's photo now belongs to its round button (CategoryStrip), so it's
  // no longer also stretched across the top of this page as a banner.
  return (
    <>
      <Container className="py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">Shop Sultan</p>
        <h1 className="font-display mt-3 text-4xl text-espresso">{category.name}</h1>
        {category.description && <p className="mt-3 max-w-2xl text-espresso-soft">{category.description}</p>}

        <div className="mt-10">
          <CategoryStrip categories={categories} activeSlug={category.slug} />
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {products.length === 0 && <p className="text-espresso-soft">No products in this category yet.</p>}
        </div>
      </Container>
    </>
  );
}
