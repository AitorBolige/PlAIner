# PLAIner — MVP Travel Planner AI

Next.js 14 (App Router) + TypeScript + Tailwind CSS v4 + NextAuth + Prisma + Postgres (Supabase).

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Environment variables

Copy `.env.example` to `.env.local` and fill:

- **Database**: `DATABASE_URL` (Supabase pooler connection string for the app) and `DIRECT_URL` (Supabase direct Postgres connection string for Prisma migrations)
- **Auth**: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **Google OAuth** (optional but supported): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **OpenAI**: `OPENAI_API_KEY`
- **Travel offers ingestion**: `TRAVEL_OFFERS_INGEST_SECRET` (optional), `TRAVEL_OFFERS_TTL_HOURS` (defaults to 12)
- **Scrape sources**: `TRAVEL_HOTEL_SCRAPE_URL`, `TRAVEL_TRANSPORT_SCRAPE_URL` (optional templates with `{{destination}}`, `{{destinationSlug}}`, `{{city}}`, `{{citySlug}}`, `{{countryCode}}`, `{{countrySlug}}`, `{{startDate}}`, `{{endDate}}`, `{{people}}`, `{{budgetMax}}`, `{{currency}}`)

For the first hotel provider, point `TRAVEL_HOTEL_SCRAPE_URL` at a Trivago listing page template. The refresh pipeline will try a Trivago-specific parser first, then fall back to the existing demo offers if the page cannot be parsed.

### 3) Database migrations

After setting `DATABASE_URL`:

```bash
npm run prisma:migrate
```

### 4) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## MVP routes

- `/` landing
- `/auth/login` and `/auth/register`
- `/onboarding`
- `/search`
- `/results`
- `/trip/[id]` + `/trip/[id]/budget` + `/trip/[id]/surprise`
- `/profile`, `/history`

## Travel offers API

- `GET /api/travel-offers` reads the cached hotel and transport offers for a destination query.
- `POST /api/travel-offers` upserts normalized offers from a scraper or provider job.
- When `TRAVEL_OFFERS_INGEST_SECRET` is set, `POST` requests must include `x-travel-offers-secret`.
- `POST /api/travel-offers/refresh` runs the scraping backend for a query and stores fresh cache data.
- If no scrape source URLs are configured, the backend falls back to demo offers so you can test the flow locally.

## Provider notes

- Trivago is a good first hotel provider because its listing pages expose hotel names, ratings, locations, and prices in a consistent public layout.
- Booking.com does not expose a simple public hotel-search API for general app use. Its public developer surface is partner-oriented (Demand API, Connectivity APIs, and Metasearch Connect), so it is not the best first implementation target unless you already have partner access.

