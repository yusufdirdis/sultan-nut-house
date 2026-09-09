"use server";

import { requireAdmin } from "@/lib/auth-guards";
import { uploadProductImage, isR2Configured } from "@/integrations/storage/upload";
import { toSafeError } from "@/lib/errors";

export interface UploadImageResult {
  success: boolean;
  url?: string;
  message?: string;
}

export async function uploadProductImageAction(formData: FormData): Promise<UploadImageResult> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, message: "No file provided." };
    }

    const { url } = await uploadProductImage(file);
    return { success: true, url };
  } catch (error) {
    const safeError = toSafeError(error, "We couldn't upload that image.");
    return { success: false, message: safeError.userMessage };
  }
}

export async function checkImageUploadAvailable(): Promise<boolean> {
  await requireAdmin();
  return isR2Configured();
}
