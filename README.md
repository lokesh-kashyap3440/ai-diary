# AI Diary

Monorepo MVP for a reflective AI diary built with Next.js, NestJS, Prisma, PostgreSQL, and Groq.

## Workspaces

- `apps/web`: Next.js web client
- `apps/api`: NestJS API
- `packages/types`: shared DTOs and domain types
- `packages/ui`: shared UI components
- `prisma`: shared Prisma schema

## Scripts

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run prisma:generate`
- `npm run prisma:migrate`

## Docker Compose

1. Copy `.env.example` to `.env`
2. Set `GROQ_API_KEY` if you want live AI reflections
3. Optionally set SMTP variables if you want real magic-link email delivery
4. Run `docker compose up --build`

Services:

- Web: `http://localhost:3002`
- API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

## Render

This repo includes a Render blueprint at [`render.yaml`](/home/lokesh3440/development/ai-diary/render.yaml) for:

- `ai-diary-web` as a free Node web service
- `ai-diary-api` as a free Node web service
- `ai-diary-db` as a free Render Postgres database

Important Render free-tier constraints:

- Free web services spin down on idle.
- Free Postgres expires after 30 days unless upgraded.
- Free web services cannot send outbound SMTP traffic on ports like `587`.

That last point means password login works on Render free, but SMTP-based magic-link email delivery does not. For real email delivery on Render free, use an email API provider instead of SMTP.

After the first Render deploy, set these service env vars manually in the Render dashboard:

- On `ai-diary-api`:
  - `WEB_URL=https://<your-web-service>.onrender.com`
  - `API_URL=https://<your-api-service>.onrender.com`
- On `ai-diary-web`:
  - `NEXT_PUBLIC_API_URL=https://<your-api-service>.onrender.com`

The web service still uses the internal Render private-network `API_URL` for server-side proxying, but public auth links and browser-facing URLs must use the external `onrender.com` addresses.

## Additional Features

- Chat coach with persisted threads
- Draft/autosave entries
- Search and tag filtering
- Reflection history and tag editing
- Reminder settings API
- JSON export endpoint at `/api/export/json`

## Email Delivery

Real magic-link delivery uses SMTP when configured:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

If those are not set, the app falls back to showing/logging a preview magic link for development.
