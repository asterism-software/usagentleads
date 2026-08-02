# Dashboard Sidebar, API, and Account Implementation

Status: Implemented

Target project: `usagentleads`

Reference project: `foreclosuredatahub`

Last updated: 2026-08-02

## 1. Summary

Redesign the authenticated USAAgentLeads dashboard shell so the sidebar remains available on every dashboard route and adds the same product areas shown in Foreclosure Data Hub:

- **Automation**
  - API Keys
  - API Docs
- **Account**
  - Billing
  - Profile
  - Support

The former States directory is represented by a single **Data → Agent Database** item; the 50 individual state tabs were removed. Automation remains in the scrollable navigation region. Account is pinned at the bottom directly above the signed-in user card so the account navigation and profile identity remain together. The entire user card, including the avatar/profile icon, links to `/dashboard/profile` in expanded and collapsed modes. API Keys and API Docs intentionally have no sidebar descriptions.

The existing subscription boundary is unchanged: only a signed-in user with valid subscription access may render the dashboard shell or any of these routes. An authenticated user without access is redirected to `/pricing?upgrade=true`.

This is not only a navigation change. Every destination must be a working product surface with server-enforced authorization, complete loading/error/success states, responsive behavior, tests, and a real backend integration. Existing API-key, usage, subscription, Stripe, public API documentation, and support-email functionality should be reused and hardened instead of reimplemented.

## 2. Decisions and assumptions

These decisions remove ambiguity from the implementation:

1. The sidebar section is labeled **Automation**, matching the supplied Foreclosure Data Hub reference. It is the “API section” described in the requirements.
2. Pro API continues to include Pro Dashboard access, as already advertised in `components/pricing/PlanGroups.tsx`.
3. The dashboard remains subscription-only. An authenticated user without a currently valid subscription is redirected to `/pricing?upgrade=true` before any `/dashboard/**` page renders. All new Automation and Account routes inherit this gate.
4. `/dashboard/api-keys` remains the API management URL to preserve existing links and checkout return URLs.
5. The public, indexable `/docs` API reference remains available. A dashboard-native `/dashboard/api-docs` route reuses the same documentation component and is `noindex`, so the sidebar remains present without creating duplicate documentation or SEO content.
6. Profile data remains provider-backed and read-only in this scope. Email changes, custom avatar uploads, passwords, and account deletion require separate verified security flows and are not implied by a Profile tab.
7. Settings was removed from the sidebar by product direction. The previously implemented route and preference backend remain available for compatibility, but Settings is not part of the delivered navigation.
8. Support is delivered by authenticated email submission through Resend. A ticketing database or third-party help desk is not required for this scope.
9. The existing `usagentleads` Supabase schema remains the source of truth for account and billing data. No table is added to `public`, and the self-hosted leads database remains read-only from the application.

## 3. Requirements traceability

| Requirement | Implementation outcome |
|---|---|
| Add API and Account sections with tabs similar to Foreclosure Data Hub | Add Automation/API Keys/API Docs and Account/Billing/Profile/Support to a route-aware persistent sidebar. |
| Clicking the profile icon redirects to Profile | Replace the current expandable footer button with a `Link` to `/dashboard/profile` in expanded, collapsed, and mobile variants. |
| Fully implement UI and backend | Add the missing routes, preference migration/API, authenticated support API, billing/upgrade actions, persistent shell, entitlement service, tests, and error states. |
| API content remains visible but requires Pro API to unlock | For an active Pro Dashboard subscriber, always render API overview, limits, quick start, endpoint examples, and docs. Lock key creation and actual API access behind an Upgrade to Pro API CTA. |
| Follow the current project UI | Use USAAgentLeads tokens and component classes from `app/globals.css`; do not copy Foreclosure Data Hub’s black active state, gradients, typography, or card styling. |
| Follow best practices | Use server-side entitlement checks, same-origin mutation protection, Zod validation, RLS, rate limiting, provider-hosted billing confirmation, accessible navigation, no secret exposure, and automated tests. |

## 4. Current-state assessment

### 4.1 USAAgentLeads functionality to preserve

