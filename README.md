# Circl — Social Calendar App

## Purpose and Motivation
Circl was inspired by the challenge of staying connected with friends and family after significant life changes — graduating, relocating, starting a new job. Life gets busy and people drift apart, not because they don't care, but because coordinating schedules is exhausting. Circl simplifies that by showing you when your people are free and suggesting things to do together.

Connect your Google Calendar, add your circle, and the app handles the rest.

## Tech Stack
- **Frontend**: React 18, Redux Toolkit, MUI v5 (custom theme)
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Calendar**: FullCalendar (month/week/day views)
- **Authentication**: JWT + Google OAuth 2.0
- **APIs**: Google Calendar API, Ticketmaster, SeatGeek, Eventbrite, OpenStreetMap (Nominatim/Overpass)
- **Deployment**: Render (main branch) or Vercel Serverless Functions (vercel-migration branch)

## Features

### Authentication & Onboarding
- Google OAuth (primary) + email/password signup
- 4-step onboarding: display name, city (with geolocation detect), invite friends, privacy explainer
- Token refresh flow (15min access + 7-day refresh tokens)
- Session persistence across page refreshes

### Calendar
- FullCalendar with month, week, and day views
- Multi-Google-Calendar support — sees all calendars you have access to
- Per-calendar visibility toggles
- Color-coded events (local = green, Google = gold)
- Mobile: dot indicators with tap-to-expand, swipe navigation
- Event creation with Google Calendar sync option

### Friend System
- Add friends by email or shareable invite link
- Invite links auto-accept friendship on signup (no extra step)
- Organize friends into circles (Family, College Friends, etc.)
- Friend cards with avatars, city, and status

### Shared Availability (Find a Time)
- Uses Google Calendar FreeBusy API — shows only free/busy, never event details
- Select friends or a circle, see overlaid availability on a week view
- Mutual free windows highlighted — tap to create an event
- Privacy controls: master toggle + per-friend sharing preferences

### Smart Suggestions
- Availability match: "You and Sarah are both free Saturday afternoon"
- Proximity alerts: "You'll be in Austin next week — 3 friends live there"
- Event discovery: "Food festival near you and 2 friends this weekend"
- Reconnect nudges: "Haven't seen College Friends circle in 6 weeks"

### Things To Do
- Multi-source event discovery (Ticketmaster, SeatGeek, Eventbrite)
- Nearby restaurants/bars/parks/entertainment via OpenStreetMap Overpass API
- Dashboard widget with category filters and horizontal scroll cards
- Event detail view shows nearby places

### Notifications
- In-app notification bell with unread badge
- Friend requests, suggestion alerts, event reminders
- 60-second polling for real-time updates

### Design
- Custom design system: white, gold, dark green, black
- macOS system font (SF Pro / -apple-system)
- Mobile-first responsive (320px — 1440px+)
- Bottom tab navigation on mobile, collapsible sidebar on desktop
- Dark mode support
- Bottom sheet modals on mobile, centered dialogs on desktop

---

# Getting Started

## Environment Variables

### Backend `.env`

Navigate to `/backend` and create a `.env` file:

```plaintext
SECRET_KEY=your_64_char_hex_key_here          # 64 hex chars (32 bytes) for AES-256 encryption + JWT signing
PORT=3001
DB_URI_DEV=postgresql://postgres:postgres@localhost:5432/social_calendar_dev
DB_URI_TEST=postgresql://postgres:postgres@localhost:5432/social_calendar_test
NODE_ENV=dev
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
REACT_APP_BASE_URL=http://localhost:3000
SERVER_BASE_URL=http://localhost:3001
```

**Security Note: Make sure your .env file is in .gitignore. Replace placeholder values with actual credentials.**

### Frontend `.env`

Navigate to `/frontend` and create a `.env` file:

```plaintext
REACT_APP_SERVER_URL=http://localhost:3001
```

### Optional API Keys (for richer event/places data)

Add to `backend/.env` if you have them:
```plaintext
REACT_APP_TICKETMASTER_API_KEY=your_key    # Free at developer.ticketmaster.com
SEATGEEK_CLIENT_ID=your_key                # Free at seatgeek.com/build
EVENTBRITE_TOKEN=your_key                  # Free at eventbrite.com/platform
YELP_API_KEY=your_key                      # Free at yelp.com/developers
```

The app works without these — they just add more event/places sources.

## Database Setup

Make sure PostgreSQL is installed and running. Create your database, then run the schema:

```bash
createdb social_calendar_dev
cd backend
psql -d social_calendar_dev -f db-schema.sql
```

## Running Locally

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend (separate terminal)
```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` in your browser.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add authorized JavaScript origin: `http://localhost:3000`
4. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
5. Enable the **Google Calendar API** in APIs & Services > Library

---

# Deployment

## Option A: Render (main branch)

The `main` branch runs as a traditional Express server. Deploy backend and frontend as separate Render services. This is how the original app was deployed.

**Live**: https://react-social-calendar-app.onrender.com

Note: Render free tier has ~30 second cold starts after inactivity.

## Option B: Vercel Serverless (vercel-migration branch)

The `vercel-migration` branch wraps the Express app in a single Vercel Serverless Function — no cold start delays.

1. Import the repo on [vercel.com](https://vercel.com)
2. Set branch to `vercel-migration`
3. Set environment variables:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Your 64-char hex key |
| `DATABASE_URL` | Supabase/Vercel Postgres connection string |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth secret |
| `SERVER_BASE_URL` | `https://your-app.vercel.app/api` |
| `REACT_APP_BASE_URL` | `https://your-app.vercel.app` |
| `REACT_APP_SERVER_URL` | `/api` |

4. Deploy
5. Add `https://your-app.vercel.app/api/auth/google/callback` to Google Cloud Console

For the database, [Supabase](https://supabase.com) offers free PostgreSQL (500MB, no expiry). Create a project, run `db-schema.sql` in their SQL Editor, and use the pooler connection string.

---

# Project Structure

```
social-calendar-app/
├── api/                        # Vercel serverless catch-all (vercel-migration branch only)
├── backend/
│   ├── routes/                 # Express routes (auth, user, event, friends, circles, etc.)
│   ├── models/                 # PostgreSQL models (User, Event, Friendship, Circle, etc.)
│   ├── middleware/             # JWT auth middleware
│   ├── services/               # Event discovery, suggestions engine, travel detection, places
│   ├── helpers/                # Token, crypto, SQL helpers
│   ├── schemas/                # JSON validation schemas
│   ├── migrations/             # Incremental SQL migrations
│   ├── tests/                  # Backend tests (115 passing)
│   ├── app.js                  # Express app setup
│   ├── server.js               # Server entry point
│   ├── db.js                   # PostgreSQL connection pool
│   └── db-schema.sql           # Full database schema
├── frontend/
│   ├── src/
│   │   ├── pages/              # SignIn, SignUp, Home, Friends, Suggestions, Profile, FindATime, Onboarding
│   │   ├── components/         # Calendar, layout shell, modals, widgets
│   │   ├── redux/              # 7 slices (user, event, googleEvent, friend, freeBusy, suggestion, notification)
│   │   ├── api/                # Server API + Google Calendar API wrappers
│   │   ├── hooks/              # City autocomplete hook
│   │   ├── theme.js            # MUI theme with Circl design tokens
│   │   └── ThemeContext.js     # Dark mode provider
│   └── public/
├── vercel.json                 # Vercel deployment config
├── PRD.md                      # Product requirements document
└── prd.json                    # User stories with completion status
```
