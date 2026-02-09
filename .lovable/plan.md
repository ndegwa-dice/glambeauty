

# Premium Discover Section Enhancement Plan

## Overview
Transform the client Discover section into a premium, ad-placement-ready marketplace with parallax scrolling, animated countdown timers, Google Calendar sync, and emotional personalized notifications. This section will be the revenue engine for GLAMOS.

---

## Key Features Summary

### 1. Premium Discover Section with Parallax
- Full-screen premium layout with parallax-scrolling background images
- Featured/Sponsored salons section at the top (monetization ready)
- "All Salons" grid view when tapping the floating action button
- Smooth scroll animations with depth effects

### 2. Featured Salon Ads (Revenue Engine)
- Premium placement badges for paying salons
- "Featured" / "Sponsored" / "Hot Right Now" sections
- Database support for `is_featured`, `featured_until`, `ad_tier` columns
- Visual distinction with special glow effects and larger cards

### 3. Full Salon Feed (Show ALL Salons)
- When tapping "+" button, open a full-screen sheet showing ALL salons
- Grid layout with search and filters
- Infinite scroll pagination
- Quick book action on each salon card

### 4. Google Calendar Sync
- OAuth integration with Google Calendar API
- Sync client appointments to their personal Google Calendar
- Sync salon owner/stylist calendars with their bookings
- Real-time two-way sync with event creation on booking confirmation

### 5. Animated Countdown Timer
- Beautiful countdown showing days/hours/minutes/seconds until next appointment
- Emotional, on-brand messaging that evolves as appointment approaches
- Animated ring/progress indicator with GLAMOS brand colors
- Messages like:
  - "7 days" -> "Your glow-up is around the corner, queen!"
  - "1 day" -> "Tomorrow is YOUR day to shine!"
  - "2 hours" -> "Almost time! Get ready to feel amazing!"

### 6. Custom In-App Notifications
- Personalized notification cards with emotional messaging
- Real-time updates for booking confirmations, reminders, status changes
- Animated notification bell with unread count
- Push notification support (future enhancement)

---

## Database Schema Changes

### Updates to `salons` Table

```text
New columns:
- is_featured (boolean, default false) - Paid featured status
- featured_until (timestamptz, nullable) - When feature expires
- ad_tier (text, nullable) - "premium" | "standard" | "basic"
- featured_image_url (text, nullable) - Special hero image for featured salons
- rating_avg (numeric, nullable) - Cached average rating
- review_count (integer, default 0) - Cached review count
```

### New `user_calendar_sync` Table

```text
┌─────────────────────────────────────────────────────────────────────┐
│  user_calendar_sync                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  id (uuid, PK)                                                      │
│  user_id (uuid) - Link to auth user                                 │
│  provider (text) - "google"                                         │
│  access_token (text, encrypted)                                     │
│  refresh_token (text, encrypted)                                    │
│  token_expires_at (timestamptz)                                     │
│  calendar_id (text) - Google calendar ID (usually "primary")        │
│  is_active (boolean, default true)                                  │
│  last_synced_at (timestamptz)                                       │
│  created_at, updated_at                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### New `user_notifications` Table

```text
┌─────────────────────────────────────────────────────────────────────┐
│  user_notifications                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  id (uuid, PK)                                                      │
│  user_id (uuid)                                                     │
│  type (text) - "booking_confirmed" | "reminder" | "status_change"   │
│  title (text)                                                       │
│  message (text)                                                     │
│  emoji (text, nullable)                                             │
│  booking_id (uuid, FK, nullable)                                    │
│  is_read (boolean, default false)                                   │
│  created_at                                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```text
src/
├── components/
│   ├── client/
│   │   ├── DiscoverSection.tsx           # NEW - Premium discover with parallax
│   │   ├── FeaturedSalonCard.tsx         # NEW - Large featured salon card
│   │   ├── SalonFeedSheet.tsx            # NEW - Full salon listing sheet
│   │   ├── SalonGridCard.tsx             # NEW - Grid card for feed
│   │   ├── AppointmentCountdown.tsx      # NEW - Animated countdown timer
│   │   ├── EmotionalMessage.tsx          # NEW - Dynamic emotional messages
│   │   ├── NotificationBell.tsx          # NEW - Notification bell icon
│   │   ├── NotificationSheet.tsx         # NEW - Notifications list
│   │   ├── NotificationCard.tsx          # NEW - Individual notification
│   │   ├── CalendarSyncButton.tsx        # NEW - Google Calendar connect button
│   │   ├── SalonDiscovery.tsx            # UPDATED - Integrate new features
│   │   └── ClientDashboard.tsx           # UPDATED - New layout
│   └── ui/
│       └── countdown-ring.tsx            # NEW - Circular countdown component
├── hooks/
│   ├── useDiscoverSalons.ts              # UPDATED - Add featured filtering
│   ├── useFeaturedSalons.ts              # NEW - Fetch featured salons
│   ├── useAppointmentCountdown.ts        # NEW - Countdown logic & messages
│   ├── useGoogleCalendarSync.ts          # NEW - Calendar sync logic
│   ├── useNotifications.ts               # NEW - Notifications management
│   └── useParallaxScroll.ts              # NEW - Container scroll parallax
├── lib/
│   └── emotional-messages.ts             # NEW - Countdown message library
└── pages/
    └── ...
```

