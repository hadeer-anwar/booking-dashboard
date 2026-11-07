'use client';

import { useEffect } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AlertCircle, RotateCw } from 'lucide-react';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'] });

/**
 * Last-resort boundary — only fires if the ROOT layout itself throws
 * (e.g. QueryProvider/ToastProvider setup), which app/error.tsx cannot
 * catch. Next.js requires this to render its own <html>/<body> since it
 * replaces the root layout entirely when active. Kept deliberately
 * self-contained (no app providers, no shared layout components) since
 * those are exactly what may have failed — only a font load and a plain
 * Tailwind-styled fallback, mirroring the same visual language as
 * `ErrorState`/`app/error.tsx` so it doesn't look like a different app.
 */
export default function GlobalError({
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
    <html lang="en">
      <body className={plusJakartaSans.className}>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
          <div className="rounded-full bg-red-50 p-3.5">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <p className="mt-4 max-w-sm text-sm text-gray-700">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-brand-500 active:scale-[0.98]"
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
