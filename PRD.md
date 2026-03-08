# Product Requirements Document (PRD)
# Circl — Social Calendar App

**Version:** 1.0
**Date:** March 7, 2026
**Status:** Draft

---

## 1. Product Vision

**Circl** helps friends and family who don't see each other often stay connected by intelligently surfacing mutual availability and suggesting things to do when they're nearby. Instead of the awkward "let me check my calendar" loop, Circl does the work — showing when you and your people are free, and what's happening around you.

> "Connect your Google Calendar, add your circle, and we'll show you when and where you can hang out."

### Core Value Proposition
- **For friends/family who've drifted apart** — life gets busy, but Circl keeps the door open
- **Non-invasive** — uses free/busy data only, never exposes private event details
- **Suggestion-driven** — don't make users check calendars; surface opportunities automatically
- **Mobile-first** — this is a phone-in-your-pocket app, not a desktop dashboard

### Distribution Strategy
- **Web app** (PWA) — primary platform
- **Browser extension** (Chrome/Firefox) — lightweight companion that surfaces Circl suggestions directly inside Google Calendar or native calendar views in webmail. Non-invasive overlay; nudges like "Sarah is free this afternoon too" appear as subtle inline hints. No monetization — this is a growth/engagement tool, not a revenue channel.

---

## 2. Current State Assessment

### What Exists (Functional)
- Local email/password + Google OAuth 2.0 authentication
- Google Calendar API integration (read/write to primary calendar)
- Event CRUD (local + Google Calendar sync)
- Custom-built month calendar grid (dayjs-based)
- Ticketmaster event search in sidebar
- PostgreSQL schema with user, calendar, event, sharing tables
- JWT auth with encrypted Google token storage (AES-256-CTR)

### What Needs Work
| Area | Issue |
|------|-------|
| **Calendar UI** | Hand-rolled grid — no week/day views, no drag-and-drop, poor mobile rendering, fixed `aspectRatio: 1.4/1` on day cells, full day names overflow on small screens |
| **Mobile UX** | 340px fixed sidebar, no responsive breakpoints, no bottom nav, no touch gestures |
| **Auth flow** | Functional but visually dated — generic MUI form with lock icon |
| **Friend system** | DB tables exist (`users_calendars`, `calendar_acl`) but zero implementation |
| **Availability** | No FreeBusy API usage, no shared availability view |
| **Suggestions** | Ticketmaster search exists but is manual and disconnected from social features |
| **Notifications** | None |
| **Design system** | No consistent theme, colors, or typography — default MUI throughout |

---

## 3. Target Users

### Primary Persona — "The Connector"
- 22–40 years old
- Has a core friend group or family scattered across cities
- Uses Google Calendar daily
- Primarily on mobile
- Wants to see friends more but finds coordination exhausting

### Secondary Persona — "The Traveler"
- Travels for work or leisure regularly
- Wants to know which friends are nearby when visiting a city
- Values spontaneous meetups

---

## 4. Feature Requirements

### Phase 1 — Foundation (MVP)
> Goal: Modern UI, auth, calendar, and friend connections

#### 4.1 Complete UI/UX Redesign
**Priority: P0**

**Design Principles:**
- Mobile-first responsive design (320px → 1440px+)
- Clean, modern aesthetic — no default MUI look
- Consistent design tokens (colors, typography, spacing, radius)
- Smooth transitions and micro-interactions
- Dark mode support from day one

**Landing / Auth Pages:**
- Modern sign-in/sign-up with prominent "Continue with Google" CTA
- Minimal fields — Google OAuth is the primary path
- Animated transitions between sign-in and sign-up
- Trust indicators (privacy messaging: "We only see when you're free, never your event details")

