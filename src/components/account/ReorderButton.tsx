"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { reorder } from "@/server/actions/account-actions";

export function ReorderButton({ orderNumber, cartHref }: { orderNumber: string; cartHref: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleReorder() {
    setIsPending(true);
    setMessage(null);
    const result = await reorder(orderNumber);
    setIsPending(false);

    if (!result.success) {
      setMessage(result.message ?? "We couldn't reorder this.");
      return;
    }

    router.push(cartHref);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="brass" disabled={isPending} onClick={handleReorder} className="disabled:opacity-60">
        {isPending ? "Adding to cart…" : "Reorder"}
      </Button>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
