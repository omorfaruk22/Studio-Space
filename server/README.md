# StudioSpace API

Express and TypeScript REST API for StudioSpace.

## Setup

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Set `MONGODB_URI` in `.env` to a MongoDB Atlas connection string. `.env.local` is also accepted and takes precedence when present. `CLIENT_ORIGIN` controls the allowed browser origin. The server listens on port 4000 by default.

## Health check

`GET /api/health` returns the API status, uptime, and Mongoose connection state. A missing or unavailable database is reported as `disconnected`; it does not prevent the HTTP server from starting during local setup.

## Scripts

- `npm run dev` — watch and run the TypeScript server.
- `npm run build` — compile TypeScript into `dist/`.
- `npm run typecheck` — check types without writing build output.
- `npm start` — run the compiled server.
