import { http, HttpResponse, delay } from 'msw'
import { mockProtocols } from '../data/protocols'

export const protocolHandlers = [
  // LIVE (no MSW handler): GET /v1/admin/protocols
  // LIVE (no MSW handler): GET /v1/admin/protocols/:id
  // LIVE (no MSW handler): POST /v1/admin/protocols/:id/suspend
  // LIVE (no MSW handler): POST /v1/admin/protocols/:id/reactivate
  //
  // Remaining endpoints below stay mocked until backend implements them per ENDPOINTS.md.
  //
  // GET all protocols (mock)
  http.get('/api/admin/protocols', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const perPage = Number(url.searchParams.get('per_page') ?? 20)
    const search = url.searchParams.get('search') ?? ''
    const tier = url.searchParams.get('tier')
    const isActive = url.searchParams.get('is_active')

    let filtered = [...mockProtocols]
    
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.protocol_pubkey.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (tier !== null && tier !== undefined && tier !== '') {
      filtered = filtered.filter(p => p.tier === Number(tier))
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      filtered = filtered.filter(p => p.is_active === (isActive === 'true'))
    }

    const start = (page - 1) * perPage
    const paged = filtered.slice(start, start + perPage)

    return HttpResponse.json({
      data: paged,
      total: filtered.length,
      page,
      per_page: perPage,
      has_more: start + perPage < filtered.length,
    })
  }),

  // GET single protocol (mock)
  http.get('/api/admin/protocols/:id', async ({ params }) => {
    await delay(300)
    const protocol = mockProtocols.find(p => p.id === params.id)
    if (!protocol) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return HttpResponse.json(protocol)
  }),

  // PUT suspend protocol (mock)
  http.put('/api/admin/protocols/:id/suspend', async ({ params, request }) => {
    await delay(600)
    const body = await request.json() as { reason: string }
    const protocol = mockProtocols.find(p => p.id === params.id)
    if (!protocol) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    protocol.is_active = false
    protocol.suspension_reason = body.reason
    return HttpResponse.json(protocol)
  }),

  // PUT unsuspend protocol (mock)
  http.put('/api/admin/protocols/:id/unsuspend', async ({ params }) => {
    await delay(600)
    const protocol = mockProtocols.find(p => p.id === params.id)
    if (!protocol) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    protocol.is_active = true
    protocol.suspension_reason = null
    return HttpResponse.json(protocol)
  }),

  // PUT change tier
  http.put('/api/admin/protocols/:id/tier', async ({ params, request }) => {
    await delay(600)
    const body = await request.json() as { tier: number }
    const protocol = mockProtocols.find(p => p.id === params.id)
    if (!protocol) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    protocol.tier = body.tier as any
    return HttpResponse.json(protocol)
  }),

  // POST protocol notes
  http.post('/api/admin/protocols/:id/notes', async ({ params, request }) => {
    await delay(600)
    await request.json()
    const protocol = mockProtocols.find(p => p.id === params.id)
    if (!protocol) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    // In real app, we'd save it to the DB
    return HttpResponse.json(protocol)
  }),
]