import { http, HttpResponse, delay } from 'msw'
import { mockReceipts } from '../data/receipts'

export const receiptHandlers = [
  // GET all failed receipts
  http.get('/api/admin/receipts/failed', async () => {
    await delay(400)
    return HttpResponse.json({
      data: mockReceipts,
      total: mockReceipts.length,
      page: 1,
      per_page: 50,
      has_more: false,
    })
  }),

  // POST retry receipt
  http.post('/api/admin/receipts/:id/retry', async ({ params }) => {
    await delay(1000)
    const index = mockReceipts.findIndex(r => r.id === params.id)
    if (index === -1) return HttpResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    
    // Simulate success/fail chance
    const success = Math.random() > 0.3
    if (success) {
      mockReceipts.splice(index, 1) // Remove on success
      return HttpResponse.json({ success: true })
    } else {
      mockReceipts[index]!.retry_count += 1
      mockReceipts[index]!.last_attempted_at = new Date().toISOString()
      return HttpResponse.json({ success: false, error: 'RPC_TIMEOUT' }, { status: 500 })
    }
  }),

  // POST retry all receipts
  http.post('/api/admin/receipts/retry-all', async () => {
    await delay(2000)
    const total = mockReceipts.length
    const succeeded = Math.floor(total * 0.7)
    // Remove succeeded ones
    mockReceipts.splice(0, succeeded)
    return HttpResponse.json({
      retried: total,
      succeeded,
      failed: total - succeeded,
    })
  }),
]