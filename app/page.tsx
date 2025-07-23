import SoundGenerator from '@/components/sound-generator'

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8 pb-24 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">WAVFLIP</h1>
        <p className="text-muted-foreground text-lg">
          AI-powered audio sampler and soundpack generator
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <SoundGenerator />
      </div>
    </main>
  )
} 