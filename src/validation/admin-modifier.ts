import { z } from "zod";

export const modifierOptionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Option name is required"),
  priceDeltaCents: z.number().int().default(0),
  isDefault: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

export const modifierGroupInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, "Name is required"),
    selectionType: z.enum(["SINGLE", "MULTI"]),
    minSelect: z.number().int().min(0),
    maxSelect: z.number().int().min(1),
    required: z.boolean().default(false),
    options: z.array(modifierOptionInputSchema).min(1, "Add at least one option"),
  })
  .refine((group) => group.maxSelect >= group.minSelect, {
    message: "Max selections must be at least min selections",
    path: ["maxSelect"],
  })
  .refine((group) => group.selectionType !== "SINGLE" || group.maxSelect <= 1, {
    message: "A single-select group can't allow more than 1 selection",
    path: ["maxSelect"],
  });

export type ModifierGroupInput = z.infer<typeof modifierGroupInputSchema>;
export type ModifierOptionInput = z.infer<typeof modifierOptionInputSchema>;
