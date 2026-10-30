# FlowFund — State of the Project & Forward Roadmap

_As of 2026-10-30. This is the forward-looking plan; the original delivery plan and its per-phase history live in [ROADMAP.md](ROADMAP.md), and the admin review in [ADMIN-ASSESSMENT.md](ADMIN-ASSESSMENT.md)._

---

## 1. Executive summary

FlowFund is a Ghanaian crowdfunding platform (Next.js 15 App Router · Prisma/MySQL · NextAuth v4 · Paystack · Cloudinary). Since the original roadmap it has moved from "working prototype, unsafe for real money" to **a functionally complete, test-backed product with a correct money ledger, a real payout path, an admin/trust-&-safety console, and a professional UI**.

**What that means in practice**

- **Phases 0–3 are done.** Hotfixes, engineering foundations, money correctness, and the full product surface (real donors, updates, discovery, email, password reset, profiles) all shipped.
- **Phase 4 (trust & safety) is substantially done on the engineering side:** organiser KYC verification enforced before payout, an admin moderation console (verifications, reports, campaign suspension, user bans), state-aware/audited admin actions, and KYC data retention.
- **Not yet launchable.** The remaining work is **operations (Phase 5), legal/compliance, money operations (refunds/approvals), and a set of hardening gaps** detailed below. These are what stand between "feature-complete" and "safe to take real money from the public."

**Quality bar today:** ~150 unit + integration tests plus an end-to-end flow, all running in GitHub Actions (typecheck, lint, format, unit, migration-drift check, integration, build, e2e). 18 migrations; `main` is green and in sync with origin.

**One-line risk statement:** the code is ready for a controlled pilot on Paystack **test** keys; it is **not** ready for live keys until the legal/custody questions are answered and the launch-readiness (backups, monitoring, hosting) work is done.

---

## 2. Capability inventory (what exists today)

| Area | Status | Notes |
| --- | --- | --- |
| Auth (email + Google), email verification, password reset | ✅ | Rate-limited; server-side password policy; banned users can't sign in (credentials). |
| Create / edit / delete campaigns | ✅ | Shared zod schemas; target & minimum locked after first donation; past-date events editable; deletion refused once donations exist. |
| Donations (server-initialised Paystack + signed webhook) | ✅ | Server owns amount/reference/metadata; `charge.success` is the source of truth; idempotent recorder; integer pesewas throughout. |
| Donation-time rules | ✅ | Must be active, before end date, at/above minimum, not suspended. |
| Payouts (custodial + transfers) | ✅ | Verified payout accounts; `SELECT … FOR UPDATE` balance reservation; `PENDING→PROCESSING→COMPLETED/FAILED/REVERSED` via transfer webhooks; 5% platform fee; after-end-date policy; **payout blocked for unverified organisers**. |
| Reconciliation | ✅ logic / ⚠️ scheduling | `lib/services/reconciliation.ts` compares counters↔ledger and ledger↔Paystack to the pesewa; triggered by `POST /api/cron/reconcile` behind `CRON_SECRET`. **No scheduler wired yet** (hosting-dependent). |
| Append-only audit log | ✅ | Every money movement and admin decision, with `from`/`to` state; no identity values stored. |
| Donors tab, campaign updates, discovery (search/filter/sort/paginate), curated home | ✅ | Real data; anonymity respected; emails never exposed. |
| Transactional email (Resend) | ✅ conditional | Receipts, alerts, payout status, verification, reset. Logs instead of sending when `RESEND_API_KEY`/`EMAIL_FROM` unset. |
| UI / design system | ✅ | FlowFund brand, motion primitives, reusable `CampaignCard`, themed sign-out dialog, signed-out dashboard, rich seed (`npm run db:seed`). |
| Admin console (`/admin`) | ✅ | Role-guarded; verifications, reports, campaign suspend/reinstate, user ban/unban; search + filter + pagination; loading/empty/error states; confirm dialogs; **state-aware (409 on stale)**; fully audited. |
| Organiser verification (KYC) | ✅ core | Submit → admin approve/reject → Verified badge; full ID retained only while `PENDING`, purged on decision (last-4 kept). |
| Security headers | ⚠️ baseline | HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy in `next.config.mjs`. No CSP yet. |

