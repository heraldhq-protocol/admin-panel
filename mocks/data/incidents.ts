import type { Incident } from '../../types/api'

export const mockIncidents: Incident[] = [
  {
    id: 'inc_P0_123',
    severity: 'P0',
    status: 'resolved',
    title: 'SES API Gateway Outage',
    description: 'AWS SES us-east-1 region experiencing high error rates.',
    affected_component: 'Email Delivery Engine',
    detected_at: '2026-03-24T18:12:00Z',
    resolved_at: '2026-03-24T19:45:00Z',
    created_by: 'admin_01',
    resolved_by: 'admin_01',
    timeline: [
      {
        id: 't_1',
        incident_id: 'inc_P0_123',
        message: 'Incident detected via automated health checks.',
        author: 'System',
        created_at: '2026-03-24T18:12:00Z',
      },
      {
        id: 't_2',
        incident_id: 'inc_P0_123',
        message: 'Flipping traffic to us-west-2 secondary gateway.',
        author: 'admin_01',
        created_at: '2026-03-24T18:25:00Z',
      },
      {
        id: 't_3',
        incident_id: 'inc_P0_123',
        message: 'Traffic successfully migrated. Error rates returned to normal.',
        author: 'admin_01',
        created_at: '2026-03-24T18:40:00Z',
      },
    ],
  },
  {
    id: 'inc_P1_456',
    severity: 'P1',
    status: 'investigating',
    title: 'ZK Receipt Generation Delay',
    description: 'Proof generation taking > 5 minutes for large batches.',
    affected_component: 'Prover Service',
    detected_at: '2026-03-28T14:00:00Z',
    resolved_at: null,
    created_by: 'admin_02',
    resolved_by: null,
    timeline: [
      {
        id: 't_4',
        incident_id: 'inc_P1_456',
        message: 'Investigation started. Checking prover cluster load.',
        author: 'admin_02',
        created_at: '2026-03-28T14:10:00Z',
      },
    ],
  },
]