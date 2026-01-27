
# Client Barbie Dashboard - Your One-Stop Beauty Shop

## Overview
Transform `/salon/:slug` into a stunning, girly client dashboard with a "Barbie" aesthetic - think pink glows, sparkles, and premium glass effects. This will be the client's personal beauty command center where they can discover salons, browse services, book appointments, and track their bookings - all synced in real-time with salon owners.

---

## Visual Identity: "Glamour Barbie Edition"

### Enhanced Color Scheme
- **Hot Pink Primary**: `#E879F9` with intense glowing effects
- **Rose Gold Accents**: `#F9A8D4` for elegant touches
- **Soft Lavender**: `#A78BFA` for secondary elements
- **Deep Plum Background**: `#0D0D0F` maintaining the dark premium feel
- **Sparkle White**: `#FAFAFA` for text and highlights

### New CSS Effects
```text
.glow-barbie        -> Intense multi-layered pink glow
.shimmer-glass      -> Animated shimmer on glass cards
.sparkle-border     -> Gradient animated border
.float-animation    -> Gentle floating motion for decorative elements
.gradient-barbie    -> Pink to rose gold to lavender gradient
```

### Decorative Elements
- Floating sparkle icons
- Animated gradient orbs in background
- Heart and star accents
- Rose gold dividers

---

## Dashboard Layout Structure

```text
+--------------------------------------------------+
|  Personalized Header                              |
|  "Hey, [Name]! Ready to glow?" (Sparkles icon)    |
|  Profile avatar with pink glow ring              |
+--------------------------------------------------+
|                                                  |
|  [===== Real-Time Beauty Calendar =====]         |
|  Week view with booking dots                     |
|  Pink dots = upcoming, Purple = completed        |
|  Tap date to see appointments                    |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [===== My Upcoming Appointments =====]          |
|  Glassy cards with:                              |
|  - Service name + pretty icon                    |
|  - Date/time in elegant format                   |
|  - Stylist avatar + name with glow border        |
|  - Salon name with location                      |
|  - Status badge (Confirmed/Pending)              |
|  - Cancel/Reschedule options                     |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  [===== Discover Salons =====]                   |
|  Horizontal scrollable glass cards:              |
|  - Salon cover image with gradient overlay       |
|  - Name + location                               |
|  - "Book Now" pink CTA button                    |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  Floating "Quick Book" FAB with glow pulse       |
|                                                  |
+--------------------------------------------------+
```

---

## New Files to Create

### Components
1. `src/components/client/ClientDashboard.tsx` - Main dashboard content
2. `src/components/client/ClientCalendar.tsx` - Real-time week/month calendar
3. `src/components/client/ClientBookingCard.tsx` - Individual booking display
4. `src/components/client/SalonDiscovery.tsx` - Horizontal salon browser
5. `src/components/client/BookingSheet.tsx` - Bottom sheet for new bookings
6. `src/components/client/StylistCard.tsx` - Display stylist info with services
7. `src/components/client/DashboardHeader.tsx` - Personalized greeting header

### Hooks
1. `src/hooks/useClientBookings.ts` - Fetch and subscribe to client's bookings
2. `src/hooks/useDiscoverSalons.ts` - Fetch active salons for discovery

---

## Files to Modify

### Complete Rewrite
- `src/pages/SalonBooking.tsx` - Replace salon booking with client dashboard

### Style Updates
- `src/index.css` - Add Barbie glow classes and animations

---

## Real-Time Architecture

### Client Bookings Subscription
```text
Subscribe to: bookings table
Filter: client_user_id = current user
Events: INSERT, UPDATE, DELETE
Result: Instant calendar and card updates when salon confirms/modifies
```

### Bi-Directional Sync Flow
```text
+------------------+                      +------------------+
|  Client Makes    |  ----> Supabase ---> |  Salon Dashboard |
|  New Booking     |       Realtime       |  Updates Instant |
+------------------+                      +------------------+

+------------------+                      +------------------+
|  Client Sees     |  <---- Supabase <--- |  Salon Confirms  |
|  Status Change   |       Realtime       |  Booking         |
+------------------+                      +------------------+
```

---

## Feature Details

### 1. Personalized Header
- Greeting based on time of day ("Good morning, [Name]!")
- User avatar with animated pink glow ring
- Settings icon with notification badge
- Logout option in dropdown

### 2. Real-Time Calendar
- Week view by default (swipe for months)
- Pink dots for upcoming bookings
- Purple dots for past/completed
- Tap date to filter bookings below
- Uses `react-day-picker` with custom Barbie styling

### 3. Booking Cards
Each card displays:
- Service icon (nail, hair, makeup) based on service name
- Service name in gradient text
- Date in pretty format ("Sat, Jan 25")
- Time with clock icon
- Stylist avatar with glow border (if assigned)
- Salon name with location pin
- Status badge with appropriate colors:
  - Pending: Amber glow
  - Confirmed: Green glow  
  - Completed: Purple