| Area | Existing implementation | Notes |
|---|---|---|
| Dashboard state browser | `app/(dashboard)/dashboard/page.tsx`, `components/dashboard/DashboardSidebar.tsx` | The sidebar is owned by the page, so it disappears on other dashboard routes. State selection is component-local rather than URL-addressable. |
| API-key management UI | `app/(dashboard)/dashboard/api-keys/page.tsx` | Create, list, revoke, usage, one-time secret display, and quick-start content already exist. The page currently returns early for non-Pro API users and therefore hides most content. Rename exists in the API but not in the UI. |
| API-key backend | `app/api/api-keys/**`, `lib/utils/apiKeys.ts` | Keys are SHA-256 hashed at rest, limited to three, and the full secret is returned only at creation. Entitlement checks are duplicated and inconsistent across handlers. |
| Public REST API | `app/api/v1/agents/route.ts`, `lib/utils/apiKeyAuth.ts` | Pro API plan check, monthly quota, per-minute limit, and usage logging exist. |
| Public API docs | `app/(site)/(education)/docs/page.tsx` | Comprehensive, indexable reference already exists and should become shared renderable content. |
| Subscription backend | `app/api/subscription/route.ts` | GET, cancel-at-period-end, and resume are implemented for Stripe subscriptions. |
| Stripe portal | `app/api/billing-portal/route.ts` | Creates a customer portal session, but returns to `/dashboard` and uses GET for session creation. |
| Subscription checkout | `app/api/checkout/route.ts`, `components/checkout/SubscribeButton.tsx` | New Pro Dashboard and Pro API checkout is implemented. An active Pro Dashboard subscriber is deliberately prevented from starting a second subscription, so a separate upgrade path is required. |
| Stripe synchronization | `app/api/webhooks/stripe/route.ts` | `customer.subscription.updated` already maps the current allowlisted price to `pro_monthly` or `pro_api`, which can complete a provider-hosted upgrade flow. |
| User identity | Supabase Auth, `lib/auth-user.ts` | Google and magic-link sign-in are supported; safe HTTPS provider-avatar extraction already exists. |
| Contact/support delivery | `components/ContactForm.tsx`, `app/api/contact/route.ts`, `lib/resend/emails.ts` | The public form can be reused visually, but the dashboard support endpoint must derive identity from the session rather than trust a submitted email. |
| Design system | `app/globals.css`, `components/ui/**` | Existing accent, typography, card, input, button, table, focus, reduced-motion, and responsive patterns are the source of truth. |

### 4.2 Foreclosure Data Hub patterns to adapt

The reference behavior lives primarily in:

- `../foreclosuredatahub/components/dashboard/sidebar.tsx`
- `../foreclosuredatahub/app/(platform)/dashboard/layout.tsx`
- `../foreclosuredatahub/app/(platform)/dashboard/api/page.tsx`
- `../foreclosuredatahub/app/(platform)/dashboard/billing/page.tsx`
- `../foreclosuredatahub/app/(platform)/dashboard/profile/page.tsx`
- `../foreclosuredatahub/app/(platform)/dashboard/settings/page.tsx`
- `../foreclosuredatahub/app/(platform)/dashboard/support/page.tsx`

Reuse its information architecture and interaction ideas, not its visual classes or domain-specific features. USAAgentLeads should not inherit foreclosure-specific saved searches, listing notifications, auction urgency, licenses, feeds, or billing providers.

### 4.3 Problems this work must correct

1. `app/(dashboard)/dashboard/layout.tsx` is only a metadata wrapper, so the sidebar is not persistent.
2. `DashboardSidebar` combines navigation, user loading, subscription loading, cancellation/resume logic, modal state, state counts, and sign-out in a 500+ line client component.
3. The current proxy’s subscription-wide dashboard gate is intentional and must be preserved when the shell and route tree are refactored. Its access calculation is duplicated elsewhere and should use the same normalized entitlement rules without relaxing the `/pricing?upgrade=true` redirect.
4. State selection cannot be deep-linked, restored on navigation, or shared because it is local component state.
5. The API page hides all content behind an early return for Pro Dashboard users.
6. Existing Pro Dashboard subscribers cannot upgrade through the current checkout route; it correctly blocks a second recurring subscription and redirects to a generic portal.
7. API plan checks are repeated in proxy/API routes and some management handlers check only the plan name, not the subscription’s valid access period.
8. API-key route errors are often silently ignored in the client, and the implemented rename endpoint has no UI.
9. Billing controls are hidden in an expandable sidebar footer instead of a stable, linkable account page.

## 5. Implemented information architecture

```text
Dashboard shell
├── Header: USAAgentLeads logo + collapse control
├── Scrollable navigation
│   ├── DATA
│   │   └── Agent Database
│   ├── AUTOMATION
│   │   ├── API Keys       /dashboard/api-keys
│   │   └── API Docs       /dashboard/api-docs
│   └── Scroll spacer
├── Pinned ACCOUNT
│   ├── Billing            /dashboard/billing
│   ├── Profile            /dashboard/profile
│   └── Support            /dashboard/support
└── Pinned user card       /dashboard/profile
```

### 5.1 Sidebar item configuration

Define navigation as data rather than hand-written isolated links:

| Section | Label | Route | Lucide icon |
|---|---|---|---|
| Automation | API Keys | `/dashboard/api-keys` | `Code2` |
| Automation | API Docs | `/dashboard/api-docs` | `BookOpen` |
| Account | Billing | `/dashboard/billing` | `CreditCard` |
| Account | Profile | `/dashboard/profile` | `UserRound` |
| Account | Support | `/dashboard/support` | `CircleHelp` |

Use `usePathname()` for route activity and `useSearchParams()` for the active state. A route is active when the pathname equals its route or begins with `route + "/"`; state items are active only on `/dashboard` and are driven by the normalized `state` query value.

### 5.2 Desktop behavior

- Expanded width remains `w-64`; collapsed width remains `w-17` unless a small width adjustment is required to prevent icon clipping.
- The logo/header and user card are fixed within the full-height shell.
- Agent Database and Automation use the middle `overflow-y-auto` region. Account is fixed above the profile card and remains visible at short viewport heights.
- Expanded items show icon and label only. Collapsed items show an icon plus an accessible tooltip/title.
- Active styling uses existing USAAgentLeads colors: `bg-accent-light`, `text-accent`, and the current radius/spacing. Do not copy Foreclosure Data Hub’s black active button.
- Preserve the collapse preference in `localStorage`; this is a device preference and should not be stored as an account setting.
- Preserve scrollability at short viewport heights; the footer must never cover the last Account item.

