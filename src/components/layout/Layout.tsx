import { ReactNode } from 'react';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { MobileBag } from '@/components/bag/MobileBag';
import { DesktopBag } from '@/components/bag/DesktopBag';
import { useBag } from '@/hooks/useBag';
import { useFlying } from '@/hooks/useFlying';
import { FlyingItems } from '@/components/animations/FlyingItems';

/**
 * Responsive Layout Component
 * 
 * Handles responsive layout with:
 * - Mobile: Bottom navigation + bottom-center bag
 * - Desktop: Left sidebar + bottom-left bag
 * - Automatic content padding to avoid overlap
 * - Shared bag state across all screens
 */
interface LayoutProps {
  children: ReactNode;
  onOpenCart?: () => void;
}

export const Layout = ({ children, onOpenCart }: LayoutProps) => {
  const { itemCount } = useBag();
  const { flyingItems } = useFlying();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Mobile Navigation */}
      <MobileBottomNav />

      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <main className="md:ml-64">
        {/* Content padding to avoid overlap with navigation/bag */}
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-full">
          {children}
        </div>
      </main>

      {/* Floating Bag - Mobile */}
      <MobileBag itemCount={itemCount} onOpenCart={onOpenCart} />

      {/* Floating Bag - Desktop */}
      <DesktopBag itemCount={itemCount} onOpenCart={onOpenCart} />

      {/* Flying Items Animation */}
      <FlyingItems items={flyingItems} />
    </div>
  );
};

export default Layout;
