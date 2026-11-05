import { CategoryCard } from "@/components/shop/CategoryCard";
import { ScrollingNav } from "@/components/shop/ScrollingNav";

interface CategoryStripProps {
  categories: { id: string; slug: string; name: string; imageUrl: string | null }[];
  /** Slug of the category being viewed; leave out on the main shop page, where "All" is the active one. */
  activeSlug?: string;
}

/**
 * The row of round category buttons. Shown on the main shop page *and* on each
 * category page, so it stays put while browsing between categories.
 */
export function CategoryStrip({ categories, activeSlug }: CategoryStripProps) {
  if (categories.length === 0) return null;

  const collage = categories.map((c) => c.imageUrl).filter((url): url is string => Boolean(url)).slice(0, 4);

  return (
    // Padding gives the active button's highlight ring room — the scroll container would clip it otherwise.
    <ScrollingNav aria-label="Shop categories" className="-mx-1.5 flex gap-5 overflow-x-auto px-1.5 py-1.5">
      <CategoryCard name="All" href="/shop" mosaic={collage} active={!activeSlug} />
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          name={category.name}
          href={`/collections/${category.slug}`}
          imageUrl={category.imageUrl}
          active={category.slug === activeSlug}
        />
      ))}
    </ScrollingNav>
  );
}
