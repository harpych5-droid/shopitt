# Shopitt Floating 3D Bag System

A modern, responsive floating shopping bag component for your Shopitt homepage with smooth animations, mobile optimization, and backend API integration.

## 🎯 Features

- ✨ **Smooth Animations**: Floating motion with wiggle effect when items added
- 📱 **Responsive Design**: Bottom-left on desktop, bottom-center on mobile
- 🎨 **3D Visual Effects**: Gradient styling, glow effects, perspective transforms
- 🔌 **Backend Integration**: Fetches and syncs items with your API
- ⚡ **Optimistic Updates**: UI updates immediately, syncs with server
- 🏷️ **Smart Badge**: Shows item count with scale animation
- ♥️ **Wishlist Support**: Keep ProductCard wishlist features
- 🚀 **Performance**: GPU-accelerated animations with framer-motion

## 📂 File Structure

```
src/
├── components/
│   ├── FloatingBag.tsx          ← Main floating bag component
│   ├── BadgeCounter.tsx         ← Item count badge
│   ├── ProductCard.tsx          ← Enhanced product with "Buy Now"
│   └── ...
├── hooks/
│   ├── useBag.ts               ← Bag state & API management
│   └── useProductFly.ts        ← Flying animation logic
├── App.tsx                      ← Already includes FloatingBag
└── FLOATING_BAG_GUIDE.ts       ← Complete implementation guide
```

## 🚀 Quick Start

### 1. FloatingBag Component (Already in App.tsx)

The floating bag is automatically available on all pages. It's imported and placed in `App.tsx`:

```tsx
import { FloatingBag } from "./components/FloatingBag";

// Inside App component:
<FloatingBag />
```

**No configuration needed!** Just works out of the box.

### 2. Update Feed to Use ProductCard

In your Feed component, replace custom product cards with the new ProductCard:

```tsx
// Before:
{products.map(product => (
  <CustomCard key={product.id} product={product} />
))}

// After:
import { ProductCard } from '@/components/ProductCard';

{products.map(product => (
  <ProductCard 
    key={product.id}
    product={product}
    onBuyClick={(product) => setCheckingOut(product)}
  />
))}
```

### 3. Ensure Backend Endpoints

Your backend should have these endpoints:

```
GET /api/bag/
Response: {
  "items": [
    {
      "id": "product-id",
      "title": "Product Title",
      "price": 29.99,
      "image": "image-url",
      "quantity": 1
    }
  ]
}

POST /api/bag/add/
Request: {
  "id": "product-id",
  "title": "Product Title",
  "price": 29.99,
  "image": "image-url"
}
```

## 🎨 Component Details

### FloatingBag.tsx

**Props:**
```tsx
interface FloatingBagProps {
  onBagClick?: () => void; // Optional callback when bag clicked
}
```

**Features:**
- Responsive positioning (desktop vs mobile)
- Continuous floating animation
- Wiggle animation on item addition
- Badge with item count
- Tooltip showing item count
- Error display
- Glow effect on hover

**Desktop Styling:**
- Position: `fixed bottom-6 left-6`
- Size: `w-12 h-12` icon container with `rounded-2xl`
- Animation: 3s floating, infinite

**Mobile Styling:**
- Position: `fixed bottom-20 left-1/2 -translate-x-1/2` (centered)
- Size: `w-10 h-10` (slightly smaller)
- Positioned above bottom nav for thumb access

### BadgeCounter.tsx

```tsx
interface BadgeCounterProps {
  count: number;
  isAnimating?: boolean;
}
```

Shows item count with scale animation when count changes.

### ProductCard.tsx

```tsx
interface ProductCardProps {
  product: Product;
  onBuyClick?: (product: Product) => void;
}
```

**Features:**
- Product image with hover zoom effect
- Seller information with avatar
- Wishlist toggle (heart icon)
- "Buy Now" button with loading state
- Flying animation when purchased
- Smooth transitions and hover effects

## 🔌 Hooks

### useBag.ts

```tsx
const { 
  items,           // Array of bag items
  itemCount,       // Total quantity
  addItem,         // Add item to bag
  fetchBagItems,   // Fetch from API
  loading,         // Loading state
  error            // Error message
} = useBag();
```

**Features:**
- Automatic fetch on mount
- Optimistic updates
- Error recovery (re-fetches on error)
- Item quantity tracking

### useProductFly.ts

```tsx
const { 
  flyingProducts,  // Array of flying items
  triggerFly       // Trigger fly animation
} = useProductFly();
```

Manages position tracking for flying animations.

## 🎬 Animations

### Floating Animation
```
Duration: 3s
Repeat: Infinity
Desktop: y = [0, -12, 0]
Mobile: y = [0, -8, 0]
Ease: easeInOut
```

### Wiggle Animation
```
Duration: 0.6s
Rotate: [0, -8, 8, -8, 8, 0]
Scale: [1, 1.05, 1]
Ease: easeInOut
```

### Badge Pop Animation
```
Duration: 0.4s
Scale: [1, 1.3, 1]
Ease: easeOut
```

