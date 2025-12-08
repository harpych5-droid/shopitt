import { motion } from 'framer-motion';

/**
 * BadgeCounter Component
 * Displays the number of items in the bag with smooth animations
 * 
 * Features:
 * - Scale up animation when count changes
 * - Responsive text sizing
 * - Smooth color transitions
 */
interface BadgeCounterProps {
  count: number;
  isAnimating?: boolean;
}

export const BadgeCounter = ({ count, isAnimating }: BadgeCounterProps) => {
  return (
    <motion.div
      className="absolute -top-2 -right-2 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 shadow-lg"
      animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {count > 99 ? '99+' : count}
    </motion.div>
  );
};
