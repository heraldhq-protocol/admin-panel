/**
 * Server-side only — call from API route handlers, not client components.
 * Set SLACK_OPS_WEBHOOK_URL in your environment to enable.
 * If the env var is absent the function is a no-op (safe in dev/test).
 */

type Severity = 'info' | 'warning' | 'critical'

const EMOJI: Record<Severity, string> = {
  info:     'ℹ️',
  warning:  '⚠️',
  critical: '🚨',
}

export async function postSlackAlert(
  message: string,
  severity: Severity = 'info',
): Promise<void> {
  const webhookUrl = process.env.SLACK_OPS_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${EMOJI[severity]} *Herald Ops* — ${message}` }),
    })
  } catch (err) {
    // Never throw — a failed Slack alert must not break the primary action
    console.error('[slack-notify] Failed to post alert:', err)
  }
}
