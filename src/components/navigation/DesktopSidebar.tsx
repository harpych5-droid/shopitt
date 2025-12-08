import { motion } from 'framer-motion';
import { Home, Play, Plus, Bell, User, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * DesktopSidebar Component
 * 
 * Vertical navigation sidebar for desktop (>768px)
 * Features:
 * - Instagram-like design with glassy background
 * - Smooth hover states and transitions
 * - Logo on top with nav stack below
 * - Active state indicators
 * - Animations on navigation clicks
 */
export const DesktopSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab
  const isActive = (path: string) => location.pathname === path;

  // Navigation items with icons
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'shorts', icon: Play, label: 'Shorts', path: '/shorts' },
    { id: 'create', icon: Plus, label: 'Add Product', path: '/create' },
    { id: 'notifications', icon: Bell, label: 'Notifications', path: '/notifications' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <motion.aside
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-slate-700 z-50"
    >
      {/* Sidebar Container */}
      <div className="flex flex-col h-full p-6 gap-12">
        {/* Logo Section */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            <Zap size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-gray-900 dark:text-white">Shopitt</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Social Shop</span>
          </div>
        </motion.div>

        {/* Navigation Stack */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(({ id, icon: Icon, label, path }, index) => (
            <motion.button
              key={id}
              onClick={() => handleNavClick(path)}
              className={`flex items-center gap-4 px-6 py-3 rounded-lg transition-all duration-200 group relative ${
                isActive(path)
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'
              }`}
              whileHover={{ x: 8 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Icon with glow on active */}
              <motion.div
                animate={
                  isActive(path)
                    ? { scale: 1.1, color: 'rgb(37, 99, 235)' }
                    : { scale: 1 }
                }
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon size={24} className="group-hover:rotate-12 transition-transform" />
              </motion.div>

              {/* Label */}
              <span className="font-semibold text-sm">{label}</span>

              {/* Active indicator pill */}
              {isActive(path) && (
                <motion.div
                  layoutId="activePill"
                  className="absolute left-0 w-1 h-8 bg-blue-600 dark:bg-blue-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-400/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden
              />
            </motion.button>
          ))}
        </nav>

        {/* Footer Section - User Quick Access */}
        <motion.div
          className="border-t border-gray-200 dark:border-slate-700 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 hover:from-blue-500/20 hover:to-blue-600/20 dark:hover:from-blue-500/30 dark:hover:to-blue-600/30 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0" />
            <div className="flex flex-col flex-1 text-left text-xs">
              <span className="font-semibold text-gray-900 dark:text-white">User Profile</span>
              <span className="text-gray-500 dark:text-gray-400">View Account</span>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default DesktopSidebar;
