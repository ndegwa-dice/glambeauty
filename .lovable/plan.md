
# Stylist Empowerment Feature Plan

## Overview
Transform stylists from simple booking assignees into empowered beauty professionals with rich profiles, portfolios, social engagement features, and dedicated dashboards - similar to an Instagram-style experience for both stylists and clients.

---

## Key Features

### 1. Enhanced Stylist Profiles (Instagram-style)
- **Profile Header**: Large cover photo, circular avatar with glow effect, display name, bio
- **Stats Bar**: Total clients served, rating (stars), followers count
- **Availability Status**: Toggle between "Available" (green), "Busy" (amber), "Away" (gray)
- **Contact Actions**: Message button, follow/unfollow button
- **Services Showcase**: Visual cards for each service they perform

### 2. Portfolio Gallery
- Grid layout of work photos (like Instagram)
- Before/after comparisons
- Category tags (nails, braids, makeup, etc.)
- Like counts on each photo
- Tap to view full-size with details

### 3. Social Features
- **Follow System**: Clients can follow their favorite stylists
- **Ratings & Reviews**: 1-5 star ratings with text reviews after completed appointments
- **Messaging**: Direct messaging between clients and stylists
- **Activity Feed**: Recent work, new reviews, availability changes

### 4. Enhanced Stylist Dashboard
- **My Profile Tab**: Edit avatar, cover photo, bio, contact info
- **Portfolio Tab**: Upload/manage work photos, add captions/tags
- **Bookings Tab**: View all bookings with quick status updates
- **Followers Tab**: See who follows them, message fans
- **Earnings Tab**: Track completed appointments and revenue
- **Availability Toggle**: Quick busy/available status switch in header

### 5. Client-Side Stylist Discovery
- **Feed View**: Scrollable stylist cards (like Instagram stories/posts)
- **Search & Filter**: By service type, rating, availability
- **Stylist Profiles**: Full Instagram-style profile pages
- **Quick Book**: Book directly from stylist profile

### 6. Salon Owner Team View
- **Grid of Stylist Cards**: Photo, name, rating, follower count, status
- **Performance Metrics**: Bookings this week, revenue generated, review score
- **Invitation Status**: Pending, Accepted, Active indicators
- **Quick Actions**: View profile, edit, send message

---

## Database Schema Changes

### New Tables

