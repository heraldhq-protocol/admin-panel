import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { AdminRole, AuthMethod } from '../types'

const ADMIN_ROLES = ['super_admin', 'admin', 'viewer'] as const
const AUTH_METHODS = ['wallet', 'email-totp'] as const

// Refresh the backend token when less than 15 minutes remain
const REFRESH_THRESHOLD_SECONDS = 15 * 60

const BACKEND_URL = process.env.HERALD_BACKEND_URL ?? 'http://localhost:3001/v1'

function isAdminRole(v: unknown): v is AdminRole {
  return ADMIN_ROLES.includes(v as AdminRole)
}

function isAuthMethod(v: unknown): v is AuthMethod {
  return AUTH_METHODS.includes(v as AuthMethod)
}

/** Decode the `exp` claim from a JWT without verifying the signature. */
function decodeTokenExp(jwt: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString(),
    )
    return payload.exp as number
  } catch {
    // Fallback: treat as 8h from now
    return Math.floor(Date.now() / 1000) + 8 * 3600
  }
}

/** Call a backend admin-auth endpoint and return the full response including the issued JWT. */
async function callAdminAuth(
  endpoint: 'wallet' | 'email',
  payload: Record<string, string>,
): Promise<{ token: string; admin: { id: string; displayName: string; role: string; authMethod: string } }> {
  const url = `${BACKEND_URL}/admin-auth/${endpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Auth failed' }))
    throw new Error((err as { message?: string }).message ?? 'Auth failed')
  }
  return res.json()
}

/** Exchange a still-valid backend JWT for a fresh 8-hour token. */
async function refreshBackendToken(currentToken: string): Promise<{ token: string }> {
  const url = `${BACKEND_URL}/admin-auth/refresh`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: currentToken }),
  })
  if (!res.ok) throw new Error(`Refresh failed with status ${res.status}`)
  return res.json() as Promise<{ token: string }>
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

        if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
          const exp = Math.floor(Date.now() / 1000) + 8 * 3600
          return {
            id: 'admin_mock_01',
            name: 'Alex Rivera (mock)',
            role: 'super_admin' as AdminRole,
            auth_method: 'wallet' as AuthMethod,
            wallet_address: credentials.publicKey as string,
            backend_token: 'mock-token',
            backend_token_exp: exp,
          }
        }

        try {
          const { token, admin } = await callAdminAuth('wallet', {
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
            backend_token: token,
            backend_token_exp: decodeTokenExp(token),
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

        if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true' && credentials.code === '123456') {
          const exp = Math.floor(Date.now() / 1000) + 8 * 3600
          return {
            id: 'admin_mock_02',
            name: 'Sarah Chen (mock)',
            role: 'admin' as AdminRole,
            auth_method: 'email-totp' as AuthMethod,
            backend_token: 'mock-token',
            backend_token_exp: exp,
          }
        }

        if (process.env.NODE_ENV === 'production' && !process.env.HERALD_BACKEND_URL) {
          console.error('[auth] HERALD_BACKEND_URL not set in production')
          return null
        }

        try {
          const { token, admin } = await callAdminAuth('email', {
            email: credentials.email as string,
            totp_code: credentials.code as string,
          })

          return {
            id: admin.id,
            name: admin.displayName,
            role: admin.role as AdminRole,
            auth_method: admin.authMethod as AuthMethod,
            backend_token: token,
            backend_token_exp: decodeTokenExp(token),
          }
        } catch (err) {
          console.error('[auth] email-totp login failed:', (err as Error).message)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in — copy backend token from User into the NextAuth JWT
      if (user) {
        token.role = user.role
        token.auth_method = user.auth_method
        token.wallet_address = user.wallet_address ?? null
        token.display_name = user.name ?? null
        token.backend_token = user.backend_token
        token.backend_token_exp = user.backend_token_exp
        return token
      }

      // Session predates backend_token — must re-authenticate
      if (!token.backend_token) {
        return { ...token, error: 'RefreshTokenError' as const }
      }

      // Subsequent requests — refresh backend token if near expiry
      const secondsRemaining = (token.backend_token_exp ?? 0) - Math.floor(Date.now() / 1000)

      if (secondsRemaining > REFRESH_THRESHOLD_SECONDS) {
        return token
      }

      try {
        const { token: newToken } = await refreshBackendToken(token.backend_token as string)
        console.info(`[auth] backend token refreshed for ${String(token.sub)}`)
        return {
          ...token,
          backend_token: newToken,
          backend_token_exp: decodeTokenExp(newToken),
          error: undefined,
        }
      } catch (err) {
        console.error('[auth] backend token refresh failed:', (err as Error).message)
        return { ...token, error: 'RefreshTokenError' as const }
      }
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
      // Forwarded server-side by the proxy — not intended for client-side use
      session.user.backend_token = token.backend_token as string

      if (token.error === 'RefreshTokenError') {
        session.error = 'RefreshTokenError'
      }

      return session
    },
  },

  pages: {
    signIn: '/login',
  },
})
