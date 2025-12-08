import { motion } from 'framer-motion';
import { useState } from 'react';
import { Product } from '@/context/ShopProvider';
import { Heart } from 'lucide-react';
import { useShop } from '@/context/ShopProvider';

/**
 * ProductCard Component
 * 
 * Displays a product with:
 * - Product image, title, price
 * - Seller information
 * - Buy Now button with flying animation
 * - Wishlist toggle
 * - Smooth hover effects
 * 
 * When "Buy Now" is clicked:
 * 1. Product animates to flying state
 * 2. Item is sent to floating bag (via useBag hook)
 * 3. Bag counter updates and wiggles
 */

interface ProductCardProps {
  product: Product;
  onBuyClick?: (product: Product) => void;
}

export const ProductCard = ({ product, onBuyClick }: ProductCardProps) => {
  const { toggleWishlist, wishlist, addToCart } = useShop();
  const [isFlying, setIsFlying] = useState(false);
  const isWishlisted = wishlist[product.id];

  const handleBuyClick = async () => {
    // Trigger flying animation
    setIsFlying(true);

    // Add to local cart immediately for UI feedback
    addToCart(product, 1);

    // Call the floating bag's addItem method
    const bagAddItem = (window as any).__shopittBag?.addItem;
    if (bagAddItem) {
      await bagAddItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.media[0],
      });
    }

    // Trigger optional callback (e.g., to open checkout modal)
    onBuyClick?.(product);

    // Reset flying animation after a brief delay
    setTimeout(() => setIsFlying(false), 800);
  };

  return (
    <motion.div
      className="group relative overflow-hidden rounded-xl border border-border bg-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <motion.img
          src={product.media[0]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          animate={isFlying ? { opacity: 0, scale: 0.5, y: -300 } : {}}
          transition={{ duration: 0.6, ease: 'easeIn' }}
        />

        {/* Wishlist Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 z-20 rounded-full bg-white/90 backdrop-blur p-2 transition-all hover:bg-white hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Heart
            size={18}
            className={`transition-colors ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </motion.button>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/10" />
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Seller Info */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full border-2 border-white"
            style={{ backgroundColor: product.seller.avatarColor || '#3B82F6' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground truncate">
              {product.seller.name}
            </p>
            <p className="text-xs text-muted-foreground">@{product.seller.handle}</p>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
            {product.title}
          </h3>
        </div>

        {/* Price and Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">
            {product.currency}
            {product.price}
          </div>

          {/* Buy Now Button */}
          <motion.button
            onClick={handleBuyClick}
            disabled={isFlying}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isFlying ? { opacity: 0.5 } : {}}
          >
            {isFlying ? 'Adding...' : 'Buy Now'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
