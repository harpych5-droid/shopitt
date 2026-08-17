# Shopitt Feed

You are building the Shopitt web application frontend (React / Next.js preferred). This is a production-oriented social-commerce feed system optimized for impulse buying, high engagement, and smooth dopamine-driven UX.

DO NOT redesign the concept.

DO NOT simplify UI.

DO NOT convert into basic e-commerce layout.

This must feel like a high-end immersive social feed with commerce embedded.

----------------------------------------------------

🎯 CORE GOAL

----------------------------------------------------

Build a TikTok/Instagram-style FULLSCREEN vertical feed where users:

- Discover products

- Feel emotional urgency

- Can instantly buy

- Experience smooth, addictive interactions

Primary KPI:

→ maximize product clicks and purchases

----------------------------------------------------

🧱 TECH REQUIREMENTS

----------------------------------------------------

- React or Next.js

- Tailwind CSS (or equivalent utility styling)

- Framer Motion for animations

- Optimized image/video loading (lazy + prefetch next items)

- Mobile-first responsive design (must feel native-like web app)

----------------------------------------------------

📱 FEED STRUCTURE (CRITICAL)

----------------------------------------------------

Each feed item is a FULLSCREEN card (100vh):

1. MEDIA AREA (70–80% of screen height)

- Full-width image or video

- Must NOT crop important content

- Auto-fit media properly (object-cover with smart positioning)

- Subtle bottom gradient overlay for readability

2. OVERLAY CONTENT (ON MEDIA)

- Top-right: “Only X left” pill (orange, subtle pulse)

- Bottom-left:

  - Price (large, bold, white)

  - “Free Delivery Available” (small grey text with icon)

- Bottom-right:

  - PRIMARY CTA button: “Buy Now”

  - Gradient: #FF4D8D → #7B61FF

  - Soft glow + micro animation on idle

3. DROP TITLE (VERY IMPORTANT)

- Positioned TOP overlay of media

- Glassmorphism style (blur + transparency)

- Text example: “Collection🔥”, “Summer Drop”, etc.

- Smooth fade-in on load

- Must feel premium, not boxed or outlined

----------------------------------------------------

❤️ INTERACTIONS (DOPAMINE ENGINE)

----------------------------------------------------

Implement the following micro-interactions:

- Like button:

  → scale up slightly on tap

  → soft pink glow burst animation

- Save button:

  → quick “snap” animation

  → toggles state with smooth transition

- Scroll behavior:

  → momentum-based vertical scroll

  → snap between posts (subtle, not rigid)

- Media loading:

  → skeleton shimmer while loading

  → preload next 2 posts for smooth experience

----------------------------------------------------

👜 FLOATING BAG SYSTEM

----------------------------------------------------

- Fixed floating bag icon (bottom-right or bottom-center safe zone)

- Subtle floating/breathing animation (scale 1.0 ↔ 1.05)

- Badge shows item count

- On item add:

  → bag bounces slightly

  → number increments with animation

Click behavior:

- Opens bag page (simple first version)

- Shows:

  - item list

  - total price

  - checkout button (always visible, never cut off)

----------------------------------------------------

🔐 AUTH GATE (MUST IMPLEMENT)

----------------------------------------------------

- Users browse freely as guests

- When user triggers:

  - Buy

  - Like

  - Save

  - Comment

→ Show modal:

"Unlock Shopitt 🔥"

Button:

- Continue with Google (only auth method for now)

After login:

- return user to same action flow (no reset)

----------------------------------------------------

🧠 NAV + APPBAR BEHAVIOR

----------------------------------------------------

- Top navigation bar:

  - hides on scroll down

  - reappears on scroll up

- Category tabs:

  - below appbar

  - also hide/reappear with scroll behavior

----------------------------------------------------

🎨 DESIGN SYSTEM

----------------------------------------------------

- Background: #000000

- Primary gradient: #FF4D8D → #7B61FF

- Text: white + soft grey

- Success: green

- Warning: orange

Must use:

- glassmorphism (selectively)

- soft shadows

- smooth transitions (no harsh jumps)

----------------------------------------------------

⚡ PERFORMANCE RULES

----------------------------------------------------

- No layout shift on scroll

- Images must preload efficiently

- No lag between posts

- Keep animations lightweight

- Avoid excessive re-renders

----------------------------------------------------

🚫 DO NOT DO

----------------------------------------------------

- Do NOT build a basic e-commerce grid

- Do NOT use boring product cards

- Do NOT remove immersive full-screen feed

- Do NOT overload with UI elements

- Do NOT break scroll smoothness

----------------------------------------------------

🏁 FINAL OUTPUT EXPECTATION

----------------------------------------------------

A fully functional immersive feed that:

- feels like a social media app

- behaves like a shopping engine

- maximizes impulse buying behavior

- is smooth, fast, and visually addictive

This is NOT a prototype. It should feel like a real production-grade consumer product.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shopitt.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3c724318-e77c-4ab7-a137-449cb16f263e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `lovable` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
