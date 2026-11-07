'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { useCategories } from '@/src/features/categories/hooks/useCategories';
import { useCreateClinicMutation } from '@/src/features/clinics/hooks/useClinic';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

interface AddClinicModalProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export const AddClinicModal = ({ open, onClose, onAdded }: AddClinicModalProps) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicType, setClinicType] = useState('');
  const [about, setAbout] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { createClinicAsync, isPending: submitting } = useCreateClinicMutation();

  useEffect(() => {
    if (!open) {
      setName('');
      setAddress('');
      setPhone('');
      setClinicType('');
      setAbout('');
      setCategoryIds([]);
      setSubmitError(null);
    }
  }, [open]);

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!name.trim() || !address.trim()) {
      setSubmitError('Name and address are required.');
      return;
    }
    try {
      await createClinicAsync({
        name: name.trim(),
        address: address.trim(),
        about: about.trim() || undefined,
        phone: phone.trim() || undefined,
        type: clinicType.trim() || undefined,
        categoryIds: categoryIds.length ? categoryIds : undefined,
      });
      onAdded?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
        (err as Error)?.message ??
        'Failed to create clinic. Please try again.';
      setSubmitError(message);
    }
  };

  if (!open) return null;

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 pb-3 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Clinic</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new clinic with name, address, phone, type, and categories.
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
                  placeholder="e.g. Central Health"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
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
                  placeholder="123 Medical Way, City, ST"
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

          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-gray-500">CATEGORIES</h3>
            <p className="text-xs text-gray-500">Select one or more categories for this clinic.</p>
            {categoriesLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No categories available. Create categories first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:border-gray-400 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            )}
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
                  Creating...
                </>
              ) : (
                'Create Clinic'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