---

## 3. Gaps and risks moving forward

Grouped by theme and tagged **[BLOCKER]** (must be resolved before taking live money from the public), **[LAUNCH]** (needed for a safe production operation), or **[IMPROVE]** (quality/robustness, not launch-blocking).

### A. Operations & launch readiness (Phase 5)

1. **[LAUNCH] No observability.** No error tracking (Sentry), no structured logging, no uptime checks, no alerting. Webhook failures and reconciliation drift are only `console.error`'d — nobody is paged.
2. **[LAUNCH] No hosting / backups story.** Managed MySQL with automated backups and at least one *tested* restore is unproven. `prisma migrate deploy` is not yet in a release pipeline. (Blocked by the **hosting** open decision.)
3. **[LAUNCH] Reconciliation is not scheduled.** The logic exists but nothing calls `/api/cron/reconcile` on a cadence, so drift would go unnoticed in production.
4. **[LAUNCH] Rate limiting is in-memory per instance.** It resets on deploy and doesn't coordinate across instances — ineffective on multi-instance hosting. Needs a shared store (e.g. Upstash Redis) once hosting is chosen.
5. **[IMPROVE] Image optimization is off.** `images.unoptimized: true`; the app uses plain `<img>`. Move to `next/image` + a Cloudinary loader + `remotePatterns`.
6. **[IMPROVE] No performance indexes review / caching.** Add/verify DB indexes (`fundraiserId`, `donorEmail`, `reference`, `userId`, `Event.status`) and cache the Discover page.
7. **[IMPROVE] SEO missing.** No `app/sitemap.ts` or `app/robots.ts`. (Per-event Open Graph metadata is done.)
8. **[IMPROVE] No product analytics** (view → donate funnel).
9. **[LAUNCH] No runbooks** for failed payouts, webhook backlog, refunds, incidents.
10. **[LAUNCH] No load test** of the donate and webhook paths.

### B. Legal & compliance (hard launch blockers)

11. **[BLOCKER] Custody / licensing unresolved.** Holding and disbursing donor funds may require a Bank of Ghana licence or a licensed partner (Payment Systems and Services Act, 2019, Act 987). The platform is currently custodial — this must be cleared with counsel.
12. **[BLOCKER] Data Protection Commission registration** (Data Protection Act, 2012, Act 843) — FlowFund processes names, emails, phone numbers and ID numbers.
13. **[BLOCKER] Paystack crowdfunding approval.** The merchant account must be approved for crowdfunding and upgraded to a registered business (the withdrawal code already notes this).
14. **[BLOCKER] Legal pages are placeholder template text** ("Last updated: May 20, 2023"). Need lawyer-reviewed Terms, Privacy Policy and refund policy reflecting the real custody/fee/payout model.
15. **[LAUNCH] Data retention & account deletion.** KYC ID numbers are purged after a decision, but there is no full account-deletion / data-export flow, no defined retention windows for phone numbers or stored Paystack payload fields.
16. **[IMPROVE] KYC data hardening.** Phone numbers are stored/shown in full; no encryption at rest for identity data; no formal scheduled deletion job.

### C. Money operations (Phase 2/4 follow-ups)

17. **[LAUNCH] No refunds or chargeback handling.** `charge.dispute.*` and `refund.*` webhooks are not handled; admins can't issue refunds. Must be ledger-driven and reconciled, not a totals edit.
18. **[LAUNCH] No payout-approval queue.** All verified organisers can withdraw with no human gate. A threshold above which payouts need admin approval is recommended before live money.
19. **[IMPROVE] Per-transaction Paystack fees not shown.** Only the 5% platform fee is surfaced; organisers don't see the Paystack cut.
20. **[IMPROVE] Donation success page trusts the URL** for amount/title (display only; the ledger is authoritative, but it could read from the recorded donation instead).

### D. Trust, safety & access control (Phase 4 hardening)

