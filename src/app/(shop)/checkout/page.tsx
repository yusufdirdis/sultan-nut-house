import { redirect } from "next/navigation";
import { getActiveCart, calculateCartSubtotal } from "@/server/services/cart-service";
import { Container } from "@/components/ui/Container";
import { ShippingCheckoutForm } from "@/components/checkout/ShippingCheckoutForm";
import { formatCents } from "@/lib/money";

export default async function CheckoutPage() {
  const cart = await getActiveCart("SHIPPING");

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const subtotalCents = calculateCartSubtotal(cart);

  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl text-espresso">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-white p-6">
          <ShippingCheckoutForm subtotalCents={subtotalCents} />
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white p-6">
          <p className="font-display text-lg text-espresso">Order summary</p>
          <ul className="mt-4 flex flex-col gap-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-espresso-soft">
                  {item.quantity}× {item.productVariant.product.name}
                </span>
                <span className="text-espresso">{formatCents(item.unitPriceCentsSnapshot * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-medium">
            <span className="text-espresso">Subtotal</span>
            <span className="text-espresso">{formatCents(subtotalCents)}</span>
          </div>
        </div>
      </div>
    </Container>
  );
}
