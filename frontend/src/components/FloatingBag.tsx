import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useBag } from '@/hooks/useBag';

const ORBIT_RADIUS = 150; // The radius of the orbit circle in pixels.

export const FloatingBag = () => {
  const { itemCount, bagItems, isBagOpen, toggleBag, bagAnimationControls } = useBag();

  return (
    <>
      {/* Main floating bag icon */}
      <motion.div
        id="floating-bag-icon"
        className="fixed bottom-8 left-8 z-50 cursor-pointer"
        onClick={toggleBag}
        animate={bagAnimationControls}
      >
        <div className="relative">
          <ShoppingBag className="h-16 w-16 text-gray-900 drop-shadow-lg" />
          <AnimatePresence>
            {itemCount > 0 && (
              <motion.div
                className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                {itemCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Orbiting items view (when bag is open) */}
      <AnimatePresence>
        {isBagOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={toggleBag}
            />

            {/* Central Bag and Close Button */}
            <motion.div
              className="relative z-50"
              layoutId="floating-bag-icon" // This makes the bag animate from the corner
            >
              <ShoppingBag className="h-24 w-24 text-white" />
              <button
                onClick={toggleBag}
                className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800"
              >
                <X />
              </button>
            </motion.div>

            {/* Orbiting Product Items */}
            {bagItems.map((item, index) => {
              const angle = (index / itemCount) * 2 * Math.PI;
              const x = ORBIT_RADIUS * Math.cos(angle);
              const y = ORBIT_RADIUS * Math.sin(angle);

              return (
                <motion.div
                  key={item.id}
                  className="absolute z-50 flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow-lg"
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{ x, y, scale: 1, transition: { type: 'spring', delay: 0.2 + index * 0.1 } }}
                  exit={{ x: 0, y: 0, scale: 0 }}
                >
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded-full object-cover" />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
