# FinTrack — 2026 Readiness Assessment & Recommendations

## Executive Assessment

FinTrack today is a solid **single-user personal finance tracker**: manual transaction entry, CSV import with keyword-based auto-categorization, per-category monthly budgets with over/under-budget status, and a two-chart dashboard (spending by category, spending by month). The architecture is clean — FastAPI + SQLAlchemy backend, Next.js App Router + React Query frontend, properly scoped ownership on every mutation, and a real (if young) test suite (50 backend tests passing).

But it's currently a **CRUD app with charts**, not yet a *financial management* app in the 2026 sense. The gaps aren't cosmetic — they're in the areas that define trust and daily usability for money software: no way to search or page through your own transaction history, no account settings at all (not even change-password), a JWT that silently expires after 24h with no recovery path, and zero automated financial insight beyond two static charts. None of this is hard to fix, but it's the difference between "a project" and "something you'd trust with your real bank statement."

## What the app already does well

- **Clean ownership model.** Every mutation (transactions, budgets, categories) is scoped to `current_user.id` and returns 404 rather than 403 for others' resources — good practice, consistently applied.
- **Sensible data model for its scope.** Categories can be user-created and deleted without orphaning transactions (nulled, not cascade-deleted) — a genuinely good design decision most hobby projects get wrong.
- **CSV import with real dedup logic** (date+description+amount tuple matching), not just naive re-insertion.
- **Budget-vs-actual tracking** computed live from transactions, not a stale cached number.
- **Real test coverage on the backend** (50 tests) exercising ownership boundaries, validation, and conflict handling — most solo/early-stage finance apps skip this entirely.
- **A working, if minimal, category/budget CRUD UI** with confirmation dialogs on destructive actions — the delete-confirmation pattern is already correctly applied everywhere it matters.

## Major gaps vs. 2026 standards

| Area | Current state | Gap |
|---|---|---|
| Transactions at scale | `GET /transactions/` returns **everything**, no pagination/search/sort/filter | Unusable once someone imports a real year of bank statements — this is the single biggest scaling wall |
| Account/profile management | Only `/auth/me` (read-only) | No change-password, no delete-account, no email update — table stakes for any app holding financial data |
| Auth resilience | JWT, 24h expiry, no refresh token, no 401-interceptor on the frontend | Token silently expires mid-session → confusing failures |
| Auth security | `secret_key` defaults to `"changeme"`, no password reset, no email verification, no 2FA | Fine for solo dev use; a real risk the moment this is ever deployed for real users |
| Recurring transactions | Not implemented | Rent, subscriptions, salary are the backbone of real budgeting — currently 100% manual re-entry every month |
| Notifications/alerts | Not implemented | Budget status is only visible if you open the dashboard — no "you're over budget" signal when it actually happens |
| Data export | Import-only, no export | You can get bank data in, never get your own data back out (CSV/PDF statement) |
| Search/filter/categorization UX | Auto-categorization only runs on CSV import, not manual entry; not user-configurable | Two different categorization experiences depending on entry method is confusing and inconsistent |
| Multi-currency | Not implemented | Fine if scope is single-currency by design — worth being an explicit decision, not an oversight |
| Mobile experience | No responsive nav, no mobile menu, fixed horizontal nav bar only | On a phone, the nav bar will overflow/break — this is a real, immediate bug, not a future concern |
| Dark mode | CSS variables fully defined, zero activation mechanism | Wasted design work — the tokens exist but no toggle, no `next-themes`, no `.dark` class ever applied |
| Accessibility | Label/id pairing only; no `aria-live`, no explicit ARIA beyond what Radix/shadcn primitives give for free | Loading/error states are silent to screen readers |
| Auditability | No audit log anywhere | For a finance app, "who changed what when" matters even for a single user (e.g., recovering from an accidental bulk CSV import) |
| Roles/permissions | Single implicit role, no `is_active`, no admin distinction | Non-issue for single-user scope; worth flagging only if you ever add shared/family accounts |

## Prioritized improvement roadmap

### Critical (security, reliability, core usability — do these before anything else)

1. **Enforce `SECRET_KEY` at startup; refuse to boot with the `"changeme"` default.**
   - *Limitation:* silent fallback to a public, guessable key.
   - *Benefit:* prevents a trivial token-forgery vulnerability the moment this is ever deployed.
   - *Complexity:* trivial (one `if` in `config.py`).

