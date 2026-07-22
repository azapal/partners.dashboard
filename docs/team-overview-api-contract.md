# Team Overview — API contract proposal

> **Status: Implemented.** Backend delivered this — see the "Azapal API
> Manifest" for the authoritative, current endpoint list (`scope=mine|team`,
> `claim`/`escalate`/`take-over`/`reassign`, `/employee/shift-status`,
> `/branch/<code>/agents`). Frontend now consumes all of it: `repService.ts`,
> `useRepOrders.ts`, `useAgents.ts`, `TeamOverviewScreen.tsx`,
> `OrderConversationSheet.tsx` (escalate), `RepProfileScreen.tsx` (real
> shift-status PATCH). Reconciliation notes below; this doc is kept for the
> "why," the manifest is the source of truth for the "what."
>
> Two differences from what was originally proposed here:
> - **`claim`** wasn't anticipated in the original proposal — it self-assigns
>   an *unclaimed* auto-escalated conversation (any employee, no branch
>   check). `take-over` turned out to be narrower than proposed: it only
>   reclaims a conversation already assigned to *one of your own agents* —
>   an unclaimed one goes through `claim` instead.
> - **Presence** landed exactly as hoped: `offline` is derived server-side
>   from staleness (no update in 12h), never user-set — open question 1
>   below is answered.
>
> Out of scope for this app: the manifest's Orders & Transactions section
> (`/partner/transactions/my-deliveries`, `.../confirm`, `.../assign-driver`)
> has no consumer here — no driver or internal-ops concept exists in this
> codebase. `/partner/transactions` itself (used by the main partner
> dashboard's `TransactionsScreen`) already auto-scopes by token and needed
> no frontend change.

## Context

Managers and Super Admins can log into a specific branch via branch-code
login (`POST /branch/verify-otp`), landing on the same support dashboard a
Customer Support rep sees. Today there's no backend-enforced difference
between the two roles — a manager's session sees exactly the same data a
rep's session does (their own assigned WhatsApp conversations only).

We want to add a manager-only "Team Overview" screen: a roster of every
agent in the branch with their queue load, plus a branch-wide escalation
queue. This doc specs the backend additions that screen needs. Everything
below is additive — no existing endpoint's default behavior changes.

## Baseline — what exists today

```
GET  /whatsapp/conversations              → ApiResponse<WaConversation[]>
GET  /whatsapp/conversations/<phone>       → ApiResponse<WaConversationDetail>
POST /whatsapp/conversations/<phone>       → mark resolved
```

```ts
interface ApiResponse<T> { code: string; message: string; data: T }

interface WaMessage {
  id: string | number;
  role: string;         // 'user' | 'assistant' | 'bot'
  content: string;
  created_at: string;
}

interface WaConversation {
  phone: string;
  customer_name: string;
  last_message: WaMessage | null;
  message_count: number;
  status: 'active' | 'resolved';
  updated_at: string;
}

interface WaConversationDetail {
  phone: string;
  customer_name?: string;
  messages: WaMessage[];
  orders: WaOrder[];
}
```

`GET /whatsapp/conversations` is implicitly scoped to the authenticated
employee's JWT — it returns only conversations assigned to them. There is
no branch-wide view, no `assigned_to` field, and no escalation state
anywhere in the model.

Also relevant: `ShiftMate` (roster/presence) is **entirely mocked
client-side** today (`repService.ts` mock array, comment: "no real
endpoint yet"), and the active/away toggle on the rep profile screen
writes only to `localStorage` — no server ever sees it, so no one but
that one browser can know an employee's status. This has to become real
for a manager's roster to mean anything.

---

## Proposed changes

### A. `scope` param on the conversations list

```
GET /whatsapp/conversations?scope=mine   (default — today's behavior, unchanged)
GET /whatsapp/conversations?scope=team   (new — manager/admin only)
```

`scope=team` returns every conversation assigned to any agent in the
caller's branch. Two new fields on each conversation:

```ts
interface WaConversation {
  phone: string;
  customer_name: string;
  last_message: WaMessage | null;
  message_count: number;
  status: 'active' | 'resolved';
  updated_at: string;
  assigned_to: { id: number; name: string } | null;   // NEW
  escalation: EscalationInfo | null;                  // NEW — see B
}
```

Per-agent open/resolved counts (the roster numbers in the UI) are
**derived client-side** by grouping `scope=team` results on
`assigned_to.id` and counting by `status` — no separate metrics
endpoint needed.

**Example response** (`scope=team`):

```json
{
  "code": "ok",
  "message": "ok",
  "data": [
    {
      "phone": "2348012345678",
      "customer_name": "Chinedu Okafor",
      "last_message": { "id": 42, "role": "user", "content": "Is my order ready?", "created_at": "2026-07-12T10:00:00Z" },
      "message_count": 4,
      "status": "active",
      "updated_at": "2026-07-12T10:00:00Z",
      "assigned_to": { "id": 3, "name": "David Okon" },
      "escalation": null
    },
    {
      "phone": "2348099999999",
      "customer_name": "Ngozi Bello",
      "last_message": { "id": 51, "role": "user", "content": "Refund please", "created_at": "2026-07-12T11:48:00Z" },
      "message_count": 6,
      "status": "active",
      "updated_at": "2026-07-12T11:48:00Z",
      "assigned_to": { "id": 2, "name": "Kemi Adesanya" },
      "escalation": {
        "raised_by": { "id": 2, "name": "Kemi Adesanya" },
        "raised_at": "2026-07-12T11:50:00Z",
        "note": "Refund request above my approval limit."
      }
    }
  ]
}
```

### B. Escalation as state on the conversation, not a new resource

```ts
interface EscalationInfo {
  raised_by: { id: number; name: string };
  raised_at: string;
  note: string;
}
```

Actions mirror the existing `resolve()` call
(`POST /whatsapp/conversations/<phone>`) rather than introducing a new
resource type:

```
POST /whatsapp/conversations/<phone>/escalate     { note: string }
  → any assigned rep; sets `escalation`

POST /whatsapp/conversations/<phone>/take-over
  → manager/admin only; assigned_to → caller, clears `escalation`

POST /whatsapp/conversations/<phone>/reassign     { employee_id: number }
  → manager/admin only; assigned_to → given employee, clears `escalation`
```

All three return the updated `WaConversation`, same shape as above.

### C. Presence and roster — the one genuinely new piece

```
GET   /branch/<branch_code>/agents         → ApiResponse<Agent[]>
PATCH /employee/shift-status               { status: 'active' | 'away' }
```

```ts
interface Agent {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'away' | 'offline';
  branch_code: string;
}
```

`offline` should be server-derived (no heartbeat / no request within some
window, or explicit logout) rather than user-settable — otherwise every
agent is permanently "active" the moment they last touched the toggle.
If there's already a last-request timestamp logged per employee session,
that's probably enough to derive `active`/`offline`; `away` needs the
explicit `PATCH` either way.

### D. Server-side role enforcement (non-negotiable)

`invite_role` is free-text and admin-assigned today — the frontend's
`isSupportRole` check is just a loose `.includes('support')` string
match, there's no fixed enum to trust. That's acceptable for deciding
whether to *render a nav item*, but every one of the new
manager/admin-only actions above (`scope=team`, `take-over`,
`reassign`, `GET /branch/<code>/agents`) needs its own authoritative
check against the role encoded in the JWT server-side. The frontend gate
is a UX nicety, not a security boundary — a rep must not be able to
`take-over` another rep's conversation just by hitting the endpoint
directly.

---

## Backward compatibility

- `GET /whatsapp/conversations` with no `scope` param, or `scope=mine`,
  is byte-for-byte what it returns today plus two new nullable fields
  (`assigned_to`, `escalation`) — existing frontend code that doesn't
  read them is unaffected.
- Nothing existing is removed or renamed.

## Open questions for backend

1. Is there already a last-request/last-seen timestamp per employee
   session we can derive `offline` from, or does this need a new
   heartbeat mechanism?
2. Should `escalate` notify the manager (push/SMS/email) or is
   poll-on-screen sufficient for v1?
3. Can `reassign` target any agent branch-wide, or only agents currently
   `active`?
4. Does "Super Admin" need cross-branch `scope=team` (all branches), or
   is this strictly single-branch for now?

## Suggested build order

1. **(A)** `scope` param + `assigned_to`/`escalation` fields — cheapest,
   unlocks roster counts and the team queue view almost immediately.
2. **(B)** Escalation fields + the three action endpoints — small,
   closely follows the existing `resolve()` pattern.
3. **(C)** Real presence — the actual lift; depends on the answer to
   open question 1.
