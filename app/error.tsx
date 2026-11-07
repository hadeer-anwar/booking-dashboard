'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/src/components/ui/ErrorState';

/**
 * Root-segment error boundary. Catches render errors from `/` and `/login`
 * (and anything else not covered by a more specific nested error.tsx, e.g.
 * `app/dashboard/error.tsx`). Does NOT catch errors thrown by the root
 * layout itself — that's `global-error.tsx`'s job.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      message="Something went wrong. Please try again."
      fullScreen
      onRetry={reset}
    />
  );
}
