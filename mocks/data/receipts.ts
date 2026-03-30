import type { FailedReceipt } from '../../types/api'

export const mockReceipts: FailedReceipt[] = [
  {
    id: 'rcp_01',
    notification_id: 'ntf_000042',
    protocol_id: '01HXKP9M2Q3R5S6T7U8V9W0X',
    protocol_name: 'Drift Protocol',
    failure_reason: 'Solana RPC timeout',
    retry_count: 1,
    last_attempted_at: '2026-03-27T14:30:00Z',
    created_at: '2026-03-27T14:28:00Z',
  },
  {
    id: 'rcp_02',
    notification_id: 'ntf_000085',
    protocol_id: '01HXKP9M2Q3R5S6T7U8V9W0Y',
    protocol_name: 'Jupiter Aggregator',
    failure_reason: 'Insufficient SOL for transaction',
    retry_count: 2,
    last_attempted_at: '2026-03-28T09:15:00Z',
    created_at: '2026-03-28T08:00:00Z',
  },
  {
    id: 'rcp_03',
    notification_id: 'ntf_000099',
    protocol_id: '01HXKP9M2Q3R5S6T7U8V9W0X',
    protocol_name: 'Drift Protocol',
    failure_reason: 'Merkle tree full',
    retry_count: 3,
    last_attempted_at: '2026-03-28T12:00:00Z',
    created_at: '2026-03-28T11:00:00Z',
  },
]