21. **[LAUNCH] Single `ADMIN` role, no MFA.** Before a staff team uses the console: role separation (e.g. support vs. finance vs. super-admin), administrator MFA, and an auditable grant/revoke process.
22. **[IMPROVE] Verification is identity-light.** No ID-document upload and no check that the payout-account name matches the verified name — both recommended before releasing funds at scale.
23. **[IMPROVE] No pre-publish review gate.** `Event.status` supports `PENDING_REVIEW` but campaigns publish straight to `ACTIVE`; there is no automated title/description/image moderation.

### E. Accessibility & front-end quality

24. **[LAUNCH] Keyboard-inaccessible donate controls.** The amount picker and the anonymity toggle in `components/donation-form.tsx` are clickable `div`s with `onClick` only — not reachable or operable by keyboard/screen reader. This is on the primary conversion path and a WCAG failure.
25. **[IMPROVE] No accessibility audit.** Labels, focus order, and contrast across the revamped UI are unverified.
26. **[IMPROVE] react-hook-form migration outstanding.** Forms validate against shared zod schemas on the server but client forms are hand-rolled.

### F. Engineering debt

27. **[IMPROVE] Next 16 / Tailwind 4 upgrade pending.** Clears the remaining build-time `npm audit` findings (7 high + 1 moderate in tooling). Next 16 renames `middleware.ts` → `proxy.ts`.
28. **[IMPROVE] No route-guard middleware.** Protected pages (`/dashboard`, `/events/create`, edit, withdraw, `/admin`) are guarded per-handler/per-page; a `middleware.ts` would centralise redirects and defend as a second layer.
29. **[IMPROVE] Package still named `my-v0-project`.** The UI is standardised to "FlowFund"; rename the package and settle the brand officially.
30. **[LAUNCH] GitHub branch protection & staging not set.** `main` should require the three CI jobs; a staging environment (own DB + Paystack test keys) is still pending the hosting decision.

---

## 4. Forward roadmap

Phases are ordered by what unblocks a safe launch. The legal track (Phase L) runs in parallel starting now because it has the longest lead time and gates go-live.

### Phase L — Legal & compliance (START NOW, runs in parallel) · _external lead time_

Gate: written legal sign-off on the custody/operating model; DPC registration filed; Paystack crowdfunding approved; lawyer-reviewed policies published.

- [ ] Engage counsel on custody & BoG licensing (Act 987) — decide custodial vs. licensed-partner vs. subaccounts.
- [ ] Register with the Data Protection Commission (Act 843); appoint a data controller contact.
- [ ] Get Paystack crowdfunding approval + registered-business upgrade on the merchant account.
- [ ] Replace Terms, Privacy Policy and refund policy with lawyer-reviewed versions reflecting the real fee (5%), custody and payout model.
- [ ] Decide data-retention windows (KYC, phone, Paystack payload) and document them.

### Phase 5 — Launch readiness (≈ 2–3 weeks engineering, after hosting is chosen)

Gate: a rehearsed release with backups restored once, alerts firing to a real person, reconciliation running on a schedule, and runbooks written.

- [ ] **Decide hosting** (unblocks most of this phase — see Open decisions).
- [ ] Managed MySQL with automated backups + one tested restore; `prisma migrate deploy` in the release pipeline; a staging environment on test keys.
- [ ] Error tracking (Sentry) + structured logs; uptime checks; **alerts on webhook failures and reconciliation drift**.
- [ ] Schedule `/api/cron/reconcile` (Vercel Cron / crontab / external pinger) with `CRON_SECRET`.
- [ ] Move rate limiting to a shared store (Upstash Redis or equivalent).
- [ ] Performance: `next/image` + Cloudinary loader + `remotePatterns`; verify DB indexes; cache Discover.
- [ ] SEO: `app/sitemap.ts`, `app/robots.ts`.
- [ ] Product analytics + view→donate funnel.
- [ ] Load-test the donate and webhook paths.
- [ ] Runbooks: failed payouts, webhook backlog, refunds, incident response.
- [ ] GitHub branch protection on `main`; nonce-based Content-Security-Policy; external security review of the payment/payout paths.

### Phase 6 — Money operations (≈ 2 weeks; needs refund/payout policy first)

