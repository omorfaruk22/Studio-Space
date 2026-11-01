# StudioSpace Client

The StudioSpace web application built with Next.js App Router, TypeScript, and Tailwind CSS.

## Setup

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Express API origin (default: `http://localhost:4000`). Browser authentication requests use the same-origin `/api/auth/*` route, which proxies to Express so HTTPOnly cookies remain available to protected Next.js pages.

Email/password authentication is configured in the server. To enable Google login, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env.local` and set `BETTER_AUTH_URL` to the frontend origin. The Google redirect URI is `${BETTER_AUTH_URL}/api/auth/callback/google`.

Hosts can upload JPEG, PNG, or WebP cover and gallery images up to 8 MB each. Configure `IMGBB_API_KEY` in the server environment to enable uploads; image hosting credentials stay on the server.

## Scripts

- `npm run dev` — start the local development server.
- `npm run lint` — run ESLint.
- `npm run build` — create an optimized production build.
- `npm start` — serve the production build.

## Studio discovery

The home page includes a three-slide hero, featured studios loaded from the API, category links, booking guidance, and host support information. The `/studios` page supports title search, category, location, hourly price range, and sorting filters. Each studio links to `/studios/[id]` for its gallery, overview, amenities, host details, and review summary.

Public studio data is fetched from the Express API at `NEXT_PUBLIC_API_URL`. When there are no studio records, the home page and discovery page show friendly empty states. Online reservations are implemented in a later project phase.