### 5.3 Mobile behavior

- Move the mobile menu trigger and `Sheet` from the Agent Database page into the dashboard shell so it exists on every route.
- The mobile top row shows the current page label and a menu button with `aria-expanded`, an accessible name, and visible keyboard focus.
- Selecting any state or menu item closes the sheet and moves focus naturally to the destination page.
- The mobile sheet contains the same navigation and profile link as desktop; there is no separate, divergent menu definition.

### 5.4 Profile card behavior

- Replace the current `showBilling` toggle button with a `Link` to `/dashboard/profile`.
- The whole card is the link target, not only the avatar.
- In collapsed mode the avatar/fallback icon remains a link with `aria-label="View profile"`.
- Provider image failures fall back to initials without shifting layout.
- Show name and email only in expanded/mobile mode.
- Billing cancellation, resume, and sign-out controls move out of the sidebar. Sign-out belongs on Profile; billing actions belong on Billing.

## 6. Dashboard shell and routing refactor

### 6.1 Persistent shell

Refactor `app/(dashboard)/dashboard/layout.tsx` into an authenticated server layout that:

1. Calls `supabase.auth.getUser()` on the server.
2. Preserves the current unauthenticated dashboard behavior and redirects an authenticated user without valid subscription access to `/pricing?upgrade=true` as defense in depth behind `proxy.ts`.
3. Loads the normalized subscription summary and total state count in parallel for an entitled user.
4. Loads account preferences, returning code defaults when no row exists.
5. Renders a client `DashboardShell` with serializable user, subscription, entitlement, count, and preference props.
6. Renders all route children inside one scrollable main content area.

Suggested split:

- `app/(dashboard)/dashboard/layout.tsx` — authentication and server data.
- `components/dashboard/DashboardShell.tsx` — collapsed/mobile state and responsive frame.
- `components/dashboard/DashboardSidebar.tsx` — presentation and route links only.
- `components/dashboard/DashboardAccountProvider.tsx` — optional small context for the main page and account pages; do not put secrets or service-role data into it.

The sidebar should receive user data from the server layout rather than making client-side Supabase and subscription requests after mount. This removes layout flicker and duplicated account fetches.

### 6.2 Route access policy

Preserve `proxy.ts` as the first subscription-wide dashboard gate. Every `/dashboard/**` path requires a signed-in user with valid Dashboard entitlement; an authenticated user without it is redirected to `/pricing?upgrade=true`. Keep the layout check as defense in depth and keep paid APIs independently protected.

| Surface | Authentication | Required entitlement |
|---|---|---|
| Dashboard shell and Account routes | Required | `dashboard` |
| `/dashboard` agent data | Required | `dashboard` |
| `/api/agents` | Required | `dashboard` |
| `/dashboard/api-keys` page/content | Required | `dashboard`; Pro Dashboard sees the locked preview |
| Create an API key | Required | `api` |
| Use `/api/v1/**` | API key | `api` |
| View/rename/revoke owned key metadata | Required | `dashboard`; lifecycle/security actions remain available after a Pro API → Pro Dashboard downgrade |
| `/dashboard/api-docs` | Required | `dashboard` |
| Public `/docs` | None | None |

The proxy and layout checks protect the dashboard experience; API handlers remain authoritative so a direct request cannot bypass plan-specific data or API-key restrictions. Expired, paused, cancelled-after-period, and missing subscriptions never render the dashboard shell.

### 6.3 URL-backed Agent Database state

Replace the page-local sidebar callback contract with query-driven navigation:

- `/dashboard` means All States.
- `/dashboard?state=CA` means California.
- Search text, page, and page size should also be candidates for query parameters so back/forward navigation is deterministic. At minimum, `state` must move into the URL for the persistent sidebar.
- A valid URL value overrides account defaults.
- When the URL has no state/page-size value, use `user_preferences.default_state` and `default_page_size`.
- Invalid state/page-size values are normalized to safe defaults and never sent to the leads query.
- Changing state resets `page` to 1 but preserves unrelated supported filters.

Use `router.replace` for rapidly changing controls such as search and `router.push` for deliberate navigation such as selecting a state. Debounce search before writing it to the URL and fetching data.

## 7. Central subscription and entitlement model

Create a server-safe module such as `lib/subscriptions.ts` and move the plan catalog from client-oriented `components/pricing/PlanGroups.tsx` into `lib/billing/plans.ts`. Pricing UI, checkout, webhook synchronization, Billing, and upgrade APIs should all import the same allowlisted plan definitions.

### 7.1 Normalized access result

```ts
type SubscriptionPlan = "pro_monthly" | "pro_api"

type SubscriptionAccess = {
  isActive: boolean
  canUseDashboard: boolean
  canUseApi: boolean
  plan: SubscriptionPlan | null
  reason: "active" | "cancels_at_period_end" | "expired" | "inactive" | "missing"
  accessEndsAt: string | null
}
```

Rules:

| Subscription state | Dashboard | API |
|---|---:|---:|
| Active/on-trial Pro Dashboard with a valid period/trial | Yes | No |
| Active/on-trial Pro API with a valid period/trial | Yes | Yes |
| `cancel_at_period_end=true` and period/trial still valid | Based on plan | Based on plan |
| Expired period, cancelled after access end, paused, or missing | No | No |

