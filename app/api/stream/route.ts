import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.HERALD_BACKEND_URL ?? 'http://localhost:3001/v1'

export async function GET(req: NextRequest): Promise<Response> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (token.error === 'RefreshTokenError' || !token.backend_token) {
    return Response.json(
      { error: 'Session expired — please log in again' },
      { status: 401 },
    )
  }

  let upstream: globalThis.Response
  try {
    upstream = await fetch(`${BACKEND_URL}/admin/stream`, {
      headers: {
        authorization: `Bearer ${token.backend_token as string}`,
        accept: 'text/event-stream',
        'cache-control': 'no-cache',
      },
    })
  } catch {
    return Response.json({ error: 'Backend unavailable' }, { status: 503 })
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.body, { status: upstream.status })
  }

  return new Response(upstream.body, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  })
}
