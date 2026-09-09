import "server-only";
import { AppError } from "@/lib/errors";
import type { LabelRequest, RateRequest, ShippingLabel, ShippingProvider, ShippingRateOption } from "@/integrations/shipping/types";

const SHIPPO_BASE_URL = "https://api.goshippo.com";

// Sultan Nut House's own address — every shipment ships from here.
const SHIP_FROM_ADDRESS = {
  name: "Sultan Nut House",
  street1: "1836 N University Dr",
  city: "Plantation",
  state: "FL",
  zip: "33322",
  country: "US",
};

// No per-product dimensions are tracked yet, so every shipment uses this
// default box size; only the summed item weight varies. Revisit once
// products carry real package dimensions.
const DEFAULT_PARCEL = { length: "10", width: "8", height: "4", distance_unit: "in" as const };

function getApiToken(): string {
  const token = process.env.SHIPPO_API_TOKEN;
  if (!token) throw new AppError("Shipping rates aren't available right now.", "SHIPPO_NOT_CONFIGURED");
  return token;
}

async function shippoFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${SHIPPO_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${getApiToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[shippo] request failed", path, response.status, text);
    throw new AppError("We couldn't calculate shipping right now. Please try again.", "SHIPPO_REQUEST_FAILED");
  }

  return response.json() as Promise<T>;
}

interface ShippoRate {
  object_id: string;
  amount: string;
  provider: string;
  servicelevel: { name: string };
  estimated_days?: number;
}

interface ShippoShipmentResponse {
  rates: ShippoRate[];
  status: string;
}

interface ShippoTransactionResponse {
  status: string;
  tracking_number?: string;
  tracking_url_provider?: string;
  label_url?: string;
  messages?: { text: string }[];
}

function totalWeightGrams(items: RateRequest["items"]): number {
  const grams = items.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0);
  // Never quote a zero-weight parcel; floor at 100g.
  return Math.max(grams, 100);
}

export const shippoProvider: ShippingProvider = {
  async getRates(input: RateRequest): Promise<ShippingRateOption[]> {
    const shipment = await shippoFetch<ShippoShipmentResponse>("/shipments/", {
      address_from: SHIP_FROM_ADDRESS,
      address_to: {
        name: input.toAddress.recipientName,
        street1: input.toAddress.line1,
        street2: input.toAddress.line2,
        city: input.toAddress.city,
        state: input.toAddress.state,
        zip: input.toAddress.postalCode,
        country: input.toAddress.country,
        phone: input.toAddress.phone,
      },
      parcels: [{ ...DEFAULT_PARCEL, weight: String(totalWeightGrams(input.items)), mass_unit: "g" }],
      async: false,
    });

    return shipment.rates
      .map((rate) => ({
        id: rate.object_id,
        carrier: rate.provider,
        serviceName: rate.servicelevel.name,
        amountCents: Math.round(Number.parseFloat(rate.amount) * 100),
        estimatedDays: rate.estimated_days,
      }))
      .sort((a, b) => a.amountCents - b.amountCents);
  },

  async createLabel(input: LabelRequest): Promise<ShippingLabel> {
    const transaction = await shippoFetch<ShippoTransactionResponse>("/transactions/", {
      rate: input.rateId,
      label_file_type: "PDF",
      async: false,
    });

    if (transaction.status !== "SUCCESS" || !transaction.label_url || !transaction.tracking_number) {
      const reason = transaction.messages?.map((m) => m.text).join("; ");
      throw new AppError(`We couldn't purchase this shipping label${reason ? `: ${reason}` : "."}`, "LABEL_PURCHASE_FAILED");
    }

    return {
      trackingNumber: transaction.tracking_number,
      trackingUrl: transaction.tracking_url_provider,
      labelUrl: transaction.label_url,
      carrier: input.carrier,
    };
  },
};
