import { auth } from '../../../lib/auth'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.HERALD_BACKEND_URL ?? 'http://localhost:3001/v1'
const ADMIN_KEY = process.env.HERALD_ADMIN_KEY ?? ''

export async function GET(): Promise<Response> {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const upstream = await fetch(`${BACKEND_URL}/admin/stream`, {
    headers: {
      'x-herald-admin-key': ADMIN_KEY,
      accept: 'text/event-stream',
      'cache-control': 'no-cache',
    },
  })

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
