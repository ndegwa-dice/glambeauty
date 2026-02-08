# Stylist Empowerment Feature Plan

## Overview
Transform stylists from simple booking assignees into empowered beauty professionals with rich profiles, portfolios, social engagement features, and dedicated dashboards - similar to an Instagram-style experience for both stylists and clients.

---

## Implementation Progress

### ✅ Phase 1: Database & Core Profile (COMPLETED)
- [x] Created `availability_status` enum (available, busy, away)
- [x] Added new columns to `stylists` table (cover_image_url, availability_status, rating_avg, rating_count, followers_count, total_clients_served, instagram_handle, specialty)
- [x] Created `stylist_portfolios` table with RLS
- [x] Created `stylist_reviews` table with RLS
- [x] Created `stylist_follows` table with RLS
- [x] Created `portfolio_likes` table with RLS
- [x] Created `messages` table with RLS
- [x] Created `stylist-portfolios` storage bucket
- [x] Added triggers for automatic rating/follower/like count updates
- [x] Enabled Supabase Realtime for messages, follows, portfolios

### ✅ Phase 2: Stylist Dashboard Enhancement (COMPLETED)
- [x] Created `useStylistProfile` hook with update capabilities
- [x] Created `useStylistPortfolio` hook for portfolio CRUD
- [x] Created `useStylistFollows` hook for follow/unfollow
- [x] Created `useStylistReviews` hook for reviews
- [x] Created `useDiscoverStylists` hook for feed discovery
- [x] Built `StylistProfileHeader` component
- [x] Built `StylistAvailabilityToggle` component
- [x] Built `PortfolioGrid` component
- [x] Built `PortfolioUploadSheet` component
- [x] Built `FollowButton` component
- [x] Built `StylistFeedCard` component
- [x] Built `StylistReviewCard` and `StylistReviewForm` components
- [x] Updated `StylistDashboard` with Profile, Portfolio, Schedule tabs
- [x] Added avatar/cover upload functionality

### ✅ Phase 3: Client Discovery Experience (COMPLETED)
- [x] Created `StylistFeed` component with search, filters, sorting
- [x] Created `StylistProfileSheet` for full profile view on client side
- [x] Added "Stylists" tab to client dashboard (alongside Salons)
- [x] Implemented Instagram-style stylist cards

---

## Remaining Phases

### 🔄 Phase 4: Social Features (TO DO)
- [ ] Enable review submission flow after completed bookings
- [ ] Add review prompt to client booking cards when appointment is completed
- [ ] Show ratings on salon booking flow when selecting stylist

### Phase 5: Messaging System
- [ ] Build `ConversationList` and `ChatThread` components
- [ ] Create messaging UI accessible from stylist profiles
- [ ] Enable realtime messaging with Supabase
- [ ] Add unread message indicators

### Phase 6: Salon Owner View Enhancement
- [ ] Redesign `StylistCard` with performance metrics
- [ ] Add grid layout option for `StylistManager`
- [ ] Show aggregated team performance stats

---

## File Structure (Current)

```text
src/
├── components/
│   ├── stylist/                          # Stylist-specific components
│   │   ├── StylistProfileHeader.tsx      ✅
│   │   ├── StylistAvailabilityToggle.tsx ✅
│   │   ├── PortfolioGrid.tsx             ✅
│   │   ├── PortfolioUploadSheet.tsx      ✅
│   │   ├── FollowButton.tsx              ✅
│   │   ├── StylistFeedCard.tsx           ✅
│   │   ├── StylistReviewCard.tsx         ✅
│   │   └── StylistReviewForm.tsx         ✅
│   ├── client/
│   │   ├── StylistFeed.tsx               ✅
│   │   ├── StylistProfileSheet.tsx       ✅
│   │   └── ...existing
│   └── messages/                         # Messaging (TODO)
│       ├── ConversationList.tsx
│       ├── ChatThread.tsx
│       └── MessageBubble.tsx
├── hooks/
│   ├── useStylistProfile.ts              ✅
│   ├── useStylistPortfolio.ts            ✅
│   ├── useStylistReviews.ts              ✅
│   ├── useStylistFollows.ts              ✅
│   └── useDiscoverStylists.ts            ✅
├── pages/
│   ├── StylistDashboard.tsx              ✅ (Enhanced)
│   └── ...
└── ...
```

---

## Database Schema (Implemented)

### New Tables
- `stylist_portfolios` - Portfolio images with captions, categories, likes
- `stylist_reviews` - Client reviews linked to completed bookings
- `stylist_follows` - Follow relationships between clients and stylists
- `portfolio_likes` - Like tracking for portfolio items
- `messages` - Direct messaging between users

### Updated Tables
- `stylists` - Added cover_image_url, availability_status, rating_avg, rating_count, followers_count, total_clients_served, instagram_handle, specialty

### Storage Buckets
- `stylist-portfolios` - Public bucket for portfolio images

### Database Functions & Triggers
- `update_stylist_rating()` - Automatically updates rating_avg/rating_count on review changes
- `update_follower_count()` - Automatically updates followers_count on follow/unfollow
- `update_portfolio_likes_count()` - Automatically updates likes_count on portfolio items

---

## Next Steps
1. Test the current implementation by visiting /stylist as a stylist user
2. Test the client discovery feed by visiting /client and switching to Stylists tab
3. Implement review prompts for completed bookings
4. Build out the messaging system
