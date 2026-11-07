'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  page?: boolean;
}

export function LoadingState({
  message = 'Loading…',
  fullScreen = false,
  page = false,
}: LoadingStateProps) {
  const heightClass = fullScreen ? 'min-h-screen' : page ? 'min-h-[60vh]' : 'py-10';

  return (
    <div
      className={`flex flex-col items-center justify-center ${heightClass} animate-fade-in`}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gray-900/5 blur-xl" />
        <Loader2 className="relative h-10 w-10 animate-spin text-gray-900" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-500">{message}</p>
      <div className="mt-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
