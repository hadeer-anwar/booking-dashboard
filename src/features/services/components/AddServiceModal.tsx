'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCategories } from '@/src/features/categories/hooks/useCategories';
import { useClinics } from '@/src/features/clinics/hooks/useClinics';
import { useCreateServiceMutation } from '../hooks/useServices';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from '@/src/components/ui/modal-shell';

interface AddServiceModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** When set, clinic is fixed and category list is scoped to this clinic. */
  lockedClinicId?: string;
  lockedClinicName?: string;
}

export const AddServiceModal = ({
  open,
  onClose,
  onSaved,
  lockedClinicId,
  lockedClinicName,
}: AddServiceModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clinicId, setClinicId] = useState(lockedClinicId ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState<number>(0);

  const { categories, isLoading: categoriesLoading } = useCategories(
    lockedClinicId ? { clinicId: lockedClinicId } : undefined
  );
  const { clinics, isLoading: clinicsLoading } = useClinics(undefined, {
    enabled: !lockedClinicId,
    // Modal selector — needs the full list of clinics, not a page.
    limit: 100,
  });

  const { createServiceAsync, isPending } = useCreateServiceMutation();

  const resetForm = () => {
    setName('');
    setDescription('');
    setClinicId(lockedClinicId ?? '');
    setCategoryId('');
    setDuration(30);
    setPrice(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !clinicId || !categoryId) return;
      createServiceAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      clinicId,
      categoryId,
      duration: Number(duration) || 30,
      price: Number(price) ?? 0,
    }, {
      onSuccess: () => {
        onSaved?.();
        handleClose();
      }
    });
  };

  if (!open) return null;

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Service</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new service and assign it to a clinic and category.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Service Name *</label>
            <input
              type="text"
              placeholder="e.g. Skin Cleaner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Description</label>
            <input
              type="text"
              placeholder="e.g. Brief description of the service"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Clinic *</label>
            {lockedClinicId ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                {lockedClinicName ?? 'Your clinic'}
              </div>
            ) : (
              <select
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white"
              >
                <option value="">Select clinic</option>
                {clinicsLoading ? (
                  <option disabled>Loading clinics...</option>
                ) : (
                  clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white"
            >
              <option value="">Select category</option>
              {categoriesLoading ? (
                <option disabled>Loading categories...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Duration (minutes) *</label>
              <input
                type="number"
                min={1}
                max={480}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 30)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Price *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col-reverse justify-end gap-3 pt-2 border-t border-gray-100 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Service'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
