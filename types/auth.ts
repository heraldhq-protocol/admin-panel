export type AdminRole = 'super_admin' | 'admin' | 'viewer'
export type AuthMethod = 'wallet' | 'email-totp'

export interface AdminSession {
  user: {
    id: string
    display_name: string
    role: AdminRole
    auth_method: AuthMethod
    wallet_address?: string
  }
  expires: string
  access_token: string
}