Gate: refunds and disputes move the ledger and reconcile to Paystack; no large payout leaves without the required approval; tested state transitions.

- [ ] Handle `refund.*` and `charge.dispute.*` webhooks; model a `Refund`/dispute ledger entry; never edit displayed totals directly.
- [ ] Admin-initiated refunds (ledger-driven, audited).
- [ ] Payout-approval queue: payouts above a configurable threshold require admin approval before the transfer is sent.
- [ ] Show per-transaction Paystack fees to organisers alongside the 5% platform fee.

### Phase 7 — Trust & access hardening (≈ 1–2 weeks)

Gate: staff can be onboarded with least privilege and MFA; verification is identity-grade.

- [ ] Admin role separation (support / finance / super-admin) + MFA for admins + auditable grant/revoke.
- [ ] ID-document upload and payout-account-name ↔ verified-name matching before releasing funds.
- [ ] Optional pre-publish `PENDING_REVIEW` gate and basic automated content moderation (title/description/image).

### Accessibility & front-end quality (fold into Phase 5; item 24 is pre-launch)

- [ ] **[pre-launch]** Make the donate amount picker and anonymity toggle real, keyboard-operable controls (`button`/`role`+`tabIndex`+key handlers or a radio group).
- [ ] Accessibility pass: labels, focus order, contrast; axe/Lighthouse in CI.
- [ ] Migrate forms to react-hook-form against the shared schemas.

### Engineering debt (continuous)

- [ ] Next 16 / Tailwind 4 upgrade to clear build-time audit findings.
- [ ] Add `middleware.ts` (→ `proxy.ts` on Next 16) for centralised route guards.
- [ ] Rename the package; finalise the brand.

---

## 5. Open decisions still outstanding

| Decision | Why it matters | Status |
| --- | --- | --- |
| **Hosting** (Vercel + managed MySQL, or VPS/container) | Unblocks staging, backups, cron scheduling, shared rate-limit store, CSP strategy | **Open — highest priority; blocks Phase 5** |
| **Custody model** vs. legal advice | Determines licensing exposure and whether refunds/holds stay in-house | Chosen custodial for build; **must be confirmed by counsel** |
| **Payout approval threshold** | Defines the Phase 6 approval queue | Open |
| **Refund policy** | Needed before building refunds and for the legal refund policy | Open |
| **Currencies** (GHS only, or NGN/KES/ZAR later) | A `currency` column exists; expansion needs FX + per-market payout rules | Open (GHS-only today) |
| **Product name** (FlowFund) | UI standardised to FlowFund; package still `my-v0-project` | Effectively decided in UI; formalise + rename package |
| **Paystack fee display** (absorb vs. show vs. pass to donor) | Affects the fee UI and organiser expectations | Open |

---

## 6. Go / no-go launch checklist

Do not switch Paystack to **live** keys until every box is checked:

- [ ] Counsel sign-off on custody/licensing; DPC registered; Paystack crowdfunding approved.
- [ ] Lawyer-reviewed Terms / Privacy / refund policy published.
- [ ] Managed DB with automated backups and a **restore rehearsed at least once**.
- [ ] Monitoring + alerting live; reconciliation scheduled; a named on-call person.
- [ ] Rate limiting on a shared store; CSP enabled; external security review passed.
- [ ] Refunds/disputes handled; payout-approval threshold enforced.
- [ ] Admin MFA + least-privilege roles for all staff accounts.
- [ ] Donate path passes a keyboard/screen-reader check; accessibility audit clean.
- [ ] Load test of donate + webhook paths passes at expected peak.
- [ ] Secrets rotated; branch protection on `main`.

---

## 7. Suggested sequencing

1. **Today:** kick off Phase L (legal) — longest lead time — and make the **hosting** decision.
2. **Sprint 1–2:** Phase 5 launch readiness (depends on hosting) + the pre-launch accessibility fix (item 24).
3. **Sprint 3:** Phase 6 money operations (once refund/approval policies are set).
4. **Sprint 4:** Phase 7 trust/access hardening; engineering-debt items as capacity allows.
5. **Launch gate:** complete the §6 checklist, run a rehearsed release on staging, then flip to live keys for a limited pilot before a public launch.

