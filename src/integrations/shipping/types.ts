export interface ShippingAddressInput {
  recipientName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface ParcelItem {
  weightGrams: number;
  quantity: number;
}

export interface ShippingRateOption {
  id: string;
  carrier: string;
  serviceName: string;
  amountCents: number;
  estimatedDays?: number;
}

export interface RateRequest {
  toAddress: ShippingAddressInput;
  items: ParcelItem[];
}

export interface LabelRequest {
  toAddress: ShippingAddressInput;
  rateId: string;
  carrier: string;
}

export interface ShippingLabel {
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl: string;
  carrier: string;
}

export interface TrackingStatus {
  status: string;
  trackingUrl?: string;
}

export interface ShippingProvider {
  getRates(input: RateRequest): Promise<ShippingRateOption[]>;
  createLabel(input: LabelRequest): Promise<ShippingLabel>;
  trackShipment?(trackingNumber: string, carrier: string): Promise<TrackingStatus>;
}
