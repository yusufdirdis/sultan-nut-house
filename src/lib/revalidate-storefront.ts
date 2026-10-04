import { revalidatePath } from "next/cache";

// /shop is prerendered from the catalog at build time (product and collection
// pages are dynamic and need nothing). Without this, a product or category
// changed in admin — including hiding one — wouldn't show up on the live shop
// grid until the next deploy.
export function revalidateStorefront() {
  revalidatePath("/shop");
}