---

## Implementation Phases

### Phase 1: Database & Premium Salon Infrastructure
1. Add featured columns to `salons` table (`is_featured`, `featured_until`, `ad_tier`)
2. Create `user_notifications` table with RLS
3. Update `useDiscoverSalons` hook to support featured filtering
4. Create `useFeaturedSalons` hook

### Phase 2: Premium Discover UI with Parallax
1. Create `DiscoverSection.tsx` with scroll-based parallax background
2. Build `FeaturedSalonCard.tsx` with premium glow effects and "Featured" badge
3. Create horizontal carousel for featured salons at top
4. Add category chips with premium styling
5. Implement parallax effect tied to scroll position in the container

### Phase 3: Full Salon Feed Sheet
1. Create `SalonFeedSheet.tsx` - full-screen sheet showing ALL salons
2. Build `SalonGridCard.tsx` for grid layout
3. Add search input with real-time filtering
4. Implement pagination/infinite scroll
5. Update floating "+" button to open this sheet

### Phase 4: Animated Countdown Timer
1. Create `AppointmentCountdown.tsx` component
2. Build `countdown-ring.tsx` UI component with SVG circle animation
3. Create `lib/emotional-messages.ts` with message library
4. Implement `useAppointmentCountdown` hook with interval updates
5. Add emotional messages that change based on time remaining:
   - 7+ days: "Your glow-up is loading..."
   - 3-7 days: "Beauty countdown begins!"
   - 1-2 days: "Almost time to shine, queen!"
   - Same day: "Today's the day! Get ready!"
   - Under 2 hours: "Your moment is here!"

### Phase 5: In-App Notifications System
1. Create `user_notifications` table
2. Build `NotificationBell.tsx` with animated unread badge
3. Create `NotificationSheet.tsx` for notification list
4. Build `NotificationCard.tsx` with emotional styling
5. Implement `useNotifications` hook with realtime subscription
6. Create database trigger to auto-generate notifications on booking events

### Phase 6: Google Calendar Sync
1. Set up Google Calendar connector
2. Create `user_calendar_sync` table
3. Build `CalendarSyncButton.tsx` component
4. Create `useGoogleCalendarSync` hook
5. Create edge function `sync-google-calendar` for OAuth flow
6. On booking confirmation, create Google Calendar event
7. Display sync status in user profile

---

## Technical Considerations

### Parallax Scroll in Container
Since the client dashboard uses a scrollable container (not window scroll), we'll create a custom hook:

```text
useParallaxScroll:
- Attach scroll listener to container ref
- Calculate parallax offset based on scrollTop
- Return transform values for background layers
```

