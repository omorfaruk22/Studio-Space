# Assignment requirement audit

This audit compares the submitted assignment brief with the current repository and deployed application.

## Implemented

- The Vercel client and Render API are live; the API health endpoint reports MongoDB connected.
- The homepage has three interactive hero slides, dynamic featured studios (limited to six), five category links, four booking steps, and a host/creator planning section that avoids claiming unprovided protection or support services.
- Email and Google authentication, protected pages, profile menu, responsive navigation, loading/error/empty states, Sonner toasts, and custom dialogs are present. Protected API mutations validate Better Auth sessions, with a short-lived JWKS-backed JWT session-cache cookie marked HTTP-only and secure in production; anonymous requests receive 401.
- Host studio create/read/update/delete and availability controls use MongoDB and owner-scoped authorization; image uploads use ImgBB when configured.
- Booking requests show statuses, support pending cancellation and host confirm/decline, reject requests overlapping confirmed slots, reject overlapping host confirmations, and provide a downloadable PDF summary for confirmed bookings.
- Signed-in users can save and remove studios from a MongoDB-backed wishlist.
- Newsletter interest stores a normalized email once in MongoDB; duplicate sign-ups are idempotent. The UI clearly says that email updates are not sent because no mailing provider is configured.
- Footer Terms and Privacy links now open pages describing the behavior and limitations of the current project.
- Server checks cover public-route auth scope, booking overlap query boundaries, newsletter validation/honeypot behavior, and protected routes.
- Repository history meets the commit-count targets: at least 15 client-touching commits and 8 server-touching commits.
- Source scans found no Lorem ipsum text or browser `alert()` calls; feedback uses Sonner or inline form errors.

## Requires owner-provided access or operational services

- **Examiner credentials:** no shared production email/password is present. Publishing a password for the live database would let anyone operate that account. The client README explains self-registration; if an examiner requires credentials, the owner should create a restricted staging account and share its credentials privately.
- **Live booking acceptance tests:** the deployed database currently has zero public studios, so a real booking, cancellation, host decision, collision, and cross-owner test cannot be performed without creating test records. Use a staging database or approve disposable production test data and provide signed-in test sessions.
- **Liability protection, verified profiles, equipment safety, and 24/7 support:** these are real-world promises that require insurance/verification processes, published safety rules, and an operating support channel. The UI now discloses these limitations. The owner must establish the services before advertising them as provided.
- **Newsletter delivery:** addresses are stored, but no email campaign provider is connected. Configure a mailing-list provider before promising that messages will be sent.

## Optional extras

The assignment describes PDF booking invoices and a saved-studios wishlist as optional enhancements. The wishlist and confirmed-booking PDF summary are implemented. The PDF is a booking summary rather than proof of payment because StudioSpace does not collect payments.
