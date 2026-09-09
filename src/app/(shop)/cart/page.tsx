import Link from "next/link";
import { getActiveCart, calculateCartSubtotal } from "@/server/services/cart-service";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatCents } from "@/lib/money";

export default async function ShippingCartPage() {
  const cart = await getActiveCart("SHIPPING");
  const items = cart?.items ?? [];
  const subtotalCents = cart ? calculateCartSubtotal(cart) : 0;

  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl text-espresso">Your cart</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-white p-10 text-center">
          <p className="text-espresso-soft">Your cart is empty.</p>
          <Button href="/shop" variant="brass" className="mt-6">
            Continue shopping
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                channel="SHIPPING"
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
            <Link href="/shop" className="mt-6 inline-block text-sm font-medium text-brass hover:underline">
              &larr; Continue shopping
            </Link>
          </div>

          <div className="h-fit rounded-2xl border border-line bg-white p-6">
            <div className="flex items-center justify-between text-base">
              <span className="text-espresso-soft">Subtotal</span>
              <span className="font-medium text-espresso">{formatCents(subtotalCents)}</span>
            </div>
            <p className="mt-1 text-xs text-espresso-soft">Shipping and tax calculated at checkout.</p>
            <Button href="/checkout" variant="brass" size="lg" className="mt-6 w-full">
              Checkout
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
