# WHEN IN API testing with Postman

This folder contains an importable Postman collection and a local environment. The collection follows the current API implementation; it does not add or change application behavior.

## Import and configure

1. In Postman, choose **Import** and import both:
   - `WHEN-IN-API-Testing.postman_collection.json`
   - `WHEN-IN-Local.postman_environment.json`
2. Select the **WHEN IN - Local** environment.
3. Set `baseUrl` to the running app URL (default `http://localhost:3000`).
4. `testEmail` and `testPassword` may be left blank. The registration request generates a unique `@example.invalid` account and a temporary password at runtime. Alternatively, set them to credentials for a dedicated test account.
5. Postman’s cookie jar stores the HTTP-only `token` cookie returned by registration/login; do not copy JWTs or secrets into variables. `unauthBaseUrl` defaults to `http://127.0.0.1:3000` so negative auth requests do not reuse the `localhost` cookie jar. If testing another host, set it to an equivalent URL with a separate cookie scope or clear the relevant Postman cookies first.
6. No MongoDB URI, database credential, JWT secret, or Resend key is included.

## Safe execution guide

The app currently points at the shared `WHENIN` Atlas database. Run **01 - Safe read-only checks** first. Those requests read data, exercise invalid IDs/auth and pagination, and check health; they do not create or update records.

Do **not** click **Run collection** against shared data. Run individual folders selectively:

- **01 - Safe read-only checks:** safe for the shared database.
- **02 - Authenticated API workflow (creates test data):** creates a new user and a uniquely named cafe, updates that cafe, creates an in-app notification as part of cafe submission, marks that new notification read, and deletes only the cafe ID returned by that test run. There is no user-delete or notification-delete endpoint, so the generated account and read notification remain. Use only on a disposable/local database or with explicit acceptance and manually clean up only the exact test records if desired. The email-notification checkbox is irrelevant to this API flow; the cafe creation route itself does not send an email.
- **03 - Email notification endpoints (manual only):** **may send email through Resend** and create email-request records. Do not execute against real recipients. Even `example.invalid` is not a guarantee that the provider will not be invoked. These are provided for manual testing only.
- **04 - Manual global mutation (do not run by default):** marks **all** of the authenticated user’s unread notifications read, including pre-existing ones. Run only if that change is intended.
- **05 - Rate limit probe:** sends 21 failed login lookups for nonexistent `.invalid` addresses. It does not create users or send email. The rate-limit helper is not currently connected to an API route, so the assertion expecting HTTP 429 is expected to fail with the present implementation.

The CRUD workflow requires the request order shown in folder 02. Registration/login responses establish the cookie; cafe submission stores its ID, and notification history looks up the notification associated with that cafe. Do not run individual dependent requests before their variables have been populated.

### Test data cleanup

Cafe deletion is scoped to the `testCafeId` produced by the collection and should only be used for that exact test cafe. Cafe submission also creates an in-app notification. The API has no delete-notification endpoint; the collection marks this test notification as read but leaves it in history. Similarly, there is no user deletion endpoint. For disposable databases, remove test records using the database’s normal administrative workflow after verifying their unique test email/cafe name and IDs. Never delete records by broad filters, and never run destructive cleanup against unrelated databases.

## Running requests and reading results

- Open a request and choose **Send**, or select a safe folder and choose **Run**.
- The **Test Results** tab reports the per-request Postman assertions (status, response shape, auth, pagination and errors).
- Requests that depend on a preceding response use collection/environment variables populated by test scripts (`cafeId`, `offerId`, `testCafeId`, `testNotificationId`).
- HTTP-only cookies are managed by Postman. If an authenticated request returns 401, check the selected environment/base URL and Postman cookie jar; login again if needed.
- Collection assertions do not imply that a request was executed. Only the run report records execution counts.
- Newman is optional and is not installed/configured by this project. No dependency or package script was added.

## API audit

All implemented API route handlers are listed below. No separate role or bearer-token system is used; protected endpoints read and validate the `token` cookie. Field validation is performed by Zod where described.

