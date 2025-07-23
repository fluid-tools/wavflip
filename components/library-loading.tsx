import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LibraryLoading() {
  return (
    <>
      {/* Stats Loading */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-6 w-12 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header Loading */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Cards Loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 flex-1 flex flex-col justify-between">
              <div className="mb-3">
                <Skeleton className="h-5 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}