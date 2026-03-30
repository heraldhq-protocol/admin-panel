import type { AdminRole, AuthMethod } from './auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      display_name: string
      role: AdminRole
      auth_method: AuthMethod
      wallet_address?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role: AdminRole
    auth_method: AuthMethod
    wallet_address?: string | null | undefined
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: AdminRole
    auth_method: AuthMethod
    wallet_address?: string | null | undefined
    display_name?: string | null | undefined
  }
}
