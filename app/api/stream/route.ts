

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'connected' })}\n\n`))
      
      const eventInterval = setInterval(() => {
        if (Math.random() > 0.85) {
          const events = [
            { type: 'new_incident', data: { severity: 'P2', title: 'Periodic Latency Spike Detected' } },
            { type: 'receipt_failure', data: { protocol: 'Jito', reason: 'RPC timeout' } },
            { type: 'protocol_suspended', data: { protocolId: '01HAXV8Y1A' } },
          ]
          const ev = events[Math.floor(Math.random() * events.length)]
          controller.enqueue(encoder.encode(`event: ${ev?.type}\ndata: ${JSON.stringify(ev?.data)}\n\n`))
        }
      }, 15000)

      const keepAliveInterval = setInterval(() => {
        controller.enqueue(encoder.encode(`:\n\n`))
      }, 30000)

      // Auto close mock stream after 2 hours
      setTimeout(() => {
        clearInterval(eventInterval)
        clearInterval(keepAliveInterval)
        try { controller.close() } catch (e) {}
      }, 7200000)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}