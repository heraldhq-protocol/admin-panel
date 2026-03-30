# Herald Admin — API Endpoint Contract
# For: Backend Engineer
# Status key: 🟡 Mock only | 🟢 Live | 🔴 Blocked
# Last updated: 2026-03-26

---

## How this works

The admin panel is built with dummy data (MSW) first.
Every endpoint below is currently mocked — the UI works fully.

When you build a real endpoint:
1. Match the response shape exactly to the TypeScript types in `types/api.ts`
2. Tell the frontend dev which endpoint is ready
3. Frontend removes the mock handler — zero other changes needed

Types are the contract. If you need a different shape, discuss first — the
types may need updating on both sides.

---

## Base URL

Development: `http://localhost:3001/api`
Production: TBD

All admin endpoints require:
```
Authorization: Bearer <access_token>
```
The `access_token` comes from the backend login endpoint (see below) and is stored
inside the NextAuth session. The frontend never signs tokens — the backend owns JWT verification.

---

## Authentication

### POST /api/auth/admin/login
Status: 🟡 Mock only (currently handled by NextAuth credentials providers)
Auth: None (this is the login endpoint)

Body:
```ts
// Wallet flow
{ strategy: 'wallet', publicKey: string, signature: string, message: string }

// Email + TOTP flow
{ strategy: 'email-totp', email: string, password: string, totp: string }
```

Response:
```ts
{
  access_token: string     // short-lived JWT — send as Authorization: Bearer <token>
  refresh_token: string    // long-lived — stored in NextAuth session only
  user: {
    id: string
    display_name: string
    role: 'super_admin' | 'admin' | 'viewer'
    auth_method: 'wallet' | 'email-totp'
    wallet_address?: string
  }
}
```

Frontend behaviour:
- NextAuth credentials provider calls this endpoint
- `access_token` is stored in the JWT and propagated to `session.user.access_token`
- Every subsequent API call sends `Authorization: Bearer <access_token>`
- Backend verifies the token internally — frontend never touches signing

### POST /api/auth/admin/refresh
Status: 🟡 Mock only
Auth: None (uses refresh_token in body)

Body: `{ refresh_token: string }`
Response: `{ access_token: string }`

Used by the API client when a 401 is received to silently refresh the token.

---

## Overview

### GET /api/admin/overview
Status: 🟡 Mock only
Auth: Required (any admin role)

Response:
```ts
{
  total_protocols: number
  total_protocols_delta: number        // vs last 30 days
  sends_today: number
  sends_today_delta: number            // % vs yesterday
  delivery_rate_24h: number            // percentage
  delivery_rate_delta: number          // percentage points vs prior 24h
  open_incidents: number               // P0 + P1 open only
  recent_activity: Array<{
    id: string
    type: 'protocol_registered' | 'protocol_suspended' | 'tier_changed'
          | 'incident_opened' | 'partner_added' | 'receipt_retry_success'
    description: string
    actor: string                      // admin display name
    created_at: string
    link?: string                      // relative URL to relevant detail page
  }>
}
```

---

## Protocols

### GET /api/admin/protocols
Status: 🟡 Mock only
Auth: Required (any admin role)

Query params:
```
page:           number   (default: 1)
per_page:       number   (default: 20, max: 100)
search:         string   (matches protocol name, case-insensitive)
tier:           0|1|2|3
is_active:      boolean
design_partner: boolean
```

Response: `PaginatedResponse<Protocol>`

Notes:
- Returns ALL protocols regardless of their own auth
- name field is decrypted and readable (admin privilege)
- contact_email_hash is SHA-256 of the plaintext email — never the email itself

---

### GET /api/admin/protocols/:id
Status: 🟡 Mock only
Auth: Required (any admin role)

Response: `Protocol`

Notes: Full protocol object including all fields.

---

### PUT /api/admin/protocols/:id/suspend
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body:
```ts
{ reason: string }   // required, min 10 chars
```

Response: `Protocol` (updated object)

Side effects:
- Sets is_active = false
- Cancels all queued notifications for this protocol
- Logs action: { admin_id, action: 'suspend', reason, timestamp }
- Protocol's next API call returns 403

Notes: Reason is stored internally — not shown to the protocol.

---

### PUT /api/admin/protocols/:id/unsuspend
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body: none

Response: `Protocol` (updated, is_active: true)

