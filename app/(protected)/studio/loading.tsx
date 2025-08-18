import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudioLoading() {
  return (
    <div className="relative flex h-full flex-col">
      {/* Floating background prompts skeleton */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            className="absolute"
            key={index}
            style={{
              top: `${15 + ((index * 37) % 70)}%`,
              left: `${10 + ((index * 43) % 80)}%`,
              transform: `rotate(${-20 + ((index * 15) % 40)}deg)`,
            }}
          >
            <Skeleton className="h-3 w-16 opacity-10" />
          </div>
        ))}
      </div>

      {/* Chat Messages - ONLY scrollable area using ScrollArea */}
      <div className="relative z-10 min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-4xl space-y-8 px-8 py-12">
            {/* System message */}
            <div className="flex items-start gap-6">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
              <div className="max-w-[75%] flex-1">
                <div className="rounded-2xl border bg-muted/30 px-5 py-4 shadow-sm">
                  <Skeleton className="h-4 w-80" />
                </div>
              </div>
            </div>

            {/* User message */}
            <div className="flex flex-row-reverse items-start gap-6">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
              <div className="flex max-w-[75%] flex-1 justify-end">
                <div className="rounded-2xl bg-primary/20 px-5 py-4 shadow-sm">
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            {/* Assistant message with sound */}
            <div className="flex items-start gap-6">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
              <div className="max-w-[75%] flex-1">
                <div className="rounded-2xl border bg-muted/50 px-5 py-4 shadow-sm">
                  <div className="rounded-xl border bg-background/90 p-5 shadow-sm backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-14 w-14 flex-shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="mb-2 h-4 w-32" />
                        <Skeleton className="mb-4 h-3 w-64" />
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
      <div className="flex-shrink-0 border-t bg-background">
        <div className="mx-auto max-w-4xl p-6">
          {/* Mode toggle & recent button skeleton */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-px" />
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
                <Skeleton className="h-7 w-20 rounded-full" key={index} />
              ))}
            </div>
          </div>

          {/* Input skeleton */}
          <div className="flex items-end gap-3 rounded-2xl border bg-muted/30 p-3">
            <Skeleton className="h-5 flex-1" />
            <div className="flex flex-shrink-0 items-center gap-2">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
