
# Full Salon Business Dashboard Suite with Stylist Login

## Overview

This plan transforms the current salon dashboard into a comprehensive business management suite with:
1. Enhanced dashboard with analytics, revenue tracking, and better calendar
2. Stylist authentication system with individual login credentials
3. Role-based access where stylists can view the salon dashboard with their assigned permissions

---

## Database Changes

### 1. Add Stylist Role Support

The `stylists` table already has a `user_id` column - we need to utilize this to link stylists to their auth accounts.

```sql
-- Add invitation tracking to stylists table
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending';
ALTER TABLE stylists ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;
```

### 2. Update RLS Policies

Add policies allowing stylists to view their assigned salon's data:

```sql
-- Stylists can view bookings for their salon
CREATE POLICY "Stylists can view their salon bookings"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stylists s 
    WHERE s.user_id = auth.uid() 
    AND s.salon_id = bookings.salon_id
    AND s.is_active = true
  )
);

-- Stylists can view their own stylist record
CREATE POLICY "Stylists can view their own record"
ON public.stylists FOR SELECT
USING (user_id = auth.uid());

-- Stylists can view salon details they belong to
CREATE POLICY "Stylists can view their salon"
ON public.salons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stylists s 
    WHERE s.user_id = auth.uid() 
    AND s.salon_id = salons.id
    AND s.is_active = true
  )
);
```

---

## New Components

### 1. Enhanced Dashboard Calendar

**File:** `src/components/salon/EnhancedCalendar.tsx`

Features:
- Month view option (in addition to week view)
- Full day timeline showing all appointments as blocks
- Drag-and-drop rescheduling (future enhancement)
- Visual distinction between stylists (color-coded)
- Time slots grid showing availability

```text
+--------------------------------------------------+
|  < January 2026 >    [Week] [Month]              |
+--------------------------------------------------+
|  Mon   Tue   Wed   Thu   Fri   Sat   Sun         |
|  [6]   [7]   [8]   [9]   [10]  [11]  [12]         |
|   2     3     1     -     4     6     -           |
|   .     .     .           .     .                 |
+--------------------------------------------------+
|  TIMELINE - January 8, 2026                      |
|  09:00  [=== Jane - Gel Nails ===]               |
|  10:00  [== Sarah - Lashes ==] [= Rose - Mani =] |
|  11:00  ........................................  |
|  12:00  [=== Jane - Full Set ===]                |
+--------------------------------------------------+
```

### 2. Analytics Dashboard Tab

**File:** `src/components/salon/AnalyticsDashboard.tsx`

Features:
- Revenue summary (today, this week, this month)
- Booking completion rate
- Popular services breakdown
- Busiest times visualization
- Client retention metrics

```text
+--------------------------------------------------+
|  Revenue This Month                               |
|  KES 45,600  +12% from last month                 |
+--------------------------------------------------+
|  [Today] [Week] [Month] [Year]                   |
|                                                  |
|  [Chart: Revenue over time]                      |
|                                                  |
+--------------------------------------------------+
|  Top Services         |  Team Performance        |
|  1. Gel Nails (32)    |  Jane: 24 bookings       |
|  2. Lashes (28)       |  Sarah: 18 bookings      |
|  3. Makeup (15)       |  Rose: 15 bookings       |
+--------------------------------------------------+
```

### 3. Stylist Invitation System

**File:** `src/components/salon/StylistInviteSheet.tsx`

Features:
- Email input for sending invitation
- Auto-generate temporary password or magic link
- Status tracking (pending, accepted, expired)
- Re-send invitation option

```text
+--------------------------------------------------+
|  Invite Team Member                              |
+--------------------------------------------------+
|  Name: [Sarah Wanjiku]                           |
|  Email: [sarah@example.com]                      |
|  Phone: [0712 345 678]                           |
|                                                  |
|  Services they can perform:                      |
|  [x] Gel Nails                                   |
|  [x] Manicure                                    |
|  [ ] Lashes                                      |
|                                                  |
|  [Send Invitation]                               |
+--------------------------------------------------+
```

### 4. Stylist Dashboard View

**File:** `src/pages/StylistDashboard.tsx`

A filtered view of the salon dashboard showing only:
- Their assigned bookings
- Their performance stats
- Salon schedule (read-only)
- Profile management

### 5. Updated Dashboard Tabs

**File:** `src/components/salon/DashboardTabs.tsx`

Expand tabs to include:
- **Today** - Current day overview with timeline
- **Calendar** - Full calendar with month/week views
- **Analytics** - Revenue and performance metrics
- **Services** - Service management (owner only)
- **Team** - Stylist management (owner only)
- **Settings** - Working hours and salon settings

