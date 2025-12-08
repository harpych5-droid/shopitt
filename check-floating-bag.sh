#!/bin/bash

# FLOATING BAG SYSTEM - INTEGRATION CHECKLIST
# Run this script to verify all files are in place

echo "🔍 Checking Floating Bag System Integration..."
echo ""

# Check components
echo "📦 Components:"
[ -f "src/components/FloatingBag.tsx" ] && echo "  ✅ FloatingBag.tsx" || echo "  ❌ FloatingBag.tsx MISSING"
[ -f "src/components/BadgeCounter.tsx" ] && echo "  ✅ BadgeCounter.tsx" || echo "  ❌ BadgeCounter.tsx MISSING"
[ -f "src/components/ProductCard.tsx" ] && echo "  ✅ ProductCard.tsx" || echo "  ❌ ProductCard.tsx MISSING"

echo ""
echo "🎯 Hooks:"
[ -f "src/hooks/useBag.ts" ] && echo "  ✅ useBag.ts" || echo "  ❌ useBag.ts MISSING"
[ -f "src/hooks/useProductFly.ts" ] && echo "  ✅ useProductFly.ts" || echo "  ❌ useProductFly.ts MISSING"

echo ""
echo "📄 Documentation:"
[ -f "src/FLOATING_BAG_GUIDE.ts" ] && echo "  ✅ FLOATING_BAG_GUIDE.ts" || echo "  ❌ FLOATING_BAG_GUIDE.ts MISSING"
[ -f "FLOATING_BAG_README.md" ] && echo "  ✅ FLOATING_BAG_README.md" || echo "  ❌ FLOATING_BAG_README.md MISSING"

echo ""
echo "⚙️ Configuration:"
grep -q "FloatingBag" src/App.tsx && echo "  ✅ FloatingBag imported in App.tsx" || echo "  ❌ FloatingBag NOT imported in App.tsx"
grep -q "framer-motion" package.json && echo "  ✅ framer-motion in package.json" || echo "  ❌ framer-motion NOT in package.json"

echo ""
echo "📋 Next Steps:"
echo "  1. Update your Feed component to use ProductCard"
echo "  2. Implement backend endpoints: GET /api/bag/ and POST /api/bag/add/"
echo "  3. Test on desktop and mobile"
echo "  4. Customize colors/animations as needed"
echo ""
echo "🎉 Integration complete! Read FLOATING_BAG_README.md for details."