**Calendar View — Replace Custom Grid:**
- **Recommendation: Adopt [FullCalendar](https://fullcalendar.io/) (MIT license) or build with a headless calendar library like [@schedule-x/react](https://schedule-x.dev/)**
- Rationale: The current hand-rolled grid has significant limitations:
  - No week or day views
  - No event drag-and-drop or resize
  - No recurring event rendering
  - Day cells use fixed aspect ratio that breaks on mobile
  - Full day names ("Wednesday") overflow on small screens
  - No time-slot rendering for day/week views
- **Required views:** Month, Week, Day
- **Mobile behavior:**
  - Month view: Compact — show dots for event indicators, tap to expand
  - Week view: Horizontal scroll with time slots
  - Day view: Scrollable agenda with time blocks
  - Swipe left/right to navigate between periods
- **Event rendering:** Color-coded chips (local = dark green, Google = gold, friend availability = soft black/charcoal)

**Navigation — Mobile:**
- Bottom tab bar: Home (calendar), Friends, Suggestions, Profile
- No persistent sidebar on mobile — use bottom sheet or modal for filters
- Hamburger menu for secondary actions on mobile

**Navigation — Desktop:**
- Collapsible left sidebar (not fixed 340px)
- Top app bar with search and notifications

**Modals and Forms:**
- Bottom sheet pattern on mobile (slide up from bottom)
- Centered modal on desktop
- Proper datetime pickers (replace raw `datetime-local` inputs)

#### 4.2 Authentication Improvements
**Priority: P0**

- Keep existing dual auth (Google OAuth + email/password)
- Google OAuth is the **recommended** path — design should emphasize this
- Add onboarding flow after first login:
  1. Set display name / avatar
  2. Set home city (for location-based suggestions)
  3. "Find friends on Circl" prompt
- Token refresh handling (currently 1hr expiry with no refresh logic)
- Session persistence (currently lost on page refresh if token expires)

#### 4.3 Friend / Circle System
**Priority: P0**

**Database additions:**
```sql
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    requester_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);

CREATE TABLE circles (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- e.g., "Family", "College Friends"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE circle_members (
    circle_id INTEGER NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (circle_id, user_id)
);

ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
```

**Features:**
- Add friends by email (sends in-app request)
- Accept / decline friend requests
- Create named circles (groups): "Family," "College Friends," "Work Crew"
- Add friends to circles
- Friends list view with online/last-active status
- Friend profile card (name, city, mutual friends)

**API endpoints:**
- `POST /friends/request` — send friend request
- `PATCH /friends/:id/accept` — accept request
- `PATCH /friends/:id/decline` — decline request
- `DELETE /friends/:id` — remove friend
- `GET /friends` — list all friends
- `GET /friends/requests` — list pending requests
- `POST /circles` — create a circle
- `POST /circles/:id/members` — add member
- `DELETE /circles/:id/members/:userId` — remove member
- `GET /circles` — list user's circles

---

### Phase 2 — Core Social Features
> Goal: Shared availability + intelligent suggestions

#### 4.4 Shared Availability (FreeBusy)
**Priority: P0**

**Google FreeBusy API integration:**
- Use `calendar.freebusy.query` to check friends' availability
- Shows only free/busy blocks — **never** event details (privacy-first)
- Friends must opt-in to share availability (per-friend or per-circle toggle)

**UI — "Find a Time" View:**
- Select a friend or circle
- Overlay free/busy blocks on a week/day view
- Highlight mutual free windows in green
- Tap a free window → "Create a hangout" flow

**Privacy Controls:**
- Default: Share availability with accepted friends only
- Granular: Per-friend or per-circle sharing toggle
- Option to block specific time ranges from being shared

#### 4.5 Location Awareness
**Priority: P1**

- Users set a home city in profile
- Optionally tag calendar events with location/city
- Detect "travel" events (flights, hotels, "Trip to Austin") from Google Calendar
- When a user will be in a friend's city → trigger "You'll be near [Friend]!" suggestion

**Database additions:**
```sql
ALTER TABLE users ADD COLUMN latitude DECIMAL(10,8);
ALTER TABLE users ADD COLUMN longitude DECIMAL(11,8);
```

#### 4.6 Smart Suggestions Engine
**Priority: P1**

**Suggestion types:**
1. **Availability match** — "You and Sarah are both free Saturday 2–6pm"
2. **Proximity alert** — "You'll be in Austin next week — 3 friends live there!"
3. **Event discovery** — "There's a food festival near both of you this weekend" (Ticketmaster / local events API)
4. **Recurring nudge** — "You haven't seen the College Friends circle in 6 weeks"

**Implementation:**
- Background job / cron that runs daily
- Checks mutual availability for the next 7–14 days
- Cross-references with location data and event APIs
- Generates suggestion cards stored in DB
- Surfaces via in-app feed + push notification

**Database additions:**
```sql
CREATE TABLE suggestions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,          -- availability_match, proximity, event, nudge
    title TEXT NOT NULL,
    body TEXT,
    metadata JSONB,             -- friend_ids, event_data, location, etc.
    status TEXT DEFAULT 'unread', -- unread, read, dismissed, acted_on
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```

---

### Phase 3 — Engagement & Polish
> Goal: Notifications, polish, and retention features

#### 4.7 Notifications System
**Priority: P1**

- In-app notification bell with badge count
- Push notifications (web push / service worker)
- Email digest (weekly summary: "Here's when you could see your friends this week")
- Notification preferences per type (friend requests, suggestions, reminders)

#### 4.8 Event Invitations
**Priority: P2**

- Create a hangout/event and invite friends from Circl
- RSVP flow (going / maybe / can't make it)
- Sync accepted events to Google Calendar
- Group chat thread per event (stretch goal)

#### 4.9 Activity Feed
**Priority: P2**

- Lightweight feed: "[Friend] is visiting your city this weekend"
- Circle activity: "3 people in Family are free next Sunday"
- No social media noise — only actionable, calendar-relevant updates

---

## 5. Technical Architecture

### 5.1 Frontend Rebuild

**Framework:** React 18 (keep existing)
**Styling:** MUI v5 with custom theme overrides → modern design system
**Calendar:** Replace hand-rolled grid with **FullCalendar React** (`@fullcalendar/react`) or **Schedule-X** (`@schedule-x/react`)
**State:** Redux Toolkit (keep existing, extend with new slices)
**Routing:** React Router v6 (keep existing)

**New dependencies to evaluate:**
| Package | Purpose |
|---------|---------|
| `@fullcalendar/react` + plugins | Calendar views (month/week/day), event rendering, drag-drop |
| `framer-motion` | Page transitions, micro-interactions |
| `react-hot-toast` or `notistack` | Toast notifications |
| `react-bottom-sheet` | Mobile bottom sheets |
| `@tanstack/react-query` | Server state management (consider for API calls alongside Redux) |

**Responsive breakpoints:**
- `xs`: 0–599px (phone portrait)
- `sm`: 600–899px (phone landscape / small tablet)
- `md`: 900–1199px (tablet)
- `lg`: 1200–1535px (laptop)
- `xl`: 1536px+ (desktop)

**New Redux slices:**
- `friendSlice` — friends list, requests, circles
- `suggestionSlice` — smart suggestions feed
- `notificationSlice` — notification state and badge count

### 5.2 Backend Extensions

**New route modules:**
- `routes/friends.js` — friend requests, list, circles
- `routes/suggestions.js` — suggestion feed CRUD
- `routes/notifications.js` — notification preferences and history
- `routes/freebusy.js` — FreeBusy proxy (calls Google API server-side)

**New models:**
- `models/friendship.js`
- `models/circle.js`
- `models/suggestion.js`

**Background jobs:**
- Daily suggestion generation (can use `node-cron` or external scheduler)
- Token refresh for Google OAuth (handle expired access tokens)

### 5.3 Database Migration Strategy
- Use incremental SQL migration files (`migrations/001_add_friendships.sql`, etc.)
- Never drop existing tables — additive changes only
- Seed data for development/testing

---

## 6. UI/UX Specifications

### 6.1 Design Tokens

```
Colors:
  Primary:       #1B5E20 (Dark Green)
  Primary Light: #2E7D32
  Primary Dark:  #0D3B13
  Accent:        #C6993A (Gold)
  Accent Light:  #D4AF61
  Accent Dark:   #A67C2E
  Background:    #FAFAFA (light) / #121212 (dark)
  Surface:       #FFFFFF (light) / #1E1E1E (dark)
  Text Primary:  #111111 (light) / #F5F5F5 (dark)
  Text Secondary:#666666 (light) / #A0A0A0 (dark)
  Border:        #E0E0E0 (light) / #333333 (dark)
  Success:       #2E7D32
  Error:         #C62828
  Black:         #111111
  White:         #FFFFFF

Typography:
  Font Family:   -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif
  Headings:      600 weight
  Body:          400 weight
  Mono:          'SF Mono', 'Menlo', monospace

Spacing:
  Base unit:     4px
  Common:        8, 12, 16, 24, 32, 48

Border Radius:
  Small:         8px
  Medium:        12px
  Large:         16px
  Full:          9999px (pills/avatars)

Shadows:
  Subtle:        0 1px 3px rgba(0,0,0,0.06)
  Medium:        0 4px 12px rgba(0,0,0,0.08)
  Elevated:      0 8px 24px rgba(0,0,0,0.10)

Design Notes:
  - Clean, minimal aesthetic — mostly white surfaces with dark green and gold accents
  - macOS-native feel: SF Pro typography, subtle shadows, rounded corners
  - Gold used sparingly for CTAs, highlights, active states, badges
  - Dark green for primary actions, nav indicators, status
  - Black for text and structural elements
  - High contrast, generous whitespace — let the content breathe
```

### 6.2 Key Screens

**1. Landing / Sign-In**
- Clean white background with subtle geometric or line-art accents in gold/dark green
- Centered card with app logo (dark green mark + gold accent) + tagline
- "Continue with Google" button (dark green, large, gold icon accent)
- "or sign in with email" secondary option (outlined, minimal)
- "We only see when you're free — never your event details" trust line in secondary text

**2. Onboarding (post-first-login)**
- Step 1: Set display name + upload avatar
- Step 2: Set your home city
- Step 3: Invite friends (email input + share link)
- Step 4: Brief privacy explainer → start using app

**3. Home — Calendar**
- Top bar: month/year, view toggle (Month | Week | Day), notification bell
- Calendar component: full-width, events as colored chips/dots
- Mobile: bottom tab bar (Calendar, Friends, Suggestions, Profile)
- FAB (floating action button) for "New Event" on mobile
- Desktop: collapsible sidebar with calendar filters + mini-calendar

**4. Friends**
- Search bar at top
- "Pending Requests" section (if any)
- Friends list grouped by circles
- Each friend card: avatar, name, city, "Free now" / "Busy" indicator
- "Add Friend" FAB or button
- Tap friend → overlay their availability on your calendar

**5. Find a Time**
- Select friend(s) or circle from picker
- Week view showing overlaid free/busy blocks
- Mutual free windows highlighted
- Tap a free window → create event pre-filled with date/time + friend as invitee

**6. Suggestions Feed**
- Card-based feed
- Each card: icon + title + body + CTA button
- Types: availability match, proximity alert, event nearby, reconnect nudge
- Swipe to dismiss or tap to act

**7. Profile**
- Avatar, display name, email
- Home city setting
- Privacy controls (who can see your availability)
- Connected accounts (Google Calendar status)
- Notification preferences
- Sign out

---

## 7. Privacy & Security

### Non-Negotiable Principles
1. **Free/Busy only** — Never expose event titles, descriptions, or attendees to friends
2. **Opt-in sharing** — Users explicitly choose who sees their availability
3. **Minimal data** — Only store what's needed; Google tokens encrypted at rest
4. **Transparent** — Clear UI showing exactly what is shared and with whom
5. **Revocable** — Users can disconnect Google Calendar or unfriend at any time

### Data Handling
- Google OAuth tokens: AES-256-CTR encrypted (already implemented)
- Passwords: bcrypt hashed (already implemented)
- FreeBusy data: fetched on-demand, not stored long-term
- Location data: user-provided city only (no GPS tracking)

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Sign-up → add first friend | > 60% within first session |
| Weekly active users returning | > 40% week-over-week |
| Suggestions acted on | > 15% click-through |
| Friends per user (avg) | > 5 within 30 days |
| Time to "Find a Time" from login | < 3 taps |

---

## 9. Implementation Phases & Milestones

### Phase 1 — Foundation (Weeks 1–4)
- [ ] Design system setup (theme, tokens, typography)
- [ ] Auth page redesign (sign-in, sign-up, onboarding)
- [ ] Calendar component replacement (FullCalendar or Schedule-X)
- [ ] Responsive layout (mobile nav, breakpoints, bottom sheets)
- [ ] Home page rebuild (calendar + responsive sidebar)
- [ ] Friend system backend (DB, models, routes, tests)
- [ ] Friend system frontend (friends list, requests, circles UI)
- [ ] Profile page redesign

### Phase 2 — Social Core (Weeks 5–8)
- [ ] FreeBusy API integration (backend proxy)
- [ ] "Find a Time" shared availability view
- [ ] Privacy controls UI
- [ ] Location/city awareness
- [ ] Suggestion engine (backend generation + frontend feed)
- [ ] Ticketmaster integration into suggestions (not just sidebar search)

### Phase 3 — Engagement (Weeks 9–12)
- [ ] Notification system (in-app + push)
- [ ] Event invitations + RSVP
- [ ] Activity feed
- [ ] Email digest
- [ ] Dark mode
- [ ] Performance optimization + PWA setup
- [ ] Testing coverage (unit + integration + E2E)

---

## 10. Event Discovery Sources

### Multi-Source Event Aggregation
Circl aggregates events from multiple free APIs to maximize coverage. All sources below are free with easy signup (no credit card required).

| Source | Coverage | Free Tier | Key Use |
|--------|----------|-----------|---------|
| **Ticketmaster** (already integrated) | Concerts, sports, arts, theater | 5,000 calls/day | Major ticketed events |
| **SeatGeek** | Concerts, sports, theater | Free, no published limits | Complements Ticketmaster with pricing data |
| **Eventbrite** | Community events, workshops, classes, festivals | Free OAuth token | Local/community events Ticketmaster misses |
| **Yelp Fusion** (Events beta) | Business-hosted events, food/drink, nightlife | Free API key | Hyperlocal events tied to venues |
| **PredictHQ** | 18 categories globally — festivals, conferences, community | Free tier after trial | Broadest category coverage |

**Implementation approach:**
- Backend aggregation service normalizes events from all sources into a common schema
- Deduplication by event name + venue + date
- Location-based queries: fetch events near user's city or near a friend's city
- Results feed into the Suggestions Engine (Phase 2)

### Future: Browser Extension
- Chrome/Firefox extension that reads Google Calendar or webmail calendar views
- Overlays subtle Circl suggestions: "Sarah is free this afternoon too" or "Food festival near you and 2 friends this Saturday"
- Non-invasive — small inline hints, not popups
- Links back to Circl app for full experience
- No monetization — pure engagement/growth tool

---

## 11. Open Questions

1. **Calendar library choice** — FullCalendar (mature, feature-rich, larger bundle) vs Schedule-X (modern, lightweight, newer)? Needs prototyping.
2. **PWA scope** — Service worker for offline support and push notifications in Phase 3.
3. **Real-time features** — WebSocket for live availability updates and chat? Adds complexity — defer to Phase 3+.

---

## Appendix A — Current File Structure Reference

```
social-calendar-app/
├── backend/
│   ├── routes/        (localAuth, googleAuth, user, event, calendar)
│   ├── models/        (user, event, calendar)
│   ├── middleware/     (auth — JWT validation)
│   ├── helpers/       (token, crypto, default calendar, SQL)
│   ├── schemas/       (JSON validation schemas)
│   ├── tests/         (model + route tests)
│   ├── app.js, server.js, config.js, db.js, db-schema.sql
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/     (HomePage, SignIn, SignUp, UserProfile)
│   │   ├── components/(Calendar/*, Sidebar, Modals, NavBars, EventCard)
│   │   ├── api/       (serverAPI, googleCalendarAPI, ticketMasterAPI)
│   │   ├── redux/     (userSlice, eventSlice, googleEventSlice, store)
│   │   └── routes/    (RouteList)
│   └── package.json
└── README.md
```

## Appendix B — Key Technical Decisions from Existing Codebase

| Decision | Current | Recommendation |
|----------|---------|----------------|
| Calendar rendering | Hand-rolled dayjs grid | Replace with FullCalendar or Schedule-X |
| Date library | dayjs + date-fns (both!) | Consolidate to one (dayjs preferred — lighter) |
| State management | Redux Toolkit | Keep, but consider React Query for server state |
| CSS/Styling | Inline MUI sx props | Keep MUI sx but add consistent theme with design tokens |
| Mobile nav | Fixed 340px sidebar drawer | Bottom tab bar on mobile, collapsible sidebar on desktop |
| Event modals | Fixed-width centered modal | Bottom sheet on mobile, modal on desktop |
| Auth emphasis | Equal weight local + Google | Emphasize Google OAuth as primary path |
