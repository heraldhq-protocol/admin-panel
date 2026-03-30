import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-mono border',
  {
    variants: {
      variant: {
        // Tier badges
        developer:  'bg-card-2 text-text-muted border-border',
        growth:     'bg-teal-bg text-teal border-teal/20',
        scale:      'bg-purple/10 text-purple border-purple/20',
        enterprise: 'bg-gold/10 text-gold border-gold/20',
        // Status badges
        active:     'bg-green/10 text-green border-green/20',
        suspended:  'bg-red/10 text-red border-red/20',
        // Severity badges
        p0:         'bg-red text-white border-transparent',
        p1:         'bg-red/10 text-red border-red/20',
        p2:         'bg-gold/10 text-gold border-gold/20',
        p3:         'bg-card-2 text-text-muted border-border',
        // Notification status
        delivered:  'bg-green/10 text-green border-green/20',
        failed:     'bg-red/10 text-red border-red/20',
        queued:     'bg-teal-bg text-teal border-teal/20',
        opted_out:  'bg-card-2 text-text-muted border-border',
      },
    },
    defaultVariants: {
      variant: 'developer',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }