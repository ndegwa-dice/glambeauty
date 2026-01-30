
# GLAM254 Premium Hero Section with Parallax Motion

## Overview
Build a stunning, motion-rich hero section featuring Tracy's portrait as a blurred background, Lando Norris-style parallax scroll effects, floating glassmorphism cards, and a premium app mockup - all embodying Nairobi luxury beauty vibes.

---

## Visual Architecture

```text
+------------------------------------------------------------------+
|  [FULL-SCREEN BACKGROUND]                                         |
|  Tracy portrait (blurred) + dark gradient overlay                 |
|  + animated particles + purple glow                               |
|                                                                   |
|  +---------------------------+  +----------------------------+    |
|  | LEFT SIDE (Content)       |  | RIGHT SIDE (App Mockup)    |    |
|  |                           |  |                            |    |
|  | "GLAM254"                 |  |  +----------------------+  |    |
|  | "Beauty, Booked in        |  |  |  Phone Frame         |  |    |
|  |  Seconds."                |  |  |  - Calendar view     |  |    |
|  |                           |  |  |  - Confirmed stylist |  |    |
|  | "Tracy doesn't wait..."   |  |  |  - Deposit paid      |  |    |
|  |                           |  |  +----------------------+  |    |
|  | [Book a Salon Now]        |  |      (3D tilt + parallax)  |    |
|  | [For Salons: Get...]      |  |                            |    |
|  +---------------------------+  +----------------------------+    |
|                                                                   |
|  +-------------+ +-------------+ +-------------+                  |
|  | Deposit to  | | Smart Beauty| | Verified    |                  |
|  | Confirm     | | Calendar    | | Stylists    |                  |
|  +-------------+ +-------------+ +-------------+                  |
|  (Floating glass cards with parallax movement)                    |
|                                                                   |
|                        [Scroll hint arrow]                        |
+------------------------------------------------------------------+
```

---

## Implementation Strategy

### 1. Background Layer (Tracy Portrait)
- Copy Tracy's image to `src/assets/hero-tracy.jpg`
- Apply CSS blur filter (8-12px for elegant silhouette)
- Dark gradient overlay: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(13,13,15,0.9))`
- Soft purple glow spot behind headline
- Parallax: background moves at 50% scroll speed using `transform: translateY(calc(var(--scroll-y) * 0.5))`

### 2. Animated Particles
- Create a CSS-only particle system using pseudo-elements
- 10-15 small dots that float gently across the screen
- Subtle opacity and blur for dreamy effect
- Keyframe animation for continuous floating motion

### 3. Hero Content (Left Side)
**Headline Section:**
- Logo: "GLAM254" with gradient text
- Main headline: "Beauty, Booked in Seconds."
- Purple glow effect behind text using CSS filter
- Staggered fade-in animations on load

**Microcopy:**
- "Tracy doesn't wait for replies. She books."
- Subtle italic styling, fades in after headline

**Subtext:**
- "Browse salons, book stylists, pay a deposit, and show up confirmed. No DMs. No calls. No stress."

**CTA Buttons:**
- Primary: "Book a Salon Now" - gradient background, hover glow, scale effect
- Secondary: "For Salons: Get More Bookings" - outline style, hover border glow

### 4. App Mockup (Right Side - Desktop Only)
**Phone Frame Design:**
- Modern phone bezel using CSS borders/shadows
- Screen content showing:
  - Calendar with bookings highlighted
  - "Confirmed with Sarah" stylist card
  - "Deposit Paid" badge

**3D Effects:**
- Subtle rotateX/rotateY for depth
- Parallax movement (faster than background)
- Soft drop shadow for floating effect
- Hover tilt effect using mouse position

### 5. Floating Glass Cards
**Three feature cards:**
1. "Deposit to Confirm" - Credit card icon
2. "Smart Beauty Calendar" - Calendar icon
3. "Verified Stylists" - Star/check icon

**Styling:**
- Glassmorphism: `backdrop-blur-xl`, semi-transparent background
- Purple glow edges on hover
- Parallax: each card moves at different speeds
- Subtle hover tilt animation

### 6. Scroll Hint
- Minimal animated arrow/chevron at bottom
- Fade out on scroll
- "Scroll to explore" microcopy (optional)

---

## File Structure

### Files to Create

1. **`src/components/hero/HeroSection.tsx`** - Main hero component
   - Manages scroll state and parallax transforms
   - Orchestrates all sub-components

2. **`src/components/hero/ParallaxBackground.tsx`** - Background with Tracy
   - Blurred portrait
   - Gradient overlay
   - Purple glow spots

3. **`src/components/hero/AnimatedParticles.tsx`** - Floating particles
   - CSS-only animated dots
   - Random positions and delays

4. **`src/components/hero/HeroContent.tsx`** - Left side content
   - Headline, subtext, CTAs
   - Entrance animations

5. **`src/components/hero/AppMockup.tsx`** - Phone mockup
   - 3D tilting effect
   - Mock app UI inside

6. **`src/components/hero/FloatingCards.tsx`** - Glass feature cards
   - Three cards with icons
   - Parallax positioning

7. **`src/components/hero/ScrollHint.tsx`** - Bottom scroll indicator
   - Animated chevron

### Files to Modify

1. **`src/pages/Index.tsx`** - Replace current hero with new HeroSection
2. **`src/index.css`** - Add new parallax and animation keyframes
3. **`tailwind.config.ts`** - Add new animation utilities

---

## Technical Implementation

### Custom Hook: useParallax
```typescript
// Tracks scroll position and calculates parallax transforms
function useParallax() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Returns transform values for different parallax speeds
  return {
    slow: scrollY * 0.3,   // Background
    medium: scrollY * 0.5, // Cards
    fast: scrollY * 0.7,   // Mockup
  };
}
```

### Custom Hook: useMouseTilt
```typescript
// Creates 3D tilt effect based on mouse position
function useMouseTilt(ref: RefObject<HTMLElement>, intensity = 10) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: y * intensity, y: -x * intensity });
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    return () => element.removeEventListener('mousemove', handleMouseMove);
  }, [ref, intensity]);
  
  return tilt;
}
```

### New CSS Animations
```css
/* Floating particles */
@keyframes float-particle {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
  50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
}

