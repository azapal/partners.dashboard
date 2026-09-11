# Partner Rate Cards API — proposal (route / cargo type / delivery method)

> **Status: Proposed — not implemented.** Companion to the `partner/rates`
> (region + scope) API, which this codebase now consumes for real (see
> `rateService` in `src/service/partnerService.ts` and `RatesScreen.tsx`).
> Before that rebuild, `/rates` was a **client-only prototype** with three
> unrelated flat-rate concepts — route pricing, cargo-type pricing, and
> delivery-method pricing — seeded from dummy arrays and mutated only in
> local component state (`src/lib/data/rates.ts` said so explicitly: *"No
> backend endpoint exists yet for partner rate cards"*). That prototype UI
> was removed when `/rates` was rebuilt against the real region/scope API.
> This doc preserves its exact data shape as a backend contract, in case
> product wants it built as a second, parallel rate-card system rather than
> let it disappear for good.

## Open question — resolve before backend builds this

How should these three rate-card types relate to the region/scope `Rate`
that's now live? Two shapes this could take:

- **(a) Independent/alternate pricing.** A partner could have region/scope
  rates, route/cargo/method rate cards, or both — unclear which one wins
  when a business is browsing partners for a delivery that matches both.
- **(b) Modifiers on top of region/scope.** Route/cargo/method rates adjust
  or override the base region/scope price for specific combinations (e.g.
  "Lagos intra, but Electronics cargo costs +₦2,000").

The deleted prototype had **no linkage to region/scope at all** — it was
built in isolation, before the region/scope model existed. Everything below
specs these three as independent flat resources, exactly mirroring what the
old UI already assumed. Whoever picks this up needs to settle (a) vs (b)
(or confirm these are being dropped for good) before backend work starts.

---

## Domain model reference

All three are partner-scoped resources, each with its own uniqueness rule,
independent of each other and of `Rate` (region/scope).

### Route Rate

Price for moving a given cargo type between two states.

```json
{
  "id": 1,
  "origin_state": "Lagos",
  "destination_state": "Abuja",
  "cargo_type": "General Goods",
  "price": 15000,
  "status": "Active",
  "created_at": "2026-06-20T09:00:00Z",
  "updated_at": "2026-06-20T09:00:00Z"
}
```
**(origin_state, destination_state, cargo_type) is unique per partner.**

### Cargo Type Rate

Flat pricing rule for a cargo type, regardless of route.

```json
{
  "id": 1,
  "cargo_type": "Electronics",
  "base_price": 8000,
  "price_per_kg": 700,
  "status": "Active",
  "created_at": "2026-06-19T09:00:00Z",
  "updated_at": "2026-06-19T09:00:00Z"
}
```
**cargo_type is unique per partner.**

### Delivery Method Rate

Flat fee for a delivery method, regardless of route or cargo.

```json
{
  "id": 1,
  "method": "Motorcycle",
  "price": 3500,
  "status": "Active",
  "created_at": "2026-06-15T09:00:00Z",
  "updated_at": "2026-06-15T09:00:00Z"
}
```
**method is unique per partner.**

### Shared field notes

- `cargo_type` enum — the exact 6 values the old UI hard-coded (shared with
  the unrelated "My Routes" pairing feature in
  `src/lib/data/logisticsNetwork.ts`, not something specific to rates):
  `"General Goods" | "Food & Perishables" | "Electronics" | "Documents" | "Furniture" | "Pharmaceuticals"`.
- `method` enum: `"Walk" | "Bicycle" | "Motorcycle" | "Car" | "Van" | "Truck"`.
- `status`: `"Active" | "Inactive"` — kept as the literal string enum the old
  UI used (not a boolean like `Service.is_active`), so a revived frontend
  wouldn't need to remap it. Worth confirming backend is fine mirroring this
  rather than using a boolean.
- `price` / `base_price` / `price_per_kg`: plain integers (naira), `>= 1`
  for `price`/`base_price` (old UI's client-side validation), `>= 0` for
  `price_per_kg` (a cargo type can have a zero per-kg rate and charge only
  the flat base).
- `origin_state` / `destination_state`: free text in the old UI, but it
  populated the picker from the same Nigerian-states list used elsewhere
  (`src/utilities/states.json`) — backend can validate against that list if
  it wants stricter enforcement than the region/scope `Rate.region` field
  (which is unconstrained free text).

---

## Endpoints

Same envelope, auth, and error conventions as `partner/rates`:

```
Authorization: Bearer <partner access token>
{ "code": "00", "message": "...", "data": { } }
```

| Status | When | Body |
|---|---|---|
| `400` | Missing/invalid field | `{"code": "01", "message": "failed", "data": {"<field>": ["error"]}}` |
| `400` | Duplicate unique key | `{"code": "01", "message": "You already have a <resource> for this <key> — update it instead"}` (create) or without "— update it instead" (update) |
| `403` | Missing/invalid/expired token | `{"detail": "Authorization header missing"}` / `"Invalid token"` / `"Token has expired"` |
| `404` | Not found, or belongs to another partner | `{"detail": "No <Resource> matches the given query."}` |

Each resource gets the same 5-endpoint set as `partner/rates`.

### 1. Route Rates — `partner/route-rates`

```
GET    partner/route-rates            → list, ordered by origin_state, destination_state
POST   partner/route-rates            → create
GET    partner/route-rates/{id}       → one
PUT    partner/route-rates/{id}       → update (any subset of fields)
DELETE partner/route-rates/{id}       → delete
```
Create body: `origin_state` and `destination_state` required, `cargo_type`
defaults to `"General Goods"`, `price` required (`>= 1`), `status` defaults
to `"Active"`.

### 2. Cargo Type Rates — `partner/cargo-rates`

```
GET    partner/cargo-rates            → list, ordered by cargo_type
POST   partner/cargo-rates            → create
GET    partner/cargo-rates/{id}       → one
PUT    partner/cargo-rates/{id}       → update (any subset of fields)
DELETE partner/cargo-rates/{id}       → delete
```
Create body: `cargo_type` and `base_price` required (`>= 1`), `price_per_kg`
required (`>= 0`), `status` defaults to `"Active"`.

### 3. Delivery Method Rates — `partner/delivery-method-rates`

```
GET    partner/delivery-method-rates          → list, ordered by method
POST   partner/delivery-method-rates          → create
GET    partner/delivery-method-rates/{id}     → one
PUT    partner/delivery-method-rates/{id}     → update (any subset of fields)
DELETE partner/delivery-method-rates/{id}     → delete
```
Create body: `method` and `price` required (`>= 1`), `status` defaults to
`"Active"`.

---

## Suggested screen flow

Restores the 3-tab UI the frontend already had (Route Rates / Cargo Rates /
Delivery Method Rates), wired to these real endpoints instead of local
state, reusing the current `partner/rates` screen's conventions:

1. **List** — `GET` all three on load (one call per tab, or lazily per tab
   switch); empty tab shows "No <type> rates yet" + an add button, same as
   `partner/rates`'s empty state.
2. **Add** — per-tab form → `POST` to that tab's endpoint. Surface the
   duplicate-key `400` inline on the relevant field(s) (route: origin/
   destination/cargo; cargo: cargo type; method: delivery method) — same
   pattern as `partner/rates`'s duplicate-(region,scope) handling.
3. **Edit** — prefill from the list item already in memory, `PUT` with only
   changed fields.
4. **Delete** — **add a confirm dialog before calling `DELETE`** — the old
   prototype's edit modals deleted immediately on click with no
   confirmation, which `partner/rates`'s spec explicitly calls out as
   something the app (not the backend) is responsible for guarding against.

No pagination — same reasoning as `partner/rates`: a partner has a small,
manageable number of rate cards per type.
