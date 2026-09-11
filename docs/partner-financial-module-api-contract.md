# Partner Financial Module API (wallet, virtual accounts, invoices, receipts)

> **Status: Implemented and real.** Wallet balance/transactions/dedicated accounts are backed by
> wallet-service (a separate Node service with a real Paystack integration for dedicated virtual
> accounts); invoices and receipts are native Django models on this backend, branch-scoped. The one
> external gap is Paystack itself: dedicated-account *creation* depends on the wallet-service app's
> Paystack business being fully configured, and even once it is, Paystack's dedicated-account
> program only supports a short, specific set of banks (see §5) — a partner may see `502` errors
> from `POST partner/wallet/accounts` that are genuine upstream Paystack responses, not bugs.

## Scope

Four independent, partner-scoped resources:

1. **Wallet** — a partner's balance and its transaction ledger. Read-only from the frontend; the
   backend is the only writer (crediting delivery earnings, debiting payouts/fees). Distinct from
   `partner/transactions` (delivery orders) and from Payout Split (`partner/split`) — this is money
   in/out of the partner's own wallet-service balance.
2. **Virtual accounts** — dedicated bank account numbers (via Paystack) a partner can generate so
   their own customers can pay directly into one. A partner can hold several, each tagged with a
   `reason`; not the partner's own payout details.
3. **Invoices** — documents a partner generates for their own customers, scoped to one of their
   branches, optionally tied to one of their deliveries.
4. **Receipts** — proof-of-payment documents, optionally generated against an invoice (marking it
   paid) or directly against a delivery. Also branch-scoped.

Same envelope, auth, and error conventions as every other partner endpoint in this codebase:

```
Authorization: Bearer <partner access token>
{ "code": "00", "message": "oma", "data": { } }
```

| Status | When | Body |
|---|---|---|
| `400` | Missing/invalid field | `{"code": "01", "message": "failed", "data": {"<field>": ["error"]}}` |
| `400` | A rejected business rule (e.g. deleting a non-draft invoice) | `{"code": "01", "message": "failed", "data": "<plain string>"}` |
| `403` | Missing/invalid/expired token | `{"detail": "Authorization header missing"}` / `"Invalid token"` / `"Token has expired"` |
| `404` | Not found, or belongs to another partner/branch | `{"detail": "No <Resource> matches the given query."}` |
| `502` | wallet-service or Paystack itself rejected the request | `{"code": "01", "message": "failed", "data": "<wallet-service/Paystack error text>"}` |

The `data` field on a `01` response is sometimes an object of field errors and sometimes a plain
descriptive string (DRF validation vs. a raised business-rule/upstream error) — the frontend's
`extractFieldError` handles both shapes; always render whichever is present rather than the generic
top-level `message`, which is always just the literal word `"failed"`.

---

## 1. Wallet — `partner/wallet/*`

```
GET partner/wallet/balance
```
```json
{ "balance": 0, "pending_balance": 0, "currency": "NGN", "updated_at": null }
```
A partner who has never opened a wallet account gets this honest zero, not a 404.
`pending_balance` is always `0` for now — wallet-service doesn't track an uncleared amount
separately yet, so this is never fabricated as anything else.

```
GET partner/wallet/transactions?page=&page_size=
```
Paginated, newest first:
```json
{
  "count": 0,
  "next": false,
  "previous": false,
  "results": [
    {
      "id": 501,
      "type": "credit",
      "category": "delivery_earning",
      "amount": 15000,
      "balance_after": null,
      "description": "Delivery earning — Transaction #1042",
      "reference": "WTX-000501",
      "related_transaction_id": null,
      "created_at": "2026-08-20T11:05:00Z"
    }
  ]
}
```
- `next`/`previous` are booleans (`page < total_pages` / `page > 1`), not URLs.
- `category` is inferred server-side from the transaction's free-text description (a best-effort
  keyword match — wallet-service's own ledger only knows credit/debit) and defaults to
  `"adjustment"` when nothing matches.
