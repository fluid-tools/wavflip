import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function LibraryLoading() {
  return (
    <>
      {/* Stats Loading */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="min-w-0 flex-1">
                  <div className="h-6 w-12 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header Loading */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
      </div>

      {/* Cards Loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex flex-col h-full">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-full bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 flex-1 flex flex-col justify-between">
              <div className="mb-3">
                <div className="h-5 w-16 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className="h-8 flex-1 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
} 