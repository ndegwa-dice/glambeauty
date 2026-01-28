
# Two-Way Authentication & Real-Time Dashboard System

## Overview
Build a comprehensive two-way authentication system separating **Clients** from **Salon Owners**, with role-specific dashboards that sync in real-time. Include service card management for salons, stylists handling, and automatic slot allocation with stylist assignment.

---

## Current State Analysis

### What Already Exists
- Basic auth (`signUp`, `signIn`, `signOut`) in `useAuth.tsx`
- Single auth page (`/auth`) for both login and signup
- `user_roles` table with `app_role` enum: `salon_owner`, `stylist`, `client`
- Salon dashboard (`/dashboard`) - currently assumes everyone is a salon owner
- Client dashboard (`/client`) - separate page but no role check
- Real-time bookings subscription already working
- `stylists` table exists with `salon_id` foreign key
- `stylist_services` junction table for service assignments
- `bookings` table has `stylist_id` column (nullable)

### What Needs to Be Built
1. Role selection during signup
2. Role-based routing after authentication
3. Enhanced salon dashboard with stylists + services management
4. Automatic stylist allocation on booking
5. Real-time sync between client and salon dashboards

---

## Authentication Flow

### Signup Flow
```text
+----------------+     +------------------+     +------------------+
|  Auth Page     | --> |  Role Selection  | --> |  Onboarding     |
|  (Email/Pass)  |     |  Client / Salon  |     |  (role-based)   |
+----------------+     +------------------+     +------------------+
                                                        |
                          +-----------------------------+
                          |                             |
                          v                             v
                   +-----------+               +----------------+
                   |  Client   |               |  Salon Owner   |
                   |  Dashboard|               |  Onboarding    |
                   |  /client  |               |  /onboarding   |
                   +-----------+               +----------------+
```

### Login Flow
```text
+----------------+     +------------------+
|  Auth Page     | --> |  Check Role      |
|  (Email/Pass)  |     |  in user_roles   |
+----------------+     +------------------+
                              |
            +-----------------+-----------------+
            |                                   |
            v                                   v
     +-----------+                      +----------------+
     |  Client   |                      |  Salon Owner   |
     |  /client  |                      |  /dashboard    |
     +-----------+                      +----------------+
```

---

## Database Changes

### New Policy for user_roles INSERT
Currently users cannot insert their own roles. We need to add this capability securely during signup:

```sql
-- Allow users to assign themselves client role during signup
CREATE POLICY "Users can assign themselves client role"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND role = 'client'
    );
```

**Note**: Salon owner role is assigned in `Onboarding.tsx` after creating a salon - this already works via the current INSERT that bypasses RLS (needs fix).

### Enable Realtime for More Tables
```sql
-- Enable realtime for stylists changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.stylists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
```

---

## New Hook: useUserRole

Create `src/hooks/useUserRole.ts`:
- Fetches user's role(s) from `user_roles` table
- Returns `{ role, loading, hasRole(role) }`
- Used for conditional routing and UI display

```typescript
// Example usage
const { role, loading, hasRole } = useUserRole();
if (hasRole('salon_owner')) navigate('/dashboard');
else navigate('/client');
```

---

## Updated Auth Flow

### Auth Page Modifications
1. Add role selection tabs/buttons on **signup** only
2. After signup, automatically assign selected role
3. After login, check existing role and redirect accordingly

### New Components

**RoleSelector.tsx**
- Beautiful toggle between "I'm a Client" and "I Own a Salon"
- Barbie-styled cards with icons
- Pink glow on selected option

---

## Salon Dashboard Enhancements

### Current Dashboard (`/dashboard`)
Shows: Today's bookings, quick stats, booking link

### Enhanced Dashboard Structure
```text
+--------------------------------------------------+
|  Header: Salon Name + Owner Avatar               |
+--------------------------------------------------+
|                                                  |
|  [Tab: Today] [Tab: Bookings] [Tab: Services]    |
|  [Tab: Team]  [Tab: Settings]                    |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  === TODAY TAB ===                               |
|  - Today's appointments with client + service   |
|  - Assigned stylist per booking                  |
|  - Confirm/Complete actions                      |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  === SERVICES TAB ===                            |
|  - List of services with cards                   |
|  - Add/Edit/Delete service                       |
|  - Price, duration, deposit info                 |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  === TEAM TAB (Stylists) ===                     |
|  - Stylist cards with avatar, name, bio          |
|  - Assign services to each stylist               |
|  - Add/Edit/Remove stylists                      |
|                                                  |
+--------------------------------------------------+
```

---

## New Salon Dashboard Components

### 1. Services Management
**`src/components/salon/ServiceManager.tsx`**
- List all salon services
- Add new service form
- Edit/delete existing services
- Fields: name, description, duration, price, deposit

**`src/components/salon/ServiceFormSheet.tsx`**
- Bottom sheet for adding/editing service
- Form with validation

### 2. Stylists Management
**`src/components/salon/StylistManager.tsx`**
- List all stylists with cards
- Add/edit stylist info
- Assign services to stylists

**`src/components/salon/StylistCard.tsx`**
- Display stylist avatar, name, bio
- Services they can perform
- Toggle active status

**`src/components/salon/StylistFormSheet.tsx`**
- Bottom sheet for adding/editing stylist
- Service assignment checkboxes

### 3. Booking Details Card
**`src/components/salon/SalonBookingCard.tsx`**
- Enhanced booking card showing:
  - Client name + phone
  - Service + duration
  - Assigned stylist (with avatar)
  - Time slot
  - Status with actions (Confirm, Complete, Cancel)