2. **Add pagination + at minimum a date-range/description filter to `GET /transactions/`.**
   - *Limitation:* full unbounded fetch, will degrade badly (both DB load and browser render) as transaction count grows past a few hundred.
   - *Benefit:* the app remains usable after real-world CSV imports.
   - *Complexity:* medium — query params + `LIMIT/OFFSET` or keyset pagination backend-side, plus a paginated list UI.

3. **Handle 401/token-expiry gracefully.**
   - *Limitation:* silent failure after 24h, indistinguishable from a network/CORS error.
   - *Benefit:* users get "please log in again" instead of a broken app.
   - *Complexity:* low — one axios response interceptor + redirect to `/login`.

4. **Add change-password and delete-account endpoints/UI.**
   - *Limitation:* zero account self-service.
   - *Benefit:* basic user trust and data-ownership compliance (GDPR-style "right to delete" expectations are now standard, not optional, in 2026).
   - *Complexity:* low-medium.

5. **Fix mobile nav.**
   - *Limitation:* the nav bar has no responsive fallback and will visibly break on a phone right now.
   - *Benefit:* the app is usable at all on mobile.
   - *Complexity:* low (a hamburger/sheet menu, shadcn already has the primitives).

### High (significant UX/business value)

6. **Recurring transactions** (rent, subscriptions, salary).
   - *Benefit:* removes the single biggest manual-entry burden in budgeting apps; this is the #1 feature gap vs. any mainstream competitor.
   - *Complexity:* medium — new model + a "generate this month's occurrences" job or on-read materialization.

7. **Budget/spending notifications** (in-app at minimum; email as a stretch).
   - *Benefit:* budgets become proactive instead of something you have to remember to check.
   - *Complexity:* medium.

8. **Unify categorization**: run the same keyword engine on manually-created transactions too, and let users add/edit their own keyword rules.
   - *Benefit:* consistent behavior, and categorization that improves over time instead of being a fixed 8-category hardcoded list.
   - *Complexity:* low for applying to manual entry, medium for user-editable rules.

9. **Data export** (CSV, and a simple PDF monthly statement).
   - *Benefit:* completes the data-ownership loop; also just useful (tax season, sharing with an accountant).
   - *Complexity:* low-medium.

10. **Activate dark mode.**
    - *Limitation:* tokens exist, nothing uses them.
    - *Benefit:* cheap, high-visibility polish — the design work is already paid for.
    - *Complexity:* trivial (`next-themes` + a toggle button, maybe an hour of work).

### Medium (valuable, not urgent)

11. **Search + sort on the transaction table** (client-side is fine at first, before full server-side pagination lands).
    - *Benefit:* immediate usability improvement with low cost.

12. **Audit trail for destructive actions** (deletions, bulk CSV imports) — even a simple append-only log table.
    - *Benefit:* recoverability and trust ("what happened to my March transactions?").

13. **CSV import flexibility**: accept common column-name variants, don't fail the whole file on one bad row (skip + report instead).
    - *Benefit:* real bank exports rarely match your exact 3-column schema; this is currently a real adoption blocker for actual bank statements.

14. **Financial goals** (e.g., "save $X by [date]"), distinct from budgets.
    - *Benefit:* budgets are about constraint, goals are about aspiration — most mature finance apps separate these because they serve different psychological motivations.

15. **Accessibility pass**: `aria-live` on async status text, explicit labels on icon-only buttons.
    - *Benefit:* real inclusivity, not just decoration.

### Low (future/optimization)

16. **Multi-currency support** — only if you actually plan to track non-single-currency spending; otherwise skip, don't build for a hypothetical.

17. **Multi-account/shared (family) budgets** — meaningful complexity jump, only worth it if that's an actual product direction.

18. **Bank-sync integrations** (Plaid-style) — the biggest possible feature, also the biggest scope/compliance jump (money-movement-adjacent regulation); explicitly out of scope unless this stops being a portfolio/personal project.

## Recommended UX/UI improvements

