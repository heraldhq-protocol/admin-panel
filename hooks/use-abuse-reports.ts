import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { AbuseReportFilters } from '@/types/api'

export function useAbuseReports(filters?: AbuseReportFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.abuseReports(filters),
    queryFn: () => apiClient.getAbuseReports(filters),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}
