import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { AdminRole, AuthMethod } from '../types'

const ADMIN_ROLES = ['super_admin', 'admin', 'viewer'] as const
const AUTH_METHODS = ['wallet', 'email-totp'] as const

function isAdminRole(v: unknown): v is AdminRole {
  return ADMIN_ROLES.includes(v as AdminRole)
}

function isAuthMethod(v: unknown): v is AuthMethod {
  return AUTH_METHODS.includes(v as AuthMethod)
}

const BACKEND_URL = process.env.HERALD_BACKEND_URL ?? 'http://localhost:3001/v1'

/**
 * Call the real backend admin auth endpoint.
 * Returns the parsed JSON response or throws on non-OK.
 */
async function callAdminAuth(
  endpoint: 'wallet' | 'email',
  payload: Record<string, string>,
): Promise<{ admin: { id: string; displayName: string; role: string; authMethod: string } }> {
  const url = `${BACKEND_URL}/admin-auth/${endpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Auth failed' }))
    throw new Error((err as any).message ?? 'Auth failed')
  }
  return res.json()
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'wallet',
      name: 'Solana Wallet',
      credentials: {
        publicKey: { label: 'Public Key', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.publicKey || !credentials?.signature || !credentials?.message) {
          return null
        }

        // MSW dev-mode: skip real backend when mocks are enabled
        if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
          return {
            id: 'admin_mock_01',
            name: 'Alex Rivera (mock)',
            role: 'super_admin' as AdminRole,
            auth_method: 'wallet' as AuthMethod,
            wallet_address: credentials.publicKey as string,
          }
        }

        try {
          const { admin } = await callAdminAuth('wallet', {
            wallet_pubkey: credentials.publicKey as string,
            signature: credentials.signature as string,
            message: credentials.message as string,
          })

          return {
            id: admin.id,
            name: admin.displayName,
            role: admin.role as AdminRole,
            auth_method: admin.authMethod as AuthMethod,
            wallet_address: credentials.publicKey as string,
          }
        } catch (err) {
          console.error('[auth] wallet login failed:', (err as Error).message)
          return null
        }
      },
    }),

    Credentials({
      id: 'email-totp',
      name: 'Email + TOTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) return null

        // MSW dev-mode bypass — never reaches production
        if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true' && credentials.code === '123456') {
          return {
            id: 'admin_mock_02',
            name: 'Sarah Chen (mock)',
            role: 'admin' as AdminRole,
            auth_method: 'email-totp' as AuthMethod,
          }
        }

        // Production: validate against AdminUser table via backend
        if (process.env.NODE_ENV === 'production' && !process.env.HERALD_BACKEND_URL) {
          console.error('[auth] HERALD_BACKEND_URL not set in production')
          return null
        }

        try {
          const { admin } = await callAdminAuth('email', {
            email: credentials.email as string,
            totp_code: credentials.code as string,
          })

          return {
            id: admin.id,
            name: admin.displayName,
            role: admin.role as AdminRole,
            auth_method: admin.authMethod as AuthMethod,
          }
        } catch (err) {
          console.error('[auth] email-totp login failed:', (err as Error).message)
          return null
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.auth_method = user.auth_method
        token.wallet_address = user.wallet_address ?? null
        token.display_name = user.name ?? null
      }
      return token
    },
    session({ session, token }) {
      if (!token.sub) throw new Error('Missing token.sub in JWT')
      if (!isAdminRole(token.role)) throw new Error(`Invalid role in JWT: ${String(token.role)}`)
      if (!isAuthMethod(token.auth_method)) throw new Error(`Invalid auth_method in JWT: ${String(token.auth_method)}`)

      session.user.id = token.sub
      session.user.display_name = typeof token.display_name === 'string'
        ? token.display_name
        : ''
      session.user.role = token.role
      session.user.auth_method = token.auth_method
      if (typeof token.wallet_address === 'string') {
        session.user.wallet_address = token.wallet_address
      }

      return session
    },
  },

  pages: {
    signIn: '/login',
  },
})
