'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Save, Loader2 } from 'lucide-react';
import { UpdateClinicStaffPayload } from '@/src/features/staff/types/types';

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
// Exported so sibling forms rendered on the same profile page (e.g.
// ChangePasswordForm) reuse the same field chrome instead of redefining it.
export function Field({
  label,
  icon: Icon,
  children,
  span2,
  htmlFor,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  span2?: boolean;
  /** Ties the label to its input via `htmlFor`/`id` — without this, screen readers (and RTL's getByLabelText) have no association at all, since the label and input are siblings, not label-wraps-input. */
  htmlFor?: string;
}) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
        {Icon && <Icon className="h-3.5 w-3.5 text-gray-400" />}
        {label}
      </label>
      {children}
    </div>
  );
}

export const fieldInput =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20';

export const fieldInputError =
  'w-full rounded-lg border border-red-400 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/10';

/* ─── Form values type ───────────────────────────────────────────────────── */
export interface StaffProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  specialty?: string;
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
export interface StaffProfileFormProps {
  /** Initial values to populate the form (from the loaded member). */
  defaultValues: StaffProfileFormValues;
  /** Whether this member is a provider (shows the Specialty field). */
  isProvider: boolean;
  /** Whether the save mutation is in-flight. */
  isSubmitting: boolean;
  /**
   * Called when the user submits a valid form.
   * The parent is responsible for calling the mutation.
   */
  onSubmit: (payload: UpdateClinicStaffPayload) => void;
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export function StaffProfileForm({
  defaultValues,
  isProvider,
  isSubmitting,
  onSubmit,
}: StaffProfileFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffProfileFormValues>({ defaultValues });

  // Sync form when the member data changes (e.g. after reload)
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleFormSubmit = handleSubmit((values) => {
    const payload: UpdateClinicStaffPayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim(),
      country: values.country.trim(),
      ...(isProvider && { specialty: values.specialty?.trim() ?? '' }),
    };
    onSubmit(payload);
  });

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">Personal information</h2>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* First name */}
        <Field label="First name" htmlFor="firstName">
          <input
            id="firstName"
            {...register('firstName', { required: 'First name is required' })}
            className={errors.firstName ? fieldInputError : fieldInput}
            placeholder="First name"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
          )}
        </Field>

        {/* Last name */}
        <Field label="Last name" htmlFor="lastName">
          <input
            id="lastName"
            {...register('lastName', { required: 'Last name is required' })}
            className={errors.lastName ? fieldInputError : fieldInput}
            placeholder="Last name"
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
          )}
        </Field>

        {/* Email */}
        <Field label="Email" icon={Mail} span2 htmlFor="email">
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
            className={errors.email ? fieldInputError : fieldInput}
            placeholder="name@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </Field>

        {/* Phone */}
        <Field label="Phone" icon={Phone} htmlFor="phoneNumber">
          <input
            id="phoneNumber"
            {...register('phoneNumber')}
            className={fieldInput}
            placeholder="+1 (555) 000-0000"
          />
        </Field>

        {/* Country */}
        <Field label="Country / region" icon={MapPin} htmlFor="country">
          <input
            id="country"
            {...register('country')}
            className={fieldInput}
            placeholder="e.g. United States"
          />
        </Field>

        {/* Specialty — providers only */}
        {isProvider && (
          <Field label="Specialty" span2 htmlFor="specialty">
            <input
              id="specialty"
              {...register('specialty')}
              className={fieldInput}
              placeholder="e.g. Dermatology, threading"
            />
          </Field>
        )}
      </div>
    </form>
  );
}