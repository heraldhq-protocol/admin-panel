import { http, HttpResponse, delay } from 'msw'
import { mockTeam } from '../data/team'

export const teamHandlers = [
  // GET all team members
  http.get('/api/admin/team', async () => {
    await delay(500)
    return HttpResponse.json({ data: mockTeam, total: mockTeam.length })
  }),

  // POST invite team member
  http.post('/api/admin/team/invite', async ({ request }) => {
    await delay(800)
    const body = await request.json() as any
    const newMember = {
      ...body,
      id: `admin_${Date.now()}`,
      created_at: new Date().toISOString(),
      last_active_at: null,
    }
    mockTeam.push(newMember)
    return HttpResponse.json(newMember)
  }),

  // PUT update role
  http.put('/api/admin/team/:id/role', async ({ params, request }) => {
    await delay(600)
    const body = await request.json() as { role: string }
    const member = mockTeam.find(m => m.id === params.id)
    if (!member) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    member.role = body.role as any
    return HttpResponse.json(member)
  }),

  // DELETE team member
  http.delete('/api/admin/team/:id', async ({ params }) => {
    await delay(600)
    const index = mockTeam.findIndex(m => m.id === params.id)
    if (index === -1) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    mockTeam.splice(index, 1)
    return HttpResponse.json({ success: true })
  }),
]