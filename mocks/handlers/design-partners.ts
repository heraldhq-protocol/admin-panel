import { http, HttpResponse, delay } from 'msw'
import { mockDesignPartners } from '../data/design-partners'

export const designPartnerHandlers = [
  // GET all design partners
  http.get('/api/admin/design-partners', async () => {
    await delay(500)
    return HttpResponse.json({
      data: mockDesignPartners,
      total: mockDesignPartners.length,
      page: 1,
      per_page: 50,
      has_more: false,
    })
  }),

  // GET single partner
  http.get('/api/admin/design-partners/:id', async ({ params }) => {
    await delay(300)
    const partner = mockDesignPartners.find(p => p.id === params.id)
    if (!partner) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return HttpResponse.json(partner)
  }),

  // POST add partner
  http.post('/api/admin/design-partners', async ({ request }) => {
    await delay(800)
    const body = await request.json() as any
    const newPartner = {
      ...body,
      id: `dp_${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    mockDesignPartners.push(newPartner)
    return HttpResponse.json(newPartner)
  }),
]