_Rough estimate to a safe public launch: ~4–6 weeks of engineering once hosting is chosen, gated by the external legal/compliance lead time, which should start immediately._

---

## 8. Demo deployment (portfolio / CV) — Vercel + Render

This section is for publishing FlowFund as a **portfolio demo** (CV + socials), not as a money-handling production service. It deliberately drops the legal/compliance phase and most of the launch-readiness hardening, which are unnecessary when no real money or real personal data is involved.

### 8.1 Scope for the demo

**Skipped (fine to ignore for a demo):**

- The entire **Phase L legal track** — no Bank of Ghana / DPC / lawyer-reviewed policies. The template Terms/Privacy pages are left as-is.
- Backups + tested restore, load testing, external security review, on-call/alerting, runbooks.
- Refunds / chargebacks, payout-approval queue, admin MFA / role separation.
- Shared-store rate limiting (the in-memory limiter is fine for a single demo instance).

**Non-negotiable even for a demo (do not skip):**

- **Paystack TEST keys only** (`sk_test_…` / `pk_test_…`). Never put live keys on a public demo — real cards would be charged.
- A visible **"Demo — test payments only"** note so visitors (and recruiters) know not to enter real card or ID details. Use the Paystack test card `4084 0840 8408 4081`, any future expiry, any CVV.
- Seeded content so the site looks alive (`npm run db:seed`).
- Be aware the seeded demo logins (password `Demo1234!`, including `admin@flowfund.demo` → `/admin`) are effectively public on a live demo. That's acceptable for a showcase; just don't treat the data as private.

### 8.2 Architecture

```
Visitor ──HTTPS──▶  Vercel  (Next.js app, SSR + API routes)
                      │
                      └──▶ Render PostgreSQL (managed, external connection URL)
External services (demo tiers): Paystack (test), Cloudinary (free), Resend (optional)
```

For a Next.js monolith the natural split is **Vercel = app, Render = database**. Render's managed database is **PostgreSQL** (it has no managed MySQL, and no public MySQL endpoint a Vercel app could reach), so the demo runs on Postgres. That needs a small one-time code change (§8.3). If you'd rather not touch the DB engine, see the keep-MySQL alternative in §8.8.

### 8.3 One-time code change: MySQL → PostgreSQL

Only two edits are required for the demo (no data to migrate):

1. **Datasource provider** in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "mysql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Quote the identifiers** in the one raw SQL statement (`lib/services/withdrawals.ts`) — Postgres folds unquoted names to lowercase, so the camelCase columns and the `Fundraiser` table must be quoted:
   ```ts
   Prisma.sql`SELECT "raisedAmount", "totalWithdrawn" FROM "Fundraiser" WHERE id = ${input.fundraiserId} FOR UPDATE`
   ```

For the demo, skip the hand-written MySQL migration history entirely and let Prisma create the schema directly with **`prisma db push`** (§8.5). The migration files under `prisma/migrations/` are MySQL-specific and are not used on the Postgres demo.

> Ask and I can make this switch (provider + raw query + a Postgres-friendly `db push` flow) on a branch so `main` keeps its MySQL/production history intact.

### 8.4 Provision the database on Render

1. Create a Render account → **New → PostgreSQL**. Pick the free instance, region closest to you, name it `flowfund-demo`.
2. After it provisions, copy the **External Database URL** (starts `postgresql://…`). Append `?sslmode=require` if it isn't already present.
3. **Free-tier caveat:** Render's **free Postgres is deleted after 30 days** — fine for a short showcase, not for a CV link you want up for months. For a lasting demo either use Render's paid instance (~US$6/mo) or a free always-on Postgres such as **Neon** (pairs well with Vercel). The deploy steps are identical; only the connection URL changes.

### 8.5 Push the schema and seed (run once, locally)

With the provider switched, point your local machine at the Render URL and create + seed the schema:

```bash
export DATABASE_URL="postgresql://…render…/flowfund_demo?sslmode=require"
npx prisma db push      # creates all tables from schema.prisma (no migrations)
npm run db:seed         # nine demo campaigns, admin + organiser + donor logins
```

