import { useEffect, useMemo } from "react";
import { useShop } from "@/context/ShopProvider";
import { Button } from "@/components/ui/button";

const Cart = () => {
  const { cart } = useShop();
  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cart]
  );

  useEffect(() => {
    document.title = "Cart – Shopit";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Your cart on Shopit.");
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Cart</h1>
      {cart.length === 0 ? (
        <div className="grid place-items-center rounded-lg border p-8 text-center">
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4" variant="cta">
            <a href="/">Browse the feed</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <img
                src={item.product.media[0]}
                alt={item.product.title}
                className="size-16 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.product.title}</p>
                <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <div className="text-sm font-semibold">
                {item.product.currency}
                {(item.product.price * item.quantity).toFixed(0)}
              </div>
            </div>
          ))}
          <div className="border-t pt-4">
            <p className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(0)}</span>
            </p>
            <Button className="mt-4 w-full">Proceed to checkout</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