```text
┌─────────────────────────────────────────────────────────────────────┐
│  stylist_portfolios                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  id (uuid, PK)                                                      │
│  stylist_id (uuid, FK → stylists)                                   │
│  image_url (text)                                                   │
│  caption (text, nullable)                                           │
│  category (text) - e.g., "nails", "braids", "makeup"                │
│  likes_count (integer, default 0)                                   │
│  is_before_after (boolean, default false)                           │
│  before_image_url (text, nullable)                                  │
│  created_at, updated_at                                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  stylist_reviews                                                    │
├─────────────────────────────────────────────────────────────────────┤
│  id (uuid, PK)                                                      │
│  stylist_id (uuid, FK → stylists)                                   │
│  client_user_id (uuid, FK → auth.users via RLS)                     │
│  booking_id (uuid, FK → bookings)                                   │
│  rating (integer, 1-5)                                              │
│  review_text (text, nullable)                                       │
│  created_at                                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  stylist_follows                                                    │
├─────────────────────────────────────────────────────────────────────┤
│  id (uuid, PK)                                                      │
│  stylist_id (uuid, FK → stylists)                                   │
│  follower_user_id (uuid)                                            │
│  created_at                                                         │
│  UNIQUE(stylist_id, follower_user_id)                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  messages                                                           │
├─────────────────────────────────────────────────────────────────────┤
│  id (uuid, PK)                                                      │
│  conversation_id (uuid)                                             │
│  sender_user_id (uuid)                                              │
│  recipient_user_id (uuid)                                           │
│  message_text (text)                                                │
│  is_read (boolean, default false)                                   │
│  created_at                                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  portfolio_likes                                                    │
├─────────────────────────────────────────────────────────────────────┤
│  id (uuid, PK)                                                      │
│  portfolio_id (uuid, FK → stylist_portfolios)                       │
│  user_id (uuid)                                                     │
│  created_at                                                         │
│  UNIQUE(portfolio_id, user_id)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Updates to Existing Tables

**stylists table** - Add columns:
- `cover_image_url` (text) - Banner/cover photo
- `availability_status` (enum: 'available', 'busy', 'away', default 'available')
- `rating_avg` (numeric, computed/cached)
- `rating_count` (integer, default 0)
- `followers_count` (integer, default 0)
- `total_clients_served` (integer, default 0)
- `instagram_handle` (text, nullable)
- `specialty` (text, nullable) - e.g., "Gel Extensions Specialist"

---

## File Structure

```text
src/
├── components/
│   ├── stylist/                          # NEW - Stylist-specific components
│   │   ├── StylistProfileHeader.tsx      # Avatar, cover, name, stats
│   │   ├── StylistStatsBar.tsx           # Clients, rating, followers
│   │   ├── StylistAvailabilityToggle.tsx # Quick status switch
│   │   ├── PortfolioGrid.tsx             # Photo grid display
│   │   ├── PortfolioUploadSheet.tsx      # Add new work photos
│   │   ├── PortfolioPhotoCard.tsx        # Individual photo card
│   │   ├── StylistReviewCard.tsx         # Review display
│   │   ├── StylistReviewForm.tsx         # Post-booking review form
│   │   ├── FollowButton.tsx              # Follow/unfollow toggle
│   │   ├── StylistFeedCard.tsx           # Card for discovery feed
│   │   ├── StylistMessageSheet.tsx       # DM composer
│   │   └── StylistServicesBadges.tsx     # Service tags/badges
│   ├── client/
│   │   ├── StylistFeed.tsx               # NEW - Instagram-style feed
│   │   ├── StylistProfileSheet.tsx       # NEW - Full profile view
│   │   └── ...existing
│   ├── salon/
│   │   ├── StylistCard.tsx               # UPDATED - Enhanced cards
│   │   ├── StylistManager.tsx            # UPDATED - Grid layout
│   │   └── StylistPerformanceCard.tsx    # NEW - Metrics card
│   └── messages/                         # NEW - Messaging components
│       ├── ConversationList.tsx
│       ├── ChatThread.tsx
│       └── MessageBubble.tsx
├── hooks/
│   ├── useStylistProfile.ts              # NEW - Fetch/update stylist profile
│   ├── useStylistPortfolio.ts            # NEW - Portfolio CRUD
│   ├── useStylistReviews.ts              # NEW - Reviews fetch/submit
│   ├── useStylistFollows.ts              # NEW - Follow/unfollow logic
│   ├── useMessages.ts                    # NEW - Messaging hook
│   └── useDiscoverStylists.ts            # NEW - Feed discovery
├── pages/
│   ├── StylistDashboard.tsx              # UPDATED - Enhanced with new tabs
│   └── StylistProfile.tsx                # NEW - Public profile page
└── ...
```

---

## Implementation Phases

### Phase 1: Database & Core Profile (Foundation)
1. Create storage bucket for portfolio images
2. Add new columns to `stylists` table
3. Create `stylist_portfolios`, `stylist_reviews`, `stylist_follows` tables
4. Set up RLS policies for all new tables
5. Create `useStylistProfile` hook with update capabilities

### Phase 2: Stylist Dashboard Enhancement
1. Build `StylistProfileHeader` component
2. Add `StylistAvailabilityToggle` to dashboard header
3. Create "My Profile" tab with editable fields
4. Build portfolio upload flow with image storage
5. Create `PortfolioGrid` for displaying work

### Phase 3: Social Features
1. Implement `FollowButton` and `useStylistFollows` hook
2. Build review submission flow after completed bookings
3. Create `StylistReviewCard` for displaying reviews
4. Add ratings to stylist profiles

### Phase 4: Client Discovery Experience
1. Create `StylistFeed` component (scrollable cards)
2. Build `StylistProfileSheet` for full profile view
3. Add "Stylists" tab to client dashboard
4. Implement search/filter by service, rating, availability

### Phase 5: Messaging System
1. Create `messages` table with RLS
2. Build `ConversationList` and `ChatThread` components
3. Enable realtime messaging with Supabase
4. Add message notifications

### Phase 6: Salon Owner View Enhancement
1. Redesign `StylistCard` with performance metrics
2. Add grid layout option for `StylistManager`
3. Show aggregated team performance stats

---

## Technical Considerations

### Storage
- Create `stylist-portfolios` bucket in Lovable Cloud storage
- Public bucket with RLS for uploads (stylists can only upload to their folder)
- Image optimization: resize on upload for thumbnails

### Realtime
- Enable realtime on `messages` table for instant chat
- Enable realtime on `stylist_follows` for follower count updates
- Enable realtime on `stylist_portfolios` for live portfolio updates

### Performance
- Cache `rating_avg`, `followers_count`, `total_clients_served` on stylists table
- Use database triggers to update cached counts
- Paginate portfolio and reviews (load 12 items at a time)

### RLS Policies Summary
- **stylist_portfolios**: Stylists can CRUD their own; anyone can view active stylists' portfolios
- **stylist_reviews**: Clients can create (one per booking); anyone can read
- **stylist_follows**: Authenticated users can follow/unfollow; anyone can see counts
- **messages**: Users can only see their own conversations

---

## UI/UX Highlights

### Stylist Profile (Instagram-inspired)
- Cover photo with gradient overlay
- Circular avatar with glow effect and availability indicator
- Stats bar: "127 clients • ⭐ 4.8 • 89 followers"
- Bio with specialty tag
- Tabbed content: Portfolio | Reviews | Services

### Discovery Feed
- Horizontal scroll for "Top Stylists Near You"
- Vertical feed of recent work (portfolio posts)
- Filter chips: All, Nails, Braids, Makeup, Bridal

### Availability Status
- Green dot + "Available" - accepting bookings
- Amber dot + "Busy" - currently with a client
- Gray dot + "Away" - not taking bookings today

