import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function StudioLoading() {
  return (
    <div className="h-full flex flex-col relative">
      {/* Floating background prompts skeleton */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              top: `${15 + (index * 37) % 70}%`,
              left: `${10 + (index * 43) % 80}%`,
              transform: `rotate(${-20 + (index * 15) % 40}deg)`,
            }}
          >
            <Skeleton className="h-3 w-16 opacity-10" />
          </div>
        ))}
      </div>

      {/* Chat Messages - ONLY scrollable area using ScrollArea */}
      <div className="flex-1 min-h-0 relative z-10">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto px-8 py-12 space-y-8">
            {/* System message */}
            <div className="flex gap-6 items-start">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 max-w-[75%]">
                <div className="rounded-2xl px-5 py-4 bg-muted/30 border shadow-sm">
                  <Skeleton className="h-4 w-80" />
                </div>
              </div>
            </div>

            {/* User message */}
            <div className="flex gap-6 items-start flex-row-reverse">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 max-w-[75%] flex justify-end">
                <div className="rounded-2xl px-5 py-4 bg-primary/20 shadow-sm">
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            {/* Assistant message with sound */}
            <div className="flex gap-6 items-start">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 max-w-[75%]">
                <div className="rounded-2xl px-5 py-4 bg-muted/50 border shadow-sm">
                  <div className="bg-background/90 backdrop-blur-sm rounded-xl p-5 border shadow-sm">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-64 mb-4" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-3.5 w-3.5" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-12 rounded-full" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-9 w-9 rounded" />
                            <Skeleton className="h-9 w-9 rounded" />
                            <Skeleton className="h-9 w-9 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Fixed input area skeleton - ABSOLUTELY CANNOT SCROLL */}
      <div className="flex-shrink-0 bg-background border-t">
        <div className="max-w-4xl mx-auto p-6">
          {/* Mode toggle & recent button skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-5 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="w-px h-4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded" />
          </div>

          {/* Prompt suggestions skeleton */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>

          {/* Input skeleton */}
          <div className="flex items-end gap-3 p-3 bg-muted/30 rounded-2xl border">
            <Skeleton className="flex-1 h-5" />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 