import Link from 'next/link';
import { HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black/95">
      <div className="space-y-6 text-center">
        <h1 className="text-6xl font-clash font-medium mb-4 text-white/90">404</h1>
        <p className="text-lg text-white/60">Page not found</p>
        <Link href="/">
          <Button 
            variant="outline" 
            className="mt-4 gap-2 hover:bg-white/10"
          >
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}