- Action buttons: Reschedule, Cancel

### 4. Salon Discovery
- Horizontal scroll with snap
- Glass cards with cover image
- Gradient overlay with salon name
- Location badge
- "Book Now" button with glow
- Tap card to see services

### 5. Quick Booking Flow (Bottom Sheet)
When user taps a salon:
1. Sheet slides up with salon services
2. User selects service
3. Date picker appears
4. Time slots load (real-time availability)
5. Confirm button creates booking
6. Success animation with confetti/sparkles

---

## Database Queries

### Fetch Client Bookings
```sql
SELECT 
  b.*,
  s.name as salon_name,
  s.address as salon_address,
  s.logo_url,
  srv.name as service_name,
  srv.duration_minutes,
  srv.price,
  st.name as stylist_name,
  st.avatar_url as stylist_avatar
FROM bookings b
JOIN salons s ON b.salon_id = s.id
JOIN services srv ON b.service_id = srv.id
LEFT JOIN stylists st ON b.stylist_id = st.id
WHERE b.client_user_id = auth.uid()
ORDER BY b.booking_date DESC, b.start_time ASC
```

### Fetch Active Salons
```sql
SELECT * FROM salons 
WHERE is_active = true 
ORDER BY created_at DESC
```

---

## CSS Additions (Barbie Theme)

```css
/* Intense barbie glow */
.glow-barbie {
  box-shadow: 
    0 0 20px rgba(232, 121, 249, 0.5),
    0 0 40px rgba(232, 121, 249, 0.3),
    0 0 60px rgba(232, 121, 249, 0.2);
}

/* Animated shimmer effect */
@keyframes shimmer-barbie {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer-glass {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(232, 121, 249, 0.1) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer-barbie 3s ease-in-out infinite;
}

/* Floating sparkle animation */
@keyframes float-sparkle {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

.sparkle-float {
  animation: float-sparkle 3s ease-in-out infinite;
}

/* Rose gold gradient */
.gradient-barbie {
  background: linear-gradient(
    135deg,
    #E879F9 0%,
    #F9A8D4 50%,
    #A78BFA 100%
  );
}

/* Pulsing glow for FAB */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(232, 121, 249, 0.4); }
  50% { box-shadow: 0 0 40px rgba(232, 121, 249, 0.7); }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

---

## User Journey

1. **Client logs in** -> Redirected to `/client` (new route) or dashboard
2. **Dashboard loads** -> See calendar + upcoming bookings + discover salons
3. **Browse salons** -> Swipe through discovery carousel
4. **Tap salon** -> Bottom sheet opens with services
5. **Select service** -> Date/time picker appears with real-time slots
6. **Confirm booking** -> Success animation, card appears in "Upcoming"
7. **Salon confirms** -> Badge updates from "Pending" to "Confirmed" in real-time
8. **Day of appointment** -> Reminder shown prominently

---

## Route Structure

### Option A: New Client Route (Recommended)
- `/client` - Client dashboard (authenticated clients)
- `/salon/:slug` - Keep as public booking page for non-authenticated users

### Option B: Replace Salon Booking (Per Request)
- `/salon/:slug` - Becomes client dashboard
- Lose public booking capability

**Recommendation**: Create new `/client` route while keeping `/salon/:slug` for public access. But per your request, I'll replace `/salon/:slug` entirely with the client dashboard.

---

## Authentication Flow

- Dashboard requires authentication
- If not logged in -> Redirect to `/auth`
- After login -> User lands on beautiful Barbie dashboard
- Show client role only (not salon owner view)

---

## Empty States

### No Bookings Yet
```text
+----------------------------------+
|         (Nail polish icon)        |
|   No appointments yet, queen! 💅  |
|                                   |
|   "Treat yourself to something    |
|    beautiful today"               |
|                                   |
|   [Browse Salons] (glowing CTA)   |
+----------------------------------+
```

### No Salons Found
```text
+----------------------------------+
|       (Sparkle icon)              |
|   Salons coming soon!             |
|   Check back for amazing beauty   |
|   spots near you                  |
+----------------------------------+
```

---

## Implementation Order

1. **Update CSS** - Add Barbie glow effects, animations, gradient utilities
2. **Create Hooks** - `useClientBookings`, `useDiscoverSalons` with real-time
3. **Build Components** - Calendar, BookingCard, SalonDiscovery, BookingSheet
4. **Build Dashboard** - Assemble all components in ClientDashboard
5. **Replace SalonBooking** - Swap content for client dashboard
6. **Polish Animations** - Add shimmer, sparkles, transitions

---

## Technical Notes

- Uses existing `useAuth` hook for user context
- Leverages `useAvailableSlots` for booking flow
- Real-time via Supabase `channel.on('postgres_changes')`
- All queries respect RLS policies (clients see own bookings only)
- No database migrations required
- Mobile-first responsive design

