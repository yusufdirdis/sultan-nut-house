import { z } from "zod";

export const categoryInputSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["MENU", "SHOP"]),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  isVisible: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