Side effects:
- Sets is_active = true
- Logs action: { admin_id, action: 'unsuspend', timestamp }

---

### PUT /api/admin/protocols/:id/tier
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body:
```ts
{ tier: 0 | 1 | 2 | 3 }
```

Response: `Protocol` (updated object)

Side effects:
- Updates tier + sends_limit immediately
- If downgrading and usage > new limit: overage starts immediately
- Logs action: { admin_id, action: 'tier_change', from_tier, to_tier, timestamp }
- Does NOT change Stripe subscription — admin handles billing separately

---

### POST /api/admin/protocols/:id/notes
Status: 🟡 Mock only
Auth: Required (any admin role)

Body:
```ts
{ notes: string }   // can be empty string to clear
```

Response: `Protocol` (updated object)

Notes: Internal notes only — never shown to the protocol.

---

## Notifications

### GET /api/admin/notifications
Status: 🟡 Mock only
Auth: Required (any admin role)

Query params:
```
page:        number   (default: 1)
per_page:    number   (default: 50, max: 200)
protocol_id: string
status:      'queued' | 'processing' | 'delivered' | 'failed' | 'opted_out'
category:    'defi' | 'governance' | 'system' | 'marketing'
date_from:   string  (ISO date, e.g. '2026-03-01')
date_to:     string  (ISO date, e.g. '2026-03-26')
```

Response: `PaginatedResponse<Notification>`

IMPORTANT: wallet_hash must be SHA-256(wallet_pubkey). Never return the raw pubkey.
IMPORTANT: Never return email-related data in this response.

---

### GET /api/admin/notifications/:id
Status: 🟡 Mock only
Auth: Required (any admin role)

Response: `Notification`

---

### GET /api/admin/notifications/export
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Query params: same as GET /notifications
Response: CSV file download
Content-Type: text/csv
Content-Disposition: attachment; filename="notifications-export-{date}.csv"

CSV columns: id, protocol_name, wallet_hash (8 chars), category, status, delivered_at, latency_ms, receipt_tx
NEVER include: wallet pubkey, email data, ses_message_id

---

## Receipt Queue

### GET /api/admin/receipts/failed
Status: 🟡 Mock only
Auth: Required (any admin role)

Response:
```ts
FailedReceipt[]   // sorted by last_attempted_at desc
```

No pagination — list is expected to be small (failed receipts after 3 retries).

---

### POST /api/admin/receipts/:id/retry
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body: none

Response:
```ts
{
  success: boolean
  tx?: string        // Solana txid if success
  error?: string     // failure reason if not success
}
```

Side effects:
- Attempts to write the ZK receipt to Solana
- If success: removes from failed queue, updates notification.receipt_tx
- If failure: increments retry_count, updates last_attempted_at

---

### POST /api/admin/receipts/retry-all
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body: none

Response:
```ts
{
  retried: number
  succeeded: number
  failed: number
}
```

Notes: Processes all failed receipts. May take several seconds.
Frontend shows progress — stream updates via SSE if possible, otherwise poll.

---

## Email Health

### GET /api/admin/email-health
Status: 🟡 Mock only
Auth: Required (any admin role)

Response:
```ts
{
  reputation_score: number            // 0-100, from SES
  bounce_rate_percent: number         // alarm threshold: > 5%
  complaint_rate_percent: number      // alarm threshold: > 0.1%
  sending_quota_24h: number
  sends_last_24h: number
  dkim_status: 'pass' | 'fail' | 'unknown'
  spf_status: 'pass' | 'fail' | 'unknown'
  dmarc_status: 'pass' | 'fail' | 'unknown'
  dedicated_ip: string
  warmup_complete: boolean
  reputation_history: Array<{
    date: string    // ISO date
    score: number   // 0-100
  }>               // last 30 days, one entry per day
}
```

Notes: Data sourced from AWS SES API. Cache for 60 seconds — don't hit SES on every request.

---

## Design Partners

### GET /api/admin/design-partners
Status: 🟡 Mock only
Auth: Required (any admin role)

Query params:
```
status: 'active' | 'pending' | 'inactive'
```

Response: `PaginatedResponse<DesignPartner>`

---

### GET /api/admin/design-partners/:id
Status: 🟡 Mock only
Auth: Required (any admin role)

Response: `DesignPartner`

