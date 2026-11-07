'use client';

import { useState, useEffect } from 'react';
import type { Clinic } from '../types/types';
import { X, MapPin, Loader2 } from 'lucide-react';
import { useUpdateClinicMutation } from '../hooks/useClinic';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

interface UpdateClinicModalProps {
  open: boolean;
  clinic: Clinic | null;
  onClose: () => void;
  /** Called with the updated clinic from the API so the parent can update UI immediately. */
  onUpdated?: (updatedClinic: Clinic) => void;
}

export const UpdateClinicModal = ({ open, clinic, onClose, onUpdated }: UpdateClinicModalProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicType, setClinicType] = useState('');
  const [about, setAbout] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { updateClinicAsync, isPending: submitting } = useUpdateClinicMutation(clinic?.id);

  useEffect(() => {
    if (open && clinic) {
      setName(clinic.name ?? '');
      setAddress(clinic.address ?? '');
      setPhone(clinic.phone ?? '');
      setClinicType(clinic.type ?? '');
      setAbout(clinic.about ?? '');
      setCategoryIds(clinic.categories?.map((c) => c.id) ?? []);
      setSubmitError(null);
    }
  }, [open, clinic]);

 

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!clinic) return;
    
    setSubmitError(null);
    
    if (!name.trim() || !address.trim()) {
      setSubmitError('Name and address are required.');
      return;
    }
    
    try {
      const updatedClinic = await updateClinicAsync({
        name: name.trim(),
        address: address.trim(),
        about: about.trim() || undefined,
        phone: phone.trim() || undefined,
        type: clinicType.trim() || undefined,
        categoryIds,
      });
      
    
      
      // The mutation hook already shows success toast, so we don't need to show another one
      onUpdated?.({ ...updatedClinic });
      onClose();
    } catch (err: unknown) {
      // The mutation hook already shows error toast, but we still want to set the local error state
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
        (err as Error)?.message ??
        'Failed to update clinic. Please try again.';
      setSubmitError(message);
    }
  };

  if (!open || !clinic) return null;

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 pb-3 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Update Clinic</h2>
            <p className="mt-1 text-sm text-gray-500">
              Edit clinic information and categories.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-6 pt-2"
        >
          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-gray-500">
              GENERAL INFORMATION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Clinic Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Clinic type</label>
              <input
                type="text"
                value={clinicType}
                onChange={(e) => setClinicType(e.target.value)}
                placeholder="e.g. Dental, General practice, Specialty"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Address *</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">About</label>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Brief description of the clinic, specialties, or any other info…"
                className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
          </section>

          


          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>
          )}

          <div className="mt-2 flex flex-col-reverse justify-end gap-3 pt-2 border-t border-gray-100 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};