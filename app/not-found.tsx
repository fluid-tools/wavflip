import { HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black/95 p-4">
      <div className="space-y-6 text-center">
        <h1 className="mb-4 font-clash font-medium text-6xl text-white/90">
          404
        </h1>
        <p className="text-lg text-white/60">Page not found</p>
        <Link href="/">
          <Button className="mt-4 gap-2 hover:bg-white/10" variant="outline">
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
