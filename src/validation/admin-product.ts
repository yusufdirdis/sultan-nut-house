import { z } from "zod";

export const productVariantInputSchema = z.object({
  id: z.string().optional(),
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Variant name is required"),
  priceCents: z.number().int().min(0, "Price can't be negative"),
  compareAtPriceCents: z.number().int().min(0).nullable().optional(),
  weightGrams: z.number().int().min(0).nullable().optional(),
  isDefault: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

export const productImageInputSchema = z.object({
  id: z.string().optional(),
  url: z.string().trim().url("Enter a valid image URL"),
  altText: z.string().trim().optional(),
});

export const productInputSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  fulfillmentType: z.enum(["PICKUP_ONLY", "SHIPPING_ONLY", "BOTH"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  categoryId: z.string().nullable().optional(),
  allergenInfo: z.string().trim().optional(),
  ingredients: z.string().trim().optional(),
  storageInstructions: z.string().trim().optional(),
  variants: z.array(productVariantInputSchema).min(1, "Add at least one variant"),
  images: z.array(productImageInputSchema).default([]),
  modifierGroupIds: z.array(z.string()).default([]),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type ProductImageInput = z.infer<typeof productImageInputSchema>;