### Countdown Timer Performance
- Use `setInterval` with 1-second updates only when < 1 hour remaining
- Use minute-based updates for > 1 hour
- Clean up intervals on unmount
- Memoize message calculations

### Notification Realtime
- Subscribe to `user_notifications` table changes
- Play subtle sound/animation on new notification
- Auto-mark as read when sheet is opened

### Google Calendar Integration
- Use Lovable Cloud's Google Calendar connector
- OAuth flow handled by gateway
- Store tokens securely in encrypted columns
- Refresh tokens automatically before expiry

---

## UI/UX Highlights

### Discover Section Layout (Top to Bottom)

```text
┌──────────────────────────────────────────┐
│  Parallax Background (salon ambiance)    │
│  ┌────────────────────────────────────┐  │
│  │  APPOINTMENT COUNTDOWN              │  │
│  │  ┌───────────────────────────────┐ │  │
│  │  │  🎀 2 days, 14 hours, 32 min  │ │  │
│  │  │  "Your glow-up is almost here"│ │  │
│  │  └───────────────────────────────┘ │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ⭐ FEATURED SALONS                       │
│  ┌────────────────────────────────────┐  │
│  │ [Featured Card] [Featured Card] →  │  │
│  └────────────────────────────────────┘  │
│                                          │
│  🏪 DISCOVER BY CATEGORY                  │
│  ┌────────────────────────────────────┐  │
│  │ [All] [Nails💅] [Braids] [Makeup] │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ [Salon] [Salon] [Salon] [Salon]   │  │
│  │ [Salon] [Salon] [Salon] [Salon]   │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### Countdown Timer Visual

```text
       ╭──────────────────╮
       │   2d 14h 32m     │
       │  ┌───────────┐   │
       │  │   ⏰      │   │  <- Animated ring
       │  │  14:32    │   │
       │  └───────────┘   │
       │                  │
       │ "Almost time to  │
       │   shine, queen!" │
       ╰──────────────────╯
```

### Emotional Message Progression

| Time Until Appt | Message | Emoji |
|-----------------|---------|-------|
| 7+ days | "Your transformation awaits..." | ✨ |
| 3-7 days | "The countdown to fabulous begins!" | 💫 |
| 1-2 days | "One more sleep until glow-up time!" | 🌙 |
| Same day (6+ hr) | "Today's the day, gorgeous!" | 👑 |
| 2-6 hours | "Get ready to feel amazing!" | 💅 |
| < 2 hours | "Your moment has arrived!" | 🎀 |
| 30 min | "Almost there, queen!" | 💖 |

### Featured Salon Card Premium Effects
- Larger card with full-bleed cover image
- Gold/Pink "FEATURED" badge with sparkle animation
- Subtle pulsing glow around card border
- Rating stars prominently displayed
- "Book VIP" premium CTA button

---

## CSS Animations to Add

```text
@keyframes countdown-pulse - Gentle pulsing for countdown ring
@keyframes star-sparkle - Sparkle effect for featured badge
@keyframes notification-bounce - Bounce for new notification
@keyframes parallax-float - Subtle floating for background elements
@keyframes progress-fill - Ring fill animation for countdown
```

---

## Security & RLS Policies

### `user_notifications`
- Users can only read their own notifications
- Users can update `is_read` on their own notifications
- System/triggers can insert notifications

### `user_calendar_sync`
- Users can only CRUD their own calendar sync records
- Tokens stored encrypted (service key required to decrypt)

### `salons` (featured columns)
- Public read access for `is_featured`, `ad_tier`
- Only salon owners can update their own salon info
- Admin-level access to set featured status (future enhancement)

---

## Deliverables Summary

1. **Premium Discover Section** - Parallax background, layered UI, premium feel
2. **Featured Salons Carousel** - Revenue-ready ad placements
3. **Full Salon Feed** - All salons accessible from one tap
4. **Animated Countdown** - Emotional, brand-consistent timer
5. **Notification System** - In-app notifications with personality
6. **Google Calendar Sync** - Seamless calendar integration (requires connector setup)

