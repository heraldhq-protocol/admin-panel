import { http, HttpResponse, delay } from 'msw'
import { mockIncidents } from '../data/incidents'

export const incidentHandlers = [
  // GET all incidents
  http.get('/api/admin/incidents', async ({ request }) => {
    await delay(400)
    const url = new URL(request.url)
    const severity = url.searchParams.get('severity')
    const status = url.searchParams.get('status')

    let filtered = [...mockIncidents]
    if (severity) filtered = filtered.filter(i => i.severity === severity)
    if (status) filtered = filtered.filter(i => i.status === status)

    return HttpResponse.json({
      data: filtered,
      total: filtered.length,
      page: 1,
      per_page: 50,
      has_more: false,
    })
  }),

  // GET single incident
  http.get('/api/admin/incidents/:id', async ({ params }) => {
    await delay(300)
    const incident = mockIncidents.find(i => i.id === params.id)
    if (!incident) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return HttpResponse.json(incident)
  }),

  // POST update incident (add timeline entry)
  http.post('/api/admin/incidents/:id/timeline', async ({ params, request }) => {
    await delay(600)
    const body = await request.json() as { message: string; author: string }
    const incident = mockIncidents.find(i => i.id === params.id)
    if (!incident) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    const entry = {
      id: `t_${Date.now()}`,
      incident_id: incident.id,
      ...body,
      created_at: new Date().toISOString(),
    }
    incident.timeline.push(entry)
    return HttpResponse.json(entry)
  }),

  // PUT resolve incident
  http.put('/api/admin/incidents/:id/resolve', async ({ params, request }) => {
    await delay(600)
    const body = await request.json() as { resolved_by: string }
    const incident = mockIncidents.find(i => i.id === params.id)
    if (!incident) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    incident.status = 'resolved'
    incident.resolved_at = new Date().toISOString()
    incident.resolved_by = body.resolved_by
    return HttpResponse.json(incident)
  }),
]