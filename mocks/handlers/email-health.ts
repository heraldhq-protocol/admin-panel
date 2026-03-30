import { http, HttpResponse, delay } from 'msw'
import { mockEmailHealth } from '../data/email-health'

export const emailHealthHandlers = [
  // GET email health status
  http.get('/api/admin/email-health', async () => {
    await delay(600)
    return HttpResponse.json(mockEmailHealth)
  }),
]