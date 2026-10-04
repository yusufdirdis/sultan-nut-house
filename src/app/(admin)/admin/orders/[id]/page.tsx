import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/server/actions/admin-refund-actions";
import { formatCents } from "@/lib/money";
import { RefundForm } from "@/components/admin/RefundForm";

const NOT_REFUNDABLE_STATUSES = ["PENDING_PAYMENT", "CANCELLED", "REFUNDED"];

function formatDate(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const backHref = order.fulfillmentType === "PICKUP" ? "/admin/orders/pickup" : "/admin/orders/shipping";
  const address = order.shippingAddress;
  const phone = address?.phone ?? order.contactPhone;
  const shippingRefunded = order.refunds.some((refund) => refund.shippingCents > 0);

  let blockedReason: string | undefined;
  if (!order.stripePaymentIntentId) {
    blockedReason = "This order has no card payment on file, so there's nothing to refund from here.";
  } else if (order.status === "REFUNDED" || order.refundedCents >= order.totalCents) {
    blockedReason = "This order has been fully refunded.";
  } else if (NOT_REFUNDABLE_STATUSES.includes(order.status)) {
    blockedReason = "This order was never paid, so there's nothing to refund.";
  }

  return (
    <div className="max-w-3xl">
      <Link href={backHref} className="text-sm text-espresso-soft hover:text-espresso">
        ← Back to {order.fulfillmentType === "PICKUP" ? "pickup" : "shipping"} orders
      </Link>

      <h1 className="font-display mt-3 text-3xl text-espresso">
        {order.orderNumber}
        <span className="ml-3 align-middle rounded-full bg-cream-deep px-2.5 py-0.5 font-sans text-xs text-espresso-soft">{order.status}</span>
      </h1>
      <p className="mt-1 text-sm text-espresso-soft">Placed {formatDate(order.placedAt ?? order.createdAt)}</p>

      <section className="mt-8 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-xl text-espresso">Customer</h2>
        <p className="mt-2 text-sm text-espresso-soft">
          {order.contactEmail}
          {phone && <> · {phone}</>}
        </p>
        {address && (
          <p className="mt-1 text-sm text-espresso-soft">
            {address.recipientName}, {address.line1}
            {address.line2 && `, ${address.line2}`}, {address.city}, {address.state} {address.postalCode}
          </p>
        )}
        {order.shippingServiceName && <p className="mt-1 text-xs text-espresso-soft">Service: {order.shippingServiceName}</p>}
        {order.trackingNumber && (
          <p className="mt-1 text-xs text-espresso-soft">
            Tracking: {order.trackingCarrier} {order.trackingNumber}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-xl text-espresso">Payment</h2>
        <dl className="mt-3 flex flex-col gap-1.5 text-sm text-espresso-soft">
          <Row label="Subtotal" value={formatCents(order.subtotalCents)} />
          {order.taxCents > 0 && <Row label="Tax" value={formatCents(order.taxCents)} />}
          {order.shippingCents > 0 && <Row label="Shipping" value={formatCents(order.shippingCents)} />}
          <Row label="Total paid" value={formatCents(order.totalCents)} strong />
          {order.refundedCents > 0 && (
            <>
              <Row label="Refunded" value={`−${formatCents(order.refundedCents)}`} />
              <Row label="Net" value={formatCents(order.totalCents - order.refundedCents)} strong />
            </>
          )}
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-xl text-espresso">Refund</h2>
        <div className="mt-4">
          <RefundForm
            orderId={order.id}
            blockedReason={blockedReason}
            totals={{
              subtotalCents: order.subtotalCents,
              taxCents: order.taxCents,
              shippingCents: order.shippingCents,
              totalCents: order.totalCents,
              refundedCents: order.refundedCents,
              shippingRefunded,
            }}
            lines={order.items.map((item) => ({
              id: item.id,
              name: item.productNameSnapshot,
              variant: item.variantNameSnapshot,
              quantity: item.quantity,
              refundedQuantity: item.refundedQuantity,
              unitCents: item.unitPriceCentsSnapshot + item.modifiers.reduce((sum, m) => sum + m.priceDeltaCentsSnapshot, 0),
            }))}
          />
        </div>
      </section>

      {order.refunds.length > 0 && (
        <section className="mt-6 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-xl text-espresso">Refund history</h2>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {order.refunds.map((refund) => {
              const lines = Array.isArray(refund.lines) ? (refund.lines as { name: string; quantity: number }[]) : [];
              return (
                <li key={refund.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                  <div className="text-espresso-soft">
                    <p>{formatDate(refund.createdAt)}</p>
                    {lines.map((line, index) => (
                      <p key={index} className="text-xs">
                        {line.quantity}× {line.name}
                      </p>
                    ))}
                    {refund.shippingCents > 0 && <p className="text-xs">Shipping</p>}
                    {refund.note && <p className="text-xs italic">&ldquo;{refund.note}&rdquo;</p>}
                  </div>
                  <p className="font-medium text-espresso">{formatCents(refund.amountCents)}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-medium text-espresso" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
