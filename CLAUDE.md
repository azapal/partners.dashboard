# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Vite dev server on 0.0.0.0:5000
npm run build            # vite build -> dist/  (does NOT typecheck)
npm run preview          # serve the built dist/
npm run lint             # see caveat below
npx tsc --noEmit         # the real typecheck — run this before considering work done
npm run release:dev      # build + s3-deploy to bucket `partner.azapal` (eu-west-2)
```

There is **no test suite** and no test runner installed. Verification is manual: run the dev
server and exercise the flow.

Two caveats on the tooling:

- `npm run lint` only matches `**/*.{js,jsx}` ([eslint.config.js](eslint.config.js)). The ~150
  `.ts`/`.tsx` files that make up the app are **not linted at all**. Don't treat a clean
  `npm run lint` as meaningful.
- `vite build` does not run the TypeScript compiler, so type errors ship. `npx tsc --noEmit`
  currently reports a backlog of pre-existing errors — check that your changes didn't add to
  the count rather than expecting zero.

### Environment

No `.env` is committed. [config/config.ts](config/config.ts) reads `VITE_APP_STAGE`
(`local` | `dev` | `staging` | `production`) and picks base URLs for two backends:

- `config.api.azapal.baseUrl` — `VITE_AZAPAL_BASE_URL_{LOCAL,DEV,STAGING,PROD}`, default
  `http://127.0.0.1:8000/api/v1/azapal`. **Every service call in the app uses this one.**
- `config.api.account.baseUrl` — `VITE_ACCOUNT_BASE_URL_*`, default port 9000. Currently unused
  by any service.

Without a `.env.local`, the app talks to localhost:8000.

## Architecture

React 19 + Vite + TypeScript SPA. The partner-facing control panel for Azapal, a logistics
platform. Server state is TanStack Query; client state is TanStack Store consumed through
`useSyncExternalStore` (there is no Redux/Zustand/Context). Styling is Tailwind v4 configured
through the Vite plugin, with brand tokens in an `@theme` block in [src/index.css](src/index.css).
Icons are Remix Icon loaded from a CDN in [index.html](index.html) — write `<i className="ri-foo-line" />`,
not a React icon component.

### The dual-session auth model — read this first

The single most important thing about this codebase. There are **two disjoint login systems
writing to two separate localStorage namespaces**, and they overlap in exactly one place.

| | Partner owner | Rep / employee |
|---|---|---|
| Login | partner code → OTP (`/`, `/login/otp`) | email + branch code → OTP (`/support/login`, `/support/branch-login`) |
| Storage | `auth_token`, `refresh_token`, `partner_profile` | `rep_auth_token`, `rep_profile` |
| Store | [store/client/partner.ts](src/store/client/partner.ts) | [store/client/rep.ts](src/store/client/rep.ts) |
| Read via | `usePartnerProfile()` | `useRepProfile()` |
| Guard | [RequireAuth](src/components/RequireAuth.tsx) | [RepRequireAuth](src/components/support/RepRequireAuth.tsx) |
| Shell | `DashboardLayout` (full sidebar) | `RepDashboardLayout` (`/support/*`) |

**The overlap:** reps whose role is exactly `tenant admin` or `super admin` get full
main-dashboard parity. `isElevatedAdminRole()` in [repService.ts](src/service/repService.ts)
mirrors the backend's `is_elevated_admin_employee` byte-for-byte; after OTP,
[BranchOtpScreen.tsx:99](src/views/support/BranchOtpScreen.tsx#L99) routes them to `/dashboard`
instead of `/support/dashboard`.

That one rule has to be honored at three separate layers, and forgetting any of them produces a
silently-empty screen rather than an error:

1. **Route guard** — `RequireAuth` passes on `partnerProfile || isElevatedAdminRole(...)`.
2. **Auth header** — `getHeaders()` in [partnerService.ts](src/service/partnerService.ts) falls
   back to `rep_auth_token` when no partner token exists.
3. **Query gating** — every main-dashboard hook must write
   `enabled: !!partnerProfile || !!repProfile`, not just the partner check. See
   [useLogistics.ts](src/hooks/useLogistics.ts) for the canonical example.

When adding any main-dashboard hook, copy the two-profile `enabled` pattern.

### Role helpers

Role names are free-text, admin-assigned strings from the backend — there is no enum. The four
helpers at the top of [repService.ts](src/service/repService.ts) deliberately differ in strictness,
and the comments there explain which backend check each one mirrors:

- `isSupportRole` — loose `includes('support')`; gates rep login itself.
- `isManagerRole` — loose `includes('manager' | 'admin')`; gates *rendering* the Team nav only.
- `canManagePairingRoutes` — exact `logistics manager` / `super admin`.
- `isElevatedAdminRole` — exact `tenant admin` / `super admin`; the dual-session rule above.

Match the existing strictness when extending; loose and exact are not interchangeable here.

### Layers

```
views/*Screen.tsx  →  hooks/use*.ts  →  service/{partnerService,repService}.ts  →  config/config.ts
   UI + layout        query keys +        fetch wrappers, DRF error parsing         base URLs
                      enabled guards
```

[service/partnerService.ts](src/service/partnerService.ts) is ~1900 lines holding roughly 25
exported service objects (`rateService`, `walletService`, `invoiceService`, `logisticsService`,
`transactionService`, …) plus all their interfaces, sectioned by `// ── Name ───` banner comments.
Add new endpoints to the matching section rather than creating a new file, unless splitting the
whole module.

Three behaviors in that file that callers depend on:

- `fetchWithAuth` treats **401 *or* 403** as a dead session: it clears both token namespaces, wipes
  all readable cookies, and hard-redirects to `/`. There is no silent refresh — `refresh_token` is
  stored but never used.
- `extractFieldError` unwraps the backend's DRF convention where the useful message sits in `data`
  (either a plain string or `{field: ["msg"]}`) while top-level `message` is just `"failed"`.
- `getHeaders()` lazily promotes `partner_profile.access` into `auth_token` if the latter is missing.

Hooks follow a consistent shape: an exported `xKeys` query-key factory, `useQuery` wrappers with an
`enabled` profile guard, and `useMutation` wrappers that `invalidateQueries` on success.
[queryClient.ts](src/lib/queryClient.ts) sets `retry: 1` for queries and **`retry: false` for
mutations** — deliberate, and the reasoning is in a comment there.

### Global sheet (slide-over) system

Slide-overs are not rendered locally. A single `sheetStore` holds `{show, name, props}`;
[DefaultResizableSheet](src/components/sheets/DefaultResizableSheet.tsx) is mounted once in
[App.tsx](src/App.tsx), looks `name` up in the [sheetConstant](src/constant/sheetConstant.ts)
registry, and renders it. To add one:

1. Build the component under `src/components/modal/`.
2. Register it in `sheetConstant`.
3. Open from anywhere with
   `sheetActions.toggleBasicResizableSheet({ show: true, name: 'yourSheet', props: {...} })`.

**The sheet renders `<Component />` with no props.** `props` is stored but never forwarded, so a
sheet must read what it needs from `useAppStore` or its own hooks. Note the naming is historical:
most files in `components/modal/` are true modals rendered inline by their screen, and only the
eight in `sheetConstant` go through this registry.

### Layouts and navigation

`DashboardLayout` and `RepDashboardLayout` are parallel implementations — the support shell mirrors
the main one rather than sharing it, so sidebar/bottom-tab/header changes usually need applying in
both places (`SideBar`/`RepSideBar`, `BottomTab`/`RepBottomTab`, `DashboardHeaderLayout`/`RepHeaderLayout`).

Main-dashboard nav is data-driven from `NAV_GROUPS` in [lib/data/navItems.ts](src/lib/data/navItems.ts);
each item carries `keywords` used by header search. Adding a page means adding a route in
[Routes.tsx](src/Routes.tsx) (flat, all routes in one file) **and** an entry in `navItems.ts`.

### Product tour

[components/tour/ProductTour.tsx](src/components/tour/ProductTour.tsx) renders a role-aware spotlight
overlay, mounted once per shell as `<ProductTour variant="main" />` / `variant="support"`. Steps are
declared in the `MAIN_TOURS` / `SUPPORT_TOURS` tables keyed by role; each step names a `route` (the
tour navigates there itself) and a CSS `target` selector. Targets are `data-tour="..."` attributes
sprinkled across the layout components — **when renaming or removing a `data-tour` attribute, update
the step tables**, or the tour silently falls back to a centered card. Completion is stored per
`variant:role` under `azapal-tour-complete:*` in localStorage; `restartProductTour(variant)` fires a
window CustomEvent to replay it.

## Repo layout gotchas

- **`.agents/src/` is a stale duplicate snapshot** of an older `src/`. It produces phantom grep hits
  for components that no longer exist. Scope searches to `src/`.
- `dist/` is committed and its build hashes churn on every build — expect noise in `git status`.
- Both `yarn.lock` and `package-lock.json` are committed.
- `src/lib/utils.ts` is dead (nothing imports it) and pulls `tailwind-merge`, which is not installed.
  Same for `json-2-csv` and `file-saver` in the `convertTo*.util.ts` files.
- [docs/](docs/) holds four API contract documents written as negotiation records with the backend
  team. They explain the "why" behind endpoint shapes; each one states whether it is implemented and
  defers to the "Azapal API Manifest" as the authoritative endpoint list.

## Conventions

- Brand color is referenced as Tailwind `brand` / `brand-hover` / `brand-navy` / `brand-maroon`.
  Where a library needs a literal (Recharts, Leaflet, react-select `styles`), import from
  [lib/brandColors.ts](src/lib/brandColors.ts) and keep it in sync with the `@theme` block.
- Non-obvious decisions are documented in block comments at the point of the decision — especially
  around the dual-session rule and the role helpers. Follow that when the "why" isn't apparent.
- `.jsx` files (help center, contact page) are legacy leftovers; new work is `.tsx`.
