

# Admin Command Center Upgrade

## Summary

Two deliverables:
1. **Admin login padlock** in the landing page footer -- a subtle lock icon that navigates to `/auth` for admin login
2. **Full Admin HQ upgrade** -- transform from basic tabs into a real-time command center with intelligence feed, smart KPIs with trends, city heat map, and automated insights

---

## Database Changes

### New table: `platform_insights`
```sql
CREATE TABLE public.platform_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'trend',
  severity text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
-- RLS: admin-only
-- Enable realtime
```

### Performance indexes
```sql
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_salons_city ON salons(city);
```

---

## Edge Function: `generate-insights`

A backend function (invoked manually from the admin dashboard or on a schedule) that:
- Queries bookings from last 24h vs previous 24h to detect growth/decline
- Queries revenue trends (weekly comparison)
- Checks stylist availability per city
- Inserts rows into `platform_insights` when thresholds are met (e.g., >30% growth, <5 active stylists in a city)

---

## Implementation

### 1. Footer Padlock (`Index.tsx`)
Add a small `Lock` icon button in the footer that links to `/auth`. Subtle, not labeled -- just an icon that admin knows about.

### 2. Upgrade `useAdminStats.ts`
Add week-over-week trend calculations:
- `bookingsGrowth` (% change vs last week)
- `revenueGrowth` (% change vs last week)
- `newClientsGrowth`
- `newSalonsGrowth`

Fetch current week vs previous week counts for comparison.

### 3. New hook: `useAdminInsights.ts`
- Fetches from `platform_insights` ordered by newest
- Real-time subscription for instant updates
- `markAsRead(id)` function

### 4. New component: `AdminInsightsFeed.tsx`
- Horizontal scrollable cards at top of dashboard
- Each card: icon by type (trend/alert/growth/warning), title, message, timestamp, severity badge (info=blue, warning=yellow, high=red, success=green)
- Dismiss button marks as read

### 5. Upgrade `AdminOverview.tsx` → Smart KPIs
- Each KPI card now shows trend arrow + percentage
- Green ▲ for positive, red ▼ for negative
- Compact sparkline-style indicator

### 6. New component: `AdminSalonHeatMap.tsx`
- Use a simple CSS-based city visualization (no heavy mapping library to keep bundle small)
- Cards for each city (Nairobi, Mombasa, Kisumu, Nakuru) showing salon count, booking count, and intensity indicator
- Color-coded by activity level

### 7. Upgrade `AdminDashboard.tsx` → Command Center Layout
Replace tab-based layout with a scrollable command center:

```text
┌─────────────────────────────────────┐
│  Header: Admin HQ + Generate Insights btn │
├─────────────────────────────────────┤
│  Insights Feed (horizontal scroll)  │
├─────────────────────────────────────┤
│  KPI Grid (4x2 smart cards)        │
├──────────────────┬──────────────────┤
│  City Heat Map   │  Recent Activity │
├──────────────────┴──────────────────┤
│  Tabs: Salons | Clients | Bookings | Broadcasts │
└─────────────────────────────────────┘
```

The overview + insights + heat map are always visible at top. The detail tables remain in tabs below.

---

## Files to Create/Edit

| File | Action |
|------|--------|
| Migration | `platform_insights` table + indexes + RLS |
| `supabase/functions/generate-insights/index.ts` | **NEW** -- insight generation logic |
| `supabase/config.toml` | Register new function |
| `src/pages/Index.tsx` | Add padlock icon in footer |
| `src/hooks/useAdminInsights.ts` | **NEW** -- fetch/subscribe insights |
| `src/hooks/useAdminStats.ts` | Add trend calculations |
| `src/components/admin/AdminInsightsFeed.tsx` | **NEW** -- intelligence feed |
| `src/components/admin/AdminSalonHeatMap.tsx` | **NEW** -- city activity map |
| `src/components/admin/AdminOverview.tsx` | Smart KPIs with trends |
| `src/pages/AdminDashboard.tsx` | Command center layout |

---

## Security
- `platform_insights` RLS: admin-only SELECT/UPDATE, service role INSERT (from edge function)
- Edge function uses service role key to insert insights
- Footer padlock just navigates to `/auth` -- no security bypass

