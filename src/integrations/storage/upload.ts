import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import convertHeic from "heic-convert";
import { getR2Client, isR2Configured } from "@/integrations/storage/r2-client";
import { AppError } from "@/lib/errors";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

// iPhones shoot HEIC/HEIF by default. Browsers are inconsistent about the
// MIME type they report for it (sometimes empty, sometimes
// application/octet-stream), so also check the filename.
const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

function isHeic(file: File): boolean {
  return HEIC_TYPES.has(file.type) || /\.hei[cf]$/i.test(file.name);
}

export { isR2Configured };

export async function uploadImage(file: File, folder: "products" | "categories" = "products"): Promise<{ url: string }> {
  if (!isR2Configured()) {
    throw new AppError("Image uploads aren't set up yet — paste an image URL instead.", "R2_NOT_CONFIGURED");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new AppError("Images must be under 8MB.", "FILE_TOO_LARGE");
  }

  let bytes = new Uint8Array(await file.arrayBuffer());
  let contentType = file.type;
  let extension = file.type.split("/")[1];

  if (isHeic(file)) {
    try {
      // sharp's prebuilt binary can't decode HEIC (HEVC decode is left out
      // of the default build for licensing reasons — only AVIF/AV1 stayed
      // in), so this narrow, purpose-built decoder handles just that case.
      const converted = await convertHeic({ buffer: bytes, format: "JPEG", quality: 0.9 });
      bytes = new Uint8Array(converted);
      contentType = "image/jpeg";
      extension = "jpg";
    } catch (error) {
      console.error("[upload] HEIC conversion failed", error);
      throw new AppError("We couldn't read that HEIC photo. Try exporting it as JPEG and uploading again.", "HEIC_CONVERSION_FAILED");
    }
  } else if (!ALLOWED_TYPES.has(file.type)) {
    throw new AppError("Please upload a JPEG, PNG, WebP, AVIF, or HEIC (iPhone photo) image.", "INVALID_FILE_TYPE");
  }

  const key = `${folder}/${randomUUID()}.${extension}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!publicBase) {
    throw new AppError("Image uploaded, but no public URL is configured (set R2_PUBLIC_BASE_URL).", "R2_PUBLIC_URL_MISSING");
  }

  return { url: `${publicBase}/${key}` };
}
