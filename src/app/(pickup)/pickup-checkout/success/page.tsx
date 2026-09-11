import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { OrderConfirmationRefresher } from "@/components/checkout/OrderConfirmationRefresher";
import { formatCents } from "@/lib/money";

export default async function PickupCheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await db.order.findUnique({ where: { orderNumber } }) : null;

  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16 text-center">
      <OrderConfirmationRefresher isPaid={order?.status === "PAID"} />
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brass">
          {order?.status === "PAID" ? "Order confirmed" : "Almost there"}
        </p>
        <h1 className="font-display mt-4 text-3xl text-espresso">
          {order?.status === "PAID" ? "We'll see you soon" : "Confirming your payment…"}
        </h1>
        {order ? (
          <>
            <p className="mt-4 text-espresso-soft">
              Order <span className="font-medium text-espresso">{order.orderNumber}</span> — {formatCents(order.totalCents)}
            </p>
            <p className="mt-2 text-sm text-espresso-soft">
              Pickup at Sultan Nut House, 1836 N University Dr, Plantation, FL 33322. A confirmation email is on its way to{" "}
              {order.contactEmail}.
            </p>
          </>
        ) : (
          <p className="mt-4 text-espresso-soft">We couldn&apos;t find that order — check your email for confirmation.</p>
        )}
        <Button href="/order" variant="brass" className="mt-8">
          Order more
        </Button>
      </div>
    </Container>
  );
}
