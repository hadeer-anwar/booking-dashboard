'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/src/components/ui/ErrorState';


export default function DashboardError({
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
      message="This page couldn't load. Please try again."
      page
      onRetry={reset}
    />
  );
}
