# StudioSpace

StudioSpace is a peer-to-peer marketplace for finding and sharing creative workspaces. This repository contains separate frontend and backend applications in one repository.

## Phase 1 structure

- `client/` — Next.js App Router, TypeScript, and Tailwind CSS frontend.
- `server/` — Express REST API with TypeScript, Mongoose, centralized errors, and a health endpoint.

## Prerequisites

- Node.js 20.9 or later (Node.js 24 is supported by the current setup).
- npm.
- A MongoDB Atlas connection string for database connectivity.

## Run locally

Open two terminals from the repository root.

```powershell
# Terminal 1
cd client
Copy-Item .env.example .env.local
npm install
npm run dev
```

```powershell
# Terminal 2
cd server
Copy-Item .env.example .env
# Set MONGODB_URI in server/.env before expecting a database connection.
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`. The API runs at `http://localhost:4000`; its health endpoint is `http://localhost:4000/api/health`.

## Environment variables

See `client/.env.example` and `server/.env.example`. Never commit real credentials. The API can start without a MongoDB URI for local route development, but the health response will report the database as disconnected until a valid URI is configured.

## Current phase

The application now includes the responsive StudioSpace UI, email/Google authentication, database-backed studio discovery, and studio detail pages. Studio CRUD and bookings are the next product phases.

## Deployment

See [docs/deployment.md](docs/deployment.md) for the Vercel, Render, MongoDB Atlas, and Google OAuth setup. The root [render.yaml](render.yaml) defines the Express API service.
