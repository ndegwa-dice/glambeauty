

# Admin HQ Dashboard & Broadcast System

## What We're Building

1. **Admin role assignment** -- Add `admin` to the `app_role` enum and assign it to `davidndegwa013@gmail.com`
2. **HQ Admin Dashboard** (`/admin`) -- Real-time overview of all salons, clients, bookings, revenue, and platform health
3. **Broadcast system** -- A `broadcasts` table + in-app news feed so admin can push messages to all users

---

## Database Changes

### 1. Add `admin` to `app_role` enum
```sql
ALTER TYPE app_role ADD VALUE 'admin';
```

### 2. Assign admin role to davidndegwa013@gmail.com
Via an edge function or migration that looks up the user by email in `auth.users` and inserts into `user_roles`.

### 3. Create `broadcasts` table
```sql
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'update', -- update, alert, promo
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);
```
- RLS: Anyone authenticated can SELECT active broadcasts. Only admin can INSERT/UPDATE/DELETE.
- Enable realtime so new broadcasts push instantly.

### 4. Admin RLS policies
- Admin can SELECT all rows on `salons`, `bookings`, `profiles`, `user_roles`, `stylists` -- need new policies using `has_role(auth.uid(), 'admin')`.

---

## Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/pages/AdminDashboard.tsx` | Main HQ page with tabs: Overview, Salons, Clients, Bookings, Broadcasts |
| `src/hooks/useAdminStats.ts` | Fetches platform-wide counts and revenue in real-time |
| `src/hooks/useBroadcasts.ts` | CRUD for broadcasts (admin) + read for all users |
| `src/components/admin/AdminOverview.tsx` | KPI cards: total salons, clients, bookings, revenue |
| `src/components/admin/AdminSalonsList.tsx` | Searchable table of all salons with status |
| `src/components/admin/AdminClientsList.tsx` | Searchable table of all profiles/clients |
| `src/components/admin/AdminBookingsList.tsx` | All bookings with filters by status/date |
| `src/components/admin/BroadcastManager.tsx` | Create/edit/delete broadcasts |
| `src/components/client/BroadcastFeed.tsx` | In-app news feed component shown on client dashboard |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/admin` route |
| `src/hooks/useUserRole.ts` | Add `admin` to primaryRole logic |
| `src/pages/Auth.tsx` | Route admin users to `/admin` on login |
| `src/components/client/ClientDashboard.tsx` | Show broadcast feed at top of Home tab |

---

## HQ Dashboard Tabs

1. **Overview** -- Platform KPIs: total salons, total clients, total bookings (today/week/month), total revenue, active stylists. All with real-time subscriptions.
2. **Salons** -- Table with name, owner, city, stylist count, booking count, status. Click to view details.
3. **Clients** -- Table with name, email, phone, bookings count, total spent.
4. **Bookings** -- Filterable list of all bookings across all salons with status badges.
5. **Broadcasts** -- Create/manage announcements. Each broadcast has title, message, type (Update/Alert/Promo), active toggle, optional expiry.

## Broadcast Feed (All Users)

- A horizontal scrollable card strip at the top of the client Home tab
- Shows active, non-expired broadcasts ordered by newest
- Real-time subscription so new broadcasts appear instantly
- Dismissible per-session (not persisted)

## Security

- Admin access gated by `has_role(auth.uid(), 'admin')` in both RLS and frontend route guard
- Admin role cannot be self-assigned (no INSERT policy for admin role -- assigned via migration only)
- Broadcast table: authenticated SELECT for active, admin-only write

