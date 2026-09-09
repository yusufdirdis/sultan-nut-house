import { randomBytes } from "node:crypto";

/** Short, human-readable, collision-resistant order number (not a DB id). */
export function generateOrderNumber(channel: "PICKUP" | "SHIPPING"): string {
  const prefix = channel === "PICKUP" ? "SNH-P" : "SNH-S";
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${suffix}`;
}
