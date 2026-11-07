# Booking System — Frontend

A **Next.js** dashboard for managing clinics, services, categories, staff, and schedules. It talks to your REST API over HTTP (axios) and supports **admin** and **clinic admin** roles with different routes and permissions.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19**, **Tailwind CSS 4** |
| Data fetching | **TanStack Query** |
| Forms / validation | **React Hook Form**, **Zod** |
| HTTP | **Axios** (cookies / refresh for auth) |
| State | **Zustand** (auth store) |

---

## Getting started

1. **Node.js** — use a current LTS (e.g. 20+).

2. **Environment** — create `.env.local` in the project root:

   ```env
   NEXT_PUBLIC_API_URL=https://your-api.example.com
   ```

   Used as the axios `baseURL` and to resolve uploaded **image URLs** when the API returns relative paths.

3. **Install & run**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. **Production build**

   ```bash
   npm run build
   npm start
   ```

5. **Lint**

   ```bash
   npm run lint
   ```

---

## What the app does (high level)

- **Auth** — Login; session uses access token + refresh flow via axios interceptors.
- **Clinics** — List, detail, overview, **weekly schedule** (day / full editor modals), **services** tab, **staff** tab. Create/update use **multipart/form-data** when sending **images**.
- **Services** — List (table), create/update/delete, status, provider column when the API returns links.
- **Categories** — List (table), create/update/delete; **images** supported like clinics/services.
- **Staff** — Clinic staff list (providers / admins tabs), member profile & **provider schedule** (aligned with clinic schedule UI), service assignments where applicable.
- **Appointments** — Placeholder / prototype area under dashboard (evolves with your API).

**`/dashboard`** — super admin / admin style navigation.  
**`/dashboard/my-clinic/*`** — scoped experience for **clinic_admin** (single clinic).

---

## Repo layout (short)

| Path | Role |
|------|------|
| `app/` | Routes, layouts, pages (App Router) |
| `src/features/` | Feature modules: `auth`, `clinics`, `services`, `categories`, `staff`, `appointments`, … |
| `src/components/ui/` | Shared UI (headers, loading, toasts, …) |
| `src/lib/api/` | Axios instance, media URL helpers |
| `src/types/` | Shared TypeScript types |

API contracts live next to usage in `*.api.ts` files under each feature.

---

## Notes for backend integration

- JSON is still used for most **GET**s and small **PATCH**es (e.g. schedule payload, status toggles).
- **Create / update** for **clinics**, **services**, and **categories** send **`multipart/form-data`** with an **`images`** field (repeatable file parts), plus the usual text fields.
- If a response shape differs (e.g. schedule PATCH without a nested `clinic`), the client **refetches** clinic details where needed so the UI stays consistent.

---

## License

Private / internal — set your `LICENSE` when you open-source or distribute.
