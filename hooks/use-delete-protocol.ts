'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import { toast } from 'sonner'

export function useDeleteProtocol(id: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => apiClient.deleteProtocol(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.protocol(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.protocols() })
      toast.success('Protocol permanently deleted')
      router.push('/protocols')
    },
    onError: () => {
      toast.error('Failed to delete protocol')
    },
  })
}
