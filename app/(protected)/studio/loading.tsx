export default function StudioLoading() {
  return (
    <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-8 w-64 bg-muted rounded-lg mx-auto mb-2 animate-pulse" />
          <div className="h-4 w-80 bg-muted rounded mx-auto animate-pulse" />
        </div>
        
        <div className="space-y-6">
          {/* Generation form */}
          <div className="border rounded-lg p-6 bg-card animate-pulse">
            <div className="h-6 w-32 bg-muted rounded mb-4" />
            <div className="space-y-4">
              <div className="h-20 w-full bg-muted rounded-lg" />
              <div className="flex gap-4">
                <div className="flex-1 h-10 bg-muted rounded" />
                <div className="w-24 h-10 bg-muted rounded" />
              </div>
              <div className="h-12 w-full bg-muted rounded-lg" />
            </div>
          </div>

          {/* Progress indicator */}
          <div className="border rounded-lg p-6 bg-card animate-pulse">
            <div className="h-4 w-48 bg-muted rounded mb-3" />
            <div className="h-2 w-full bg-muted rounded-full" />
          </div>

          {/* Recent generations */}
          <div className="border rounded-lg p-6 bg-card animate-pulse">
            <div className="h-6 w-40 bg-muted rounded mb-4" />
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded">
                  <div className="h-12 w-12 bg-muted rounded" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded mb-2" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                  <div className="h-8 w-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 