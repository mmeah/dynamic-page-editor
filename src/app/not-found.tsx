import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-center p-4">
      <h1 className="text-4xl font-bold mb-4 text-foreground">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! The page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Go Back to Home</Link>
      </Button>
    </div>
  );
}
