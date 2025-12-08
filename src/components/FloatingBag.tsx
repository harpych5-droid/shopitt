import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { BadgeCounter } from './BadgeCounter';
import { useBag } from '@/hooks/useBag';

/**
 * FloatingBag Component
 * 
 * A modern floating 3D shopping bag component that:
 * - Floats smoothly with continuous animation
 * - Wiggles when items are added
 * - Displays item count with badge
 * - Responsive positioning (bottom-left desktop, bottom-center mobile)
 * - Integrates with backend API via useBag hook
 * 
 * Desktop: Fixed to bottom-left corner
 * Mobile: Fixed to bottom-center for easier thumb access
 */

interface FloatingBagProps {
  onBagClick?: () => void;
}

export const FloatingBag = ({ onBagClick }: FloatingBagProps) => {
  const { items, itemCount, addItem, loading, error } = useBag();
  const bagRef = useRef<HTMLDivElement>(null);
  const [shouldWiggle, setShouldWiggle] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);

  // Trigger wiggle animation when item count increases
  useEffect(() => {
    if (itemCount > prevCount) {
      setShouldWiggle(true);
      const timer = setTimeout(() => setShouldWiggle(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(itemCount);
  }, [itemCount, prevCount]);

  // Expose addItem method to window for easy access from ProductCard
  useEffect(() => {
    (window as any).__shopittBag = { addItem };
  }, [addItem]);

  return (
    <>
      <motion.div
        ref={bagRef}
        className="hidden md:block fixed bottom-6 left-6 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={onBagClick}
          className="relative group"
          animate={
            shouldWiggle
              ? {
                  rotate: [0, -8, 8, -8, 8, 0],
                  scale: [1, 1.05, 1],
                }
              : {
                  y: [0, -12, 0],
                }
          }
          transition={
            shouldWiggle
              ? { duration: 0.6, ease: 'easeInOut' }
              : {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Bag Icon Container */}
          <div className="relative">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

            {/* Main Bag */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700/50 backdrop-blur">
              {/* SVG Bag Icon */}
              <svg
                className="w-12 h-12 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2h-2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7H3V5a1 1 0 011-1h4zM9 2h6v2H9V2zm0 12a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" />
              </svg>

              {/* 3D Perspective effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/0 via-transparent to-white/5 group-hover:from-white/10 transition-all duration-300" />
            </div>

            {/* Badge Counter */}
            {itemCount > 0 && (
              <BadgeCounter count={itemCount} isAnimating={shouldWiggle} />
            )}
          </div>

          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200">
            {itemCount} item{itemCount !== 1 ? 's' : ''} in bag
          </div>
        </motion.button>
      </motion.div>

      {/* Mobile Floating Bag - Bottom Center */}
      <motion.div
        ref={bagRef}
        className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          onClick={onBagClick}
          className="relative group"
          animate={
            shouldWiggle
              ? {
                  rotate: [0, -8, 8, -8, 8, 0],
                  scale: [1, 1.05, 1],
                }
              : {
                  y: [0, -8, 0],
                }
          }
          transition={
            shouldWiggle
              ? { duration: 0.6, ease: 'easeInOut' }
              : {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Bag Icon Container - Mobile */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 shadow-xl border border-slate-700/50 backdrop-blur">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2h-2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V7H3V5a1 1 0 011-1h4zM9 2h6v2H9V2zm0 12a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2z" />
              </svg>

              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/0 via-transparent to-white/5 group-hover:from-white/10 transition-all duration-300" />
            </div>

            {/* Badge Counter */}
            {itemCount > 0 && (
              <BadgeCounter count={itemCount} isAnimating={shouldWiggle} />
            )}
          </div>
        </motion.button>
      </motion.div>

      {/* Error handling display (optional) */}
      {error && (
        <div className="fixed bottom-2 left-2 right-2 md:left-auto md:right-2 md:w-64 bg-red-500/90 text-white text-xs p-3 rounded-lg">
          {error}
        </div>
      )}
    </>
  );
};

export default FloatingBag;
