import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useBag } from '@/hooks/useBag';

export const FlyingProduct = () => {
  const { flyingProduct, setFlyingProduct } = useBag();
  const bagIconRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    if (!flyingProduct || !bagIconRef.current) return;

    const bagElement = bagIconRef.current;
    const endRect = bagElement.getBoundingClientRect();
    const { startRect } = flyingProduct;

    // Calculate delta from start to end
    const deltaX = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
    const deltaY = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

    controls
      .start({
        x: deltaX,
        y: deltaY,
        scale: 0.1,
        rotate: 360,
        opacity: 0,
        transition: { duration: 0.8, ease: 'easeInOut' },
      })
      .then(() => setFlyingProduct(null));
  }, [flyingProduct, controls, bagIconRef, setFlyingProduct]);

  if (!flyingProduct) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-[999]"
      style={{
        top: flyingProduct.startRect.top,
        left: flyingProduct.startRect.left,
        width: flyingProduct.startRect.width,
        height: flyingProduct.startRect.height,
      }}
      initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
      animate={controls}
    >
      <img
        src={flyingProduct.product.imageUrl}
        alt={flyingProduct.product.name}
        className="h-full w-full rounded-md object-cover"
      />
    </motion.div>
  );
};
