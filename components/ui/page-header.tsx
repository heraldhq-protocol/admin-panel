import * as React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode  // buttons, badges in top-right
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-syne text-2xl font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}