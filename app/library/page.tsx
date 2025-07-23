import { Suspense } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { LibraryContent } from '@/components/library-content'
import { LibraryLoading } from '@/components/library-loading'

export default function LibraryPage() {
  return (
    <AuthGuard>
      <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Library</h1>
          <p className="text-muted-foreground">Your saved audio tracks</p>
        </div>

        <Suspense fallback={<LibraryLoading />}>
          <LibraryContent />
        </Suspense>
      </main>
    </AuthGuard>
  )
}