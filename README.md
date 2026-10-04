# FlowFund

A fundraising platform for Ghana: organisers create events with a fundraiser, donors give in GH₵ through Paystack, and organisers track what they have raised.

Built with Next.js 15 (App Router), Prisma on MySQL, NextAuth v4, Paystack and Cloudinary.

> **Status:** not yet ready for real money. Keep Paystack on test keys until roadmap Phase 2 is done. See [ROADMAP.md](ROADMAP.md).

## Getting started

You need Node.js 20.9 or later (22 recommended), npm, and either Docker or a MySQL 8 server.

```bash
git clone https://github.com/JessemQuarcks/FlowFund.git
cd FlowFund
npm install                 # also generates the Prisma client
cp .env.example .env        # then fill in the blanks (see below)
docker compose up -d        # MySQL 8.4 on localhost:3307
npx prisma migrate dev      # create the tables
npm run dev                 # http://localhost:3000
```

If you use your own MySQL instead of Docker, point `DATABASE_URL` at it. The database user needs permission to create databases, because `prisma migrate dev` creates a temporary shadow database.

## Environment variables

The app checks these when it starts (`lib/env.ts`) and refuses to boot if any are missing or malformed, listing what is wrong. `.env.example` has a template.

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL connection string, `mysql://user:password@host:port/database` |
| `NEXTAUTH_URL` | Except on Vercel | Public URL of the app, e.g. `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | Random secret for signing sessions: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Yes | OAuth client from the [Google Cloud console](https://console.cloud.google.com/apis/credentials). Add `<NEXTAUTH_URL>/api/auth/callback/google` as a redirect URI |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes | From the Cloudinary dashboard; used for event cover images |
| `PAYSTACK_SECRET_KEY` | Yes | `sk_test_…` or `sk_live_…` from Paystack → Settings → API Keys |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Yes | `pk_test_…` or `pk_live_…`; must be the same mode as the secret key |
| `TEST_DATABASE_URL` | For tests | A disposable database whose name contains `test` (see [Running tests](#running-tests)) |

Never commit `.env`. Production secrets belong in your host's secrets manager.

## Paystack test mode

With test keys, no real money moves. On the donation form, pay with Paystack's test card:

| Field | Value |
| --- | --- |
| Card number | `4084 0840 8408 4081` |
| Expiry | Any future date |
| CVV | `408` |
| PIN | `0000` |
| OTP | `123456` |

Paystack lists more test cards and mobile money test numbers in its [testing guide](https://paystack.com/docs/payments/test-payments/). The test dashboard shows every transaction, which is the easiest way to check that a donation was verified.

## Database and migrations

The schema lives in `prisma/schema.prisma`; every change to it needs a migration.

```bash
npx prisma migrate dev --name describe_the_change   # create and apply a migration locally
npx prisma migrate deploy                           # apply pending migrations (production, CI)
npx prisma studio                                   # browse the data
```

- Commit the generated `prisma/migrations/*` folder with the schema change. CI fails if the two disagree.
- Never edit a migration that has run in production. Add a new one.
- Table names are case-sensitive on Linux MySQL. Write them exactly as the model names (`User`, `Fundraiser`), even if your local MySQL on Windows or macOS accepts any case.
- If you created your local database before 4 October 2026, `prisma migrate dev` will say six old migrations were modified (their table names were fixed to the right case). Reset your local database with `npx prisma migrate reset`. This deletes local data.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier write / check |
| `npm test` | Unit tests (no database needed) |
| `npm run test:integration` | Service tests against a real MySQL database |
| `npm run test:e2e` | Playwright end-to-end tests against a production build |

## Running tests

Unit tests need nothing else:

```bash
npm test
```

Integration and end-to-end tests use `TEST_DATABASE_URL`. **Every run drops all its tables**, so it must be a throwaway database. The test setup refuses any database whose name does not contain `test`. With Docker:

```bash
docker compose up -d
export TEST_DATABASE_URL="mysql://root:flowfund@localhost:3307/flowfund_test"

npm run test:integration

npx playwright install chromium   # first time only
npm run test:e2e
```

On Windows PowerShell, set the variable with `$env:TEST_DATABASE_URL = "mysql://root:flowfund@localhost:3307/flowfund_test"`.

The end-to-end tests build the app and start it on port 3100 with placeholder Google, Cloudinary and Paystack keys. The donation and withdrawal flow is not covered yet; it needs the Phase 2 payment changes.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and every push to `main`:

1. Typecheck, lint, Prettier check and unit tests
2. Migration drift check and integration tests against MySQL 8.4
3. Production build and Playwright tests

## Project layout

| Path | What's there |
| --- | --- |
| `app/` | Pages and API route handlers. Routes parse input, call a service and return JSON |
| `lib/services/` | Business logic: events, donations, users, images |
| `lib/errors.ts`, `lib/api.ts` | `AppError` and the helpers that turn errors into JSON responses (`{ message, code, issues? }`) |
| `lib/env.ts` | Environment validation |
| `lib/paystack.ts`, `lib/cloudinary.ts`, `lib/prisma.ts` | Clients for external services and the database |
| `schemas/` | zod schemas for request input |
| `prisma/` | Database schema and migrations |
| `tests/unit`, `tests/integration`, `e2e/` | Vitest unit and integration tests, Playwright tests |
