import type { NextConfig } from "next";

// Cafe pickup + delivery moved to Toast's own online ordering page — see
// src/lib/toast.ts. The in-house pickup ordering flow (built before that
// switch) is unlinked but still in the codebase; these redirects catch
// anyone hitting it directly (old bookmark, search engine) and send them
// to Toast instead. Not marked permanent so this stays easy to reverse.
const TOAST_ORDER_URL =
  "https://order.toasttab.com/online/sultan-nut-house-nuts-coffee-chocolates-more-1836-n-university-dr";

// Product and category photos live in Cloudflare R2 (src/integrations/storage/
// upload.ts writes to products/ and categories/). Allowing next/image to
// optimise them means a phone downloads a resized copy of each photo instead
// of the multi-megabyte original — the shop grid alone was ~70 MB before.
function r2ImagePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  try {
    const base = new URL(process.env.R2_PUBLIC_BASE_URL ?? "");
    const protocol = base.protocol === "http:" ? "http" : "https";
    return [
      { protocol, hostname: base.hostname, pathname: "/products/**" },
      { protocol, hostname: base.hostname, pathname: "/categories/**" },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: { remotePatterns: r2ImagePatterns() },
  experimental: {
    serverActions: {
      // Default is 1MB, too small for photo uploads (product/category
      // images go through a Server Action as FormData). Set comfortably
      // above the 8MB limit enforced in src/integrations/storage/upload.ts,
      // so that friendlier message is what a user actually sees.
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      { source: "/order", destination: TOAST_ORDER_URL, permanent: false },
      { source: "/order/:path*", destination: TOAST_ORDER_URL, permanent: false },
      { source: "/pickup-cart", destination: TOAST_ORDER_URL, permanent: false },
      { source: "/pickup-checkout", destination: TOAST_ORDER_URL, permanent: false },
      { source: "/pickup-checkout/:path*", destination: TOAST_ORDER_URL, permanent: false },
    ];
  },
};

export default nextConfig;
