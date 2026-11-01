# StudioSpace API

Express and TypeScript REST API for StudioSpace, including Better Auth and MongoDB-backed sessions.

## Setup

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Set `MONGODB_URI` in `.env` to a MongoDB Atlas connection string. `.env.local` is also accepted and takes precedence when present. `CLIENT_ORIGIN` controls the allowed browser origin. The server listens on port 4000 by default.

Set a private `BETTER_AUTH_SECRET` of at least 32 characters and `BETTER_AUTH_URL=http://localhost:3000` (the frontend origin). The frontend proxies `/api/auth/*` to Express so HTTPOnly cookies stay on the frontend origin. Google login requires a Google OAuth Web Client ID and secret. In Google Cloud Console, add `<BETTER_AUTH_URL>/api/auth/callback/google` as an authorized redirect URI, then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

`GET /api/account` is a protected API example and requires a valid session. `GET /api/session` returns the current session or `null` for the browser client.

## Studio discovery

- `GET /api/studios/featured` returns up to six available studios, ordered by rating and then newest first.
- `GET /api/studios` returns available studios. Optional query parameters are `category`, `location`, `search`, `minPrice`, `maxPrice`, and `sort` (`newest`, `price`, or `rating`).
- `GET /api/studios/:id` returns a studio's public details. Invalid MongoDB IDs receive `400`; unavailable or missing studios receive `404`.

## Host studio management

All host studio routes require a signed-in session and scope records to the authenticated owner:

- `GET /api/host/studios` lists the current host's listings.
- `POST /api/host/studios` creates a listing using the signed-in account as its owner.
- `GET /api/host/studios/:id` returns one owned listing, including hidden listings.
- `PATCH /api/host/studios/:id` updates listing details.
- `DELETE /api/host/studios/:id` permanently deletes an owned listing.
- `PATCH /api/host/studios/:id/availability` accepts `{ "isAvailable": true }` to publish a hidden listing again.

Studio cover and gallery uploads use ImgBB. Set `IMGBB_API_KEY` in the server environment; uploads are proxied through the authenticated API and limited to JPEG, PNG, and WebP images up to 8 MB each.

## Health check

`GET /api/health` returns the API status, uptime, and Mongoose connection state. A missing or unavailable database is reported as `disconnected`; it does not prevent the HTTP server from starting during local setup.

## Scripts

- `npm run dev` — watch and run the TypeScript server.
- `npm run build` — compile TypeScript into `dist/`.
- `npm run typecheck` — check types without writing build output.
- `npm start` — run the compiled server.
