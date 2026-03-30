import * as React from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
}

function Card({ className, padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl shadow-sm overflow-hidden',
        paddingMap[padding],
        className
      )}
      {...props}
    />
  )
}

export { Card }