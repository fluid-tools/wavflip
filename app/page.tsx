import Link from 'next/link'
import { getServerSession } from '@/lib/auth-server'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const session = await getServerSession()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            WAV<span className="text-blue-600">FLIP</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-powered audio sampler and soundpack generator
          </p>
          <p className="text-muted-foreground">
            100x your audio-sampling workflow. Free and open-source.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          {session ? (
            // Authenticated user - show app links
            <>
              <Button asChild size="lg">
                <Link href="/studio">Generate Sounds</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/library">My Library</Link>
              </Button>
            </>
          ) : (
            // Unauthenticated user - show auth links
            <>
              <Button asChild size="lg">
                <Link href="/sign-in">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="text-center space-y-2">
            <div className="text-2xl">🎵</div>
            <h3 className="font-semibold">AI-Powered Sampler</h3>
            <p className="text-sm text-muted-foreground">
              Sample anything. Produce tracks in minutes.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="font-semibold">Generate Soundpacks</h3>
            <p className="text-sm text-muted-foreground">
              Generate royalty-free soundpacks in seconds.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-2xl">🎹</div>
            <h3 className="font-semibold">Professional Tools</h3>
            <p className="text-sm text-muted-foreground">
              Upload your own tracks and manipulate audio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 