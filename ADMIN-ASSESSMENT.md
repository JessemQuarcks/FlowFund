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

Show useful error and retry feedback when console data fails to load, and distinguish “nothing to review” from “the queue failed to load.” As more operational areas are added, consider an admin layout with persistent navigation rather than expanding a single page indefinitely.

## Backend recommendations

### 1. Make actions state-aware and safe to repeat

Verification reviews and report resolutions should only apply to records in an eligible state. Define allowed state transitions and reject stale or conflicting actions with an appropriate conflict response. This prevents repeated or out-of-order requests from silently changing an already-reviewed record.

### 2. Complete audit coverage

Verification, campaign status, and user ban actions are logged, but dismissing a report currently updates its status without creating an audit entry. Audit every admin decision—including report dismissal—with the actor, target, timestamp, previous and new state, and an appropriate reason.

Keep audit metadata minimal: do not include full identity numbers or unnecessary personal details.

### 3. Protect KYC data

Verification records contain full ID numbers and phone numbers, and the admin queue displays the full ID number. Limit exposure, mask values by default, define retention and deletion rules, and assess encryption and access logging for identity data.

### 4. Add operational controls for money-related administration

The roadmap identifies a payout-approval queue and admin-initiated refunds as unfinished. Implement these only alongside clear approval policies, appropriate organiser verification, audit trails, and tested payment-state transitions. Admin actions involving money should be designed around the payment ledger and provider reconciliation rather than directly changing displayed totals.

### 5. Test authorization and workflow boundaries

The existing trust-and-safety integration tests provide useful service-level coverage. Add route-level tests for non-admin access, validation failures, stale or repeated actions, and unexpected states. Add UI coverage for review workflows, rejection notes, and loading/error states.

### 6. Plan for stronger admin access controls

The current authorization model has a single `ADMIN` role. Before a larger staff team uses the console, consider role separation, multi-factor authentication for administrators, and a documented, auditable process for granting and revoking admin access.

## Recommended order of work

1. **Strengthen backend guarantees:** enforce valid state transitions, make admin actions safe against stale requests, and complete audit logging.
2. **Reduce KYC exposure:** mask sensitive values, limit access, and define identity-data retention and deletion behavior.
3. **Improve daily usability:** add search, filtering, pagination, and useful record-detail views.
4. **Complete money operations:** implement payout approvals and refunds only after policies and payment-state handling are defined and tested.
5. **Harden access and verification:** expand route and UI coverage, then add stronger admin authentication and role controls as the staff model requires.

## Summary

The admin console is a credible foundation for basic moderation, with role checks and several audited workflows already in place. The highest-priority improvements are to make state transitions reliable, audit every admin decision, and limit exposure of KYC data. Search, pagination, and richer review context will then make the console more effective as campaign and user volumes increase.
