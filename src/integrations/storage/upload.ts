import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, isR2Configured } from "@/integrations/storage/r2-client";
import { AppError } from "@/lib/errors";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

export { isR2Configured };

export async function uploadImage(file: File, folder: "products" | "categories" = "products"): Promise<{ url: string }> {
  if (!isR2Configured()) {
    throw new AppError("Image uploads aren't set up yet — paste an image URL instead.", "R2_NOT_CONFIGURED");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new AppError("Please upload a JPEG, PNG, WebP, or AVIF image.", "INVALID_FILE_TYPE");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new AppError("Images must be under 8MB.", "FILE_TOO_LARGE");
  }

  const extension = file.type.split("/")[1];
  const key = `${folder}/${randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!publicBase) {
    throw new AppError("Image uploaded, but no public URL is configured (set R2_PUBLIC_BASE_URL).", "R2_PUBLIC_URL_MISSING");
  }

  return { url: `${publicBase}/${key}` };
}