Use this helper from:

- dashboard server layout/summary
- `app/api/agents/route.ts`
- `app/api/api-keys/route.ts`
- `app/api/api-keys/[id]/route.ts` where applicable
- `app/api/api-keys/usage/route.ts`
- `lib/utils/apiKeyAuth.ts`
- Billing and upgrade APIs
- homepage active-subscriber redirect logic

Do not authorize from a client-supplied plan, cached UI state, key prefix, or the mere existence of a subscription row.

### 7.2 API management behavior after downgrade

For security and account ownership:

- Any authenticated Pro Dashboard or Pro API subscriber may list their owned key metadata, rename a key, and revoke a key. This keeps key cleanup available after a Pro API → Pro Dashboard plan downgrade.
- Only an active Pro API customer may create a new key.
- A revoked, expired, downgraded, or inactive key can never authenticate `/api/v1/**`.
- Full key material is never stored or returned after the one-time creation response.

Change `GET /api/api-keys` to return both metadata and access state instead of returning an early 403:

```json
{
  "keys": [],
  "access": {
    "can_use_api": false,
    "plan": "pro_monthly",
    "reason": "upgrade_required"
  }
}
```

`POST /api/api-keys` continues to return 403 when locked, with a stable machine-readable code such as `PRO_API_REQUIRED`. Ownership filters remain mandatory for PATCH/DELETE.

### 7.3 API quota hardening

Preserve the documented 10,000 successful requests per UTC calendar month and 60 requests/minute/key, with these corrections:

- Calculate month boundaries explicitly with UTC functions rather than the server’s local timezone.
- Replace unmanaged fire-and-forget database writes with awaited reservation/finalization writes so usage logs are not lost when a serverless invocation freezes.
- Ensure quota reservation/checking is atomic under concurrency.
- Return consistent rate/quota headers on successful and quota/rate-limited responses.
- Never log the presented API key. Store only key ID, user ID, endpoint, status, bounded user-agent/IP metadata, and response time.

Use the existing `api_usage_logs` table as both the audit trail and quota authority through a service-role-only database RPC:

1. `reserve_api_usage(...)` takes the authenticated user/key IDs, endpoint, bounded request metadata, UTC month start, and limit.
2. It takes a transaction-scoped advisory lock derived from user ID + period.
3. It marks abandoned `status_code=102` reservations older than 15 minutes as an internal failure status, then counts successful/current pending rows for that user and UTC period.
4. If the limit is reached, it returns `{ allowed: false, used }` without inserting.
5. Otherwise it inserts one `status_code=102` pending log row and returns `{ allowed: true, log_id, used }`.
6. The route performs the query and **awaits** an update of that exact row to the final status code and response time before responding. A 5xx final status no longer counts against the successful-request quota.

Revoke RPC execution from `anon` and `authenticated`; grant it only to `service_role`. This closes the count-then-insert race without adding a second counter that could drift from the audit log. The migration is additive and requires no historical backfill.

## 8. Automation surfaces

### 8.1 API Keys page

Keep `/dashboard/api-keys`, but restructure it so access state changes actions rather than removing the page.

Always visible:

1. Header: “API Access” and link to dashboard API docs.
2. Pro API plan summary: REST access, 10,000 requests/month, 60 requests/minute, up to three active keys.
3. Base URL and authentication method.
4. Quick-start cURL and JavaScript examples.
5. Endpoint/query parameter summary.
6. Link to the full API reference.
7. API key card shell and explanatory access state.

Visible for active Pro API:

- actual monthly usage and reset date
- active/revoked key metadata
- create, copy-once, rename, and revoke actions
- empty state when no keys exist
- limit state at three active keys

Visible when locked:

- the complete static overview and examples above
- a lock banner inside the key-management card
- no fabricated usage, key, or customer data
- disabled key-creation affordance with an adjacent actionable CTA
- any previously owned key metadata plus rename/revoke actions, so security cleanup remains possible

CTA matrix:

| Account state | CTA | Behavior |
|---|---|---|
| Active Pro Dashboard on Stripe | **Upgrade to Pro API** | Starts a Stripe-hosted subscription update confirmation flow. |
| Active legacy Pro Dashboard | **Contact support to upgrade** | Links to `/dashboard/support?topic=billing`. No second subscription is created. |
| Active Pro API | No upgrade CTA | Key actions and usage are enabled. |
| Pro API cancelling at period end but still valid | **Manage billing** | API remains enabled until access ends; CTA links to Billing. |

Do not use CSS blur as the security boundary. Server handlers remain authoritative regardless of what the page renders.

### 8.2 Pro Dashboard to Pro API upgrade flow

Add `POST /api/subscription/upgrade`:

