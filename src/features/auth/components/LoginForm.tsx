/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useLogin } from '@/src/features/auth/hooks/useLogin';
import { loginSchema, type LoginFormData } from '@/src/features/auth/schemas/login.schema';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Handle specific errors
      if (err.message?.includes('Invalid credentials')) {
        setError('root', {
          type: 'manual',
          message: 'Invalid email or password. Please try again.',
        });
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand panel — hidden below `lg`, where the form panel alone fills
            the screen (the mobile-only wordmark below covers branding there
            instead of shrinking this whole panel down responsively). */}
        <section className="relative hidden overflow-hidden bg-brand-400 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/bookedby-lola.webp"
            alt="booked by lola"
            className="h-12 w-auto max-w-[210px] object-contain object-left"
          />

          <div className="relative z-10 max-w-xl">
            <p className="font-heading text-3xl italic">Thoughtfully organised.</p>
            <h1 className="mt-5 font-heading text-6xl leading-[0.95] tracking-tight xl:text-7xl">
              Your whole clinic day, in one view.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-gray-900/75">
              Track bookings, manage your team&apos;s schedule, and keep every appointment running smoothly.
            </p>
          </div>

          {/* Decorative blobs — purely geometric, no content of their own. */}
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 h-[360px] w-[300px] rotate-12 rounded-[48%_52%_48%_52%/58%_42%_58%_42%] bg-gold-400/80"
          />
          <div
            aria-hidden="true"
            className="absolute right-48 top-24 h-36 w-28 -rotate-12 rounded-[55%_45%_55%_45%/60%_40%_60%_40%] bg-tan-400/75"
          />

          <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.18em]">
            Lola Clinic Admin
          </p>
        </section>

        {/* Form panel */}
        <section className="flex items-center justify-center bg-white px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/bookedby-lola.webp"
              alt="booked by lola"
              className="mb-12 h-10 w-auto max-w-[170px] object-contain object-left lg:hidden"
            />

            <h2 className="font-heading text-5xl leading-none tracking-tight text-gray-900">
              Welcome back.
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Sign in to access your clinic dashboard.
            </p>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-center text-xs text-red-600">
                  {(() => {
                    if (error instanceof Error) return error.message;
                    if (typeof error === 'string') return error;
                    return 'Login failed. Please try again.';
                  })()}
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-900">Email address</span>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="username"
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm outline-none transition-shadow focus:ring-2 ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-brand-400/35'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-900">Password</span>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-white px-4 py-3.5 pr-11 text-sm outline-none transition-shadow focus:ring-2 ${
                      errors.password
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-brand-400/35'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                )}
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 px-4 py-3.5 text-sm font-semibold text-gray-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    Sign in
                  </>
                )}
              </button>

              {errors.root && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-center text-xs text-red-600">{errors.root.message}</p>
                </div>
              )}
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-gray-500">
              Don&apos;t have access?{' '}
              <span className="cursor-pointer font-medium text-gray-900 hover:underline">
                Contact Admin
              </span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
