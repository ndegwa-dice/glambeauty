

# Stylist Invite System & Salon Dashboard Access

## What We're Building

1. **Automatic email invitations** -- When a salon owner adds a stylist, an invite email is sent automatically with a signup link
2. **Stylist access to salon dashboard** -- Stylists can view their salon's dashboard in read-only mode alongside their own dashboard
3. **Real-time invitation tracking** -- Salon owners see live status updates (Pending, Accepted, Active)

---

## How It Works

### Invitation Flow

```text
Salon Owner adds stylist (name + email)
          |
          v
Edge function "send-stylist-invite" triggered
          |
          v
Email sent to stylist with invite link:
  /auth?invite=true&email=sarah@example.com
          |
          v
Stylist clicks link -> Auth page pre-fills email
          |
          v
On signup, DB trigger "link_stylist_on_signup"
auto-links them + assigns "stylist" role
          |
          v
Stylist redirected to /stylist dashboard
with access to salon bookings, calendar, etc.
```

### Stylist Dashboard Enhancement

The stylist dashboard gets a new **"Salon View"** tab that shows a read-only version of the salon owner's dashboard -- calendar, today's bookings, team stats -- so the stylist has full visibility into salon operations while managing their own schedule.

---

## Implementation Details

### 1. Edge Function: `send-stylist-invite`

A backend function that:
- Receives stylist name, email, and salon name
- Generates an invite link with pre-filled email: `/auth?invite=true&email=...`
- Sends a branded GLAMOS invitation email using the built-in Supabase email (Resend)
- Updates the stylist record with `invitation_status: 'sent'`

### 2. Updated Salon Owner Flow (`StylistManager`)

- Replace `StylistFormSheet` with the existing `StylistInviteSheet` for new stylists
- After creating the stylist record in the database, call the edge function to send the email
- Show real-time invitation status on `StylistCard` (Pending -> Sent -> Accepted -> Active)

### 3. Auth Page Updates

- Detect `?invite=true&email=...` query params
- Auto-switch to "Create Account" tab
- Pre-fill the email field (read-only so they use the correct email)
- Show a welcome message: "You've been invited to join [Salon Name]!"

### 4. Stylist Dashboard: Salon View Tab

Add a 4th tab "Salon" to the stylist dashboard that shows:
- Salon-wide booking calendar (all stylists, not just theirs)
- Today's full schedule across the team
- Team member list with availability status
- Salon performance stats (read-only)

### 5. Database Migration

- Add `invitation_token` column to `stylists` for tracking unique invite links
- Update `invitation_status` to support: `pending`, `sent`, `accepted`, `active`

---

## Files to Create/Edit

### New Files
- `supabase/functions/send-stylist-invite/index.ts` -- Edge function for email delivery
- `src/components/salon/StylistInviteFlow.tsx` -- Wrapper that handles invite + DB insert

### Modified Files
- `src/components/salon/StylistManager.tsx` -- Use invite sheet for new stylists, call edge function
- `src/components/salon/StylistCard.tsx` -- Enhanced status badges with resend option
- `src/pages/Auth.tsx` -- Handle invite query params, pre-fill email
- `src/pages/StylistDashboard.tsx` -- Add "Salon" tab with read-only salon view
- `src/hooks/useSalonStylists.ts` -- Add `sendInvite` function that calls edge function
- Database migration for `invitation_token` column

---

## Security

- Edge function validates the caller is a salon owner before sending invites
- Invite emails use the app's own domain link (no magic tokens needed -- the `link_stylist_on_signup` trigger handles matching by email)
- Stylists can only view their own salon's data (enforced by existing RLS on `salon_id`)
- Salon view tab uses the same `useSalonBookings` hook already scoped to the stylist's `salon_id`

