'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Activity, MessageSquare } from 'lucide-react'
import * as React from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { toast } from 'sonner'
import { formatRelativeTime } from '@/lib/format'

export default function IncidentDetail() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const { data: incident, isLoading, isError } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => apiClient.getIncident(id),
    enabled: !!id,
  })

  const [updateMsg, setUpdateMsg] = React.useState('')
  const [resolutionMsg, setResolutionMsg] = React.useState('')
  const [showResolveForm, setShowResolveForm] = React.useState(false)

  const addTimelineMutation = useMutation({
    mutationFn: (message: string) => apiClient.addTimelineEntry(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] })
      setUpdateMsg('')
      toast.success('Timeline update added')
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; resolution?: string }) => apiClient.updateIncidentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', id] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.incidents() })
      toast.success('Incident status updated')
      setShowResolveForm(false)
      setResolutionMsg('')
    }
  })

  if (isLoading) return <div className="p-8"><Skeleton variant="rect" /></div>
  if (isError || !incident) return <div className="p-8 text-center text-red">Failed to load incident or not found. <Button className="mt-4" onClick={() => router.back()}>Go Back</Button></div>

  const isResolved = incident.status === 'resolved'

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Incidents
      </Button>

      <PageHeader 
        title={incident.title} 
        description={`Detected on ${new Date(incident.detected_at).toLocaleString()}`}
        actions={
          <div className="flex gap-2">
            <Badge variant="developer">{incident.severity}</Badge>
            <Badge variant={isResolved ? 'active' : incident.status === 'investigating' ? 'suspended' : 'developer'}>
              {incident.status.toUpperCase()}
            </Badge>
          </div>
        }
      />

      <Card padding="lg" className="space-y-6">
        <h3 className="font-syne text-lg font-bold flex items-center gap-2 border-b border-border pb-2">
          <Activity className="h-5 w-5 text-teal" />
          Timeline & Updates
        </h3>

        <div className="space-y-4">
          <div className="flex gap-4 items-start relative ml-2">
            <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-red/20 border border-red" />
            <div className="border border-border rounded p-3 text-sm flex-1 bg-bg-elevated">
              <p className="font-medium text-red mb-1">Incident Detected</p>
              <p className="text-text-secondary">{incident.description}</p>
              <p className="text-[10px] text-text-muted mt-2">{formatRelativeTime(incident.detected_at)} • System</p>
            </div>
          </div>

          {incident.timeline.map((entry) => (
            <div key={entry.id} className="flex gap-4 items-start relative ml-2">
              <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-card-2 border border-border" />
              <div className="border border-border rounded p-3 text-sm flex-1">
                <p className="text-text-primary">{entry.message}</p>
                <p className="text-[10px] text-text-muted mt-2">{formatRelativeTime(entry.created_at)} • {entry.author}</p>
              </div>
            </div>
          ))}

          {isResolved && incident.resolved_at && (
            <div className="flex gap-4 items-start relative ml-2">
              <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-teal/20 border border-teal" />
              <div className="border border-border/50 bg-teal/5 rounded p-3 text-sm flex-1">
                <p className="font-bold text-teal flex items-center gap-1"><CheckCircle size={14}/> Incident Resolved</p>
                {incident.resolved_by && <p className="text-[10px] text-teal/80 mt-1">Resolved by {incident.resolved_by}</p>}
              </div>
            </div>
          )}
        </div>

        {!isResolved && (
          <div className="pt-6 border-t border-border space-y-4">
            <div className="flex items-center gap-2">
              <textarea
                className="flex-1 bg-bg rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal border border-border min-h-[80px]"
                placeholder="Add timeline update..."
                value={updateMsg}
                onChange={(e) => setUpdateMsg(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center">
              <Button 
                variant="secondary"
                disabled={!updateMsg.trim() || addTimelineMutation.isPending}
                onClick={() => addTimelineMutation.mutate(updateMsg)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Add Update
              </Button>
              
              <div className="flex gap-2">
                {incident.status !== 'investigating' && (
                  <Button 
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({ status: 'investigating' })}
                  >
                    Mark Investigating
                  </Button>
                )}
                <Button 
                  onClick={() => setShowResolveForm(true)}
                  disabled={showResolveForm}
                >
                  Resolve Incident
                </Button>
              </div>
            </div>

            {showResolveForm && (
              <div className="bg-card-2 p-4 rounded-lg space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-bold">Resolution Details</h4>
                <textarea
                  className="w-full bg-bg rounded p-2 text-sm border border-border mb-2 min-h-[60px]"
                  placeholder="Describe how the incident was resolved..."
                  value={resolutionMsg}
                  onChange={(e) => setResolutionMsg(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowResolveForm(false)}>Cancel</Button>
                  <Button 
                    size="sm" 
                    disabled={!resolutionMsg.trim()}
                    onClick={() => updateStatusMutation.mutate({ status: 'resolved', resolution: resolutionMsg })}
                  >
                    Confirm Resolution
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}