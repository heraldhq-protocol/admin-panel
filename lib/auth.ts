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
        // In MSW environment, we simulate validation
        if (!credentials?.publicKey) return null

        // Success simulation
        return {
          id: 'admin_01',
          name: 'Alex Rivera',
          role: 'super_admin' as AdminRole,
          auth_method: 'wallet' as AuthMethod,
          wallet_address: credentials.publicKey as string,
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

        // Success simulation if code is 123456
        if (credentials.code === '123456') {
          return {
            id: 'admin_02',
            name: 'Sarah Chen',
            role: 'admin' as AdminRole,
            auth_method: 'email-totp' as AuthMethod,
          }
        }
        return null
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