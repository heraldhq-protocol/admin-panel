import { http, HttpResponse, delay } from 'msw'
import { mockTeam } from '../data/team'

export const teamHandlers = [
  // GET all team members
  http.get('/api/admin/team', async () => {
    await delay(500)
    return HttpResponse.json({
      data: mockTeam,
      total: mockTeam.length,
      page: 1,
      per_page: 50,
      has_more: false,
    })
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
]