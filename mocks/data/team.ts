import type { TeamMember } from '../../types/api'

export const mockTeam: TeamMember[] = [
  {
    id: 'admin_01',
    display_name: 'Alex Rivera',
    role: 'super_admin',
    auth_method: 'wallet',
    wallet_address_hash: 'sha256_wallet_alex',
    last_active_at: '2026-03-28T15:00:00Z',
    created_at: '2026-01-01T09:00:00Z',
  },
  {
    id: 'admin_02',
    display_name: 'Sarah Chen',
    role: 'admin',
    auth_method: 'email-totp',
    wallet_address_hash: null,
    last_active_at: '2026-03-28T14:45:00Z',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'viewer_01',
    display_name: 'Junior Ops',
    role: 'viewer',
    auth_method: 'email-totp',
    wallet_address_hash: null,
    last_active_at: '2026-03-27T17:00:00Z',
    created_at: '2026-02-01T09:00:00Z',
  },
]
