# StudioSpace deployment

StudioSpace uses Vercel for the Next.js client, Render for the Express API, and MongoDB Atlas for data.

## 1. Deploy the API on Render

1. In Render, choose **New → Blueprint** and connect this GitHub repository on `main`.
2. Render reads the root `render.yaml`. Confirm that the service root is `server`, with build command `npm ci && npm run build`, start command `npm start`, and health check `/api/health`.
3. Supply the prompted environment variables. Set `MONGODB_URI` to the Atlas connection string. Use your Vercel production origin for `CLIENT_ORIGIN` and `BETTER_AUTH_URL` once you have it; both values are origins such as `https://your-project.vercel.app`, without a trailing slash. If you deploy Render first and don't have the Vercel URL yet, temporarily use `http://localhost:3000` for both, then replace both with the Vercel production origin and redeploy. Enter the Google OAuth Web Client ID and secret in Render's environment settings.
4. Create the service and copy its `onrender.com` URL. In the Render service's **Connect → Outbound** panel, copy the outbound CIDR ranges for its region. Add those ranges to the MongoDB Atlas project's **Network Access → IP Access List**, then redeploy or restart the Render service and confirm `GET /api/health` reports `database: "connected"`.

Do not use `0.0.0.0/0` for Atlas access. Render's outbound ranges can be shared and can change; use the ranges shown for the service, or a dedicated outbound IP if your Render plan supports it. See the [Render outbound IP guide](https://render.com/docs/outbound-ip-addresses) and [Atlas IP access list guide](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## 2. Deploy the client on Vercel

1. Import the same GitHub repository as a Vercel project.
2. Set **Root Directory** to `client` and use the detected Next.js framework settings.
3. Add `NEXT_PUBLIC_API_URL` with the Render service URL, for example `https://studiospace-api.onrender.com` (use the actual URL Render assigned). Apply it to Production and Preview only if those preview domains are also configured as trusted origins in Render.
4. Deploy. Copy the production `.vercel.app` origin.

Vercel documents the monorepo **Root Directory** setting in its [monorepo guide](https://vercel.com/docs/monorepos).

## 3. Finish production authentication settings

In Render, set both `CLIENT_ORIGIN` and `BETTER_AUTH_URL` to the exact Vercel production origin, then redeploy the API. In Google Cloud Console, add:

- Authorized JavaScript origin: `https://your-project.vercel.app`
- Authorized redirect URI: `https://your-project.vercel.app/api/auth/callback/google`

Use the actual Vercel origin in both entries. Keep `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `GOOGLE_CLIENT_SECRET` in provider environment settings only; never commit them. Render generates `BETTER_AUTH_SECRET` from the Blueprint.

## 4. Verify the deployment

- Open `https://<render-service>.onrender.com/api/health`; confirm the response says the API is healthy and the database is connected.
- Open the Vercel site and confirm the home page loads and the studios endpoint is reachable. An empty studio collection is expected until hosts create listings.
- Test email registration/login, Google login, session persistence after reload, and logout.
- Test `/studios`, a studio detail URL, and direct reloads on those routes.

If authentication fails, check that `CLIENT_ORIGIN`, `BETTER_AUTH_URL`, the Google origin, and the Google redirect URI all match the production Vercel domain exactly. Better Auth validates trusted origins; see its [security guidance](https://better-auth.com/docs/reference/security).
