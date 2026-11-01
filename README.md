# StudioSpace

StudioSpace is a peer-to-peer marketplace for finding and sharing creative workspaces. The repository contains a Next.js client and an Express API in one monorepo.

## Live application

- Website: [studio-space-phi.vercel.app](https://studio-space-phi.vercel.app)
- API: [studio-space.onrender.com](https://studio-space.onrender.com)
- API health and database status: [studio-space.onrender.com/api/health](https://studio-space.onrender.com/api/health)

## Features

- Responsive home page and studio discovery with search, location, category, price, and sort filters.
- Email/password and Google sign-in, session-aware pages, and protected host/customer areas.
- Studio detail pages, image galleries, and host listing create/edit/availability/delete controls.
- Booking requests, customer cancellation, host confirm/decline, and protection against overlapping confirmed bookings.
- Saved studio wishlists and downloadable PDF summaries for confirmed bookings.
- Light/dark theme toggle and loading, empty, and error states.
- Newsletter interest is persisted in MongoDB; email campaigns are not connected yet.
- Terms and privacy pages describe the current demo behavior and its operational limits.

## Technology

- `client/` — Next.js App Router, React, TypeScript, and Tailwind CSS.
- `server/` — Express, TypeScript, Better Auth, MongoDB, and Mongoose.
- Deployment — Vercel (client), Render (API), and MongoDB Atlas (database).

## Run locally

Use Node.js 20.9 or later and npm. Open two terminals from the repository root.

```powershell
# Terminal 1: frontend
cd client
Copy-Item .env.example .env.local
npm ci
npm run dev
```

```powershell
# Terminal 2: API
cd server
Copy-Item .env.example .env
# Fill server/.env with your local MongoDB URI and a private Better Auth secret.
npm ci
npm run dev
```

The client is at `http://localhost:3000`; the API is at `http://localhost:4000`. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `client/.env.local`. Configure `CLIENT_ORIGIN` and `BETTER_AUTH_URL` as `http://localhost:3000` in `server/.env`. Google login additionally requires a Google OAuth Web Client ID and secret. See the application READMEs and [deployment guide](docs/deployment.md) for details.

Never commit `.env` files, OAuth secrets, database credentials, or API keys. The checked-in `.env.example` files contain placeholders only.

## Build and check

```powershell
cd client
npm run lint
npm run build

cd ..\server
npm run typecheck
npm run build
npm test
```

For deployed endpoint checks and the manual release checklist, see [Phase 10 verification](docs/phase-10-verification.md). Deployment steps are in [docs/deployment.md](docs/deployment.md).