---

### POST /api/admin/design-partners
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body:
```ts
{
  protocol_id: string
  retainer_amount_cents: number    // default: 100000 ($1,000)
  retainer_start: string           // ISO date
  equity_warrant_issued: boolean
  notes?: string
}
```

Response: `DesignPartner`

Side effects:
- Sets protocol.design_partner = true
- Creates design partner record

---

### PUT /api/admin/design-partners/:id
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body: Partial `DesignPartner` fields (all optional)

Response: `DesignPartner` (updated)

---

### POST /api/admin/design-partners/:id/notes
Status: 🟡 Mock only
Auth: Required (any admin role)

Body: `{ notes: string }`

Response: `DesignPartner` (updated)

---

## Incidents

### GET /api/admin/incidents
Status: 🟡 Mock only
Auth: Required (any admin role)

Query params:
```
severity: 'P0' | 'P1' | 'P2' | 'P3'
status:   'open' | 'investigating' | 'resolved'
```

Response: `PaginatedResponse<Incident>`

Includes: timeline array (all entries for each incident)

---

### GET /api/admin/incidents/:id
Status: 🟡 Mock only
Auth: Required (any admin role)

Response: `Incident` (includes full timeline)

---

### POST /api/admin/incidents
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body:
```ts
{
  severity: 'P0' | 'P1' | 'P2' | 'P3'
  title: string
  description: string
  affected_component: string
}
```

Response: `Incident`

Side effects: Creates initial timeline entry "Incident opened by {admin}"

---

### PUT /api/admin/incidents/:id/status
Status: 🟡 Mock only
Auth: Required (admin or super_admin role)

Body:
```ts
{
  status: 'open' | 'investigating' | 'resolved'
  resolution?: string    // required when status = 'resolved'
}
```

Response: `Incident` (updated)

Side effects: If resolved, sets resolved_at + resolved_by.

---

### POST /api/admin/incidents/:id/timeline
Status: 🟡 Mock only
Auth: Required (any admin role)

Body:
```ts
{ message: string }    // required, min 5 chars
```

Response: `IncidentTimelineEntry`

Side effects: Appends to incident timeline. Triggers SSE event.

---

## Team

### GET /api/admin/team
Status: 🟡 Mock only
Auth: Required (super_admin role only)

Response: `TeamMember[]`

---

### POST /api/admin/team/invite
Status: 🟡 Mock only
Auth: Required (super_admin role only)

Body:
```ts
{
  display_name: string
  role: 'admin' | 'viewer'          // super_admin not grantable via API
  auth_method: 'wallet' | 'email-totp'
  wallet_address?: string            // required if auth_method = 'wallet'
  email?: string                     // required if auth_method = 'email-totp'
}
```

Response: `TeamMember`

Side effects: Sends invite email (email-totp) or adds wallet to allowlist (wallet).

---

### PUT /api/admin/team/:id/role
Status: 🟡 Mock only
Auth: Required (super_admin role only)

Body:
```ts
{ role: 'admin' | 'viewer' }
```

Response: `TeamMember` (updated)

Constraints: Cannot change own role. Cannot change another super_admin's role.

---

### DELETE /api/admin/team/:id
Status: 🟡 Mock only
Auth: Required (super_admin role only)

Response: `{ success: boolean }`

Constraints: Cannot remove self. Cannot remove last super_admin.

---

## SSE Stream

### GET /api/stream
Status: 🟡 Mock only
Auth: Required (any admin role)
Content-Type: text/event-stream

Events emitted:
```ts
// New P0 or P1 incident opened
event: new_incident
data: { severity: 'P0' | 'P1', title: string, id: string }

// Receipt retry failure count changed
event: receipt_failure
data: { count: number }

// Protocol suspended
event: protocol_suspended
data: { protocol_name: string, id: string }

// Email health alarm triggered
event: email_alarm
data: { metric: 'bounce_rate' | 'complaint_rate' | 'dkim' | 'spf', value: number }

// Heartbeat to keep connection alive
event: ping
data: {}
```

Notes: Send ping every 30 seconds to prevent connection timeout.

---

*This document is maintained by the frontend dev.*
*Backend engineer: build endpoints in any order, match the response shapes exactly.*
*When an endpoint is live, tell the frontend dev — they'll remove the mock and mark it 🟢.*
