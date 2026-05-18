/**
 * Public proxy — forwards admin auth requests to the NestJS backend.
 * No NextAuth session required (this IS the auth endpoint).
 *
 * POST /api/admin-auth
 * Body: { method: 'wallet', wallet_pubkey, signature, message }
 *    or { method: 'email',  email, totp_code }
 */
import type { NextRequest } from 'next/server'

const BACKEND_URL = process.env.HERALD_BACKEND_URL ?? 'http://localhost:3001/v1'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { method, ...payload } = body

  if (method !== 'wallet' && method !== 'email') {
    return Response.json({ error: 'method must be "wallet" or "email"' }, { status: 400 })
  }

  const endpoint = method === 'wallet' ? 'admin-auth/wallet' : 'admin-auth/email'

  let upstream: Response
  try {
    upstream = await fetch(`${BACKEND_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return Response.json(
      { error: 'Cannot reach backend. Is the server running?' },
      { status: 503 },
    )
  }

  const data = await upstream.json().catch(() => ({ error: 'Unexpected backend response' }))
  return Response.json(data, { status: upstream.status })
}