### Hover Effect
```
Scale: 1.1
Glow: Opacity increase
Shadow: Enhanced
```

### Tap Effect
```
Scale: 0.95
Duration: Instant
```

## 🎨 Styling Classes

### Responsive Classes
```tsx
// Desktop/Mobile visibility
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Responsive sizing
<div className="w-10 md:w-12">Responsive width</div>
<div className="p-5 md:p-6">Responsive padding</div>
```

### Color Gradient
```tsx
// Main bag gradient
className="bg-gradient-to-br from-slate-800 to-slate-900"

// Glow effect
className="bg-gradient-to-br from-blue-400 to-purple-400"

// Badge
className="bg-red-500 text-white"
```

### Shadow & Blur
```tsx
// Deep shadow
className="shadow-2xl"

// Glow blur
className="blur-xl"

// Backdrop blur
className="backdrop-blur"
```

## 🔄 Data Flow

```
1. User clicks "Buy Now" on ProductCard
   ↓
2. addToCart() called (updates local context)
   ↓
3. window.__shopittBag.addItem() called (API call)
   ↓
4. Floating bag item count updates
   ↓
5. Badge animates (wiggle + scale)
   ↓
6. Backend returns success/error
   ↓
7. On error: Re-fetch from API to sync
```

## 📱 Mobile Optimization

- **Bottom-center position**: Easier thumb access
- **Reduced floating distance**: -8px instead of -12px
- **Smaller icon**: w-10 h-10 instead of w-12 h-12
- **Smaller padding**: p-5 instead of p-6
- **Above nav bar**: bottom-20 (accounting for bottom nav height)

## 🛠️ Development

### Adding Custom Animations

```tsx
// In FloatingBag.tsx, modify animate prop:
animate={
  shouldWiggle
    ? { /* custom wiggle */ }
    : { /* custom floating */ }
}
```

### Changing Colors

```tsx
// Desktop bag (line ~50)
<div className="bg-gradient-to-br from-YOUR-COLOR to-YOUR-DARK-COLOR">

// Glow effect (line ~40)
<div className="bg-gradient-to-br from-YOUR-GLOW-1 to-YOUR-GLOW-2">

// Badge (BadgeCounter.tsx)
className="bg-YOUR-COLOR text-white"
```

### Adjusting Position

```tsx
// Desktop position (line ~28)
className="fixed bottom-6 left-6 z-40" // Change bottom-6, left-6

// Mobile position (line ~79)
className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40" // Change bottom-20
```

### Changing Animation Speed

```tsx
// In FloatingBag.tsx:
transition={{
  duration: 2, // Change from 3 to faster/slower
  repeat: Infinity,
  ease: "easeInOut"
}}
```

## 🚨 Error Handling

Errors are automatically handled:

```tsx
// API fetch fails
→ Falls back to empty local state
→ Re-fetches on next add attempt
→ Shows error message briefly
→ No UI crashes
```

## 📊 Performance

- **GPU Accelerated**: All animations use framer-motion with transform/opacity
- **No Layout Shifts**: Fixed positioning prevents reflows
- **Efficient Re-renders**: Only updates on state changes
- **Memoized Components**: BadgeCounter prevents unnecessary updates
- **Optimistic UI**: No waiting for API response

## 🔐 Best Practices

✅ **Do:**
- Keep ProductCard in Feed component
- Let useBag hook handle all API calls
- Use FloatingBag on all pages (already in App.tsx)
- Handle errors gracefully (already built in)

❌ **Don't:**
- Call API directly from ProductCard
- Manually update bag state from multiple places
- Remove FloatingBag from App.tsx
- Modify internal animation values without testing

## 🐛 Troubleshooting

**Badge not showing?**
- Check `itemCount > 0` in useBag hook
- Verify API response has items array

**Bag not floating?**
- Check framer-motion is installed: `npm list framer-motion`
- Verify animate prop in FloatingBag.tsx

**API not connecting?**
- Check network tab in DevTools
- Verify endpoints are correct: `/api/bag/`
- Check CORS headers if different domain

**Animations janky on mobile?**
- Reduce animation duration in FloatingBag.tsx
- Check device performance in Chrome DevTools
- Use `will-change: transform` for performance

## 📝 Notes

- Cart page still shows full order details
- Floating bag shows live item count
- Both work together seamlessly
- No breaking changes to existing code
- All animations are smooth and performant

## 🎓 Examples

### Add callback when item added

```tsx
<ProductCard 
  product={product}
  onBuyClick={(product) => {
    console.log('Purchased:', product.title);
    // Show confirmation toast, etc.
  }}
/>
```

### Customize bag appearance

```tsx
// In FloatingBag.tsx, update className on main div:
className="bg-gradient-to-br from-purple-800 to-purple-900 rounded-2xl"
```

### Redirect to cart on bag click

```tsx
<FloatingBag onBagClick={() => navigate('/cart')} />
```

---

**Version:** 1.0.0  
**Created:** December 2025  
**Compatibility:** React 18+, Tailwind CSS 3+, Framer Motion 10+