- `balance_after` and `related_transaction_id` are always `null` — wallet-service doesn't store a
  running per-transaction balance, and it has no concept of this backend's own delivery
  `Transaction` model. The frontend renders `"—"` rather than guessing a value.

No POST/PUT/DELETE — this resource is entirely backend-written.

---

## 2. Virtual accounts — `partner/wallet/accounts`

```json
{
  "account_number": "9012345678",
  "reason": "customer_collections",
  "bank_name": "Wema Bank",
  "account_name": "AZAPAL/TEST PARTNER CO",
  "status": "Active",
  "created_at": "2026-07-01T09:00:00Z"
}
```
There is no numeric `id` — wallet-service never returns one. `account_number` is the one
identifier every account exposes, is globally unique, and is what the frontend keys and
deactivates by. `reason` can be `null` for an account opened before this field existed.

```
GET   partner/wallet/accounts                                → list
POST  partner/wallet/accounts                                 → open a new one
PATCH partner/wallet/accounts/{account_number}/deactivate     → deactivate
```
Create body: `{ "reason": "...", "bank_name": "<provider_slug>" }` — `reason` required,
`bank_name` optional (see §5 for where the slug comes from).

- `reason`: `"customer_collections" | "branch_operations" | "payroll" | "savings" | "refunds" |
  "loan_repayment"` — how a partner tells multiple accounts apart. Every call with a given
  `reason` opens an *additional* account (wallet-service only returns an existing account back
  when `reason` is omitted and a default account already exists).
- `bank_name` must be a `provider_slug` from `GET partner/wallet/providers` (§5), e.g.
  `"wema-bank"` — **not** a display name. Paystack's dedicated-account API takes a slug; sending a
  display name fails silently against Paystack (this was a real bug in an earlier hardcoded bank
  list, fixed by wiring up the real endpoint).
