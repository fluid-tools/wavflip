import { LibraryContent } from './library-content'
// import { getLibraryTracks, getLibraryStats } from '@/lib/storage/library-storage'

export default async function LibraryPage() {
  // // Fetch data on server - this will trigger loading.tsx
  // const [tracks, stats] = await Promise.all([
  //   getLibraryTracks(),
  //   getLibraryStats()
  // ])

  return (
    <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Library</h1>
        <p className="text-muted-foreground">Your saved audio tracks</p>
      </div>

      {/* <LibraryContent initialTracks={tracks} initialStats={stats} /> */}
      <LibraryContent />
    </main>
  )
}