import { Skeleton } from '@/components/ui/skeleton';

export default function PlayerDockSkeleton() {
  return (
    <div className="absolute right-0 bottom-0 left-0 z-50 rounded-tl-2xl border-border/50 border-t border-l bg-background/95 shadow-2xl backdrop-blur-md">
      {/* Waveform Container */}
      <div className="px-4 pt-4 pb-3 sm:px-6">
        <div className="w-full overflow-hidden rounded-lg bg-muted/30 ring-1 ring-border/20">
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>

      {/* Controls Container */}
      <div className="px-4 pb-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Track Info - Responsive */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* Play Button - Always Visible */}
          <Skeleton className="h-12 w-12 flex-shrink-0 rounded-full" />

          {/* Desktop Controls */}
          <div className="hidden flex-shrink-0 items-center gap-4 sm:flex">
            {/* Time Display */}
            <Skeleton className="h-3 w-16" />

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex flex-shrink-0 items-center gap-2 sm:hidden">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>

        {/* Mobile Time Display */}
        <div className="mt-2 flex justify-center sm:hidden">
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
