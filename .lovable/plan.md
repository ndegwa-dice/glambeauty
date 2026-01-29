
# Enhanced Salon Dashboard with Calendar & Stylist Selection

## Overview
Build a comprehensive salon dashboard with a calendar view matching the client side, enable clients to choose their preferred stylist during booking, implement robust booking clash prevention, and allow salon owners to mark sessions as complete.

---

## Current State Analysis

### What Already Works
- Salon dashboard shows today's bookings with confirm/complete/cancel actions
- Real-time subscription for bookings exists (lines 122-144 in Dashboard.tsx)
- Auto-assign stylist logic exists but clients cannot choose stylists manually
- `useAvailableSlots` checks for time conflicts but not per-stylist
- Client calendar shows week view with booking indicators

### What Needs to Be Built
1. **Salon Calendar View** - Same week-based calendar as client side for salon dashboard
2. **Stylist Selection in Booking** - Let clients pick a preferred stylist
3. **Per-Stylist Availability** - Update slot logic to check individual stylist schedules
4. **Clash Prevention** - Block booking if stylist is already booked for that time
5. **Visual Stylist Schedule** - Show client which stylists are booked and when
6. **Mark Session Complete** - Already exists, needs enhanced UI feedback

---

## Architecture Changes

### New Hook: useSalonBookings
Fetch all bookings for a salon for a date range (not just today) with real-time updates.

```text
Input: salonId, startDate, endDate
Output: bookings[] with full details (client, service, stylist, time)
Features: Real-time subscription, formatted for calendar display
```

### Updated Hook: useAvailableSlots
Add stylist-aware availability checking:
- New parameter: `stylistId` (optional)
- When stylist selected, only check that stylist's bookings for conflicts
- When no stylist, check all bookings (salon-wide availability)

### New Hook: useSalonStylistsWithAvailability
Extend existing `useSalonStylists` to include:
- Each stylist's bookings for a given date
- Busy time ranges per stylist
- Visual indicator of availability

---

## Salon Dashboard Calendar Component

### SalonCalendar.tsx
Similar to `ClientCalendar.tsx` but for salon view:
- Week navigation (same as client)
- Booking indicators per day (number of bookings)
- Click date to see bookings for that day
- Color coding: pending (amber), confirmed (green), completed (purple)

### Enhanced Today Tab
```text
+--------------------------------------------------+
|  [Calendar Week View - Same as Client Side]       |
|  Mon Tue Wed Thu Fri Sat Sun                     |
|   5   6   7   8   9  10  11                      |
|   ·   ·  ●●  ●  ·   ·   ●                        |
+--------------------------------------------------+
|                                                  |
|  === Selected Day: Thursday, Jan 29 ===          |
|                                                  |
|  [Booking Card] 09:00 - 10:00                    |
|  - Jane Wanjiku | Gel Manicure                   |
|  - Assigned: Sarah (avatar)                      |
|  - Status: Confirmed                             |
|  - [Mark Complete] [Cancel]                      |
|                                                  |
|  [Booking Card] 10:30 - 11:30                    |
|  - Mary Kamau | Hair Braiding                    |
|  - Assigned: Emma (avatar)                       |
|  - Status: Pending                               |
|  - [Confirm] [Cancel]                            |
|                                                  |
+--------------------------------------------------+
```

---

## Client-Side Stylist Selection

### Updated BookingSheet.tsx Flow
```text
Step 1: Select Service
Step 2: [NEW] Select Stylist (Optional)
        - Show all stylists who can do this service
        - Show busy indicators per stylist
        - "Any Available" option for auto-assign
Step 3: Select Date & Time
        - Slots now filtered by selected stylist's availability
        - If "Any Available", show all open slots
Step 4: Confirm Booking
```

### StylistPicker Component
```text
+--------------------------------------------------+
|  Choose Your Stylist                             |
+--------------------------------------------------+
|                                                  |
|  [●] Any Available Stylist                       |
|      We'll assign the first available            |
|                                                  |
|  [○] Sarah Mwangi                                |
|      Specialist in: Nails, Gel, Pedicure         |
|      Next available: 2:00 PM today               |
|                                                  |
|  [○] Emma Ochieng                                |
|      Specialist in: Hair, Braiding               |
|      Booked until: 4:00 PM                       |
|                                                  |
+--------------------------------------------------+
```

---

## Per-Stylist Availability Logic

### Modified useAvailableSlots Hook
```typescript
interface UseAvailableSlotsProps {
  salonId: string;
  date: Date | undefined;
  serviceDuration: number;
  stylistId?: string | null;  // NEW: Optional stylist filter
}

// Logic:
// 1. Fetch working hours (salon-wide)
// 2. Fetch bookings for date
//    - If stylistId provided: filter by stylist_id
//    - If not: check ALL bookings for time conflicts
// 3. Generate slots, marking unavailable where conflicts exist
```

### Real-Time Clash Prevention
When client selects a time slot:
1. Re-check availability immediately before booking insert
2. If slot taken (race condition), show error and refresh slots
3. Use Supabase RLS + unique constraint or application-level check

