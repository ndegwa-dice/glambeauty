

# Fix: Build Error, Missing Countdown, and Booking Flow

## Three Issues to Fix

### 1. Build Error -- `send-stylist-invite` Resend import
The edge function imports `npm:resend@2.0.0` which fails without a `deno.json`. Fix by switching to `esm.sh` import (same pattern as the supabase-js import in the same file).

**File**: `supabase/functions/send-stylist-invite/index.ts`
- Change `import { Resend } from "npm:resend@2.0.0"` to `import { Resend } from "https://esm.sh/resend@2.0.0"`

### 2. Countdown Timer Missing from Home Tab
The `AppointmentCountdown` component currently only appears inside the Discover tab (via `DiscoverSection`). It needs to also appear on the Home tab.

Additionally, `nextBooking` from `useClientBookings` has a flat structure (`salon_name`, `service_name`) but `AppointmentCountdown` expects nested objects (`service: { name }`, `salon: { name }`). Need to transform the data.

**File**: `src/components/client/ClientDashboard.tsx`
- Import `AppointmentCountdown`
- Add it to the Home tab (above BroadcastFeed)
- Transform `nextBooking` to match the expected shape: `{ booking_date, start_time, service: { name: nextBooking.service_name }, salon: { name: nextBooking.salon_name } }`

### 3. Bookings Not Appearing on Salon Dashboard
The booking insert in `BookingSheet` looks correct. The likely issue is the `useDiscoverSalons` filter `.eq("is_verified", true)` -- if a salon isn't verified, clients can't discover it to book. But if the booking was already made, the salon dashboard should still show it.

Let me verify the salon dashboard's booking query uses the correct RLS. The `useSalonBookings` hook filters by `salon_id` and date range. The RLS policy "Salon owners can view their salon bookings" uses `owns_salon(auth.uid(), salon_id)`. This should work.

The more likely issue: the salon dashboard may be filtering by week, and the booking date might be outside the current week view. Or the booking status filtering could be wrong. The real-time subscription looks correct.

I'll also check if there's any issue with the booking insert itself -- the `client_phone` field is NOT NULL in the schema but `profile?.phone_number` could be empty string or null.

**Files to fix**:
1. `supabase/functions/send-stylist-invite/index.ts` -- fix import
2. `src/components/client/ClientDashboard.tsx` -- add countdown to Home tab with data transform

---

## Detailed Changes

### `supabase/functions/send-stylist-invite/index.ts`
Line 2: Change `npm:resend@2.0.0` to `https://esm.sh/resend@2.0.0`

### `src/components/client/ClientDashboard.tsx`
- Import `AppointmentCountdown`
- Create a transformed `nextBookingForCountdown` useMemo that maps flat fields to nested structure
- Add `<AppointmentCountdown>` at the top of the Home tab content (before `<BroadcastFeed />`)