---

## Updated Hooks

### 1. useStylistAuth Hook

**File:** `src/hooks/useStylistAuth.ts`

```typescript
// Determines if user is a stylist and fetches their salon
interface StylistAuthReturn {
  isStylist: boolean;
  stylistId: string | null;
  salonId: string | null;
  loading: boolean;
}
```

### 2. useSalonAnalytics Hook

**File:** `src/hooks/useSalonAnalytics.ts`

```typescript
// Fetches analytics data for the salon
interface AnalyticsData {
  revenue: { today: number; week: number; month: number };
  bookings: { total: number; completed: number; cancelled: number };
  topServices: Array<{ name: string; count: number; revenue: number }>;
  teamPerformance: Array<{ name: string; bookings: number; revenue: number }>;
}
```

---

## Auth Flow Changes

### Updated Sign-In Flow

```text
User Signs In
     |
     v
Check user_roles table
     |
     +---> salon_owner --> Dashboard (full access)
     |
     +---> stylist --> Check stylists table for user_id match
     |                     |
     |                     v
     |                 StylistDashboard (limited access)
     |
     +---> client --> ClientDashboard
```

### Stylist Onboarding Flow

1. Salon owner adds stylist with email
2. System creates stylist record with email
3. Invitation sent to stylist's email
4. Stylist signs up using the email
5. On signup, check if email exists in stylists table
6. If match found, link user_id and assign "stylist" role
7. Redirect to StylistDashboard

---

## File Changes Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/salon/EnhancedCalendar.tsx` | Month/week view calendar with timeline |
| `src/components/salon/CalendarTimeline.tsx` | Day timeline showing appointment blocks |
| `src/components/salon/AnalyticsDashboard.tsx` | Revenue and performance analytics |
| `src/components/salon/AnalyticsCard.tsx` | Reusable analytics stat card |
| `src/components/salon/StylistInviteSheet.tsx` | Invitation form for stylists |
| `src/pages/StylistDashboard.tsx` | Stylist-specific dashboard view |
| `src/hooks/useStylistAuth.ts` | Hook for stylist authentication state |
| `src/hooks/useSalonAnalytics.ts` | Hook for fetching analytics data |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Add analytics tab, enhanced calendar, role-based rendering |
| `src/pages/Auth.tsx` | Handle stylist invitation acceptance |
| `src/components/salon/DashboardTabs.tsx` | Add "Analytics" and "Calendar" tabs |
| `src/components/salon/StylistFormSheet.tsx` | Add email field and invitation option |
| `src/components/salon/StylistManager.tsx` | Show invitation status, re-send option |
| `src/hooks/useUserRole.ts` | Add stylist role detection |
| `src/App.tsx` | Add StylistDashboard route |

---

## Technical Details

### Enhanced Calendar Implementation

The calendar will use a custom grid-based layout:

```typescript
// Calendar view modes
type CalendarView = "week" | "month";

// Timeline slot representation
interface TimeSlot {
  time: string; // "09:00"
  bookings: BookingBlock[];
}

interface BookingBlock {
  id: string;
  stylistId: string;
  stylistName: string;
  stylistColor: string; // For visual distinction
  serviceName: string;
  clientName: string;
  startTime: string;
  duration: number; // in minutes
}
```

### Stylist Color Coding

Each stylist gets a unique color for calendar visualization:

```typescript
const STYLIST_COLORS = [
  "#EC4899", // Pink
  "#8B5CF6", // Purple  
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
];
```

### Analytics Calculations

Revenue and stats computed from bookings table:

```sql
-- Monthly revenue
SELECT SUM(total_amount) 
FROM bookings 
WHERE salon_id = ? 
  AND status = 'completed'
  AND booking_date >= date_trunc('month', CURRENT_DATE);
```

---

## Security Considerations

1. **Role Separation**: Stylists can only view, not modify salon settings
2. **Data Isolation**: RLS policies ensure stylists only see their salon's data
3. **Invitation Validation**: Email must match to link stylist to auth account
4. **Owner Permissions**: Only salon owners can invite/remove team members

---

## Implementation Order

1. **Database migrations** - Add stylist email column and RLS policies
2. **useStylistAuth hook** - Detect stylist role and fetch salon
3. **Enhanced Calendar** - Build month/week views with timeline
4. **Analytics Dashboard** - Revenue and performance metrics
5. **Stylist Invitation** - Update form with email and invitation
6. **Auth flow updates** - Handle stylist signup linking
7. **Stylist Dashboard** - Create limited view for stylists
8. **Testing** - Verify role-based access and data isolation

