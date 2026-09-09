export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatCentsRange(min: number, max: number): string {
  return min === max ? formatCents(min) : `${formatCents(min)}–${formatCents(max)}`;
}
