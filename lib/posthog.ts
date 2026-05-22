import { PostHog } from 'posthog-node'

/**
 * Server-side PostHog client for App Router server components and route handlers.
 * Creates a fresh instance per call — always call `await client.shutdown()` when done.
 *
 * Usage:
 *   const client = PostHogClient()
 *   client.capture({ distinctId: session.user.id, event: 'some_event' })
 *   await client.shutdown()
 */
export function PostHogClient(): PostHog {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    // Flush immediately — server functions are short-lived
    flushAt: 1,
    flushInterval: 0,
  })
}