1. Enforce same-origin mutation, authenticated user, and a per-user rate limit.
2. Accept a Zod-validated target enum; initially only `pro_api` is allowed.
3. Load the user’s current normalized subscription by user ID.
4. Reject inactive, already-Pro-API, non-Stripe, or missing-provider subscriptions with specific safe errors.
5. Retrieve the Stripe subscription and verify it belongs to the stored customer/subscription IDs.
6. Use the server-side allowlisted Pro API price ID from `lib/billing/plans.ts`; never accept a price ID or amount from the browser.
7. Create a Stripe Billing Portal `subscription_update_confirm` flow for the existing subscription item, with proration/confirmation handled by Stripe.
8. Return the short-lived hosted URL as JSON.
9. Redirect back to `/dashboard/api-keys?upgrade=success` after completion.
10. Let the existing signed `customer.subscription.updated` webhook update `plan`, `stripe_price_id`, period, and status. Do not grant access from the return URL alone.
11. On return, poll the normalized subscription endpoint for a bounded period, reusing the current webhook-propagation UX pattern before showing an error/retry action.

This creates one subscription with one provider history instead of charging the customer for a second subscription. Confirm Stripe Portal’s product-switch configuration in test mode before production rollout.

### 8.3 API Docs page

The authenticated `app/(dashboard)/dashboard/api-docs/page.tsx` follows the reference project’s full documentation layout: sticky desktop navigation, mobile documentation menu, overview hero, base URL, quick links, authentication language tabs, rate-limit cards, success/error response examples, endpoint parameters, error codes, language examples, and a final integration CTA. All copy and examples are adapted to the single USAgentLeads `GET /api/v1/agents` endpoint and its real quota rules. The existing public `/docs` route remains canonical and indexable.

## 9. Account surfaces

### 9.1 Billing

Add `app/(dashboard)/dashboard/billing/page.tsx` as a dynamic server-rendered page. It must work for active, trial, cancelling-at-period-end with remaining access, Pro Dashboard, Pro API, and legacy subscribed accounts. Inactive, expired, or missing subscriptions are redirected to `/pricing?upgrade=true` by the shared dashboard gate.

UI, using USAAgentLeads `card`, badge, button, and typography classes:

- current plan and price
- normalized status badge
- billing provider
- renewal, trial-end, or access-end date
- cancellation-at-period-end notice
- included capabilities (Dashboard and API)
- upgrade to Pro API where eligible
- manage payment method/invoices in Stripe Portal
- cancel-at-period-end and resume controls
- clear legacy migration/support state

Backend changes:

- Extend `GET /api/subscription` to return normalized entitlements and display-safe billing summary, not raw provider objects.
- Keep cancellation and resume server-side and idempotent.
- Add same-origin validation to cancel/resume requests.
- Keep billing portal creation at `GET /api/billing-portal` and invoke it only from an explicit dashboard button; the route redirects directly to the short-lived Stripe Portal session and returns to `/dashboard/billing`.
- Set the normal portal return URL to `/dashboard/billing`.
- Use the dedicated upgrade-confirm flow for Pro Dashboard → Pro API.
- Continue treating Stripe webhooks as the entitlement source of truth. A direct Stripe success response may update local UI optimistically, but access changes only after verified provider state is synchronized.
- For `billing_provider !== "stripe"`, preserve access according to the existing period and send the user to Support rather than attempting Stripe mutations.

### 9.2 Profile

Add `app/(dashboard)/dashboard/profile/page.tsx` as a server component backed by `supabase.auth.getUser()`.

Display:

- provider avatar or initials fallback
- full/provider name when available
- verified email address
- sign-in method (`google` or email magic link)
- account creation date
- email verification state
- current plan summary with a link to Billing
- sign-out action

Do not expose access tokens, provider IDs, raw metadata, Stripe IDs, or internal user IDs. Use `getUserAvatarUrl()` and the existing safe `<img referrerPolicy="no-referrer">` fallback strategy because OAuth avatar hosts are dynamic.

The page is deliberately read-only. For Google users, name/avatar are managed by the identity provider; for magic-link users, the email is the verified identity. If editable profiles are required later, define verified email-change and avatar-storage lifecycles as a separate project instead of adding a nonfunctional Save button.

### 9.3 Settings compatibility

The preference migration, authenticated preferences API, and existing Settings route remain in the codebase for backward compatibility. Per the final navigation requirement, Settings is not linked from the sidebar and is not one of the delivered Account tabs. The active Account tabs are Billing, Profile, and Support.

### 9.4 Support

Add `app/(dashboard)/dashboard/support/page.tsx` and `components/dashboard/SupportForm.tsx`.

Page content:

- response-time/support email summary based on existing site claims
- quick links to API Docs, Billing, FAQ, Terms, and Privacy
- authenticated support form
- confirmation state with a clear next step

Support form fields:

- topic: Billing, API/technical, Data quality, Account access, Other
- subject
- message
- name/email shown as read-only account context, not trusted form inputs

Add `POST /api/dashboard/support`:

1. Enforce same-origin, authentication, user/IP rate limits, and JSON content type.
2. Validate topic, bounded subject, and bounded message with Zod.
3. Derive user ID, verified email, and display name from the authenticated session.
4. Load only the display-safe plan/provider context needed by support.
5. Extend the Resend mailer with `sendSupportRequest()` or a typed `source: "dashboard"` variant. Escape all user content and strip control characters from the email subject.
6. Include account email, plan, status, provider, page URL, and submitted topic in the internal email; never include cookies, tokens, API-key hashes, full API keys, or service-role information.
7. Await the Resend result and return a useful retryable error if delivery fails.
8. Return a generic success result without leaking internal recipients or provider response details.

