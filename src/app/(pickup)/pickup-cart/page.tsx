import Link from "next/link";
import { getActiveCart, calculateCartSubtotal } from "@/server/services/cart-service";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatCents } from "@/lib/money";

export default async function PickupCartPage() {
  const cart = await getActiveCart("PICKUP");
  const items = cart?.items ?? [];
  const subtotalCents = cart ? calculateCartSubtotal(cart) : 0;

  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl text-espresso">Your pickup order</h1>
      <p className="mt-1 text-sm text-espresso-soft">Sultan Nut House — 1836 N University Dr, Plantation, FL 33322</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white p-10 text-center">
          <p className="text-espresso-soft">Your order is empty.</p>
          <Button href="/order" variant="brass" className="mt-6">
            Browse the menu
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                channel="PICKUP"
                item={{
                  id: item.id,
                  quantity: item.quantity,
                  unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
                  notes: item.notes,
                  productName: item.productVariant.product.name,
                  variantName: item.productVariant.name,
                  imageUrl: item.productVariant.product.images[0]?.url,
                  modifiers: item.modifiers.map((m) => ({
                    name: m.modifierOption.name,
                    priceDeltaCentsSnapshot: m.priceDeltaCentsSnapshot,
                  })),
                }}
              />
            ))}
            <Link href="/order" className="mt-6 inline-block text-sm font-medium text-brass hover:underline">
              &larr; Add more items
            </Link>
          </div>

          <div className="h-fit rounded-2xl border border-line bg-white p-6">
            <div className="flex items-center justify-between text-base">
              <span className="text-espresso-soft">Subtotal</span>
              <span className="font-medium text-espresso">{formatCents(subtotalCents)}</span>
            </div>
            <p className="mt-1 text-xs text-espresso-soft">Tax calculated at checkout.</p>
            <Button href="/pickup-checkout" variant="brass" size="lg" className="mt-6 w-full">
              Checkout
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
