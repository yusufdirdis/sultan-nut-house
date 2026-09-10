import Link from "next/link";
import { listMyOrders } from "@/server/actions/account-actions";
import { formatCents } from "@/lib/money";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";

export default async function AccountOrdersPage() {
  const orders = await listMyOrders();

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Orders</h1>

      <div className="mt-8 flex flex-col gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.orderNumber}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-5 py-4 transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex items-center gap-3">
                <p className="font-medium text-espresso">{order.orderNumber}</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-espresso-soft">
                {order.fulfillmentType === "PICKUP" ? "Pickup" : "Shipping"} · {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <p className="font-medium text-espresso">{formatCents(order.totalCents)}</p>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-espresso-soft">No orders yet.</p>}
      </div>
    </div>
  );
}