| Method | Endpoint | Parameters / body | Auth | Success | Common error responses |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | JSON: `name` (2+ chars), `email` (valid email), `password` (6+ chars) | No | `200` `{ success, user }`; sets HTTP-only `token` cookie | `400` invalid JSON/fields; `409` duplicate email; `500`/`503` database/server failure |
| `POST` | `/api/auth/login` | JSON: `email`, `password` (6+ chars) | No | `200` `{ success, user }`; sets cookie | `400` malformed/invalid body; `401` invalid credentials; `500`/`503` |
| `POST` | `/api/auth/logout` | None | No | `200` `{ success, message }`; expires cookie | Normally no application validation error |
| `GET` | `/api/auth/me` | None | Yes | `200` `{ success, user }` | `401` missing/invalid/expired cookie or user not found; `500`/`503` |
| `GET` | `/api/users/me` | None | Yes | `200` `{ success, user, cafes }` | `401` auth; `404` user missing; `500`/`503` |
| `PATCH` | `/api/users/me` | JSON: optional `name` (2+ chars), optional `notificationPreferences.cafeSubmission` and `offerAlerts` booleans | Yes | `200` `{ success, user }` | `400` invalid JSON/body; `401`; `404`; `500`/`503` |
| `GET` | `/api/cafes` | Query: `page` (default 1), `limit` (default 10, capped at 20), `search`, `city` (default configured city/Pune), `cuisine` | No | `200` `{ success, pagination, data }` | `500`/`503` |
| `POST` | `/api/cafes` | JSON: `name` (2+), `description` (10+), `address` (5+), `locality`/`city`/`cuisine` (2+), numeric `averagePriceForTwo` (>0), `openingHours` (3+); optional `contactNumber`, `imageUrl` | Yes | `201` `{ success, cafe, message }`; creates an in-app notification | `400` invalid/missing fields; `401`; `409` duplicate cafe; `500`/`503` |
| `GET` | `/api/cafes/{id}` | Path `id` (Mongo ObjectId) | No | `200` `{ success, cafe }` | `404` invalid or missing cafe; `500`/`503` |
| `PATCH` | `/api/cafes/{id}` | Path ObjectId; JSON with at least one supported field (`name`, `description`, `address`, `locality`, `city`, `cuisine`, numeric `averagePriceForTwo`, `openingHours`, `contactNumber`, `imageUrl`) | Yes; only the submitting user may update | `200` `{ success, cafe }` | `400` invalid/empty update; `401`; `403` not owner; `404`; `409` duplicate; `500`/`503` |
| `DELETE` | `/api/cafes/{id}` | Path ObjectId | Yes; only the submitting user may delete | `200` `{ success, message: "Cafe deleted." }` | `401`; `403` not owner; `404`; `500`/`503` |
| `GET` | `/api/offers` | Query: optional `search`; `active=false` includes inactive offers (default is active only) | No | `200` `{ success, data }` | `500`/`503` |
| `GET` | `/api/offers/{id}` | Path ObjectId | No | `200` `{ success, data }` including `cafeName` | `404` invalid/missing offer; `500`/`503` |
| `GET` | `/api/notifications` | None | Yes | `200` `{ success, data, unreadCount }`, most recent 50 | `401`; `500`/`503` |
| `PATCH` | `/api/notifications` | Either `{ "notificationId": "<ObjectId>" }` or `{ "markAllRead": true }` | Yes; scoped to current user | `200` `{ success, unreadCount }` | `400` invalid JSON/payload/ID; `401`; `404` notification not owned/found; `500`/`503` |
| `POST` | `/api/notifications/offer` | JSON: valid `email`, `offerId`, `cafeName`, `offerTitle`, `discount`, `terms`, `validity`, `link` | Yes | `200` `{ success, message, emailResult, notification }`; persists email request and in-app notification, attempts Resend | `400` invalid payload; `401`; `404` offer; `500`/`503` |
| `POST` | `/api/notifications/cafe-submission` | JSON: valid `email`, `cafeName`; optional `cafeId` ObjectId | Yes | `200` `{ success, message, emailResult, notification }`; persists email request, attempts Resend | `400` invalid payload/ID; `401`; `404` cafe; `500`/`503` |
| `GET` | `/api/health` | None | No | `200` health and safe database/collection counts | `500`/`503` if database check fails |

### Coverage and known boundaries

- Cafe listing enforces a maximum page size of 20 server-side. Invalid page/limit values fall back to defaults.
- Offers have read/list/detail APIs only. There are **no offer creation, update, or deletion routes**.
- Cafe submission supports `POST`, `PATCH` updates, and `DELETE` for the owner’s submission.
- The repository contains an in-memory rate-limiter helper, but no API route currently calls it. There is therefore no application-level rate-limit behavior to assert as passing; the dedicated probe documents the expected failure.
- No explicit application request-body size limit was found in the route handlers. Do not treat framework/proxy defaults as a documented app limit.
- Wrong/unsupported HTTP methods are rejected by the Next.js route handler layer (normally `405 Method Not Allowed`); the collection includes a safe method check.
- Invalid JSON is explicitly handled on routes that parse JSON. Unsupported content types and oversized payload thresholds have no route-specific contract and need manual deployment/framework verification.
- Successful notification-request routes call the existing email integration. Avoid sending those requests in routine test runs.

## Execution record for this audit

The following checks were executed against `http://localhost:3000` during setup: `GET /api/health` returned `200`, reported `WHENIN` connected, and included collection counts. No collection was run, no account/cafe/notification was created or changed, and no email endpoint was called. Newman is not installed. All other cases in the collection are prepared but not executed; use Postman’s Test Results/run report to record their actual outcomes.
