import { notFound } from "next/navigation";
import Link from "next/link";
import { getMyOrder } from "@/server/actions/account-actions";
import { formatCents } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { ReorderButton } from "@/components/account/ReorderButton";

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await getMyOrder(orderNumber);

  if (!order) notFound();

  return (
    <div>
      <Link href="/account/orders" className="text-sm font-medium text-brass hover:underline">
        &larr; Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-espresso">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-espresso-soft">
            {order.fulfillmentType === "PICKUP" ? "Pickup at Sultan Nut House" : "Shipping"} ·{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <ReorderButton orderNumber={order.orderNumber} cartHref={order.fulfillmentType === "PICKUP" ? "/pickup-cart" : "/cart"} />
      </div>

      {order.fulfillmentType === "SHIPPING" && order.trackingNumber && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-medium text-espresso">Tracking</p>
          <p className="mt-1 text-sm text-espresso-soft">
            {order.trackingCarrier} {order.trackingNumber}
          </p>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-brass hover:underline">
              Track shipment
            </a>
          )}
        </div>
      )}

      {order.fulfillmentType === "SHIPPING" && order.shippingAddress && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-5">
          <p className="text-sm font-medium text-espresso">Shipping to</p>
          <p className="mt-1 text-sm text-espresso-soft">
            {order.shippingAddress.recipientName}, {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}, {order.shippingAddress.city},{" "}
            {order.shippingAddress.state} {order.shippingAddress.postalCode}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-white p-5">
        <p className="text-sm font-medium text-espresso">Items</p>
        <ul className="mt-3 flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="text-espresso">
                  {item.quantity}× {item.productNameSnapshot} ({item.variantNameSnapshot})
                </p>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-espresso-soft">{item.modifiers.map((m) => m.modifierOptionNameSnapshot).join(", ")}</p>
                )}
                {item.notes && <p className="text-xs italic text-espresso-soft">&ldquo;{item.notes}&rdquo;</p>}
              </div>
              <p className="text-espresso">
                {formatCents(
                  (item.unitPriceCentsSnapshot + item.modifiers.reduce((s, m) => s + m.priceDeltaCentsSnapshot, 0)) * item.quantity,
                )}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-espresso-soft">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-espresso-soft">
            <span>Tax</span>
            <span>{formatCents(order.taxCents)}</span>
          </div>
          {order.shippingCents > 0 && (
            <div className="flex justify-between text-espresso-soft">
              <span>Shipping</span>
              <span>{formatCents(order.shippingCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-medium text-espresso">
            <span>Total</span>
            <span>{formatCents(order.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
