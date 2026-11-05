import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { isOptimizableImage } from "@/lib/images";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

interface CategoryCardProps {
  name: string;
  href: string;
  imageUrl?: string | null;
  /** Four or more photos shown as a collage instead of a single image — used by the "All" button. */
  mosaic?: string[];
  /** The category the visitor is currently viewing. */
  active?: boolean;
}

export function CategoryCard({ name, href, imageUrl, mosaic, active = false }: CategoryCardProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="group flex shrink-0 flex-col items-center gap-2 text-center"
      style={{ width: "6.5rem" }}
    >
      <div
        className={clsx(
          "relative h-24 w-24 overflow-hidden rounded-full border transition-shadow group-hover:shadow-md",
          active ? "border-brass ring-2 ring-brass ring-offset-2 ring-offset-cream" : "border-line",
        )}
      >
        {mosaic && mosaic.length >= 4 ? (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2">
            {mosaic.slice(0, 4).map((url) => (
              <div key={url} className="relative">
                <Image src={url} alt="" fill sizes="48px" unoptimized={!isOptimizableImage(url)} className="object-cover" />
              </div>
            ))}
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="96px"
            unoptimized={!isOptimizableImage(imageUrl)}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <span className={clsx("text-sm text-espresso", active ? "font-semibold" : "font-medium")}>{name}</span>
    </Link>
  );
}
