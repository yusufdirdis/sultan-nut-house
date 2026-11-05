import Image from "next/image";
import Link from "next/link";
import { formatCentsRange } from "@/lib/money";
import { isOptimizableImage } from "@/lib/images";
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
      <div className="relative aspect-square w-full overflow-hidden bg-cream-deep">
        {image ? (
          // Resized and lazy-loaded: the originals are ~0.75 MB each (up to 2.9 MB) and
          // the shop grid shows ~100 of them. `sizes` matches the grid's column widths.
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={!isOptimizableImage(image.url)}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
