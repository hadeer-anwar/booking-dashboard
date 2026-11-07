import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { ToastProvider } from '@/src/components/ui/ToastProvider';
import './globals.css';

// Warm editorial serif for headings/emphasis numbers — pairs with the warm
// cream/rose palette in globals.css. Exposed as --font-heading so it's usable
// from Tailwind's `font-heading` utility (see the @theme block there).
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  axes: ['opsz', 'SOFT'],
});

// Warm geometric-humanist sans for body/UI text — the app's default font
// everywhere that isn't a heading. Exposed as --font-sans (Tailwind's
// default `font-sans`).
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Lola Clinic Admin - Healthcare Management System',
  description: 'Professional clinic booking and management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} ${fraunces.variable} font-sans`}>
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}