'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Service } from '@/src/features/services/types/types';
import { useCategories } from '@/src/features/categories/hooks/useCategories';
import { useClinics } from '@/src/features/clinics/hooks/useClinics';
import { useClinic } from '@/src/features/clinics/hooks/useClinic';
import { useUpdateServiceMutation } from '@/src/features/services/hooks/useServices';
import { X, Loader2 } from 'lucide-react';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from '@/src/components/ui/modal-shell';

interface UpdateServiceModalProps {
  open: boolean;
  service: Service | null;
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  lockedClinicId?: string;
  lockedClinicName?: string;
}

export const UpdateServiceModal = ({
  open,
  service,
  onClose,
  onSaved,
  lockedClinicId,
  lockedClinicName,
}: UpdateServiceModalProps) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState<number>(0);

  const { categories, isLoading: categoriesLoading } = useCategories(
    lockedClinicId ? { clinicId: lockedClinicId } : undefined
  );
  // Modal selector — needs all clinics, not a page.
  const { clinics } = useClinics(undefined, { enabled: !lockedClinicId && !lockedClinicName, limit: 100 });

  const { updateServiceAsync, isPending: isSubmitting } = useUpdateServiceMutation();

  const clinicFromList = useMemo(
    () => (service ? clinics.find((c) => c.id === service.clinicId)?.name : undefined),
    [service, clinics]
  );

  const shouldFetchClinic = Boolean(open && service && !clinicFromList && !lockedClinicName);
  const { clinic: clinicFetched } = useClinic(shouldFetchClinic ? service?.clinicId : undefined);

  const clinicName = lockedClinicName ?? clinicFromList ?? clinicFetched?.name ?? '—';

  useEffect(() => {
    if (service) {
      setName(service.name);
      setCategoryId(service.categoryId);
      setDuration(service.duration);
      setPrice(service.price ?? 0);
    }
  }, [service]);

  if (!open || !service) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !categoryId) return;

    await updateServiceAsync({
      id: service.id,
      payload: {
        name: name.trim(),
        categoryId,
        duration: Number(duration) || 30,
        price: Number(price) ?? 0,
      },
    });

    await onSaved?.();
    onClose();
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Service</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update service details, category, and duration. Clinic cannot be changed.
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

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Service Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Clinic</label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {clinicName}
            </div>
            <p className="text-[11px] text-gray-500">Clinic cannot be changed after creation.</p>
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
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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