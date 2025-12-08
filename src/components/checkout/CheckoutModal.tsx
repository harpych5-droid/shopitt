import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/context/ShopProvider";
import { useState, useRef, useEffect } from "react";
import { useShop } from "@/context/ShopProvider";
import { useFlying } from "@/hooks/useFlying";

const CheckoutModal = ({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product: Product | null }) => {
  const [step, setStep] = useState<"shipping" | "payment" | "confirm">("shipping");
  const { addToCart } = useShop();
  const { animateItemToCart } = useFlying();
  const dialogRef = useRef<HTMLDivElement>(null);

  const proceed = () => {
    if (step === "shipping") setStep("payment");
    else if (step === "payment") {
      setStep("confirm");
      // Trigger flying animation after a short delay
      setTimeout(() => {
        if (product && dialogRef.current) {
          const productImageEl = dialogRef.current.querySelector('img[alt="' + product.title + '"]') as HTMLElement;
          const bagElement = document.querySelector('[data-bag-element]') as HTMLElement;
          
          if (productImageEl && bagElement) {
            animateItemToCart(productImageEl, bagElement, product.id, product.media[0]);
          }
        }
      }, 100);
    }
    else onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" ref={dialogRef}>
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>
        {!product ? (
          <p className="text-sm text-muted-foreground">No product selected.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={product.media[0]} alt={product.title} className="size-16 rounded-md object-cover" />
              <div className="min-w-0">
                <p className="truncate font-medium">{product.title}</p>
                <p className="text-sm text-muted-foreground">
                  {product.currency}
                  {product.price.toFixed(0)}
                </p>
              </div>
            </div>

            {step === "shipping" && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Shipping to your saved address.</p>
                <Button variant="secondary" size="sm">Change</Button>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Pay with Shopit Pay • **** 4242</p>
                <Button variant="secondary" size="sm">Manage</Button>
              </div>
            )}

            {step === "confirm" && (
              <div className="space-y-2 text-sm">
                <p className="text-success">Order confirmed! 🎉</p>
                <p className="text-muted-foreground">We'll send you tracking updates.</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {step !== "confirm" ? (
                <Button
                  className="flex-1"
                  variant="cta"
                  onClick={() => {
                    addToCart(product, 1);
                    proceed();
                  }}
                >
                  {step === "shipping" ? "Continue to Payment" : "Pay Now"}
                </Button>
              ) : (
                <Button className="flex-1" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
