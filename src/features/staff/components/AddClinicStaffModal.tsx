'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/src/components/ui/ToastProvider';
import { useCreateStaffMutation } from '@/src/features/staff/hooks/useStaff';
import { useAuthStore } from '@/src/features/auth/store/auth.store';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from '@/src/components/ui/modal-shell';

type StaffRole = 'provider' | 'clinic_admin' | 'moderator';

interface AddClinicStaffModalProps {
  open: boolean;
  clinicId: string;
  defaultRole: StaffRole;
  onClose: () => void;
  onSaved?: () => void;
}

export const AddClinicStaffModal = ({
  open,
  clinicId,
  defaultRole,
  onClose,
  onSaved,
}: AddClinicStaffModalProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<StaffRole>(defaultRole);
  const [specialty, setSpecialty] = useState('');
  const { showError } = useToast();
  const { createStaffAsync, isPending: submitting } = useCreateStaffMutation();
  const currentUser = useAuthStore((state) => state.user);
  // Defense-in-depth mirror of the backend's restrictModeratorAssignment:
  // only super_admin may submit role: "moderator" — hide the option
  // entirely rather than let a non-super-admin pick it and hit a 403.
  const canAssignModerator = currentUser?.role === 'super_admin';

  const reset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setCountry('');
    setPhoneNumber('');
    setRole(defaultRole);
    setSpecialty('');
  };

  if (!open) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      showError('First name, last name, email and password are required.', 'Missing fields');
      return;
    }
    if (!country.trim() || !phoneNumber.trim()) {
      showError('Country and phone number are required.', 'Missing fields');
      return;
    }
    if (role === 'provider') {
      if (!specialty.trim()) {
        showError('Specialty is required for service providers.', 'Missing specialty');
        return;
      }
    }

 
    try {
      await createStaffAsync({
        clinicId,
        payload: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
          country: country.trim(),
          phoneNumber: phoneNumber.trim(),
          role,
          specialty: role === 'provider' ? specialty.trim() : undefined,
        },
      });
      reset();
      onSaved?.();
      onClose();
    } catch {
      // Toast surfaced by the mutation's onError handler.
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add clinic staff</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create an account for a service provider, clinic administrator{canAssignModerator ? ', or moderator' : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Country</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Phone</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="provider">Service provider</option>
              <option value="clinic_admin">Clinic administrator</option>
              {canAssignModerator && <option value="moderator">Moderator</option>}
            </select>
          </div>

          {role === 'provider' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Specialty</label>
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Brow threading"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
             
            </>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 pt-4 border-t border-gray-100 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Add staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
