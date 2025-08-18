import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCachedSession } from '@/lib/server/auth';

export default async function HomePage() {
  const session = await getCachedSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="font-bold text-4xl tracking-tight">
            WAV<span className="text-blue-600">FLIP</span>
          </h1>
          <p className="text-muted-foreground text-xl">
            AI-powered audio sampler and soundpack generator
          </p>
          <p className="text-muted-foreground">
            100x your audio-sampling workflow. Free and open-source.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href={session ? '/studio' : '/sign-in'}>
              {session ? 'Generate Sounds' : 'Get Started'}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={session ? '/vault' : '/sign-in'}>
              {session ? 'My Vault' : 'Sign In'}
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2 text-center">
            <div className="text-2xl">🎵</div>
            <h3 className="font-semibold">AI-Powered Sampler</h3>
            <p className="text-muted-foreground text-sm">
              Sample anything. Produce tracks in minutes.
            </p>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-2xl">⚡</div>
            <h3 className="font-semibold">Generate Soundpacks</h3>
            <p className="text-muted-foreground text-sm">
              Generate royalty-free soundpacks in seconds.
            </p>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-2xl">🎹</div>
            <h3 className="font-semibold">Professional Tools</h3>
            <p className="text-muted-foreground text-sm">
              Upload your own tracks and manipulate audio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
