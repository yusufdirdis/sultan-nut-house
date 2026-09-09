import { listPickupOrders } from "@/server/actions/admin-order-actions";
import { formatCents } from "@/lib/money";
import { OrderStatusAdvanceButton } from "@/components/admin/OrderStatusAdvanceButton";

export default async function AdminPickupOrdersPage() {
  const orders = await listPickupOrders();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Pickup orders</h1>
      <p className="mt-1 text-sm text-espresso-soft">
        Paid cafe orders. Toast integration isn&apos;t wired up yet, so update status here in the meantime.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5">
            <div>
              <p className="font-medium text-espresso">
                {order.orderNumber} <span className="ml-2 rounded-full bg-cream-deep px-2 py-0.5 text-xs text-espresso-soft">{order.status}</span>
              </p>
              <p className="mt-1 text-sm text-espresso-soft">
                {order.contactEmail} {order.contactPhone && `· ${order.contactPhone}`}
              </p>
              <ul className="mt-2 text-sm text-espresso-soft">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.productNameSnapshot} ({item.variantNameSnapshot})
                    {item.notes && <span className="italic"> — &ldquo;{item.notes}&rdquo;</span>}
                  </li>
                ))}
              </ul>
              {order.notes && <p className="mt-2 text-xs italic text-espresso-soft">Note: {order.notes}</p>}
            </div>

            <div className="flex flex-col items-end gap-3">
              <p className="font-medium text-espresso">{formatCents(order.totalCents)}</p>
              <OrderStatusAdvanceButton orderId={order.id} status={order.status} />
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-espresso-soft">No pickup orders yet.</p>}
      </div>
    </div>
  );
}
