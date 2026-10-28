# FlowFund Admin Assessment

_Assessment date: 2026-10-21_

## Overall assessment

FlowFund has a solid first version of a moderation console, but it is not yet a complete operational back office. The current admin area supports organiser verification, campaign reports and suspension, and user bans. It also has important foundations: the admin page and admin API routes check the user's role against the database, request bodies are validated, many changes are transactional, and several workflows have integration tests.

The main gap is that the console is list-and-button oriented. It can perform basic moderation, but provides limited context, workflow support, and oversight for operating a fundraising platform. This assessment aligns with the remaining trust, safety, and compliance work in the project roadmap.

## Frontend recommendations

### 1. Make queues usable as they grow

**Implemented:** all four admin queues now support server-side search, relevant status filters, URL-persisted state, result totals, and 20-item pagination. Search covers campaign title/description and organiser, report reason/details/reporter email and campaign title, verification applicant/contact details, and user name/email.

Campaign status, report status, verification status, and banned/active account filters are available. Date-range and report-count filters remain potential follow-ups.

### 2. Give reviewers enough context to decide

**Implemented:** report rows now have an expandable, accessible review panel with the campaign description and status, category and dates, fundraiser totals and donor count, organiser identity and verification/account status, organiser campaign count, and the five most recent reports. The panel links to the public campaign and the organiser's filtered user record. The report query fetches this context server-side and does not expose reporter contact details.

### 3. Improve verification review

**Implemented:** verification queue results no longer include full ID numbers. Admins explicitly request the ID through an admin-only, non-cacheable endpoint; each reveal is audited without copying the ID value into the audit log. Pending applications have approve/reject controls, and rejection opens a dialog for an optional reviewer note that is shared with the applicant.

### 4. Prevent confusing or accidental actions

**Implemented:** admin actions now use explicit contextual confirmation dialogs, clearly distinguish “dismiss report” from “suspend campaign,” and disable overlapping actions while a request is pending. Buttons also surface busy states such as “Suspending...” or “Banning...” so admins can see when the moderation change is in flight.

### 5. Polish loading, empty, and error states

**Implemented:** the admin route now shows a console-shaped loading skeleton while its server data loads, a route-specific error with a retry action when loading fails, and queue-specific empty messages that distinguish no work to review from searches or filters with no matches. Filtered empty states offer a direct way to clear the current search and filters.

As more operational areas are added, consider an admin layout with persistent navigation rather than expanding a single page indefinitely.

## Backend recommendations

### 1. Make actions state-aware and safe to repeat

**Implemented (2026-10-27):** verification review requires a `PENDING` request, report resolution requires an `OPEN` report, campaign status changes reject no-ops and only allow reinstating a suspended campaign, and ban/unban rejects a no-op. Each stale or conflicting action now returns a `409 CONFLICT` instead of silently re-applying.

### 2. Complete audit coverage

**Implemented (2026-10-27):** every admin decision is audited with the actor, target, previous→new state (`from`/`to`), and the reason where one is captured (e.g. a rejection note). Report dismissal and report-driven suspension both write audit entries. Audit metadata stays minimal — identity numbers are never copied into the log (the identity-view entry only records whether the value was redacted).

### 3. Protect KYC data

**Implemented (2026-10-27):** the full ID number is retained only while a request is `PENDING`; once an admin decides, it is purged and only the last four digits (`idNumberLast4`) are kept for reference. The admin queue never returns the full number; revealing it is an admin-only, no-store, audited action. Remaining follow-ups: masking/limiting phone numbers, encryption at rest, and a formal retention window with scheduled deletion.

### 4. Add operational controls for money-related administration

**Deferred (policy-gated):** the payout-approval queue and admin-initiated refunds depend on an approval policy and tested provider payment-state transitions that aren't settled yet. When built, they must be driven by the payment ledger and Paystack reconciliation rather than editing displayed totals. Not started in this pass.

### 5. Test authorization and workflow boundaries

**Implemented (2026-10-27):** route-level integration tests now drive the real admin handlers with a mocked session and cover unauthenticated (401), non-admin (403), invalid body (400), the happy path (200) and stale/repeated actions (409). Service-level tests cover the new state transitions and KYC retention. Remaining follow-up: component/UI tests for the review workflow, rejection notes, and loading/error states.

### 6. Plan for stronger admin access controls

**Deferred (follow-up):** still a single `ADMIN` role. Role separation, administrator MFA, and an auditable grant/revoke process are recommended before a larger staff team uses the console. Not started in this pass.

## Recommended order of work

1. **Strengthen backend guarantees:** enforce valid state transitions, make admin actions safe against stale requests, and complete audit logging.
2. **Reduce KYC exposure:** mask sensitive values, limit access, and define identity-data retention and deletion behavior.
3. **Improve daily usability:** add search, filtering, pagination, and useful record-detail views.
4. **Complete money operations:** implement payout approvals and refunds only after policies and payment-state handling are defined and tested.
5. **Harden access and verification:** expand route and UI coverage, then add stronger admin authentication and role controls as the staff model requires.

## Summary

The admin console is a credible foundation for basic moderation, with role checks and several audited workflows already in place. The highest-priority improvements are to make state transitions reliable, audit every admin decision, and limit exposure of KYC data. Search, pagination, and richer review context will then make the console more effective as campaign and user volumes increase.
