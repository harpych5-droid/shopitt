import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { BagBadge } from './BagBadge';

// Bag logo as SVG component
const BagLogoSVG = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 16H44C45.1046 16 46 16.8954 46 18V50C46 51.1046 45.1046 52 44 52H20C18.8954 52 18 51.1046 18 50V18C18 16.8954 18.8954 16 20 16Z" stroke="white" strokeWidth="2" fill="none"/>
    <path d="M24 16C24 24 24 28 32 28C40 28 40 24 40 16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <circle cx="32" cy="35" r="6" fill="white" opacity="0.3"/>
  </svg>
);

/**
 * DesktopBag Component
 * 
 * Floating shopping bag for desktop (>768px)
 * Features:
 * - Bottom-left corner positioning
 * - Continuous floating motion (3s infinite)
 * - Wiggle animation on item add
 * - Badge showing item count
 * - Hover to reveal details
 * - Product flying animation on "Buy Now"
 */
interface DesktopBagProps {
  itemCount?: number;
  onOpenCart?: () => void;
}

export const DesktopBag = ({ itemCount = 0, onOpenCart }: DesktopBagProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wiggleKey, setWiggleKey] = useState(0);

  // Expose addItem method to window for ProductCard access
  const addItem = () => {
    setWiggleKey((prev) => prev + 1);
  };

  const handleOpenCart = () => {
    onOpenCart?.();
  };

  return (
    <>
      {/* Desktop Floating Bag - Hidden on mobile */}
      <motion.div
        className="hidden md:flex fixed bottom-6 left-6 z-30"
        data-bag-element
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Container with expanded details on hover */}
        <motion.div
          className="relative"
          animate={{ width: isHovered ? 'auto' : '64px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Floating Animation - Continuous up/down motion */}
          <motion.button
            key={wiggleKey}
            onClick={handleOpenCart}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-2xl hover:shadow-3xl transition-shadow flex items-center justify-center flex-shrink-0"
            animate={{
              // Floating animation: 3s infinite loop
              y: [0, -12, 0],
              // Wiggle on add: 0.6s
              rotate: wiggleKey > 0 ? [0, -8, 8, -8, 8, 0] : 0,
              scale: wiggleKey > 0 ? [1, 1.05, 1] : 1,
            }}
            transition={{
              y: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              },
              rotate: {
                duration: 0.6,
                ease: 'easeInOut',
              },
              scale: {
                duration: 0.6,
                ease: 'easeInOut',
              },
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Bag Icon - Official bag logo SVG */}
            <BagLogoSVG />

            {/* Badge Counter */}
            <BagBadge count={itemCount} />

            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-slate-400/20 blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          {/* Expanded Details - Shows on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                className="absolute left-20 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 min-w-64 border border-gray-200 dark:border-slate-700"
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {/* Header */}
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                  Shopping Bag
                </h3>

                {/* Item Count */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {itemCount === 0 ? 'Empty' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                  </span>
                  {itemCount > 0 && (
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Ready to checkout
                    </span>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <motion.button
                    onClick={handleOpenCart}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Cart
                  </motion.button>
                  <button className="w-full py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm font-semibold rounded-lg transition">
                    Continue Shopping
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </>
  );
};

export default DesktopBag;
