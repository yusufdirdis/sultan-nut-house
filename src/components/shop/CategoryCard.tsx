import Link from "next/link";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";

export function CategoryCard({
  slug,
  name,
  imageUrl,
  hrefPrefix = "/collections",
}: {
  slug: string;
  name: string;
  imageUrl?: string | null;
  hrefPrefix?: string;
}) {
  return (
    <Link
      href={`${hrefPrefix}/${slug}`}
      className="group flex shrink-0 flex-col items-center gap-2 text-center"
      style={{ width: "6.5rem" }}
    >
      <div className="h-24 w-24 overflow-hidden rounded-full border border-line transition-shadow group-hover:shadow-md">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <span className="text-sm font-medium text-espresso">{name}</span>
    </Link>
  );
}
