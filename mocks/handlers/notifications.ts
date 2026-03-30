import { http, HttpResponse, delay } from 'msw'
import { mockNotifications } from '../data/notifications'

export const notificationHandlers = [
  // GET all notifications
  http.get('/api/admin/notifications', async ({ request }) => {
    await delay(500)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const perPage = Number(url.searchParams.get('per_page') ?? 20)
    const protocolId = url.searchParams.get('protocol_id')
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')

    let filtered = [...mockNotifications]
    
    if (protocolId) {
      filtered = filtered.filter(n => n.protocol_id === protocolId)
    }
    
    if (status) {
      filtered = filtered.filter(n => n.status === status)
    }
    
    if (category) {
      filtered = filtered.filter(n => n.category === category)
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

  // GET single notification
  http.get('/api/admin/notifications/:id', async ({ params }) => {
    await delay(300)
    const notification = mockNotifications.find(n => n.id === params.id)
    if (!notification) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return HttpResponse.json(notification)
  }),
]