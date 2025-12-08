import { useState, useCallback } from 'react';

/**
 * Hook for managing flying product animations
 * Handles animation state and flying position tracking
 */
export const useProductFly = () => {
  const [flyingProducts, setFlyingProducts] = useState<
    Array<{
      id: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }>
  >([]);

  const triggerFly = useCallback((productId: string, fromElement: HTMLElement) => {
    const bagElement = document.querySelector('[data-bag-target]');
    if (!bagElement) return;

    const fromRect = fromElement.getBoundingClientRect();
    const toRect = bagElement.getBoundingClientRect();

    setFlyingProducts((prev) => [
      ...prev,
      {
        id: productId,
        fromX: fromRect.left,
        fromY: fromRect.top,
        toX: toRect.left,
        toY: toRect.top,
      },
    ]);

    // Remove flying product after animation completes
    setTimeout(() => {
      setFlyingProducts((prev) => prev.filter((p) => p.id !== productId));
    }, 600);
  }, []);

  return { flyingProducts, triggerFly };
};
