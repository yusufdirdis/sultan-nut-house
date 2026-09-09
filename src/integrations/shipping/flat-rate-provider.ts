import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { LabelRequest, RateRequest, ShippingLabel, ShippingProvider, ShippingRateOption } from "@/integrations/shipping/types";

/**
 * Launch-time fallback: admin-configured flat rates from the ShippingMethod
 * table. Used when no live carrier provider (Shippo) is configured, or as a
 * safety net if the live provider errors. Does not support real label
 * purchase — createLabel throws, directing the admin to enter tracking
 * manually until a real provider is wired in.
 */
export const flatRateProvider: ShippingProvider = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- interface requires this parameter
  async getRates(input: RateRequest): Promise<ShippingRateOption[]> {
    const methods = await db.shippingMethod.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });

    return methods.map((method) => ({
      id: method.id,
      carrier: method.carrier ?? "Standard",
      serviceName: method.name,
      amountCents: method.flatRateCents,
      estimatedDays: method.estimatedDaysMax ?? undefined,
    }));
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- interface requires this parameter
  async createLabel(input: LabelRequest): Promise<ShippingLabel> {
    throw new AppError(
      "Automatic label purchase isn't available with flat-rate shipping — enter the tracking number manually once you've shipped this order.",
      "LABEL_PURCHASE_UNAVAILABLE",
    );
  },
};
