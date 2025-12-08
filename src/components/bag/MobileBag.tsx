import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { BagBadge } from './BagBadge';
import BagLogo from '@/assets/icons/bag-logo.png';

/**
 * MobileBag Component
 * 
 * Floating shopping bag for mobile (≤768px)
 * Features:
 * - Bottom-center positioning, slightly lifted above mobile nav
 * - Floating animation with continuous motion
 * - Wiggle animation on item add
 * - Badge showing item count
 * - Tap to open bag details
 * - Product flying animation on "Buy Now"
 */
interface MobileBagProps {
  itemCount?: number;
  onOpenCart?: () => void;
}

export const MobileBag = ({ itemCount = 0, onOpenCart }: MobileBagProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [wiggleKey, setWiggleKey] = useState(0);

  // Expose addItem method to window for ProductCard access
  const addItem = () => {
    setWiggleKey((prev) => prev + 1);
  };

  // Handle open cart
  const handleOpenCart = () => {
    setIsOpen(true);
    onOpenCart?.();
  };

  return (
    <>
      {/* Floating Bag Container - Mobile Only */}
      <motion.div
        className="md:hidden fixed bottom-28 left-6 z-30"
        data-bag-element
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Floating Animation - Continuous up/down motion */}
        <motion.button
          key={wiggleKey}
          onClick={handleOpenCart}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-2xl hover:shadow-3xl transition-shadow flex items-center justify-center"
          animate={{
            // Floating animation
            y: [0, -12, 0],
            // Wiggle on add
            rotate: wiggleKey > 0 ? [0, -8, 8, -8, 8, 0] : 0,
            scale: wiggleKey > 0 ? [1, 1.05, 1] : 1,
          }}
          transition={{
            // Floating: 3s infinite loop
            y: {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            // Wiggle: 0.6s animation
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
          {/* Bag Icon - Official bag logo PNG */}
          <img 
            src={BagLogo} 
            alt="Shopping Bag" 
            className="w-9 h-9 object-contain"
          />

          {/* Badge Counter */}
          <BagBadge count={itemCount} />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-slate-400/20 blur-xl"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>
      </motion.div>

      {/* Bag Details Modal - Mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            {/* Bag Details Sheet */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl"
              initial={{ y: 500 }}
              animate={{ y: 0 }}
              exit={{ y: 500 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Your Shopping Bag
                </h2>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Content Area */}
              <div className="px-6 py-4 max-h-96 overflow-y-auto">
                {itemCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingBag size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Your bag is empty</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Add items to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Placeholder for bag items */}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {itemCount} item{itemCount !== 1 ? 's' : ''} in your bag
                    </p>
                  </div>
                )}
              </div>

              {/* CTA Footer */}
              {itemCount > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
                  <motion.button
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Proceed to Checkout
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBag;
