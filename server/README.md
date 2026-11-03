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

## Admin dashboard

Set `ADMIN_EMAILS` in the server environment to a comma-separated allowlist of StudioSpace account email addresses. Only authenticated accounts on this allowlist can use the `/api/admin/*` routes. The client dashboard is available at `/admin` and supports editing all studio listing fields, changing listing visibility, and managing booking statuses. Booking confirmation checks for overlapping confirmed bookings.

## Booking API

Booking endpoints require a signed-in session and only expose the current user's bookings:

- `POST /api/bookings` creates a `Pending` request. The API rejects a time range that overlaps an existing `Confirmed` booking, checks the studio's current rate, date, time range, and capacity, then calculates the rental total itself.
- `GET /api/my-bookings` lists the signed-in user's requests with booking-time studio and price snapshots.
- `GET /api/bookings/:id` returns one owned booking.
- `PATCH /api/bookings/:id/cancel` cancels an owned `Pending` booking; other statuses return `409`.
- `GET /api/host/bookings` lists bookings only for studios owned by the signed-in host.
- `PATCH /api/host/bookings/:id/confirm` confirms an owned pending request unless it overlaps another confirmed booking for that studio and date; a conflict returns `409`.
- `PATCH /api/host/bookings/:id/decline` declines an owned pending request.

Confirmation checks run in a MongoDB transaction and update a per-studio revision field so concurrent confirmation requests serialize before the overlap check.

## Health check

`GET /api/health` returns the API status, uptime, and Mongoose connection state. A missing or unavailable database is reported as `disconnected`; it does not prevent the HTTP server from starting during local setup.

## Newsletter

- `POST /api/newsletter` accepts `{ "email": "name@example.com" }`, normalizes the address, and stores one subscription per unique email in MongoDB. Duplicate sign-ups return the same accepted response. A hidden honeypot field filters basic automated form submissions.

## Scripts

- `npm run dev` — watch and run the TypeScript server.
- `npm run build` — compile TypeScript into `dist/`.
- `npm run typecheck` — check types without writing build output.
- `npm test` — build the API and run route/auth regression tests with Node's test runner.
- `npm start` — run the compiled server.
- `npm run smoke` — check the client/API health, public studio routes, and anonymous access restrictions. Set `CLIENT_BASE_URL`, `API_BASE_URL`, `REQUIRE_DATABASE=true`, and `REQUIRE_GOOGLE_AUTH=true` when running against production; see [Phase 10 verification](../docs/phase-10-verification.md).