/* Entrance animations - staggered */
@keyframes hero-fade-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Glow pulse behind headline */
@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

/* Scroll hint bounce */
@keyframes scroll-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}
```

---

## Component Details

### ParallaxBackground
- Full-screen fixed background
- Tracy image with object-fit: cover
- CSS blur filter: 8px
- Z-index: -1 (behind everything)
- Transform: translateY based on scroll for parallax

### AnimatedParticles
- Absolutely positioned container
- 12 particle elements with randomized:
  - Positions (left, top percentages)
  - Animation delays (0-5s)
  - Sizes (2-6px)
  - Opacities (0.2-0.5)
- Pointer-events: none

### HeroContent
- Max-width container for text
- Staggered animation delays:
  - Logo: 0s
  - Headline: 0.2s
  - Microcopy: 0.4s
  - Subtext: 0.6s
  - CTAs: 0.8s
- Purple glow spot using absolute positioned div with blur

### AppMockup (Desktop Only)
- Hidden on mobile (lg:block)
- Phone frame: rounded-3xl, dark border
- Inner screen with gradient background
- Mock UI elements:
  - "Today" header
  - Calendar row with highlighted date
  - Booking card with stylist avatar
  - "Deposit Paid" green badge
- CSS transform for 3D perspective
- Mouse-following tilt effect

### FloatingCards
- Flex row on desktop, stack on mobile
- Each card:
  - Icon (emoji or Lucide icon)
  - Title text
  - Glassmorphism styling
  - Different parallax offset
  - Hover: scale + glow border

---

## Responsive Behavior

### Mobile (< 768px)
- Tracy background: centered, less blur
- Content: full-width, centered text
- App mockup: hidden
- Floating cards: horizontal scroll or 2x2 grid
- Buttons: full-width, stacked

### Desktop (>= 1024px)
- Two-column layout: content left, mockup right
- Floating cards: row below content
- Full parallax effects active
- Mouse tilt on mockup

---

## Performance Considerations

1. **Passive scroll listeners** - use `{ passive: true }` for smooth scroll
2. **CSS transforms only** - no layout-triggering properties for animations
3. **will-change hints** - applied to parallax elements
4. **Reduced motion** - respect `prefers-reduced-motion` media query
5. **Image optimization** - Tracy image should be reasonably sized (max 1MB)

---

## Implementation Order

1. Copy Tracy image to assets
2. Add new CSS keyframes and utilities
3. Create useParallax hook
4. Create ParallaxBackground component
5. Create AnimatedParticles component
6. Create HeroContent with animations
7. Create FloatingCards component
8. Create AppMockup with 3D effects
9. Create ScrollHint component
10. Build HeroSection to combine all
11. Replace Index.tsx hero section
12. Test parallax and animations
13. Responsive adjustments

---

## Brand Consistency

- Uses existing color variables (--primary, --secondary)
- Maintains Barbie Glamour aesthetic
- Leverages existing utility classes:
  - `gradient-primary`, `gradient-barbie`
  - `glow-pink`, `glow-barbie`
  - `card-glass`, `shimmer-glass`
  - `text-gradient`
- Typography: Outfit for headlines, DM Sans for body