---

## Automatic Stylist Allocation

### Logic Flow
When a client books a service:
1. Find stylists who can perform the selected service (via `stylist_services`)
2. Check each stylist's availability for the selected time slot
3. Auto-assign the first available stylist
4. If no stylist available, leave `stylist_id` null (owner handles manually)

### Implementation
**`src/hooks/useAutoAssignStylist.ts`**

```typescript
// Pseudocode
async function autoAssignStylist(salonId, serviceId, date, startTime, endTime) {
  // 1. Get stylists who can do this service
  const eligibleStylists = await supabase
    .from('stylist_services')
    .select('stylist_id')
    .eq('service_id', serviceId);

  // 2. Check each stylist's bookings for conflicts
  for (const stylist of eligibleStylists) {
    const conflicts = await checkConflicts(stylist.id, date, startTime, endTime);
    if (!conflicts) return stylist.id;
  }
  
  return null; // No available stylist
}
```

### Booking Flow Update
Update `BookingSheet.tsx` and `SalonBooking.tsx`:
1. Before inserting booking, call `autoAssignStylist()`
2. Include `stylist_id` in the booking insert
3. Show assigned stylist in confirmation

---

## Client Dashboard Updates

### Show Stylist in Booking Cards
Update `ClientBookingCard.tsx` to prominently display:
- Stylist avatar with glow border
- Stylist name
- "Your stylist for this appointment"

### Real-Time Stylist Updates
When salon assigns/changes stylist, client sees update instantly (already supported via existing realtime subscription).

---

## Files to Create

### Hooks
1. `src/hooks/useUserRole.ts` - Role checking and routing
2. `src/hooks/useSalonServices.ts` - Fetch/manage services with realtime
3. `src/hooks/useSalonStylists.ts` - Fetch/manage stylists with realtime
4. `src/hooks/useAutoAssignStylist.ts` - Automatic stylist allocation logic

### Salon Dashboard Components
1. `src/components/salon/ServiceManager.tsx` - Services list + management
2. `src/components/salon/ServiceCard.tsx` - Individual service display
3. `src/components/salon/ServiceFormSheet.tsx` - Add/edit service form
4. `src/components/salon/StylistManager.tsx` - Stylists list + management
5. `src/components/salon/StylistCard.tsx` - Individual stylist display
6. `src/components/salon/StylistFormSheet.tsx` - Add/edit stylist form
7. `src/components/salon/SalonBookingCard.tsx` - Enhanced booking card
8. `src/components/salon/DashboardTabs.tsx` - Tab navigation

### Auth Components
1. `src/components/auth/RoleSelector.tsx` - Client/Salon selection UI

---

## Files to Modify

### Auth & Routing
- `src/pages/Auth.tsx` - Add role selection during signup, role-based redirect after login
- `src/pages/Onboarding.tsx` - Ensure salon_owner role is assigned
- `src/App.tsx` - Add protected route logic

### Dashboards
- `src/pages/Dashboard.tsx` - Complete overhaul with tabs (Today, Services, Team)
- `src/pages/ClientPage.tsx` - Add role check, ensure only clients access

### Booking Flow
- `src/components/client/BookingSheet.tsx` - Add auto-assign stylist before booking
- `src/components/client/ClientBookingCard.tsx` - Show assigned stylist

---

## Real-Time Sync Architecture

```text
+------------------+                      +------------------+
|  CLIENT BOOKS    |                      |  SALON SEES      |
|  (selects service|  ----> Supabase ---> |  new booking     |
|   + date/time)   |       Realtime       |  instantly       |
+------------------+                      +------------------+

+------------------+                      +------------------+
|  CLIENT SEES     |  <---- Supabase <--- |  SALON CONFIRMS  |
|  status update   |       Realtime       |  or assigns      |
|  + stylist       |                      |  stylist         |
+------------------+                      +------------------+
```

Both dashboards subscribe to:
- `bookings` table changes
- `stylists` table changes (for availability)
- `services` table changes (for menu updates)

---

## Implementation Order

1. **Database Migration** - Add RLS policy for user_roles INSERT, enable realtime for stylists/services
2. **useUserRole Hook** - Role fetching and checking
3. **Auth Page Update** - Role selection + role-based redirect
4. **Onboarding Fix** - Ensure proper role assignment
5. **Salon Services Management** - CRUD for services
6. **Salon Stylists Management** - CRUD for stylists + service assignment
7. **Auto-Assign Stylist** - Hook for automatic allocation
8. **Update Booking Flow** - Include stylist in booking
9. **Enhanced Booking Cards** - Show stylist in both dashboards
10. **Dashboard Tabs** - Organize salon dashboard sections

---

## Security Considerations

1. **Role Assignment**: Only allow users to self-assign `client` role. `salon_owner` role assigned only after creating a salon (via trigger or secure function)
2. **Protected Routes**: Check role before rendering dashboard content
3. **RLS Policies**: Existing policies already protect data access correctly
4. **Stylist Assignment**: Only salon owners can manually reassign stylists

---

## UI/UX Notes

### Barbie Theme Consistency
- Role selector cards with pink glow on selection
- Service cards with gradient borders
- Stylist cards with avatar glow rings
- All forms use existing dark glass styling
- Success animations with sparkles

### Mobile-First
- Bottom sheets for all forms
- Touch-friendly targets (44px min)
- Swipeable tabs on dashboard
- Pull-to-refresh for bookings

