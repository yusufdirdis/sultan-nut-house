import Link from "next/link";
import { formatCentsRange } from "@/lib/money";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export interface ProductCardData {
  slug: string;
  name: string;
  images: { url: string; altText: string | null }[];
  variants: { priceCents: number }[];
}

export function ProductCard({ product, hrefPrefix = "/products" }: { product: ProductCardData; hrefPrefix?: string }) {
  const prices = product.variants.map((v) => v.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const image = product.images[0];

  return (
    <Link
      href={`${hrefPrefix}/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-espresso/5"
    >
      <div className="aspect-square w-full overflow-hidden bg-cream-deep">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText ?? product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="p-4">
        <p className="font-display text-lg text-espresso">{product.name}</p>
        <p className="mt-1 text-sm text-espresso-soft">{formatCentsRange(min, max)}</p>
      </div>
    </Link>
  );
}
