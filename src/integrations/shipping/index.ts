import "server-only";
import { flatRateProvider } from "@/integrations/shipping/flat-rate-provider";
import { shippoProvider } from "@/integrations/shipping/shippo-provider";
import type { ShippingProvider } from "@/integrations/shipping/types";

export function getShippingProvider(): ShippingProvider {
  if (process.env.SHIPPING_PROVIDER === "shippo" && process.env.SHIPPO_API_TOKEN) {
    return shippoProvider;
  }
  return flatRateProvider;
}

export type {
  ShippingAddressInput,
  ShippingProvider,
  ShippingRateOption,
  ShippingLabel,
  RateRequest,
  LabelRequest,
} from "@/integrations/shipping/types";
