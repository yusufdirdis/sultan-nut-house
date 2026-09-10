const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-brass/15 text-brass",
  CONFIRMED: "bg-brass/15 text-brass",
  SUBMITTED_TO_TOAST: "bg-brass/15 text-brass",
  PREPARING: "bg-brass/15 text-brass",
  PROCESSING: "bg-brass/15 text-brass",
  PACKING: "bg-brass/15 text-brass",
  READY_FOR_PICKUP: "bg-pistachio/15 text-pistachio",
  SHIPPED: "bg-pistachio/15 text-pistachio",
  COMPLETED: "bg-pistachio/15 text-pistachio",
  DELIVERED: "bg-pistachio/15 text-pistachio",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-espresso/10 text-espresso-soft",
};

const STATUS_LABELS: Record<string, string> = {
  READY_FOR_PICKUP: "Ready for pickup",
  SUBMITTED_TO_TOAST: "Confirmed",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-cream-deep text-espresso-soft"}`}>
      {label}
    </span>
  );
}