(Seeding must be run once from somewhere with the DB URL; doing it locally is simplest.)

### 8.6 External services in demo mode

| Service | Needed for | Demo setup |
| --- | --- | --- |
| **Paystack** | Donations + payouts | Dashboard in **Test mode**; copy `sk_test_…` and `pk_test_…`. After the app is live, set the **webhook URL** to `https://<your-app>.vercel.app/api/webhooks/paystack`. |
| **Cloudinary** | Image uploads (create/edit campaign, avatar) | Free account; copy cloud name + API key + secret. Browsing works without it (seed images are external), but uploads need real values. |
| **Google OAuth** | "Sign in with Google" button | Optional. Either create an OAuth client and add `https://<app>.vercel.app/api/auth/callback/google` as a redirect URI, **or** set any non-empty dummy values — env validation passes, the Google button won't work, and the seeded email/password logins still do. |
| **Resend** | Transactional email | Optional. Leave `RESEND_API_KEY`/`EMAIL_FROM` unset and the app just logs emails instead of sending them. |

### 8.7 Deploy on Vercel

1. Push the demo branch to GitHub. In Vercel: **New Project → Import** the repo. Vercel auto-detects Next.js; leave the build/install commands at their defaults (`npm install` runs `postinstall: prisma generate`, then `next build`). No database is needed at build time — every page is server-rendered on demand.
2. Add **Environment Variables** (Production), from `lib/env.ts`:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | the Render (or Neon) Postgres URL with `?sslmode=require` |
   | `NEXTAUTH_URL` | `https://<your-app>.vercel.app` (set after the first deploy gives you the domain, then redeploy) |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `PAYSTACK_SECRET_KEY` | `sk_test_…` |
   | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_test_…` |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | real values or non-empty dummies |
   | `CRON_SECRET` _(optional)_ | `openssl rand -base64 32` — enables the reconciliation cron (§8.9) |
   | `RESEND_API_KEY` / `EMAIL_FROM` / `CONTACT_TO` _(optional)_ | leave unset to log emails instead of sending |

3. **Deploy.** Then set `NEXTAUTH_URL` to the real domain Vercel assigned and **redeploy** (NextAuth needs the correct public URL).
4. In Paystack (test mode), set the webhook to `https://<your-app>.vercel.app/api/webhooks/paystack`.

### 8.8 Post-deploy smoke test

- Home and `/events` render the nine seeded campaigns.
- Open a campaign → donate with test card `4084 0840 8408 4081` → the thank-you page shows and the donor count/total tick up (webhook + the client confirm both record idempotently).
- Sign in as `admin@flowfund.demo` / `Demo1234!` → `/admin` shows the pending verification and the open report.
- Create a campaign (needs Cloudinary) and post an update.

### 8.9 Optional polish (nice for a portfolio)

- **Reconciliation cron (free on Vercel):** add `vercel.json` with a cron that pings the route — Vercel automatically sends `Authorization: Bearer $CRON_SECRET`, which the route already checks:
  ```json
  { "crons": [{ "path": "/api/cron/reconcile", "schedule": "0 2 * * *" }] }
  ```
- **Custom domain** (e.g. `flowfund.yourname.dev`) in Vercel → Domains.
- A short **demo disclaimer banner** and a link to the GitHub repo and this roadmap from the footer/README.
- Keep **image optimization** in mind: the demo uses plain `<img>` with `images.unoptimized`; fine for a showcase, and switching to `next/image` (roadmap item 5) is an easy follow-up that improves Lighthouse scores.

### 8.10 Keep-MySQL alternative (zero code change)

If you prefer not to switch the DB engine, host the app on **Vercel** exactly as above but point `DATABASE_URL` at a **managed MySQL that exposes a public URL** — e.g. Aiven (free MySQL), Railway, or TiDB Cloud Serverless (MySQL-compatible, free). Render isn't a MySQL host, so this route doesn't use Render for the database. Everything else (env vars, `prisma db push` or `migrate deploy`, seeding, Vercel setup) is identical, and no code changes are needed.

