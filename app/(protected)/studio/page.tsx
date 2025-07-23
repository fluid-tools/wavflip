import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SoundGeneratorSkeleton from '@/components/gen-ai/sound-gen-skeleton'

const SoundGenerator = dynamic(() => import('@/components/gen-ai/sound-gen'), {
  loading: () => <SoundGeneratorSkeleton />
})

export default async function StudioPage() {
  return (
    <main className="container mx-auto px-4 py-6 pb-24 max-w-7xl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Sound Generator</h1>
          <p className="text-muted-foreground">Create custom sounds and speech with AI</p>
        </div>
        
        <Suspense fallback={<SoundGeneratorSkeleton />}>
          <SoundGenerator />
        </Suspense>
      </div>
    </main>
  )
} 