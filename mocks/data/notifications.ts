import type { Notification } from '../../types/api'
import { mockProtocols } from './protocols'

const statuses = ['delivered', 'failed', 'queued', 'opted_out'] as const
const categories = ['defi', 'governance', 'system', 'marketing'] as const

export const mockNotifications: Notification[] = Array.from({ length: 200 }).map((_, i) => {
  const protocol = mockProtocols[i % mockProtocols.length]!
  const status = statuses[Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 4)] as any
  
  return {
    id: `ntf_${i.toString().padStart(6, '0')}`,
    protocol_id: protocol.id,
    protocol_name: protocol.name,
    wallet_hash: `sha256_wallet_hash_${i}`,
    status,
    category: categories[Math.floor(Math.random() * 4)] as any,
    queued_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    receipt_tx: status === 'delivered' ? `tx_${i}_signature` : null,
    bounce: status === 'failed' && Math.random() > 0.5,
    error_code: status === 'failed' ? 'RPC_TIMEOUT' : null,
    latency_ms: status === 'delivered' ? Math.floor(Math.random() * 1000) + 100 : null,
  }
})