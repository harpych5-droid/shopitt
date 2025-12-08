import { motion } from 'framer-motion';

/**
 * BagBadge Component
 * 
 * Shared badge displaying item count on floating bag
 * Features:
 * - Pop animation on count change
 * - Smooth scale transitions
 * - Item count display (99+ overflow)
 * - Works for both mobile and desktop bags
 */
interface BagBadgeProps {
  count?: number;
}

export const BagBadge = ({ count = 0 }: BagBadgeProps) => {
  // Hide badge if count is 0
  if (count === 0) return null;

  return (
    <motion.div
      className="absolute -top-2 -right-2 min-w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
      // Pop animation on count change
      animate={{
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 0.4,
        ease: 'easeOut',
      }}
      key={count} // Re-trigger animation on count change
    >
      {/* Display count, max 99 with + */}
      {count > 99 ? '99+' : count}
    </motion.div>
  );
};

export default BagBadge;