- Fix the nav for mobile (hamburger/sheet).
- Activate dark mode (the work is already done, just needs wiring).
- Add a real page `<title>` (still literally "Create Next App" — small thing, but it's the first thing anyone sees in a browser tab, and it currently reads as unfinished).
- Add pagination/search to every list view before it becomes a real problem.
- Add loading skeletons instead of plain "Loading..." text for a more polished feel — low effort, disproportionate visual payoff.
- Add a settings/profile page — right now there is *nowhere* to go except the 3 nav links; that's an unusually bare surface for an app holding financial history.

## Recommended functional improvements

- Recurring transactions (highest-value single addition).
- Unified, user-editable categorization rules.
- Budget notifications (in-app toast/banner is enough to start).
- CSV import tolerance (flexible columns, partial-failure reporting).
- Data export (CSV + simple PDF).
- Financial goals as a concept separate from budgets.

## Recommended security and technical improvements

- Enforce a real `SECRET_KEY` at boot (refuse default).
- Add token-expiry handling on the frontend (401 interceptor → redirect to login).
- Add password reset flow (even a simple email-link one) before this is used by anyone but you.
- Move CORS origins to an env var instead of a hardcoded `localhost:3000` — required the moment this deploys anywhere.
- Remove the dead duplicate router/keyword-dict in `core/categorization.py` — small, but dead code in an auth-adjacent file is exactly the kind of thing that causes confusion later.
- Add basic rate-limiting on `/auth/login` (brute-force protection) before any real deployment.

## Quick wins vs. long-term improvements

**Quick wins (hours, not days):**
- Enforce real `SECRET_KEY`
- 401-interceptor for token expiry
- Fix page `<title>`
- Activate dark mode
- Mobile nav fix
- Remove dead code in `categorization.py`

**Long-term (real feature work):**
- Recurring transactions
- Notifications system
- Pagination + search at scale
- Data export
- Password reset / account self-service
- Audit logging
- Financial goals

## Final "2026 readiness" checklist

- [x] No hardcoded/default secrets can reach production — `SECRET_KEY` now enforced at startup (rejects weak/default values)
- [x] Token expiry is handled gracefully, not silently — 401 interceptor clears the token and redirects to `/login`
- [x] Users can manage their own account (password, deletion) — Settings page with change-password and delete-account (with full data cleanup)
- [x] Transaction lists scale (pagination/search) beyond a few hundred rows — paginated + searchable + filterable by category/date range, with CSV export
- [x] Recurring transactions exist — rent/subscriptions/salary auto-generate monthly, no manual re-entry needed
- [x] Users get proactive budget alerts, not just on-demand status — dashboard banner surfaces over-budget categories automatically
- [x] Data can be exported, not just imported — CSV export; PDF statements not built (noted as a stretch goal, not done)
- [x] The app is usable on a phone — responsive hamburger nav
- [x] Dark mode actually works — `next-themes` wired up with a toggle in the nav
- [x] Basic accessibility (`aria-live`, labeled icon buttons) is in place — added across dashboard, transactions, budgets, goals, categories, recurring transactions
- [x] Destructive actions are auditable — audit log for all deletions + CSV imports, viewable on the Settings page
- [x] CORS/config are environment-driven, not hardcoded

**Also completed beyond the original checklist:**
- Rate limiting on `/auth/login` and `/auth/register` (brute-force protection)
- CSV import now accepts common bank export column-name variants and skips invalid rows individually instead of failing the whole file
- Auto-categorization now applies to manually-created transactions too, not just CSV import (still uses the fixed keyword list — user-editable rules were not built)
- Financial goals (separate from budgets) with contribution tracking
- Removed dead duplicate router in `core/categorization.py`

**Still open:**
- Password reset / email verification — blocked on choosing an email provider (Resend/SendGrid/SMTP); not implemented
- PDF statement export — CSV export covers the core data-ownership need; PDF not built
- User-editable categorization keyword rules — auto-categorization works, but rules are still the fixed hardcoded list
- Multi-currency, multi-account/shared budgets, bank-sync — intentionally out of scope per the original recommendation unless the product direction changes

## Open question

Is this meant to stay a **single-user personal tool**, or are you aiming for multi-user/shared budgets eventually? Each user's data is already fully isolated (so "inviting others" already works as independent accounts), but true shared/family budgets would be a separate, larger feature if you want it.
