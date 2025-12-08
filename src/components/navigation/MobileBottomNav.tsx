import { motion } from 'framer-motion';
import { Home, Play, Bell, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

/**
 * MobileBottomNav Component
 * 
 * Fixed bottom navigation for mobile (≤768px)
 * Features:
 * - Home, Shorts, Add Product (center), Notifications, Profile
 * - Smooth tap animations with haptic feedback
 * - Active state indicators
 * - Floats above mobile bag component
 */
export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPosting, setIsPosting] = useState(false);

  // Determine active tab based on current route
  const isActive = (path: string) => location.pathname === path;

  // Haptic feedback simulation (works on supported devices)
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Navigation items with icons
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/', vibrate: true },
    { id: 'shorts', icon: Play, label: 'Shorts', path: '/shorts', vibrate: true },
    // Center button is separate (Plus icon)
    { id: 'notifications', icon: Bell, label: 'Notifications', path: '/notifications', vibrate: true },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile', vibrate: true },
  ];

  const handleNavClick = (path: string) => {
    triggerHaptic();
    navigate(path);
  };

  const handlePostClick = () => {
    triggerHaptic();
    setIsPosting(true);
    // Navigate to post creation or open modal
    navigate('/create');
    setTimeout(() => setIsPosting(false), 600);
  };

  return (
    <>
      {/* Mobile Bottom Navigation - Fixed at bottom */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 dark:bg-slate-900/95 dark:border-slate-700"
      >
        {/* Navigation container */}
        <div className="flex items-center justify-between px-3 py-2 max-w-md mx-auto">
          {/* Left side items (2 items) */}
          <div className="flex flex-1 justify-around items-center gap-2">
            {navItems.slice(0, 2).map(({ id, icon: Icon, label, path }) => (
              <motion.button
                key={id}
                onClick={() => handleNavClick(path)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                  isActive(path)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.05 }}
              >
                <Icon size={24} />
                <span className="text-xs mt-0.5 font-medium">{label}</span>

                {/* Active indicator line */}
                {isActive(path) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-2 h-1 w-6 bg-blue-600 dark:bg-blue-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Center Plus Button - Floating effect */}
          <motion.button
            onClick={handlePostClick}
            className="relative -top-4 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' }}
            animate={isPosting ? { rotate: 180, scale: 1.1 } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Plus Icon */}
            <motion.div
              animate={isPosting ? { opacity: 0, rotate: 180 } : { opacity: 1, rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </motion.div>

            {/* Glow effect on focus */}
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          {/* Right side items (2 items) */}
          <div className="flex flex-1 justify-around items-center gap-2">
            {navItems.slice(2, 4).map(({ id, icon: Icon, label, path }) => (
              <motion.button
                key={id}
                onClick={() => handleNavClick(path)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                  isActive(path)
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.05 }}
              >
                <Icon size={24} />
                <span className="text-xs mt-0.5 font-medium">{label}</span>

                {/* Active indicator line */}
                {isActive(path) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-2 h-1 w-6 bg-blue-600 dark:bg-blue-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Safe area padding for bottom nav on mobile */}
      <div className="md:hidden h-24" />
    </>
  );
};

export default MobileBottomNav;
