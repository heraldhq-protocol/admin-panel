import type { AdminRole, AuthMethod } from './auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      display_name: string
      role: AdminRole
      auth_method: AuthMethod
      wallet_address?: string
      /** Backend-issued JWT forwarded server-side by the proxy — never read in browser components */
      backend_token: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    /** Set when the backend token refresh fails — proxy returns 401, axios redirects to login */
    error?: 'RefreshTokenError'
  }

  interface User {
    role: AdminRole
    auth_method: AuthMethod
    wallet_address?: string | null | undefined
    backend_token: string
    backend_token_exp: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: AdminRole
    auth_method: AuthMethod
    wallet_address?: string | null | undefined
    display_name?: string | null | undefined
    backend_token: string
    backend_token_exp: number
    error?: 'RefreshTokenError'
  }
}
