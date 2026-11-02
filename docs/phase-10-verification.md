# Phase 10: testing, documentation, and release verification

## Automated smoke check

Run the server's `npm test` first. It checks the regression where public studio details were previously intercepted by a router-wide auth middleware, and verifies that booking and host listing routes remain protected.

The smoke script checks that the client and API are reachable, the client API proxy is configured, public studio endpoints stay public, API CORS allows the client origin, invalid studio IDs are rejected, and protected API routes reject anonymous requests.

PowerShell example for production:

```powershell
cd server
$env:CLIENT_BASE_URL = "https://studio-space-phi.vercel.app"
$env:API_BASE_URL = "https://studio-space.onrender.com"
$env:REQUIRE_DATABASE = "true"
$env:REQUIRE_GOOGLE_AUTH = "true"
npm run smoke
```

For a local run, omit the environment variables; defaults are `http://localhost:3000` and `http://localhost:4000`. Set `REQUIRE_DATABASE` and `REQUIRE_GOOGLE_AUTH` to `true` when the environment is expected to have those services configured. The script does not create or modify data and does not test login using real credentials.

## Manual release checklist

Use separate test accounts for a customer and a host. Do not add real passwords or OAuth secrets to this repository. Run these checks against the deployed site after the API health endpoint reports `ready: true`.

### Sign-in and access

- [ ] Register with email/password; confirm the new account is persisted.
- [ ] Log out, then log in with the same credentials.
- [ ] Complete Google sign-in and return to the site successfully.
- [ ] Reload while signed in; the session remains active.
- [ ] Log out; a reload or a protected route no longer treats the user as signed in.
- [ ] Open customer and host protected routes in a signed-out browser; confirm access is redirected or denied.

### Studios

- [ ] Browse `/studios`; search by title and location, filter by category and price, and change sorting.
- [ ] Open a studio detail page and reload that URL directly.
- [ ] As the host, create a listing with a cover image and gallery; confirm it appears in discovery.
- [ ] Edit the listing, hide it, show it again, and delete a disposable test listing.
- [ ] With a second host account, verify the first host's listing cannot be read or changed through host controls.

### Bookings

- [ ] As the customer, request a future time slot; check the booking appears in customer bookings.
- [ ] Cancel a pending request and confirm its status changes.
- [ ] As the listing host, open host booking requests and confirm or decline a pending request.
- [ ] Create two requests for overlapping times on the same studio/date; confirm one, then verify confirming the overlapping request is rejected.
- [ ] Verify the host cannot access or change another host's booking, and a customer cannot access another customer's booking.
- [ ] Try a past date and an invalid time range; confirm the API rejects them.
- [ ] Save and remove a studio from the wishlist; confirm the saved list survives a reload and is private to the signed-in account.
- [ ] Download the PDF summary for a host-confirmed booking; confirm it contains the correct slot and price breakdown and does not imply payment was collected.

### Footer and policies

- [ ] Submit a valid email to the updates list; confirm the page says the email is saved and that campaigns are not sent yet.
- [ ] Open the Terms and Privacy links from the footer.

### Deployment and responsive layout

- [ ] `https://studio-space.onrender.com/api/health` reports `status: "ok"`, `database: "connected"`, and `ready: true`.
- [ ] `https://studio-space-phi.vercel.app` and direct reloads of `/studios` and a real `/studios/<id>` URL load successfully.
- [ ] Check the home, discovery, login, listing, and booking pages at mobile, tablet, and desktop widths.
- [ ] Confirm browser console and Render runtime logs contain no new application errors.

## Release notes and test data

The production deployment uses Vercel for the frontend, Render for the API, MongoDB Atlas for persistence, Google OAuth for optional Google login, and ImgBB for host image uploads. Create throwaway test accounts and disposable listings in the deployed app for the manual checks above; this project intentionally does not publish shared test passwords.

Record the date, deployment commit, smoke check result, manual checklist result, and any failures in the release/commit notes when completing a release. Never record passwords, access tokens, or secret environment-variable values.

## Verification record — 2026-11-02

- Commit checked: `79eacb2` (`origin/main` matched `HEAD`).
- Production smoke check: **12/12 passed**. The live API health endpoint reported MongoDB connected and ready; the website and discovery route returned HTTP 200; anonymous protected API requests returned HTTP 401.
- Server tests: **5/5 passed**. Client lint passed.
- Isolated end-to-end API check: **63 checks passed** against a newly named temporary Atlas database. The run covered registration, sign-in/out, studio create/edit/hide/show/delete, discovery filters, ownership checks, saved studios, booking creation/cancellation/confirmation/decline, capacity and date validation, adjacent and overlapping bookings, concurrent confirmations, PDF generation, and newsletter idempotency. The temporary database and its test records were dropped after the run; production records were not changed.
- Responsive spot-check: **390 × 844 px** on home, mobile navigation, discovery, login, registration, add-studio, dashboard, customer bookings, host booking requests, and saved studios. The layouts fit the mobile viewport; the temporary viewport override was reset.
- Local client production build compiled and completed TypeScript checking, then failed during `/dashboard` prerender because Windows returned `EPERM` while Next.js created a generated `.next` directory. Production home and discovery routes were reachable; rerun the full build in Vercel’s build environment to clear this local-only verification gap.
- Production currently has zero public studios, so live listing and booking flows still need a staging listing or owner-approved test records before they can be exercised against the deployed database.
- Operational integrations still require owner setup if they are part of the launch scope: a mailing-list delivery provider and real identity/safety/support services. Confirm the ImgBB API key in Render before accepting file-upload tests. The site currently explains that newsletter campaigns are not sent and does not claim verification, insurance, or 24/7 support.
