# PLAIner — MVP Travel Planner AI

Next.js 14 (App Router) + TypeScript + NextAuth + Prisma + PostgreSQL (Supabase) + Resend.

## Configuració local (per a nous col·laboradors)

### 1. Clona el repositori i instal·la dependències

```bash
git clone <repo-url>
cd PlAIner
npm install
```

### 2. Variables d'entorn

```bash
cp .env.example .env.local
```

Omple `.env.local` amb els valors que et passarà el teu company d'equip:

| Variable | Com obtenir-la |
|----------|---------------|
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection string → **Transaction mode** |
| `NEXTAUTH_SECRET` | Executa: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (local) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `RESEND_API_KEY` | resend.com → API Keys |

> ⚠️ **Important sobre DATABASE_URL**: Supabase usa IPv6 per connexions directes, cosa que **no funciona en moltes xarxes domèstiques**. Usa sempre la URL del **pooler** (format `aws-X-[region].pooler.supabase.com:6543`), no la connexió directa (`db.[ref].supabase.co:5432`). Si el pooler tampoc funciona, prova amb hotspot mòbil.

### 3. Genera el Prisma Client

```bash
npm run prisma:generate
```

> No cal executar migracions — la base de dades ja té totes les taules creades a Supabase.

### 4. Arrenca l'app

```bash
npm run dev
```

Obre `http://localhost:3000`.

---

## Flux d'autenticació

| Ruta | Descripció |
|------|------------|
| `/auth/login` | Login amb email/password o Google |
| `/auth/register` | Crear compte nou |
| `/auth/forgot-password` | Sol·licitar reset de contrasenya |
| `/auth/reset-password` | Crear nova contrasenya (via link per email) |

## Rutes MVP

- `/` — landing
- `/search` — cercador principal
- `/results` — resultats de cerca
- `/history` — historial de viatges
- `/auth/*` — autenticació completa

## Stack

- **Framework**: Next.js 14 App Router
- **Auth**: NextAuth v4 + Prisma Adapter
- **BD**: PostgreSQL via Supabase + Prisma ORM
- **Emails**: Resend
- **Passwords**: bcryptjs (hash rounds: 12)
