/**
 * True for photos hosted in our own R2 bucket — the only images next/image is
 * allowed to optimise (see images.remotePatterns in next.config.ts, which
 * mirrors this). Anything else, e.g. a product image added by pasting a URL
 * from another site, has to be shown as-is: asking the optimiser for a host it
 * isn't configured for gives a broken image.
 */
export function isOptimizableImage(url: string): boolean {
  try {
    const base = new URL(process.env.R2_PUBLIC_BASE_URL ?? "");
    const image = new URL(url);
    return image.hostname === base.hostname && (image.pathname.startsWith("/products/") || image.pathname.startsWith("/categories/"));
  } catch {
    return false;
  }
}
