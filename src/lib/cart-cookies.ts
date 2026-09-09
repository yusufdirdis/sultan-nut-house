import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import type { FulfillmentChannel } from "@/generated/prisma/enums";

const COOKIE_NAMES: Record<FulfillmentChannel, string> = {
  PICKUP: "sultan_pickup_cart",
  SHIPPING: "sultan_shipping_cart",
};

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function readGuestCartToken(channel: FulfillmentChannel): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAMES[channel])?.value;
}

/** Only callable from a Server Action / Route Handler, not during RSC render. */
export async function issueGuestCartToken(channel: FulfillmentChannel): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(COOKIE_NAMES[channel], token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return token;
}

export async function clearGuestCartToken(channel: FulfillmentChannel): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAMES[channel]);
}
