"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { advanceOrderStatus } from "@/server/actions/admin-order-actions";

const NEXT_LABEL: Record<string, string> = {
  PAID: "Confirm",
  CONFIRMED: "Start preparing",
  PREPARING: "Mark ready",
  READY_FOR_PICKUP: "Mark completed",
};

export function OrderStatusAdvanceButton({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const label = NEXT_LABEL[status];
  if (!label) return null;

  return (
    <Button
      type="button"
      size="md"
      variant="brass"
      disabled={isPending}
      className="disabled:opacity-60"
      onClick={() =>
        startTransition(async () => {
          await advanceOrderStatus(orderId, "PICKUP");
          router.refresh();
        })
      }
    >
      {isPending ? "Updating…" : label}
    </Button>
  );
}
