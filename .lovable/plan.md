

# Avatar & Salon Brand Control Plan

## What We're Building

1. **User avatar upload** -- All users (clients, stylists, salon owners) can upload a profile photo from their dashboard header, stored in a new `avatars` storage bucket
2. **Salon brand assets** -- Logo, cover photo upload in salon dashboard settings with live preview
3. **Service images** -- Each service gets an optional `image_url` so salons can showcase their work per service
4. **Discovery integration** -- Salon cards in discover section properly display logo, cover, and service images

---

## Database Changes

### Add `image_url` to `services` table
```sql
ALTER TABLE services ADD COLUMN image_url text;
```

### Create `avatars` storage bucket
Public bucket for user profile photos with RLS so users can only upload to their own folder.

---

## Implementation

### 1. User Avatar Upload (All Roles)

**`DashboardHeader.tsx`** -- Add a camera icon overlay on the avatar. Tapping opens file picker. Upload to `avatars/{user_id}/avatar-{timestamp}.ext`, then call `updateProfile({ avatar_url })`.

**`ClientDashboard.tsx`** -- The header already shows `profile?.avatar_url`. Just needs the upload action wired in.

**Salon owner dashboard (`Dashboard.tsx`)** -- Same header pattern with avatar upload.

### 2. Salon Brand Control (Settings Tab)

Create **`src/components/salon/SalonBrandManager.tsx`**:
- Logo upload (square, displayed in a rounded container with border)
- Cover/banner photo upload (wide aspect ratio preview)
- Live preview card showing how the salon appears in discovery
- Uploads go to `avatars/{salon_id}/logo-{ts}.ext` and `avatars/{salon_id}/cover-{ts}.ext`
- Updates `salons` table: `logo_url`, `cover_image_url`, `featured_image_url`

Integrate into `Dashboard.tsx` settings tab alongside `WorkingHoursManager`.

### 3. Service Images

**`ServiceFormSheet.tsx`** -- Add image upload field with preview thumbnail. Upload to `avatars/{salon_id}/service-{ts}.ext`.

**`ServiceCard.tsx`** (salon side) -- Show service image thumbnail on the left side of the card.

**`src/components/booking/ServiceCard.tsx`** (client side) -- Show service image in booking flow cards.

### 4. Discovery Cards Update

**`FeaturedSalonCard.tsx`** and **`SalonGridCard.tsx`** already handle `cover_image_url` and `logo_url` -- no changes needed, they'll automatically display uploaded assets.

---

## Files to Create/Edit

| File | Action |
|------|--------|
| `supabase migration` | Add `image_url` to services, create avatars bucket + RLS |
| `src/components/client/DashboardHeader.tsx` | Add avatar upload with camera overlay |
| `src/components/salon/SalonBrandManager.tsx` | **NEW** -- Logo + cover upload with preview |
| `src/components/salon/ServiceFormSheet.tsx` | Add image upload field |
| `src/components/salon/ServiceCard.tsx` | Show service image thumbnail |
| `src/components/booking/ServiceCard.tsx` | Show service image in booking |
| `src/pages/Dashboard.tsx` | Add SalonBrandManager to settings tab |

---

## Storage Structure

```text
avatars/
├── {user_id}/
│   └── avatar-{timestamp}.jpg
├── {salon_id}/
│   ├── logo-{timestamp}.png
│   ├── cover-{timestamp}.jpg
│   └── service-{timestamp}.jpg
```

All uploads use the public `avatars` bucket. RLS policies ensure authenticated users can upload to their own folder path.

