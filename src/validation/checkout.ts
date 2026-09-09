import { z } from "zod";

export const shippingAddressSchema = z.object({
  recipientName: z.string().trim().min(1, "Name is required"),
  line1: z.string().trim().min(1, "Address is required"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().length(2, "Use a 2-letter state code"),
  postalCode: z.string().trim().min(3, "Enter a valid ZIP code"),
  country: z.string().trim().default("US"),
  phone: z.string().trim().optional(),
});

export const quoteShippingSchema = z.object({
  shippingAddress: shippingAddressSchema,
});

export const startShippingCheckoutSchema = z.object({
  contactEmail: z.string().trim().toLowerCase().email(),
  shippingAddress: shippingAddressSchema,
  rateId: z.string().min(1),
  carrier: z.string().min(1),
  serviceName: z.string().min(1),
  amountCents: z.number().int().min(0),
});

export const startPickupCheckoutSchema = z.object({
  contactEmail: z.string().trim().toLowerCase().email(),
  contactName: z.string().trim().min(1, "Name is required"),
  contactPhone: z.string().trim().min(7, "Enter a valid phone number"),
  notes: z.string().trim().max(300).optional(),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type StartShippingCheckoutInput = z.infer<typeof startShippingCheckoutSchema>;
export type StartPickupCheckoutInput = z.infer<typeof startPickupCheckoutSchema>;
