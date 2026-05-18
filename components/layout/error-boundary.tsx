'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Wire Sentry here when added: Sentry.captureException(error, { extra: info })
    console.error('[RouteErrorBoundary]', error, info.componentStack)
  }

  private reset = () => this.setState({ hasError: false } as State)

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
          <div className="h-12 w-12 rounded-full bg-admin-bg flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-admin" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold font-syne text-text-primary">
              Something went wrong
            </p>
            <p className="text-sm text-text-muted max-w-sm">
              {this.state.error?.message ?? 'An unexpected error occurred in this section.'}
            </p>
          </div>
          <Button onClick={this.reset} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload section
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
