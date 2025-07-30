import { Skeleton } from '@/components/ui/skeleton'

export default function PlayerDockSkeleton() {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-l rounded-tl-2xl border-border/50 shadow-2xl">
      {/* Waveform Container */}
      <div className="px-4 sm:px-6 pt-4 pb-3">
        <div className="w-full rounded-lg overflow-hidden bg-muted/30 ring-1 ring-border/20">
          <Skeleton className="w-full h-20 rounded-lg" />
        </div>
      </div>

      {/* Controls Container */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="flex items-center gap-4">
          {/* Track Info - Responsive */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* Play Button - Always Visible */}
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            {/* Time Display */}
            <Skeleton className="h-3 w-16" />

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-20 h-5 rounded-full" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Skeleton className="w-8 h-8 rounded" />
              <Skeleton className="w-8 h-8 rounded" />
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex sm:hidden items-center gap-2 flex-shrink-0">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        </div>

        {/* Mobile Time Display */}
        <div className="flex sm:hidden justify-center mt-2">
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
} 