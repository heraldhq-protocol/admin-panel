'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Handshake, Save, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'

import { useDebounce } from '@/hooks/use-debounce'

export default function DesignPartnerDetail() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: partner, isLoading, isError } = useQuery({
    queryKey: ['design-partner', id],
    queryFn: () => apiClient.getDesignPartner(id),
    enabled: !!id,
  })

  const [notes, setNotes] = React.useState('')
  const debouncedNotes = useDebounce(notes, 1000)

  React.useEffect(() => {
    if (partner?.notes) setNotes(partner.notes)
  }, [partner?.notes])

  const updateNotes = useMutation({
    mutationFn: (newNotes: string) => apiClient.updateDesignPartnerNotes(id, newNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-partner', id] })
    }
  })

  React.useEffect(() => {
    if (debouncedNotes && debouncedNotes !== partner?.notes) {
      updateNotes.mutate(debouncedNotes)
    }
  }, [debouncedNotes, partner?.notes])

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" /></div>
  if (isError || !partner) return <div className="p-8 text-center text-red">Failed to load partner or not found. <Button className="mt-4" onClick={() => router.back()}>Go Back</Button></div>

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Design Partners
      </Button>

      <PageHeader 
        title={`${partner.protocol_name}`} 
        description="Design Partner Agreement Details"
        actions={
          <Badge variant={partner.status === 'active' ? 'active' : 'suspended'}>
            {partner.status.toUpperCase()}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="space-y-4 text-sm">
          <h3 className="font-syne text-lg font-bold flex items-center gap-2">
            <Handshake className="h-5 w-5 text-teal" />
            Terms & Economics
          </h3>
          <div className="space-y-3 pt-2">
            <div className="flex justify-between border-b border-border pb-1">
              <span className="text-text-muted">Retainer (Monthly)</span>
              <span className="font-bold">${(partner.retainer_amount_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1">
              <span className="text-text-muted">Start Date</span>
              <span>{new Date(partner.retainer_start).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1">
              <span className="text-text-muted">Equity Warrant Status</span>
              <span>{partner.equity_warrant_issued ? 'Issued' : 'Pending Deployment'}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-1">
              <span className="text-text-muted">Feedback Sessions</span>
              <span>{partner.feedback_sessions} Completed</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-text-muted">Protocol Details</span>
              <Link href={`/protocols/${partner.protocol_id}`} className="text-teal font-medium flex items-center gap-1 hover:underline">
                View Protocol <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-syne text-lg font-bold">Partner Notes</h3>
            {updateNotes.isPending && <span className="text-xs text-text-muted flex items-center gap-1"><Save size={12} className="animate-pulse" /> Saving...</span>}
          </div>
          <textarea
            className="w-full h-[200px] bg-bg rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal border border-border resize-none"
            placeholder="Document key requirements, feature requests, or strategic notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Card>
      </div>
    </div>
  )
}