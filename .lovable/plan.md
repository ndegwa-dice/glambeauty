

# UI Enhancement: Discovery Feed, Sparkle Background, Dynamic Countdown, Detailed Salon Booking Card

## Summary

Four upgrades:
1. **Salon discovery → vertical scroll** instead of horizontal carousel
2. **Animated sparkle background** with 3D parallax gradient across the full app
3. **Enhanced countdown timer** -- more dynamic, real-time, emotionally engaging
4. **Detailed salon booking card** -- richer client info for salon owners

---

## 1. Salon Discovery Vertical Scroll

**File**: `src/components/client/SalonDiscovery.tsx`

Change the horizontal scroll container (`overflow-x-auto`, `min-w-[280px]`, `snap-x`) to a vertical grid layout. Each card takes full width, stacked vertically with spacing. Keep the cover image, salon info, and Book Now button.

**File**: `src/components/client/DiscoverSection.tsx`

Same treatment for the Featured Salons section -- convert from horizontal carousel to vertical stack.

---

## 2. Animated Sparkle Background

**New file**: `src/components/ui/SparkleBackground.tsx`

A full-screen fixed background component using pure CSS/canvas that renders:
- Floating sparkle particles (small dots with glow, randomized position/size/opacity)
- CSS keyframe animations for twinkling and drifting motion
- Deep charcoal-black base with subtle gradient layers (primary/secondary glows)
- Multiple parallax-speed layers for a 3D depth effect

**File**: `src/components/layout/MobileLayout.tsx`

Add `<SparkleBackground />` as a fixed layer behind all content.

**File**: `src/index.css`

Add sparkle keyframes: `@keyframes sparkle-float`, `@keyframes sparkle-twinkle` with randomized delays.

---

## 3. Enhanced Dynamic Countdown

**File**: `src/components/client/AppointmentCountdown.tsx`

Major visual upgrade:
- Larger, more prominent card with animated gradient border
- Individual digit displays for days/hours/minutes/seconds (flip-clock style boxes)
- Each digit box has its own glow animation
- Pulsing sparkle effects around the countdown
- Richer emotional messaging with bigger emoji and bolder typography
- Progress ring becomes more animated with gradient glow trail
- When urgent (<2h): intense pink pulse, "Get ready queen!" messaging
- When imminent (<30min): full glow-barbie with sparkle burst

**File**: `src/hooks/useAppointmentCountdown.ts`

Ensure the timer always ticks every second (currently only ticks per-second under 1 hour). Change to always update every second for real-time feel.

**File**: `src/components/ui/countdown-ring.tsx`

Add animated gradient glow trail on the progress arc, sparkle at the leading edge of the progress circle.

---

## 4. Detailed Salon Booking Card

**File**: `src/components/salon/SalonBookingCard.tsx`

Expand the card to show much more detail for salon owners:
- Booking date prominently displayed (not just time)
- Client email (add to the interface, fetched from profile)
- Duration calculation (end_time - start_time displayed as "1h 30m")
- Service price breakdown
- Booking created timestamp ("Booked 2 days ago")
- Notes field if present
- Visual timeline indicator (where this booking sits in the day)
- Larger client avatar with gradient border
- Status-specific action hints ("Confirm within 2 hours" for pending)

**File**: `src/hooks/useSalonBookings.ts`

Expand the select query to also fetch `client_email` from the profiles table (join `bookings.user_id` → `profiles.id` → `profiles.email` or similar), and `created_at` from bookings, and `notes` if the column exists.

**File**: `src/components/salon/SalonBookingCard.tsx` interface

Add new fields: `client_email`, `created_at`, `notes`, `service_price`, `duration_minutes`.

---

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/client/SalonDiscovery.tsx` | Convert to vertical scroll grid |
| `src/components/client/DiscoverSection.tsx` | Convert featured to vertical stack |
| `src/components/ui/SparkleBackground.tsx` | **NEW** -- animated sparkle layer |
| `src/components/layout/MobileLayout.tsx` | Add SparkleBackground |
| `src/index.css` | Add sparkle keyframes |
| `src/components/client/AppointmentCountdown.tsx` | Visual upgrade with digit boxes, richer messaging |
| `src/hooks/useAppointmentCountdown.ts` | Always tick every second |
| `src/components/ui/countdown-ring.tsx` | Animated glow trail |
| `src/components/salon/SalonBookingCard.tsx` | Detailed booking card with all client info |
| `src/hooks/useSalonBookings.ts` | Fetch additional fields (email, created_at) |

