export default function LibraryLoading() {
  return (
    <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
      <div className="text-center mb-8">
        <div className="h-8 w-48 bg-muted rounded-lg mx-auto mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
      </div>

      <div className="grid gap-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg bg-card animate-pulse">
              <div className="h-4 w-16 bg-muted rounded mb-2" />
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Track grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-card animate-pulse">
              <div className="h-32 bg-muted rounded-lg mb-4" />
              <div className="h-5 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded mb-3" />
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
} 