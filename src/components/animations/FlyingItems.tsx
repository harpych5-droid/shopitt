import { motion } from 'framer-motion';
import { FlyingItem } from '@/hooks/useFlying';

interface FlyingItemsProps {
  items: FlyingItem[];
}

export const FlyingItems = ({ items }: FlyingItemsProps) => {
  return (
    <>
      {items.map((item) => (
        <motion.div
          key={item.id}
          className="fixed pointer-events-none z-50"
          initial={{
            x: item.fromX,
            y: item.fromY,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: item.toX,
            y: item.toY,
            scale: 0.3,
            opacity: 0.5,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: item.duration,
            ease: 'easeInOut',
          }}
        >
          <img
            src={item.image}
            alt="Flying item"
            className="w-16 h-16 rounded-lg object-cover shadow-lg"
          />
        </motion.div>
      ))}
    </>
  );
};
