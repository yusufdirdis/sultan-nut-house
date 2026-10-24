import { revalidatePath } from "next/cache";

// The storefront's catalog pages are cached rather than rebuilt per request
// (/shop at build time; product and collection pages on first visit). Without
// this, a product or category changed in admin — including hiding one —
// wouldn't show up on the live site until the cache expired or the next
// deploy.
export function revalidateStorefront() {
  revalidatePath("/shop");
  revalidatePath("/(shop)/products/[slug]", "page");
  revalidatePath("/(shop)/collections/[slug]", "page");
}
