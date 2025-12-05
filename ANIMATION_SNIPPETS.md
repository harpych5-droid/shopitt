# 🚀 Quick Integration Snippets

## Copy-Paste Ready Code

### 1. Update App.tsx

```tsx
import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { ShopProvider } from "./context/ShopProvider";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";

// NEW IMPORTS
import FloatingBag from "@/components/FloatingBag";
import Confetti from "@/components/Confetti";
import { ToastContainer } from "@/components/Toast";
import { useToast } from "@/hooks/useAnimations";

const queryClient = new QueryClient();

const App = () => {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ShopProvider>
          <Toaster />
          <Sonner />
          
          {/* NEW: Animations */}
          <Confetti trigger={triggerConfetti} />
          <ToastContainer toasts={toasts} onRemove={removeToast} />
          <FloatingBag onOpenCart={() => navigate('/cart')} />
          
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/profile/:handle" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ShopProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
```

---

### 2. Use Toasts in Components

```tsx
import { useAppToast } from '@/context/ToastContext';

const MyComponent = () => {
  const { addToast } = useAppToast();

  const handleAddToCart = () => {
    // Add item logic
    addToast('Item added to cart! 🛍️', { type: 'success' });
  };

  const handleError = () => {
    addToast('Something went wrong', { type: 'error', duration: 5000 });
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
};
```

---

### 3. Use Confetti in Components

```tsx
import { useState } from 'react';
import Confetti from '@/components/Confetti';

const DropComponent = () => {
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  const handleDropStart = () => {
    setTriggerConfetti(true);
    // Reset for next trigger
    setTimeout(() => setTriggerConfetti(false), 2000);
  };

  return (
    <>
      <Confetti trigger={triggerConfetti} />
      <button onClick={handleDropStart}>
        Start Drop 🎉
      </button>
    </>
  );
};
```

---

### 4. Use FloatingBag in Layout

```tsx
// Already added to App.tsx globally, but custom usage:
import FloatingBag from '@/components/FloatingBag';
import { useNavigate } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();

  return (
    <div>
      <FloatingBag onOpenCart={() => navigate('/cart')} />
      {/* Rest of layout */}
    </div>
  );
};
```

---

### 5. Use Animation Hooks

#### Fade-in on Scroll
```tsx
import { useFadeInOnScroll } from '@/hooks/useAnimations';

const ImageGallery = () => {
  const { ref, isVisible } = useFadeInOnScroll(0.3);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <img src="/image.jpg" alt="Gallery" />
    </div>
  );
};
```

#### Hover Scale Effect
```tsx
import { useHoverScale } from '@/hooks/useAnimations';

const ScalableButton = () => {
  const ref = useHoverScale(1.1, 200);

  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>}>
      Hover me
    </button>
  );
};
```

#### Card Lift Effect
```tsx
import { useCardLift } from '@/hooks/useAnimations';

const LiftingCard = () => {
  const ref = useCardLift();

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="p-4 bg-card border rounded-lg"
    >
      Move your mouse over me
    </div>
  );
};
```

---

### 6. Tailwind Animation Classes

```html
<!-- Scale in from center -->
<div class="animate-scale-in">Content</div>

<!-- Slide up with fade -->
<div class="animate-slide-in">Content</div>

<!-- Gentle infinite bounce -->
<div class="animate-gentle-bounce">Bouncing</div>

<!-- Subtle glow effect -->
<div class="animate-subtle-glow">Glowing</div>

<!-- Pop entrance -->
<div class="animate-pop">Pop!</div>

<!-- Fade up entrance -->
<div class="animate-fade-in-up">Fading</div>
```

---

### 7. Update PostCard to Enhanced Version

**Option A: Replace existing**
```tsx
// Replace import in Feed.tsx
import PostCardEnhanced from '@/components/feed/PostCardEnhanced';

// Then use:
<PostCardEnhanced post={p} onBuy={onBuy} />
```

**Option B: Gradually migrate**
Keep original and create new feed pages using enhanced version.

---

### 8. Create Toast Context (Optional but Recommended)

