import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { ItemCustomizer } from "@/components/cafe/ItemCustomizer";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

async function getMenuItem(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      modifierGroups: {
        orderBy: { position: "asc" },
        include: { modifierGroup: { include: { options: { orderBy: { position: "asc" } } } } },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getMenuItem(slug);
  if (!product) return {};
  return { title: product.seoTitle || product.name, description: product.seoDescription || product.description || undefined };
}

export default async function MenuItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getMenuItem(slug);

  if (!product || product.status !== "ACTIVE" || product.fulfillmentType === "SHIPPING_ONLY") {
    notFound();
  }

  return (
    <Container className="py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-cream-deep">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0].url} alt={product.images[0].altText ?? product.name} className="h-full w-full object-cover" />
          ) : (
            <ImagePlaceholder />
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl text-espresso">{product.name}</h1>
          {product.description && <p className="mt-3 leading-relaxed text-espresso-soft">{product.description}</p>}

          <div className="mt-8">
            <ItemCustomizer
              variants={product.variants}
              modifierGroups={product.modifierGroups.map((link) => link.modifierGroup)}
            />
          </div>

          {(product.ingredients || product.allergenInfo) && (
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
            </dl>
          )}
        </div>
      </div>
    </Container>
  );
}
