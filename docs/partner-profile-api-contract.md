# Partner Profile API — proposal (self-service account information)

> **Status: Proposed — not implemented.** The Settings screen's Account tab used to open a
> slide-over sheet (`components/modal/AccountView.tsx`) showing fully hardcoded/mocked business
> info, with no real data and no working save. That's been replaced with inline `<input>` fields
> pre-filled from the logged-in partner's real profile — but there's no update endpoint for a
> partner to edit their own business info anywhere in the service layer today. This doc specs
> the endpoint the new inline form needs; the existing `partner/{id}` PUT
> (`partnerService.updatePartner`) is a different, minimal shape (`email`/`fullName`/`status`)
> built for what looks like an internal/admin onboarding flow over arbitrary partner records, not
> a self-service "edit my own profile" endpoint — this is a new, separate one.

## Overview

Same conventions as `partner/rates` (base URL, envelope, auth header):

```json
{ "code": "00", "message": "...", "data": { } }
```
```
Authorization: Bearer <partner access token>
```

**Common error responses:**

| Status | When | Body |
|---|---|---|
| `400` | Missing/invalid field | `{"code": "01", "message": "failed", "data": {"<field>": ["error"]}}` |
| `403` | Missing/invalid/expired token | `{"detail": "Authorization header missing"}` (or `"Invalid token"` / `"Token has expired"}` — `403`, not `401`) |

No `404` case — this endpoint always targets the calling partner's own record, identified by the
bearer token, never a record that "doesn't belong to you."

## Update my profile

```
PUT partner/profile
```

Self-scoped — no `{id}` in the URL. Body: any subset of the six editable fields below, only send
what changed.

**Body:**
```json
{
  "partner_name": "Spoonel Service Men",
  "partner_email": "contact@spoonel.com",
  "partner_hq_address": "15 Marina Street",
  "partner_hq_state": "Lagos",
  "partner_hq_city": "Lagos",
  "partner_country": "Nigeria"
}
```

- All fields optional — send only what changed.
- `partner_code`, `partner_id`, `partner_user`, `id`, and the timestamp fields are **not**
  editable through this endpoint — they're backend-assigned/immutable identifiers, shown to the
  partner as read-only context, not accepted here.

**Response `200`:** the updated profile, same shape as everywhere else this app already reads
`PartnerProfile` from (`id`, `partner_user`, `partner_id`, `partner_name`, `partner_code`,
`partner_hq_address`, `partner_hq_state`, `partner_hq_city`, `partner_country`, `partner_email`,
`partner_token_expires_at`, `created_at`, `updated_at`) — **without** `access`/`refresh`; those
are only ever issued at OTP-verification time, not on a profile edit.

```json
{
  "code": "00",
  "message": "oma",
  "data": {
    "id": 1,
    "partner_user": "test-user",
    "partner_id": "PTN-00231",
    "partner_name": "Spoonel Service Men",
    "partner_code": "SPN001",
    "partner_hq_address": "15 Marina Street",
    "partner_hq_state": "Lagos",
    "partner_hq_city": "Lagos",
    "partner_country": "Nigeria",
    "partner_email": "contact@spoonel.com",
    "partner_token_expires_at": "2026-09-30T00:00:00Z",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-08-31T10:00:00Z"
  }
}
```

**Response `400`:** validation errors per field, e.g. `partner_email` not a valid email —
surfaced inline on the form the same way `partner/rates`' validation errors are.

## Suggested screen flow

A single inline form (no modal, no confirm dialog — this isn't destructive): pre-fill from the
already-cached profile (`usePartnerProfile()` client-side — no need to `GET` anything first,
there's no `GET` in this doc), edit, Save → `PUT partner/profile` → on success, replace the
cached profile with the response so the rest of the app (header badge, any other profile reads)
reflects the change immediately without requiring a re-login.
