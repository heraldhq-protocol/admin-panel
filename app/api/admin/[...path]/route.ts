/* eslint-disable import/no-default-export */
// Required: Next.js App Router catch-all route must use named exports per HTTP method.
// This file proxies all /api/admin/* requests to the NestJS backend at HERALD_BACKEND_URL.
// The x-herald-admin-key header is added server-side — never exposed to the browser.

import { auth } from '../../../../lib/auth'

import type { NextRequest } from 'next/server'

const BACKEND_URL = process.env.HERALD_BACKEND_URL ?? 'http://localhost:3001/v1'
const ADMIN_KEY = process.env.HERALD_ADMIN_KEY ?? ''

async function proxy(
  req: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<Response> {
  const session = await auth()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await params
  const search = req.nextUrl.search
  const targetUrl = `${BACKEND_URL}/admin/${path.join('/')}${search}`

  const headers = new Headers()
  headers.set('content-type', 'application/json')
  headers.set('x-herald-admin-key', ADMIN_KEY)

  const forwarded = req.headers.get('authorization')
  if (forwarded) headers.set('authorization', forwarded)

  const isBodyMethod = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
  const body = isBodyMethod ? await req.text() : undefined

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  })

  const contentType = upstream.headers.get('content-type') ?? ''
  const responseHeaders = new Headers()
  responseHeaders.set('content-type', contentType)

  // Pass through Content-Disposition so CSV exports trigger a download
  const disposition = upstream.headers.get('content-disposition')
  if (disposition) responseHeaders.set('content-disposition', disposition)

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params)
}
