'use client';

import { AlertCircle, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  fullScreen?: boolean;
  page?: boolean;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  fullScreen = false,
  page = false,
  onRetry,
}: ErrorStateProps) {
  const heightClass = fullScreen ? 'min-h-screen' : page ? 'min-h-[60vh]' : 'py-10';

  return (
    <div
      className={`flex flex-col items-center justify-center ${heightClass} animate-fade-in`}
    >
      <div className="rounded-full bg-red-50 p-3.5">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <p className="mt-4 max-w-sm text-center text-sm text-gray-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
        >
          <RotateCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
