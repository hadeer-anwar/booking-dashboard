'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, KeyRound, Loader2, Save } from 'lucide-react';
import { useChangePassword } from '@/src/features/auth/hooks/useChangePassword';
import { Field, fieldInput, fieldInputError } from './StaffProfileForm';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** A single password input with its own show/hide toggle. */
function PasswordField({
  label,
  error,
  registration,
}: {
  label: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<ChangePasswordFormValues>>['register']>;
}) {
  const [visible, setVisible] = useState(false);
  // `registration.name` is the RHF field key (e.g. "currentPassword") —
  // reused as-is for the id since it's already unique within this form.
  const id = registration.name;
  return (
    <Field label={label} icon={KeyRound} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          {...registration}
          className={error ? fieldInputError : fieldInput}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </Field>
  );
}

/**
 * Shown only on your own profile — the endpoint always changes the
 * currently authenticated user's password regardless of which staff
 * member's page you're looking at, so an admin viewing someone else's
 * profile must never see this form (the parent page is responsible for
 * that gate; see ClinicStaffMemberDetailPage's isOwnProfile check).
 */
export function ChangePasswordForm() {
  const { changePasswordAsync, isPending } = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      await changePasswordAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      reset();
    } catch {
      // Error toast already surfaced by the mutation's onError — keep the
      // fields as typed so the user can just fix the one that was wrong
      // (usually currentPassword) instead of retyping everything.
    }
  });

  return (
    <form onSubmit={handleFormSubmit} noValidate className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Change password</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Changing your password signs you out of every other device and browser.
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Update password
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          label="Current password"
          error={errors.currentPassword?.message}
          registration={register('currentPassword', { required: 'Current password is required' })}
        />

        <div className="hidden sm:block" aria-hidden />

        <PasswordField
          label="New password"
          error={errors.newPassword?.message}
          registration={register('newPassword', {
            required: 'New password is required',
            minLength: { value: 8, message: 'New password must be at least 8 characters' },
            validate: (value, formValues) =>
              value !== formValues.currentPassword || 'New password must be different from the current password',
          })}
        />

        <PasswordField
          label="Confirm new password"
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword', {
            required: 'Please confirm your new password',
            validate: (value, formValues) => value === formValues.newPassword || 'Passwords do not match',
          })}
        />
      </div>
    </form>
  );
}
