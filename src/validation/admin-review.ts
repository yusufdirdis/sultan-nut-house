import { z } from "zod";

export const reviewInputSchema = z.object({
  id: z.string().optional(),
  authorName: z.string().trim().min(1, "Name is required"),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(1, "Review text is required").max(600),
  googleReviewUrl: z.string().trim().url("Enter a valid URL"),
  isVisible: z.boolean().default(true),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
