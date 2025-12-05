import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useShop } from '@/context/ShopProvider';
import './FloatingBag.css';

interface FloatingBagProps {
  onOpenCart: () => void;
}

export const FloatingBag = ({ onOpenCart }: FloatingBagProps) => {
  const { cart } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [animateAdd, setAnimateAdd] = useState(false);

  const itemCount = cart.length;
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Trigger jiggle animation when item is added
  const handleItemAdded = () => {
    setAnimateAdd(true);
    setTimeout(() => setAnimateAdd(false), 600);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    onOpenCart();
  };

  return (
    <>
      {/* Floating Bag Button */}
      <div
        className={`floating-bag-container ${animateAdd ? 'jiggle-glow' : 'soft-bounce'}`}
        onClick={handleClick}
      >
        <div className="relative">
          {/* Glow effect when animating */}
          {animateAdd && <div className="absolute inset-0 bg-accent/30 rounded-full blur-lg animate-pulse" />}

          {/* Bag Icon */}
          <button
            className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full 
              bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg
              transition-all duration-300 hover:scale-110 active:scale-95
              ${animateAdd ? 'shadow-accent/50 drop-shadow-lg' : 'hover:shadow-xl'}`}
            aria-label="Shopping bag"
          >
            <ShoppingBag className="w-6 h-6" strokeWidth={2.5} />
          </button>

          {/* Badge for item count */}
          {itemCount > 0 && (
            <div
              className={`absolute -top-2 -right-2 bg-accent text-white text-xs font-bold
                w-6 h-6 rounded-full flex items-center justify-center
                animation-pop ${animateAdd ? 'animate-pulse' : ''}`}
            >
              {itemCount}
            </div>
          )}
        </div>

        {/* Mini Cart Preview (empty state) */}
        {isOpen && (
          <div
            className="absolute bottom-20 right-0 w-80 bg-card border border-border rounded-lg
              shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Your Bag</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            {itemCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Your bag is empty</p>
                <p className="text-xs mt-2">Add items from the feed to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded"
                    >
                      <span className="text-sm font-medium">{item.product.title}</span>
                      <span className="text-xs font-semibold text-primary">
                        {item.product.currency}{(item.product.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary text-lg">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      onOpenCart();
                    }}
                    className="w-full bg-primary text-white py-2 rounded-md font-semibold
                      hover:bg-primary/90 transition-colors hover:scale-105 active:scale-95"
                  >
                    View Cart
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingBag;