Keep the existing public `/contact` form and `/api/contact` route working. Shared visual form primitives are encouraged, but the public route continues to accept a visitor email while the authenticated route always binds identity server-side.

## 10. API contracts

All JSON errors should use a stable shape:

```json
{
  "error": {
    "code": "PRO_API_REQUIRED",
    "message": "An active Pro API plan is required."
  }
}
```

Do not expose database/provider error text to clients.

| Method and path | Purpose | Auth/entitlement | Rate limit |
|---|---|---|---|
| `GET /api/subscription` | Normalized billing and entitlement summary | User session | 30/min/user |
| `DELETE /api/subscription` | Cancel at period end | User session + same origin + managed Stripe subscription | 5/min/user |
| `PATCH /api/subscription` | Resume scheduled cancellation | User session + same origin + managed Stripe subscription | 5/min/user |
| `POST /api/subscription/upgrade` | Start Stripe-hosted Pro API upgrade | User session + same origin + active Stripe Pro Dashboard | 5/min/user |
| `GET /api/billing-portal` | Create and redirect to a Stripe Portal session | User session + Stripe customer | 10/min/user |
| `GET /api/dashboard/preferences` | Read dashboard defaults | User session | 30/min/user |
| `PATCH /api/dashboard/preferences` | Save dashboard defaults | User session + same origin | 10/min/user |
| `POST /api/dashboard/support` | Send authenticated support request | User session + same origin | 5/hour/user |
| `GET /api/api-keys` | Key metadata and access state | User session | 10/min/user |
| `POST /api/api-keys` | Create key | User session + same origin + Pro API | 10/min/user, max 3 active |
| `PATCH /api/api-keys/:id` | Rename owned key | User session + same origin | 10/min/user |
| `DELETE /api/api-keys/:id` | Revoke owned key | User session + same origin | 10/min/user |
| `GET /api/api-keys/usage` | Historical/monthly aggregate | User session | 10/min/user |

Create a reusable same-origin helper that validates `Origin` against the configured application origin and rejects cross-site mutation requests. Authentication cookies’ SameSite policy remains defense in depth, not the only CSRF control.

## 11. UI and accessibility specification

### 11.1 Current project style

- Use Poppins for UI and JetBrains Mono only for codes, counts, keys, and API examples.
- Use `text-ink`, `text-body`, `text-tertiary`, `text-muted`, `bg-page`, `bg-white`, `border-border`, `accent`, and semantic colors from `app/globals.css`.
- Use existing `card`, `btn-primary`, `btn-outline`, `btn-ghost`, `input`, badge, and table patterns.
- Match Foreclosure Data Hub’s page composition exactly where requested: subtle gradient page background, decorative accent glows, `rounded-3xl` primary cards, generous section spacing, and reference-specific max widths. Keep all colors, typography, controls, borders, and shadows in the USAgentLeads design system.
- Use `max-w-4xl` for API Access/Profile, `max-w-5xl` for Billing/Support, and `max-w-7xl` for the documentation layout.
- Preserve current page spacing: `p-4` mobile, `p-8` desktop, with 44px minimum touch targets.

### 11.2 Required interaction states

Every new or refactored page includes:

- server or skeleton loading state without layout shift
- empty state
- validation state
- network/server error with Retry where useful
- success confirmation
- disabled/busy state preventing double submission
- reduced-motion compliance
- responsive narrow-screen behavior

### 11.3 Accessibility

- Use semantic `nav`, `main`, `section`, headings, labels, and buttons/links.
- Add `aria-current="page"` to the active route and state link.
- Tooltips/titles in collapsed mode cannot be the only accessible name.
- Dialogs for create/revoke/cancel must trap focus, close on Escape, restore focus, and use existing dialog primitives instead of hand-built fixed overlays.
- The one-time API key secret uses a live status message after copy and remains keyboard selectable.
- Status is never conveyed by color alone.
- Locked controls pair `aria-disabled`/disabled state with text that explains how to unlock them.
- On form submission errors, focus the error summary or first invalid field.

## 12. Security and reliability checklist

- [ ] All paid data is protected by server checks even when preview UI is visible.
- [ ] One centralized function determines active subscription and plan entitlements.
- [ ] All cookie-authenticated mutations validate same origin.
- [ ] All request payloads use Zod allowlists and explicit length bounds.
- [ ] Stripe price IDs and target plan are selected server-side from an allowlist.
- [ ] A plan upgrade changes the existing subscription; it never creates a parallel subscription.
- [ ] Verified Stripe webhooks remain authoritative for entitlement changes.
- [ ] API secrets are shown once, hashed at rest, never logged, and never placed in analytics.
- [ ] Users can revoke keys after a Pro API → Pro Dashboard downgrade while their Dashboard subscription remains valid.
- [ ] Preferences use RLS and authenticated-user ownership; no client-selected user ID is accepted.
- [ ] Support identity comes from the session; HTML and email header injection are prevented.
- [ ] Service-role clients remain server-only.
- [ ] Dashboard pages are `noindex`; public `/docs` keeps its canonical URL and SEO metadata.
- [ ] Async usage/email writes are awaited or scheduled with a supported post-response primitive.
- [ ] Errors shown to users are safe; detailed errors stay in server logs.
- [ ] Analytics events contain plan/action names only, not emails, names, query text, API keys, or messages.

