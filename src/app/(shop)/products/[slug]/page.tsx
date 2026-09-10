import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/shop/ProductCard";
import { AddToCartForm } from "@/components/shop/AddToCartForm";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { formatCentsRange } from "@/lib/money";

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      category: true,
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description || undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || product.status !== "ACTIVE" || product.fulfillmentType === "PICKUP_ONLY") {
    notFound();
  }

  const relatedProducts = product.categoryId
    ? await db.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          status: "ACTIVE",
          fulfillmentType: { in: ["SHIPPING_ONLY", "BOTH"] },
        },
        include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true },
        take: 4,
      })
    : [];

  const prices = product.variants.map((v) => v.priceCents);

  return (
    <Container className="py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-cream-deep">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0].url} alt={product.images[0].altText ?? product.name} className="h-full w-full object-cover" />
            ) : (
              <ImagePlaceholder />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1).map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.id}
                  src={image.url}
                  alt={image.altText ?? product.name}
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">{product.category.name}</p>}
          <h1 className="font-display mt-3 text-4xl text-espresso">{product.name}</h1>
          <p className="mt-3 text-xl text-espresso-soft">{formatCentsRange(Math.min(...prices), Math.max(...prices))}</p>
          {product.description && <p className="mt-6 leading-relaxed text-espresso-soft">{product.description}</p>}

          <div className="mt-8">
            <AddToCartForm variants={product.variants} />
          </div>

          {(product.ingredients || product.allergenInfo || product.storageInstructions) && (
            <dl className="mt-10 space-y-4 border-t border-line pt-8 text-sm">
              {product.ingredients && (
                <div>
                  <dt className="font-medium text-espresso">Ingredients</dt>
                  <dd className="mt-1 text-espresso-soft">{product.ingredients}</dd>
                </div>
              )}
              {product.allergenInfo && (
                <div>
                  <dt className="font-medium text-espresso">Allergen info</dt>
                  <dd className="mt-1 text-espresso-soft">{product.allergenInfo}</dd>
                </div>
              )}
              {product.storageInstructions && (
                <div>
                  <dt className="font-medium text-espresso">Storage</dt>
                  <dd className="mt-1 text-espresso-soft">{product.storageInstructions}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl text-espresso">You may also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
