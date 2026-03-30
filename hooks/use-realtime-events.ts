'use client'
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS } from '@/lib/query-keys'

type StreamEventHandler = (event: MessageEvent) => void

export function useRealtimeEvents() {
  const queryClient = useQueryClient()

  const handleEvent: StreamEventHandler = useCallback((event) => {
    try {
      const data = JSON.parse(event.data)

      switch (event.type) {
        case 'new_incident':
          toast.error(`🚨 ${data.severity} Incident: ${data.title}`, { duration: Infinity })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incidents() })
          break
        case 'receipt_failure':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.receiptQueue() })
          break
        case 'protocol_suspended':
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
          break
        case 'email_alarm':
          toast.warning(`Email alarm: ${data.metric} = ${data.value}`)
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emailHealth() })
          break
      }
    } catch {
      // Ignore malformed events
    }
  }, [queryClient])

  useEffect(() => {
    const shouldConnect =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true'

    if (!shouldConnect) return

    const eventSource = new EventSource('/api/stream')

    for (const type of ['new_incident', 'receipt_failure', 'protocol_suspended', 'email_alarm']) {
      eventSource.addEventListener(type, handleEvent)
    }

    return () => {
      eventSource.close()
    }
  }, [handleEvent])
}