'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  RefreshCw, 
  Search, 
  AlertCircle,
  Clock
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface FailedReceipt {
  id: string
  notification_id: string
  protocol_id: string
  protocol_name: string
  failure_reason: string
  retry_count: number
  last_attempted_at: string
  created_at: string
}

export default function ReceiptsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ data: FailedReceipt[] }>({
    queryKey: ['receipts'],
    queryFn: () => fetch('/api/admin/receipts').then(res => res.json()),
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => 
      fetch(`/api/admin/receipts/${id}/retry`, { method: 'POST' }).then(async res => {
        if (!res.ok) throw new Error((await res.json()).error)
        return res.json()
      }),
    onSuccess: () => {
      toast.success('Retry batch scheduled successfully')
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
    onError: (err: Error) => {
      toast.error(`Retry failed: ${err.message}`)
    }
  })

  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="Retryable Failures" 
        description="Manage failed notification receipts and trigger manual retries."
      />

      {/* Filters/Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by Protocol or ID..."
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className={retryMutation.isPending ? 'animate-spin h-4 w-4' : 'h-4 w-4'} />
          Retry All
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-card-2 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Failure Info</th>
                <th className="px-6 py-4 font-bold text-center">Protocol</th>
                <th className="px-6 py-4 font-bold text-center">Attempts</th>
                <th className="px-6 py-4 font-bold text-center">Last Attempt</th>
                <th className="px-6 py-4 font-bold text-right pr-10">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-32 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                    No retryable failures found.
                  </td>
                </tr>
              ) : (
                data?.data?.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-card-2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs text-teal">{receipt.notification_id}</span>
                        <div className="flex items-center gap-1.5 text-text-secondary">
                          <AlertCircle className="h-3.5 w-3.5 text-red shrink-0" />
                          <span className="truncate max-w-[300px]">{receipt.failure_reason}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {receipt.protocol_name}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="developer">{receipt.retry_count} / 5</Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-text-muted">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(receipt.last_attempted_at), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right pr-10">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 shadow-none"
                        onClick={() => retryMutation.mutate(receipt.id)}
                        disabled={retryMutation.isPending}
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}