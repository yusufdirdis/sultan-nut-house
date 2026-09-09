import "server-only";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  // Not thrown: this module is evaluated during `next build` (before env
  // vars are necessarily configured), and a missing key must not break the
  // build. Any real Stripe call made with the placeholder key below fails
  // cleanly at request time (401), which is surfaced to the customer as a
  // safe "we couldn't start checkout" message — see checkout-actions.ts.
  console.warn("[stripe] STRIPE_SECRET_KEY is not set — Stripe calls will fail until it's configured.");
}

// No explicit apiVersion pin: the installed SDK's default matches the
// version it was built against, and guessing a literal version string here
// risks pinning to one that doesn't exist for this SDK release.
export const stripe = new Stripe(secretKey ?? "sk_test_placeholder_key_not_configured");
