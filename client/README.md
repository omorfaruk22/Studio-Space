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

## Scripts

- `npm run dev` — start the local development server.
- `npm run lint` — run ESLint.
- `npm run build` — create an optimized production build.
- `npm start` — serve the production build.

The current page confirms the Phase 1 frontend scaffold. Marketplace UI will be added in later phases.
