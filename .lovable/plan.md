

# Admin Power Upgrade: Verification, Disputes, Targeted Broadcasts

## What We're Building

1. **Salon Verification System** -- New `is_verified` column on salons. Only verified salons appear in client discovery. Admin can verify/unverify from the Salons tab.
2. **Dispute System** -- New `disputes` table. Clients and salons can file disputes; admin sees and resolves them from a new Disputes tab.
3. **Targeted Broadcasts** -- Add `audience` column to broadcasts (`all`, `clients`, `salons`). Admin picks audience when creating. Client feed filters by audience. Salon dashboard shows relevant broadcasts.
4. **Enhanced Clients & Bookings Views** -- Show booking counts, total spent per client. Show all pending bookings with full client details.

---

## Database Changes

### 1. Add `is_verified` to salons
```sql
ALTER TABLE salons ADD COLUMN is_verified boolean DEFAULT false;
```

### 2. Add `audience` to broadcasts
```sql
ALTER TABLE broadcasts ADD COLUMN audience text DEFAULT 'all';
-- values: 'all', 'clients', 'salons'
```

### 3. Create disputes table
```sql
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  filed_by_user_id uuid NOT NULL,
  filed_by_role text NOT NULL, -- 'client' or 'salon'
  salon_id uuid,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'open', -- open, investigating, resolved, dismissed
  admin_notes text,
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: admin can SELECT/UPDATE all, users can SELECT own, users can INSERT own
```

---

## Implementation

### Salon Verification
- **`AdminSalonsList.tsx`**: Add Verify/Unverify toggle button per salon row. Call `supabase.from('salons').update({ is_verified })`. Show verification badge.
- **`useDiscoverSalons.ts`**: Add `.eq("is_verified", true)` filter so only verified salons appear in client discovery.
- **Admin needs UPDATE on salons**: Add RLS policy for admin to update all salons.

### Disputes
- **New `src/components/admin/AdminDisputesList.tsx`**: Table of all disputes with status filters, expandable details, resolution form.
- **New `src/hooks/useDisputes.ts`**: CRUD for disputes.
- **Client-side**: A "Report Issue" button on booking history cards that opens a dispute filing sheet.
- **Salon-side**: Similar "Report" button on booking cards.
- **`AdminDashboard.tsx`**: Add Disputes tab with count badge for open disputes.

### Targeted Broadcasts
- **`BroadcastManager.tsx`**: Add audience selector (All Users / Clients Only / Salons Only) in the create/edit form.
- **`useBroadcasts.ts`**: Pass `audience` in create/update.
- **`BroadcastFeed.tsx`** (client side): Filter broadcasts where `audience` is `'all'` or `'clients'`.
- **Salon dashboard**: Show broadcasts where `audience` is `'all'` or `'salons'` (add a small feed component or reuse BroadcastFeed with a role filter).

### Enhanced Admin Views
- **`AdminClientsList.tsx`**: Join with bookings to show booking count and total spent per client.
- **`AdminBookingsList.tsx`**: Add "Pending" quick filter, show full client details (name, phone, email via profile join).

---

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration | `is_verified` on salons, `audience` on broadcasts, `disputes` table + RLS |
| `src/components/admin/AdminSalonsList.tsx` | Add verify/unverify toggle |
| `src/components/admin/AdminDisputesList.tsx` | **NEW** -- disputes management |
| `src/components/admin/AdminClientsList.tsx` | Show booking stats per client |
| `src/components/admin/AdminBookingsList.tsx` | Pending filter, client details |
| `src/components/admin/BroadcastManager.tsx` | Add audience selector |
| `src/hooks/useDisputes.ts` | **NEW** -- disputes CRUD |
| `src/hooks/useBroadcasts.ts` | Add audience field |
| `src/hooks/useDiscoverSalons.ts` | Filter by `is_verified = true` |
| `src/components/client/BroadcastFeed.tsx` | Filter by audience |
| `src/components/client/BookingHistory.tsx` | Add "Report Issue" button |
| `src/pages/AdminDashboard.tsx` | Add Disputes tab |