- `account_number`/`account_name` are assigned by Paystack; the frontend never supplies them.
- A `POST` can return `202` with `{"reason": "...", "status": "pending"}` if wallet-service queued
  the Paystack call asynchronously, or `502` if Paystack rejected it outright (e.g. the chosen bank
  isn't enabled for this integration/environment).

There is deliberately no `DELETE` — Paystack-issued dedicated accounts aren't deletable, only
deactivated.

---

## 3. Invoices — `partner/invoices`

```json
{
  "id": 1,
  "invoice_number": "INV-0001",
  "branch": 36,
  "customer_name": "Jane Doe",
  "customer_email": "jane@example.com",
  "customer_phone": "+2348012345678",
  "customer_address": "12 Marina St, Lagos",
  "related_transaction": 1042,
  "line_items": [
    { "description": "Delivery — Lagos to Lekki", "quantity": 1, "unit_price": 15000 }
  ],
  "subtotal": "15000.00",
  "total": "15000.00",
  "status": "draft",
  "due_date": "2026-09-15",
  "notes": "Thank you for your business.",
  "created_at": "2026-09-01T09:00:00Z",
  "updated_at": "2026-09-01T09:00:00Z"
}
```
- `branch`/`related_transaction` are bare FK ids (Django's default `ModelSerializer` behavior),
  not `_id`-suffixed field names.
- `invoice_number`: backend-assigned, sequential **per partner** (`INV-0001` is partner-scoped, not
  global — two different partners can each have their own `INV-0001`), never client-supplied.
- `subtotal`/`total` come back as **strings** (Django `Decimal` JSON serialization), not numbers —
  the frontend normalizes these to `number` on read.
- `status`: `"draft" | "sent" | "paid" | "overdue" | "void"`. Creating a receipt against this
  invoice (see below) moves it to `"paid"` server-side.

```
GET    partner/invoices?branch_id=          → list, ordered by created_at desc, optionally filtered
POST   partner/invoices                     → create
GET    partner/invoices/{id}                → one
PUT    partner/invoices/{id}                → update (any subset of fields except invoice_number)
DELETE partner/invoices/{id}                → delete (draft only — 400 otherwise)
```
Create body: `branch_id` required for a partner-owner token (a branch-employee token is forced to
their own branch regardless of what's sent); `customer_name` required; `line_items` required, at
least one entry, each with `description`, `unit_price >= 0`, `quantity >= 1`.

Access is scoped by `resolve_partner`/`resolve_branch`: a partner-owner token sees every branch's
invoices (or one branch via `?branch_id=`), a branch-employee token only ever sees their own
branch's.

Deleting a non-draft invoice returns `400` with
`{"code": "01", "message": "failed", "data": "Only draft invoices can be deleted"}`.

---

## 4. Receipts — `partner/receipts`

```json
{
  "id": 1,
  "receipt_number": "RCT-0001",
  "branch": 36,
  "customer_name": "Jane Doe",
  "amount": "15000.00",
  "payment_method": "bank_transfer",
  "payment_reference": "PSK-88213",
  "related_invoice": 1,
  "related_transaction": null,
  "issued_at": "2026-09-02T10:00:00Z",
  "created_at": "2026-09-02T10:00:00Z"
}
```
- `payment_method`: `"bank_transfer" | "card" | "cash" | "wallet"`.
- `related_invoice`/`related_transaction` are bare FK ids, both nullable and independent — a
  receipt can reference an invoice, a raw delivery transaction, or neither.
- `amount` comes back as a **string**, normalized to `number` on the frontend, same as invoices.

```
GET    partner/receipts?branch_id=      → list, ordered by issued_at desc, optionally filtered
POST   partner/receipts                 → create
GET    partner/receipts/{id}            → one
DELETE partner/receipts/{id}            → delete
```
Create body: `branch_id` required for a partner-owner token (branch-employee forced to their own
branch); `customer_name`, `amount >= 1`, `payment_method` required. Setting `related_invoice_id`
on create also flips that invoice's `status` to `"paid"` in the same request.

Same partner/branch scoping rules as invoices.

---

## 5. Bank providers — `partner/wallet/providers`

```
GET partner/wallet/providers
```
```json
[
  { "provider_slug": "wema-bank", "bank_id": 20, "bank_name": "Wema Bank", "id": 5 },
  { "provider_slug": "titan-paystack", "bank_id": 629, "bank_name": "Paystack-Titan", "id": 9 }
]
```
This proxies wallet-service's `/v1/wallet/providers`, which itself proxies Paystack's
`/dedicated_account/available_providers` — the short, specific list of banks Paystack's dedicated
virtual account program actually supports, **not** a general Nigerian-bank list. `provider_slug`
is the value to send as `bank_name` when opening a virtual account (§2); `bank_name` here is only
the display label.

The frontend's `OpenWalletAccountModal` renders this list directly and shows an honest
"no banks available right now" state (with the bank select disabled and submit blocked) when the
call fails or returns empty, rather than falling back to a guessed list — sending the wrong
identifier would just fail against Paystack anyway.

---

## Screen flow (as built)

One `/financials` route, a tab bar switching between the four panels above (mirrors
`partner/rates`'s Region Rates / Rate Cards toggle):

0. A partner with zero virtual accounts sees a full-height intro/landing screen instead of the tab
   bar — an explanation of the module plus one "Open a Wallet Account" call to action. Once they
   have at least one account, they land on the normal tabbed view on every future visit.
1. Wallet is the default tab — balance card + paginated ledger table, no create action.
2. Virtual Accounts — list + "Open a Wallet Account" (reason + real bank picker, §5) + a
   confirm-gated deactivate per row. The same action opens whether it's the partner's first account
   or their fifth.
3. Invoices — branch filter (only shown when the partner has more than one branch) + list +
   "Create Invoice" (branch + customer fields + line-item editor) + a print-style preview.
4. Receipts — same branch filter + list + "Create Receipt" (branch + customer + amount + method,
   optionally linked to an invoice or a delivery) + the same print-style preview.

No pagination on virtual accounts/invoices/receipts — small, manageable counts per partner, same
reasoning as `partner/rates` and its rate cards. Wallet transactions are paginated since a long
history is expected over time.
