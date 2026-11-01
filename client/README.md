# StudioSpace Client

The StudioSpace web application built with Next.js App Router, TypeScript, and Tailwind CSS.

## Project summary

- **Website:** StudioSpace — [https://studio-space-phi.vercel.app](https://studio-space-phi.vercel.app).
- **Client stack:** Next.js App Router, React, TypeScript, Tailwind CSS, and Sonner notifications.
- **API and data:** Express, Better Auth, MongoDB Atlas, and Mongoose at [https://studio-space.onrender.com](https://studio-space.onrender.com).
- **Main features:** Google/email authentication, studio discovery and host CRUD, image uploads, bookings, newsletter sign-up, and light/dark themes.
- **Local setup:** copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_URL`, run `npm ci`, then `npm run dev` from this folder.
- **Examiner test credentials:** no shared production account or password is published in the repository. Create an account at `/register`; use a separate host account and a disposable listing to review host and booking flows. A dedicated shared account should be supplied privately by the project owner if required.

## Setup

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Express API origin (default: `http://localhost:4000`). Browser authentication requests use the same-origin `/api/auth/*` route, which proxies to Express so HTTPOnly cookies remain available to protected Next.js pages.

The production frontend is deployed at [https://studio-space-phi.vercel.app](https://studio-space-phi.vercel.app), with its API at [https://studio-space.onrender.com](https://studio-space.onrender.com). See the root README and [deployment guide](../docs/deployment.md) for setup and release verification.

Email/password authentication is configured in the server. To enable Google login, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env.local` and set `BETTER_AUTH_URL` to the frontend origin. The Google redirect URI is `${BETTER_AUTH_URL}/api/auth/callback/google`.

Hosts can upload JPEG, PNG, or WebP cover and gallery images up to 8 MB each. Configure `IMGBB_API_KEY` in the server environment to enable uploads; image hosting credentials stay on the server.

## Scripts

- `npm run dev` — start the local development server.
- `npm run lint` — run ESLint.
- `npm run build` — create an optimized production build.
- `npm start` — serve the production build.

## Studio discovery

The home page includes a three-slide hero, featured studios loaded from the API, category links, booking guidance, and host support information. The `/studios` page supports title search, category, location, hourly price range, and sorting filters. Each studio links to `/studios/[id]` for its gallery, overview, amenities, host details, review summary, and booking request form.

Public studio data is fetched from the Express API at `NEXT_PUBLIC_API_URL`. When there are no studio records, the home page and discovery page show friendly empty states.

Signed-in creators can request a studio booking from its details page and review or cancel pending requests at `/my-bookings`. Prices are calculated by the server from the current studio rate; this app does not collect payments.