```tsx
// context/ToastContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/useAnimations';

type ToastContextType = ReturnType<typeof useToast>;

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const toast = useToast();
  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  );
};

export const useAppToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAppToast must be used within ToastProvider');
  }
  return context;
};
```

Then wrap App:
```tsx
<ToastProvider>
  <App />
</ToastProvider>
```

---

### 9. Common Toast Patterns

```tsx
import { useAppToast } from '@/context/ToastContext';

const MyComponent = () => {
  const { addToast } = useAppToast();

  // Success
  const handleSuccess = () => {
    addToast('Operation completed!', { type: 'success' });
  };

  // Error with longer duration
  const handleError = () => {
    addToast('An error occurred', { type: 'error', duration: 5000 });
  };

  // Info notification
  const handleInfo = () => {
    addToast('New drop available!', { type: 'info' });
  };

  // Warning
  const handleWarning = () => {
    addToast('Low stock available', { type: 'warning' });
  };

  return (
    <div className="space-y-2">
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleInfo}>Info</button>
      <button onClick={handleWarning}>Warning</button>
    </div>
  );
};
```

---

### 10. Performance Tips

```tsx
// ✅ DO: Memoize callbacks to prevent re-renders
import { useCallback } from 'react';

const handleAddToCart = useCallback((product: Product) => {
  addToast(`${product.title} added!`, { type: 'success' });
}, [addToast]);

// ❌ DON'T: Create new functions every render
const handleClick = () => {
  // This recreates on every render
};

// ✅ DO: Use will-change for animated elements
<img className="will-change-transform hover:scale-105" />

// ✅ DO: Use transform/opacity for GPU acceleration
// ❌ DON'T: Animate width/height (causes reflow)
```

---

## File Structure Summary

```
src/
├── components/
│   ├── FloatingBag.tsx          ← Shopping bag component
│   ├── FloatingBag.css          ← Bag animations
│   ├── Toast.tsx                ← Toast notifications
│   ├── Toast.css                ← Toast animations
│   ├── Confetti.tsx             ← Confetti effect
│   ├── Confetti.css             ← Confetti animations
│   └── feed/
│       └── PostCardEnhanced.tsx  ← Enhanced post card
├── hooks/
│   └── useAnimations.ts         ← All animation hooks
├── context/
│   └── ToastContext.tsx         ← Optional toast context
├── App.tsx                      ← Updated with new components
└── index.css                    ← (Already has Tailwind)

tailwind.config.ts              ← Updated with new animations
```

---

## Environment Setup

No additional dependencies needed! Uses existing:
- React
- Tailwind CSS
- Lucide React (icons)
- Framer Motion (optional, but hooks handle animations)

---

## Testing

```tsx
// Test animations are working
describe('FloatingBag', () => {
  it('should trigger jiggle on item add', () => {
    const { getByRole } = render(<FloatingBag onOpenCart={() => {}} />);
    const bag = getByRole('button');
    expect(bag).toHaveClass('soft-bounce');
  });
});

// Test toast shows
describe('Toast', () => {
  it('should display notification', () => {
    const { addToast } = renderHook(() => useToast());
    addToast('Test message', { type: 'success' });
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
```

---

## Troubleshooting

**Q: Animations not showing?**
A: Ensure CSS files are imported in components

**Q: Confetti not appearing?**
A: Check canvas context 2d is available, ensure Confetti is at root level

**Q: FloatingBag too high?**
A: Adjust bottom/left values in FloatingBag.css based on navigation height

**Q: Toast position wrong?**
A: Change `fixed top-4 right-4` in Toast.tsx to preferred position

**Q: Hooks not working?**
A: Ensure components are wrapped in necessary providers

---

## Next Steps

1. ✅ Copy components to your project
2. ✅ Update App.tsx with new imports
3. ✅ Add ToastProvider (optional)
4. ✅ Import hooks in components
5. ✅ Test animations
6. ✅ Customize colors/timings
7. ✅ Deploy! 🚀

Enjoy your enhanced homepage! 🎉
