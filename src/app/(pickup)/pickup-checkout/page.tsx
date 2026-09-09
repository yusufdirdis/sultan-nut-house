import { redirect } from "next/navigation";
import { getActiveCart, calculateCartSubtotal } from "@/server/services/cart-service";
import { Container } from "@/components/ui/Container";
import { PickupCheckoutForm } from "@/components/checkout/PickupCheckoutForm";
import { formatCents } from "@/lib/money";
import { calculateTaxCents } from "@/domain/tax/calculateTax";

export default async function PickupCheckoutPage() {
  const cart = await getActiveCart("PICKUP");

  if (!cart || cart.items.length === 0) {
    redirect("/pickup-cart");
  }

  const subtotalCents = calculateCartSubtotal(cart);
  const taxCents = calculateTaxCents({ subtotalCents, channel: "PICKUP" });

  return (
    <Container className="py-12">
      <h1 className="font-display text-3xl text-espresso">Pickup checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-line bg-white p-6">
          <PickupCheckoutForm />
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
          <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-espresso-soft">
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-espresso-soft">
              <span>Tax</span>
              <span>{formatCents(taxCents)}</span>
            </div>
            <div className="flex justify-between text-base font-medium text-espresso">
              <span>Total</span>
              <span>{formatCents(subtotalCents + taxCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