## 13. File-level implementation map

### 13.1 Add

| File | Responsibility |
|---|---|
| `components/dashboard/DashboardShell.tsx` | Persistent desktop/mobile frame and collapse/sheet state. |
| `components/dashboard/DashboardContext.tsx` | Display-safe user/subscription/preferences context. |
| `components/dashboard/ApiUpgradeButton.tsx` | Reusable hosted Pro API upgrade action. |
| `app/(dashboard)/dashboard/api-docs/page.tsx` | Dashboard API Docs tab. |
| `app/(dashboard)/dashboard/billing/page.tsx` | Billing page. |
| `app/(dashboard)/dashboard/profile/page.tsx` | Profile page. |
| `app/(dashboard)/dashboard/support/page.tsx` | Support page. |
| `app/api/dashboard/preferences/route.ts` | Preference GET/PATCH compatibility endpoint. |
| `app/api/subscription/upgrade/route.ts` | Hosted Stripe upgrade-confirm flow. |
| `app/api/dashboard/support/route.ts` | Authenticated support delivery. |
| `lib/subscriptions.ts` | Normalized entitlement model. |
| `lib/billing/plans.ts` | Server-safe plan/price catalog. |
| `lib/utils/request-origin.ts` | Same-origin mutation helper. |
| `supabase/migrations/<timestamp>_user_preferences.sql` | Preferences table, checks, RLS, and grants. |
| `supabase/migrations/<timestamp>_atomic_api_usage_reservation.sql` | Atomic quota reservation/finalization support and service-role-only RPC grants. |

### 13.2 Refactor

| File | Change |
|---|---|
| `app/(dashboard)/dashboard/layout.tsx` | Authenticate and render the persistent shell. |
| `components/dashboard/DashboardSidebar.tsx` | Route-driven navigation; remove billing fetches/modals; make profile card a link. |
| `app/(dashboard)/dashboard/page.tsx` | Remove shell ownership, use query-backed state and persisted defaults. |
| `app/(dashboard)/dashboard/api-keys/page.tsx` | Never early-return for locked plans; add contextual CTA, rename UI, and robust errors. |
| `app/(site)/(education)/docs/page.tsx` | Render shared API docs content while preserving metadata/canonical behavior. |
| `components/pricing/PlanGroups.tsx` | Import plan catalog rather than owning server allowlist data. |
| `proxy.ts` | Preserve the active-subscription dashboard gate, use normalized entitlement rules, and redirect non-subscribers to `/pricing?upgrade=true`. |
| `app/api/subscription/route.ts` | Return normalized access and add same-origin checks to mutations. |
| `app/api/billing-portal/route.ts` | Convert portal creation to POST JSON and return to Billing. |
| `app/api/api-keys/route.ts` | Return metadata/access for any owner; require Pro API only for creation. |
| `app/api/api-keys/[id]/route.ts` | Add origin checks and preserve owner-only rename/revoke after downgrade. |
| `app/api/api-keys/usage/route.ts` | UTC ranges, normalized response, entitlement context. |
| `lib/utils/apiKeyAuth.ts` | Use centralized entitlement and atomic quota authority. |
| `app/api/v1/agents/route.ts` | Reliable usage reservation/logging and consistent headers. |
| `app/api/agents/route.ts` | Use centralized dashboard entitlement. |
| `app/api/webhooks/stripe/route.ts` | Import shared plan mapping; verify upgrade event coverage. |
| `components/layout/Navbar.tsx` | Replace GET portal links with a POST-backed client action or Billing link. |
| `lib/resend/emails.ts` | Add typed authenticated support email function. |

Do not delete the existing public contact page, API docs URL, checkout-resume flow, or API key route URL.

## 14. Implementation sequence

### Phase 1 — shared access and billing foundations

1. Extract the plan catalog.
2. Add and unit-test normalized entitlement logic.
3. Centralize and preserve proxy/layout subscription access boundaries.
4. Add same-origin helper.
5. Update existing data/API handlers to use the shared entitlement result.

This phase must land before relying on UI locks.

### Phase 2 — persistent shell and navigation

1. Add `DashboardShell` and move the responsive sheet/collapse state into it.
2. Convert state selection to URL navigation.
3. Refactor the sidebar into route-aware sections.
4. Make the profile card a link.
5. Verify every existing dashboard route renders in the shell.

### Phase 3 — Automation

1. Refactor the API Keys page to preview-first access behavior.
2. Implement rename UI and error handling.
3. Add the provider-hosted upgrade endpoint and CTA.
4. Extract shared API Docs content and add the dashboard route.
5. Harden quota/logging behavior without changing public response fields unexpectedly.

### Phase 4 — Account

1. Add Billing and move subscription actions out of the sidebar.
2. Add Profile and sign-out.
3. Preserve the preference migration/API as a compatibility surface without adding Settings to the sidebar.
4. Add authenticated Support UI/API and mailer.

### Phase 5 — verification and rollout

1. Add unit, route, integration, and critical E2E coverage.
2. Run type-check, test, and production build.
3. Test Stripe upgrade in test mode, including webhook lag and cancellation states.
4. Apply migration before deploying UI that reads preferences.
5. Deploy backend/entitlement changes before or with the new UI.
6. Monitor 401/403/409/429 rates, Stripe webhook failures, Resend failures, and upgrade conversion.

