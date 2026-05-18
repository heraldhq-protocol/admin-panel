import * as React from 'react'

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="font-syne text-xl sm:text-2xl font-bold text-text-primary tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}
