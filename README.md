# PLAIner — MVP Travel Planner AI

Next.js 14 (App Router) + TypeScript + Tailwind CSS v4 + NextAuth + Prisma + Postgres (Supabase).

## Local setup

### 1) Install dependencies

```bash
npm install
```

### 2) Environment variables

Copy `.env.example` to `.env.local` and fill:

- **Database**: `DATABASE_URL` (Supabase Postgres connection string)
- **Auth**: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **Google OAuth** (optional but supported): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **OpenAI**: `OPENAI_API_KEY`

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