## 15. Test plan

### 15.1 Unit tests

Add a table-driven `__tests__/lib/subscriptions.test.ts` covering:

- Pro Dashboard vs Pro API
- active vs trial
- cancellation with future period end
- cancellation after period end
- missing dates
- expired, paused, and missing rows
- a fixed injected `now` to avoid time-dependent tests

Also test:

- safe plan-price lookup and unknown Stripe price rejection
- same-origin validation
- preference schema and state/page-size normalization
- support payload bounds
- API quota UTC period boundaries

### 15.2 Route tests

Extend/add route tests for:

- unauthenticated responses
- cross-origin mutation rejection
- Pro Dashboard locked creation but visible key metadata
- Pro API active creation
- expired Pro API rejection
- owner-only rename/revoke
- Pro Dashboard upgrade vs legacy-support CTA state returned by summary APIs
- upgrade rejects arbitrary price IDs and duplicate/already-upgraded requests
- portal session uses the stored Stripe IDs and allowlisted Pro API price
- preference get/default/upsert/RLS-safe user ownership
- support derives account email rather than submitted email
- Resend failure returns retryable error
- cancel/resume idempotency and webhook/local-sync race behavior

Update existing tests rather than preserving obsolete expectations such as `GET /api/api-keys` returning 403 for every non-Pro API user.

### 15.3 UI/E2E scenarios

Cover these critical browser journeys with Playwright or the project’s adopted E2E runner:

1. Desktop expand/collapse persists and active items are correct.
2. Mobile menu opens, traps focus correctly through the sheet primitive, and closes after navigation.
3. Selecting California updates `/dashboard?state=CA` and the table; reload preserves it.
4. The expanded and collapsed profile cards both navigate to Profile.
5. An authenticated user without a valid subscription is redirected from every `/dashboard/**` route to `/pricing?upgrade=true`.
6. Pro Dashboard user sees API examples and Upgrade, not a blank/redirect page.
7. Pro API user creates a key, sees it once, copies it, renames it, uses it, sees usage, and revokes it.
8. Pro Dashboard → Pro API test-mode upgrade returns, waits for webhook state, then enables key creation.
9. Cancellation keeps access until the period end and Resume restores renewal.
10. Support submission is pre-associated with the signed-in email and shows success/error states.

### 15.4 Required commands

From `usagentleads`:

```bash
yarn type-check
yarn test
yarn build
```

Run migration verification against a local/staging Supabase environment before production. Do not test schema changes against the shared production project first.

## 16. Acceptance criteria

### Navigation and shell

- [ ] Every `/dashboard/**` route requires a valid subscription; an authenticated user without one is redirected to `/pricing?upgrade=true`.
- [ ] Sidebar appears on Agent Database and every new Automation/Account route.
- [x] Data contains one Agent Database tab; the 50 individual state sidebar tabs are removed.
- [x] Automation has API Keys and API Docs without descriptions.
- [x] Account is pinned above the profile card and has Billing, Profile, and Support.
- [ ] Active route/state styling is correct in expanded, collapsed, and mobile modes.
- [ ] Clicking the avatar/profile card always navigates to `/dashboard/profile`.
- [ ] Sidebar collapse and mobile navigation are accessible and responsive.

### API

- [ ] Active Pro Dashboard users see API overview, limits, examples, docs, and an accurate Upgrade to Pro API CTA.
- [ ] Only active Pro API entitlement can create/use keys or receive API data.
- [ ] Existing key owners can rename/revoke keys after downgrade.
- [ ] Full keys are shown once and never logged or returned again.
- [ ] Usage, quota reset, rate-limit headers, and locked/error states are accurate.
- [ ] Pro Dashboard upgrades the existing Stripe subscription and becomes Pro API only after verified provider synchronization.
- [x] Dashboard API Docs contains the complete USAgentLeads endpoint reference and public `/docs` remains available.

### Account

- [ ] Billing accurately handles active, trial, cancelling-with-access, Pro API, Pro Dashboard, and legacy subscribed states.
- [ ] Portal, cancel, resume, and eligible upgrade actions work end to end.
- [ ] Profile renders only safe authenticated identity details and supports sign-out.
- [x] Settings is intentionally absent from the sidebar; its earlier compatibility route remains available.
- [x] Support derives identity server-side and delivers a sanitized Resend email with useful account context.

### Quality

- [x] No new TypeScript, test, or production-build failures.
- [ ] No service-role credential or secret enters the client bundle.
- [ ] No paid data is exposed by preview UI or the persistent dashboard-shell refactor.
- [ ] Dashboard routes are non-indexable; public `/docs` remains canonical and indexable.
- [ ] Relevant route/unit/E2E tests pass, including entitlement and Stripe webhook-lag cases.

## 17. Out of scope

- New public API resources beyond the existing agent endpoint
- Custom API quota tiers or metered overage billing
- Team accounts or multiple seats
- Editable email, password, identity-provider avatar, or custom avatar storage
- Account deletion/export workflows
- A persistent support ticket database or third-party help-desk integration
- Foreclosure-specific notifications, saved searches, reports, licenses, or feed settings
- Redesigning the public site, pricing page, or Agent Database table beyond what the persistent shell and URL-backed state require
