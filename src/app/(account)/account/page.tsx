import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCents } from "@/lib/money";

const ADMIN_ROLES = ["MANAGER", "ADMIN", "SUPERADMIN"];

export default async function AccountOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isAdmin = ADMIN_ROLES.includes(session!.user.role);

  const [recentOrders, addressCount] = await Promise.all([
    db.order.findMany({
      where: { userId, status: { not: "PENDING_PAYMENT" } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.address.count({ where: { userId } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso">Welcome back{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>

      {isAdmin && (
        <Link
          href="/admin"
          className="mt-6 flex items-center justify-between rounded-2xl border border-brass/40 bg-brass/10 p-6 transition-shadow hover:shadow-md"
        >
          <div>
            <p className="font-display text-lg text-espresso">Admin panel</p>
            <p className="mt-1 text-sm text-espresso-soft">Manage products, categories, modifiers, and orders.</p>
          </div>
          <span className="text-brass">&rarr;</span>
        </Link>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-md">
          <p className="font-display text-lg text-espresso">Orders</p>
          <p className="mt-1 text-sm text-espresso-soft">
            {recentOrders.length === 0 ? "No orders yet" : `${recentOrders.length} recent order${recentOrders.length === 1 ? "" : "s"}`}
          </p>
        </Link>
        <Link href="/account/addresses" className="rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-md">
          <p className="font-display text-lg text-espresso">Addresses</p>
          <p className="mt-1 text-sm text-espresso-soft">{addressCount} saved</p>
        </Link>
      </div>

      {recentOrders.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-espresso">Recent orders</h2>
          <div className="mt-4 flex flex-col gap-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderNumber}`}
                className="flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4 hover:shadow-sm"
              >
                <div>
                  <p className="font-medium text-espresso">{order.orderNumber}</p>
                  <p className="text-sm text-espresso-soft">{order.fulfillmentType === "PICKUP" ? "Pickup" : "Shipping"} · {order.status}</p>
                </div>
                <p className="font-medium text-espresso">{formatCents(order.totalCents)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