---

## Updated Booking Flow with Stylist Choice

### Client Perspective
1. Select service
2. See stylists who can perform that service
3. Pick specific stylist OR "Any Available"
4. Calendar shows availability based on stylist choice
5. If specific stylist picked, only their free slots shown
6. If "Any Available", all slots where at least one stylist is free
7. On confirm: Either save chosen stylist or auto-assign

### Salon Perspective (Real-Time Sync)
- New booking appears instantly in calendar
- Stylist assignment visible immediately
- Can reassign stylist if needed (future enhancement)

---

## Files to Create

### New Components
1. `src/components/salon/SalonCalendar.tsx` - Week calendar for salon dashboard
2. `src/components/booking/StylistPicker.tsx` - Stylist selection during booking
3. `src/components/salon/DayBookingsList.tsx` - List bookings for a selected day

### New/Updated Hooks
1. `src/hooks/useSalonBookings.ts` - Fetch bookings for date range with realtime
2. Update `src/hooks/useAvailableSlots.ts` - Add stylistId parameter

---

## Files to Modify

### Dashboard
- `src/pages/Dashboard.tsx` - Add calendar view, date-based filtering

### Booking Flow
- `src/components/client/BookingSheet.tsx` - Add stylist selection step
- `src/pages/SalonBooking.tsx` - Add stylist selection for non-logged-in users

### Hooks
- `src/hooks/useAvailableSlots.ts` - Per-stylist filtering

---

## Implementation Details

### useSalonBookings Hook
```typescript
interface SalonBookingWithDetails {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  client_name: string;
  client_phone: string;
  service_name: string;
  stylist_id: string | null;
  stylist_name: string | null;
  stylist_avatar: string | null;
  total_amount: number;
}

function useSalonBookings(salonId: string, startDate: string, endDate: string) {
  // Fetch bookings in date range
  // Real-time subscription
  // Group by date for calendar display
  return { bookings, bookingsByDate, loading };
}
```

### SalonCalendar Component
- Reuse structure from ClientCalendar.tsx
- Show booking count badges per day
- Click to filter bookings list below
- Sync with today's bookings state

### StylistPicker Component
- Fetch stylists for selected service via stylist_services join
- Show each stylist's current bookings for selected date
- Calculate "next available" time for display
- Radio selection: "Any" vs specific stylist

### Updated Availability Check
```typescript
// In useAvailableSlots
const fetchSlots = async () => {
  // ... existing working hours fetch ...
  
  // Modified bookings query
  let bookingsQuery = supabase
    .from("bookings")
    .select("start_time, end_time, stylist_id")
    .eq("salon_id", salonId)
    .eq("booking_date", dateStr)
    .neq("status", "cancelled");
  
  // Filter by stylist if specified
  if (stylistId) {
    bookingsQuery = bookingsQuery.eq("stylist_id", stylistId);
  }
  
  const { data: existingBookings } = await bookingsQuery;
  
  // ... rest of slot generation logic ...
};
```

---

## Real-Time Sync Architecture

```text
CLIENT DASHBOARD                    SALON DASHBOARD
      |                                    |
      |  Client books with stylist         |
      +-----------> Supabase <-------------+
                   Realtime                
      |                                    |
      |  Bookings subscription             |
      +<-------------------------------+   |
      |                                |   |
   Calendar updates                 Calendar updates
   Shows "Booked"                   Shows new booking
      |                                    |
      |                                    |
      +<------- Salon confirms booking ----+
      |                                    |
   Status badge                    Button changes to
   changes to                      "Mark Complete"
   "Confirmed"                            |
```

---

## Implementation Order

1. **Create useSalonBookings hook** - Date range fetching with realtime
2. **Create SalonCalendar component** - Week view for salon dashboard
3. **Update Dashboard.tsx** - Integrate calendar, date-based filtering
4. **Create StylistPicker component** - Stylist selection UI
5. **Update useAvailableSlots** - Add stylistId parameter
6. **Update BookingSheet.tsx** - Add stylist selection step
7. **Update SalonBooking.tsx** - Add stylist selection for public booking

---

## Edge Cases Handled

1. **No stylists assigned to service** - Show "Any Available" only, auto-assign on booking
2. **All stylists booked** - Show "No available slots" message
3. **Race condition** - Two clients booking same slot simultaneously
   - Handle with error message and slot refresh
4. **Stylist marked inactive** - Don't show in picker, don't affect existing bookings
5. **Service duration longer than remaining time** - Slot not shown

---

## UI/UX Enhancements

### Visual Clash Indicators
- Gray out slots where selected stylist is booked
- Show "Booked by [Client Name]" tooltip on hover (salon view only)
- Animated transition when slots update in real-time

### Mark Complete Flow
- Add satisfaction animation (sparkles/checkmark)
- Show completion time timestamp
- Update stylist's "available from" time

### Barbie Theme Consistency
- Stylist cards with gradient borders
- Selected stylist has glow effect
- Calendar matches client-side styling
- All components use existing card-glass, shimmer-glass classes
