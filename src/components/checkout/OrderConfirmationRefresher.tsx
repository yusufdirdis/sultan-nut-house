"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * The success page can render a moment before the Stripe webhook has
 * finished marking the order PAID (payment already succeeded on Stripe's
 * side — our DB just hasn't caught up yet). Rather than leave the customer
 * staring at "Confirming your payment…" until they manually refresh, poll a
 * few times so the page updates itself once the webhook lands.
 */
export function OrderConfirmationRefresher({ isPaid }: { isPaid: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (isPaid) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      router.refresh();
      if (attempts >= 6) clearInterval(interval);
    }, 1500);

    return () => clearInterval(interval);
  }, [isPaid, router]);

  return null;
}
