This is a [Next.js](https://nextjs.org) application with a custom Node.js HTTP server and Socket.IO.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Database setup

The API requires MongoDB. Configure `MONGODB_URI` and `JWT_SECRET` in your local environment before using registration, cafe, offer, profile, or notification features. If MongoDB is missing or unavailable, API requests return a server error rather than using temporary in-memory data.

In development only, cafe and offer reads insert any missing records from the demo dataset. Existing records are not overwritten, and no demo user account is created. Production deployments do not seed demo data.

## CI and deployment

GitHub Actions runs `npm ci --legacy-peer-deps`, checks `server.js` syntax, and runs `npm run build` on pushes to `main` and pull requests targeting `main`. The legacy peer option is needed because the existing Vitest 5 / `@types/node` 20 declarations conflict during clean npm installation; dependency manifests are unchanged. There are currently no application test files, and the existing full-project lint command reports pre-existing `no-explicit-any` errors, so lint and tests are not configured as passing CI gates.

The project includes a Render Blueprint in `render.yaml`. Deploy it as a Render **Web Service** so the custom `server.js` process owns both the Next.js HTTP server and persistent Socket.IO connections. Render supports inbound WebSockets and supplies `PORT`; the server binds to `0.0.0.0`. The Blueprint disables Render's automatic Git deploy so GitHub Actions can trigger deployment only after its build succeeds. Configure `MONGODB_URI`, `JWT_SECRET`, and `RESEND_API_KEY` as secret environment variables in Render. Set `RESEND_FROM_EMAIL` if required. The database connection selects `WHENIN`; keep the URI private and grant access only to the intended Atlas database.

To enable deployment, create the Render Web Service from this Blueprint and set the required Render environment secrets. In Render, create a deploy hook for the service, then add its URL in GitHub **Settings → Secrets and variables → Actions** as `RENDER_DEPLOY_HOOK_URL`. The workflow triggers this hook only for a successful push to `main`; pull requests build but do not deploy. If the secret is absent, the deploy job reports a warning and skips deployment.

The Blueprint uses a single service instance because Socket.IO rooms use the process-local adapter. For multiple instances, configure a shared Socket.IO adapter and appropriate load-balancing/stickiness before scaling. Render's free service may spin down after inactivity, so use an always-on plan if uninterrupted real-time connections are required. No Render service is created until you connect and deploy the repository.

Do not commit `.env.local` or any secret values. `.env.example` contains placeholders and is intentionally allowed in Git.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Next.js deployment documentation

For this custom-server application, use the Render Web Service configuration above rather than a standard serverless-only deployment. See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for framework deployment details.
