import { z } from "zod";

export const addToCartSchema = z.object({
  channel: z.enum(["PICKUP", "SHIPPING"]),
  productVariantId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  notes: z.string().trim().max(500).optional(),
  modifierOptionIds: z.array(z.string()).default([]),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
