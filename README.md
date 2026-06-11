# Gurudedo 🎓
### Guru chahiye? Gurudedo!

Hyperlocal skill coach & tutor finder for India.
Find coaches for academics, music, dance, yoga, art, cooking, beauty, coding — near you.

Coach registers → Admin approves → Student searches → Student connects on WhatsApp. That's Phase 1.

## Tech Stack
- **Frontend:** Expo (React Native Web) + Expo Router + NativeWind (Tailwind)
- **Backend:** ASP.NET Core 8 Web API
- **Database:** Supabase (PostgreSQL via PostgREST)
- **Messaging:** WhatsApp — Meta Cloud API
- **Hosting:** Vercel (frontend) + Railway.app (backend)

## Project Structure
```
gurudedo/
├── frontend/    Expo React Native Web app (PWA-ready)
├── backend/     ASP.NET Core 8 Web API
├── supabase/    SQL migration (schema + seed data)
└── README.md
```

## Setup

### 0. Database (Supabase)
1. Create a project at https://supabase.com.
2. Open the SQL Editor and run `supabase/migrations/001_initial_schema.sql`.
3. Grab your **Project URL**, **anon key**, and **service_role key** from Project Settings → API.
4. Change the default admin password (`admin_config` table) from `gurudedo@admin123`.

### 1. Backend (ASP.NET Core 8)
```bash
cd backend
cp .env.example .env        # then fill in real values (or edit appsettings.json)
dotnet run
```
- Runs on `http://localhost:5000`. Swagger UI at `http://localhost:5000/swagger`.
- Health check: `GET /health`.
- Without Supabase credentials the API still boots; data calls will report a clear
  "Supabase not configured" error and WhatsApp sends become dry-run logs.

Configuration is read from `appsettings.json` and overridden by these env vars:
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_PHONE_NUMBER_ID`,
`WHATSAPP_ACCESS_TOKEN`, `ADMIN_PASSWORD`, `JWT_SECRET`, `PUBLIC_SITE_URL`.

### 2. Frontend (Expo Web)
```bash
cd frontend
cp .env.example .env        # set EXPO_PUBLIC_API_URL to your backend URL
npm install
npx expo start --web
```
- Dev server on `http://localhost:8081`.
- Web production build: `npx expo export --platform web` → outputs to `dist/`.

## Phase 1 Features
- Coach registration (4-step form with validation)
- Admin approval panel (password-gated, JWT)
- Search coaches by skill + area + filters
- Coach public profile
- WhatsApp direct connect (wa.me deep link + enquiry logging)
- 12 skill categories

## API Overview
| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/categories` | List active categories |
| GET | `/api/coaches` | List approved coaches (filters + paging) |
| GET | `/api/coaches/search` | Search by skill / area / category |
| GET | `/api/coaches/{id}` | Single coach profile |
| POST | `/api/coaches/register` | Submit registration (pending) |
| POST | `/api/coaches/{id}/enquiry` | Log WhatsApp click + notify coach |
| POST | `/api/admin/login` | Exchange password for JWT |
| GET | `/api/admin/stats` | Dashboard totals |
| GET | `/api/admin/coaches/pending` | Pending registrations |
| GET | `/api/admin/coaches/all` | All coaches (status filter) |
| PUT | `/api/admin/coaches/{id}/approve` | Approve + WhatsApp |
| PUT | `/api/admin/coaches/{id}/reject` | Reject + WhatsApp |
| PUT | `/api/admin/coaches/{id}/feature` | Toggle featured |
| DELETE | `/api/admin/coaches/{id}` | Delete coach |

All `/api/admin/*` routes except `/login` require an `Authorization: Bearer <token>` header.

## Deployment
- **Frontend → Vercel:** uses `frontend/vercel.json` (builds with `expo export`, serves `dist/`).
  Custom domain via `frontend/public/CNAME` (`gurudedo.com`).
- **Backend → Railway:** uses `backend/Dockerfile` + `backend/railway.json`
  (Docker build, `/health` healthcheck). Set the env vars listed above in the Railway dashboard.

## Notes / Phase 1 decisions
- **Data access** goes through Supabase PostgREST over `HttpClient` (`SupabaseService`),
  not EF Core — see `backend/Data/AppDbContext.cs` for the rationale and the EF migration path.
- **WhatsApp** uses plain free-form text messages (no pre-approved templates) so we can ship
  immediately; switch to approved templates in Phase 2. Without credentials, sends are logged
  as dry-runs so the rest of the flow keeps working.

Made with ❤️ in Ahmedabad 🇮🇳 by Jigar Pandya
