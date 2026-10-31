# StudioSpace Client

The StudioSpace web application built with Next.js App Router, TypeScript, and Tailwind CSS.

## Setup

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` in `.env.local` to the Express API origin (default: `http://localhost:4000`).

## Scripts

- `npm run dev` — start the local development server.
- `npm run lint` — run ESLint.
- `npm run build` — create an optimized production build.
- `npm start` — serve the production build.

The current page confirms the Phase 1 frontend scaffold. Marketplace UI will be added in later phases.
