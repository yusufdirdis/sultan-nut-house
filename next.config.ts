import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, too small for photo uploads (product/category
      // images go through a Server Action as FormData). Set comfortably
      // above the 8MB limit enforced in src/integrations/storage/upload.ts,
      // so that friendlier message is what a user actually sees.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
