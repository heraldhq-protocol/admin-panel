import { Card } from './card'
import { Badge } from './badge'
import { cn } from '../../lib/cn'

interface StatCardProps {
  label: string
  value: string | number
  delta?: string | number
  trend?: 'up' | 'down' | 'neutral'
  suffix?: string
  className?: string
}

export function StatCard({
  label,
  value,
  delta,
  trend,
  suffix,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('flex flex-col gap-1', className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="font-syne text-3xl font-bold text-text-primary">
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-medium text-text-secondary">
            {suffix}
          </span>
        )}
      </div>
      {delta !== undefined && (
        <div className="mt-1 flex items-center gap-1.5">
          <Badge
            variant={trend === 'up' ? 'active' : trend === 'down' ? 'suspended' : 'developer'}
            className="px-1.5 py-0"
          >
            {trend === 'up' && '+'}
            {delta}
            {trend === 'up' ? '%' : trend === 'down' ? '%' : ''}
          </Badge>
          <span className="text-[10px] text-text-muted font-medium">vs last month</span>
        </div>
      )}
    </Card>
  )
}