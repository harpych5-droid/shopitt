import { createContext, useContext, useState, ReactNode, RefObject } from 'react';
import { useAnimation, AnimationControls } from 'framer-motion';

export interface Product {
  id: number | string;
  name: string;
  price: number;
  imageUrl: string;
}

interface FlyingProduct {
  product: Product;
  startRect: DOMRect;
}

interface BagContextType {
  bagItems: Product[];
  isBagOpen: boolean;
  itemCount: number;
  flyingProduct: FlyingProduct | null;
  bagAnimationControls: AnimationControls;
  addToBag: (product: Product, productRef: RefObject<HTMLElement>) => void;
  toggleBag: () => void;
  setFlyingProduct: (product: FlyingProduct | null) => void;
}

const BagContext = createContext<BagContextType | undefined>(undefined);

export const BagProvider = ({ children }: { children: ReactNode }) => {
  const [bagItems, setBagItems] = useState<Product[]>([]);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [flyingProduct, setFlyingProduct] = useState<FlyingProduct | null>(null);
  const bagAnimationControls = useAnimation();

  const addToBag = (product: Product, productRef: RefObject<HTMLElement>) => {
    if (!productRef.current) return;

    // 1. Get the product image's position to animate from.
    const startRect = productRef.current.getBoundingClientRect();
    setFlyingProduct({ product, startRect });

    // 2. After the flying animation (simulated with a timeout), update the bag state.
    setTimeout(() => {
      setBagItems((prevItems) => {
        // Avoid adding duplicates, or handle quantity later
        if (prevItems.find(item => item.id === product.id)) {
          return prevItems;
        }
        return [...prevItems, product];
      });

      // 3. Trigger the bag wiggle animation.
      bagAnimationControls.start({
        scale: [1, 1.3, 1],
        rotate: [0, -15, 15, -15, 0],
        transition: { duration: 0.5, type: 'spring' },
      });
    }, 800); // This duration should match the flying animation.
  };

  const toggleBag = () => {
    setIsBagOpen(prev => !prev);
  };

  const value = {
    bagItems,
    isBagOpen,
    itemCount: bagItems.length,
    flyingProduct,
    bagAnimationControls,
    addToBag,
    toggleBag,
    setFlyingProduct,
  };

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
};

export const useBag = () => {
  const context = useContext(BagContext);
  if (context === undefined) {
    throw new Error('useBag must be used within a BagProvider');
  }
  return context;
};