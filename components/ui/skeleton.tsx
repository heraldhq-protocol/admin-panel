import { cn } from '../../lib/cn'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'short' | 'tiny' | 'circle' | 'rect'
}

function Skeleton({ className, variant = 'line', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-card-2 rounded-md',
        variant === 'line' && 'w-full h-4',
        variant === 'short' && 'w-[60%] h-4',
        variant === 'tiny' && 'w-[30%] h-4',
        variant === 'circle' && 'w-10 h-10 rounded-full',
        variant === 'rect' && 'w-full h-24',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }