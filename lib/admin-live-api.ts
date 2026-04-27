import type { PaginatedResponse, Protocol } from '@/types/api'

type AdminMetrics = {
  totalProtocols: number
  activeProtocols: number
  totalWebhooks: number
  notificationsSent: number
  timestamp: string
}

function getAdminApiBaseUrl() {
  return process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? 'http://localhost:3001'
}

function getAdminApiKey() {
  return process.env.NEXT_PUBLIC_HERALD_ADMIN_KEY ?? ''
}

async function adminFetch(pathname: string, init?: RequestInit) {
  const baseUrl = getAdminApiBaseUrl().replace(/\/$/, '')
  const url = `${baseUrl}${pathname.startsWith('/') ? '' : '/'}${pathname}`

  const headers = new Headers(init?.headers)
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json')

  const adminKey = getAdminApiKey()
  if (adminKey) headers.set('x-herald-admin-key', adminKey)

  const res = await fetch(url, {
    ...init,
    headers,
  })

  if (!res.ok) {
    // Keep it simple: propagate a readable error (UI will show toast/logging)
    const text = await res.text().catch(() => '')
    throw new Error(`Admin API ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`)
  }

  return res
}

export const adminLiveApi = {
  getMetrics: async () => {
    const res = await adminFetch('/v1/admin/metrics')
    return (await res.json()) as AdminMetrics
  },

  getProtocols: async (opts?: { search?: string; page?: number; per_page?: number }) => {
    const page = opts?.page ?? 1
    const perPage = opts?.per_page ?? 20
    const search = opts?.search?.trim() ?? ''

    // Backend supports `query` + `limit` only (no offset). Fetch a superset and page locally.
    const limit = Math.min(250, Math.max(5, perPage * 5))
    const params = new URLSearchParams()
    if (search) params.set('query', search)
    params.set('limit', String(limit))

    const res = await adminFetch(`/v1/admin/protocols?${params.toString()}`)
    const data = (await res.json()) as Protocol[]

    const start = (page - 1) * perPage
    const paged = data.slice(start, start + perPage)

    const wrapped: PaginatedResponse<Protocol> = {
      data: paged,
      total: data.length,
      page,
      per_page: perPage,
      has_more: start + perPage < data.length,
    }

    return wrapped
  },

  getProtocol: async (id: string) => {
    const res = await adminFetch(`/v1/admin/protocols/${id}`)
    return (await res.json()) as Protocol
  },

  suspendProtocol: async (id: string, reason: string) => {
    const res = await adminFetch(`/v1/admin/protocols/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    return (await res.json()) as unknown
  },

  reactivateProtocol: async (id: string) => {
    const res = await adminFetch(`/v1/admin/protocols/${id}/reactivate`, {
      method: 'POST',
    })
    return (await res.json()) as unknown
  },
}

