import { listShippingOrders } from "@/server/actions/admin-order-actions";
import { formatCents } from "@/lib/money";
import { ShippingOrderActions } from "@/components/admin/ShippingOrderActions";

export default async function AdminShippingOrdersPage() {
  const orders = await listShippingOrders();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Shipping orders</h1>
      <p className="mt-1 text-sm text-espresso-soft">Paid orders ready to pack and ship.</p>

      <div className="mt-8 flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-espresso">
                  {order.orderNumber} <span className="ml-2 rounded-full bg-cream-deep px-2 py-0.5 text-xs text-espresso-soft">{order.status}</span>
                </p>
                <p className="mt-1 text-sm text-espresso-soft">{order.contactEmail}</p>
                {order.shippingAddress && (
                  <p className="mt-1 text-sm text-espresso-soft">
                    {order.shippingAddress.recipientName}, {order.shippingAddress.line1}, {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                )}
                <ul className="mt-2 text-sm text-espresso-soft">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.productNameSnapshot} ({item.variantNameSnapshot})
                    </li>
                  ))}
                </ul>
                {order.shippingServiceName && <p className="mt-2 text-xs text-espresso-soft">Service: {order.shippingServiceName}</p>}
                {order.trackingNumber && (
                  <p className="mt-1 text-xs text-espresso-soft">
                    Tracking: {order.trackingCarrier} {order.trackingNumber}
                    {order.labelUrl && (
                      <>
                        {" "}
                        ·{" "}
                        <a href={order.labelUrl} target="_blank" rel="noreferrer" className="text-brass hover:underline">
                          Download label
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <p className="font-medium text-espresso">{formatCents(order.totalCents)}</p>
                {order.status === "PAID" && (
                  <ShippingOrderActions orderId={order.id} hasRate={Boolean(order.shippoRateId)} alreadyLabeled={Boolean(order.labelUrl)} />
                )}
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-espresso-soft">No shipping orders yet.</p>}
      </div>
    </div>
  );
}
