import { useState, useCallback } from 'react';

export interface FlyingItem {
  id: string;
  image: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  duration: number;
}

export const useFlying = () => {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const animateItemToCart = useCallback((
    fromElement: HTMLElement,
    toElement: HTMLElement,
    itemId: string,
    itemImage: string
  ) => {
    // Get positions of the elements
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    // Calculate window scroll offset
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Create flying item with absolute positions
    const flyingItem: FlyingItem = {
      id: `flying-${itemId}-${Date.now()}`,
      image: itemImage,
      fromX: fromRect.left + scrollX,
      fromY: fromRect.top + scrollY,
      toX: toRect.left + scrollX,
      toY: toRect.top + scrollY,
      duration: 1,
    };

    setFlyingItems((prev) => [...prev, flyingItem]);

    // Remove the flying item after animation completes
    const timer = setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== flyingItem.id));
    }, flyingItem.duration * 1000 + 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    flyingItems,
    animateItemToCart,
    clearFlying: () => setFlyingItems([]),
  };
};
