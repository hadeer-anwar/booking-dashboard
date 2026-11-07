'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCategories, useClinicCategoriesMutation } from '@/src/features/categories/hooks/useCategories';
import { EntityPicker } from '@/src/components/ui/EntityPicker';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_CLASS } from '@/src/components/ui/modal-shell';

interface AddClinicCategoryModalProps {
  open: boolean;
  clinicId: string;
  onClose: () => void;
  onAdded?: () => void;
}

export const AddClinicCategoryModal = ({ open, clinicId, onClose, onAdded }: AddClinicCategoryModalProps) => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const {
    categories: clinicCategories,
    refetch: refetchClinicCategories,
  } = useCategories({ clinicId });

  const {
    categories: allCategories,
    isLoading: allCategoriesLoading,
    isError: allCategoriesError,
  } = useCategories({});

  const {
    updateClinicCategoriesAsync,
    isPending: busy,
  } = useClinicCategoriesMutation(clinicId);

  // Reset selection each time the modal opens
  useEffect(() => {
    if (open) {
      setSelectedCategoryIds([]);
    }
  }, [open]);

  // Only offer categories not already linked to the clinic
  const availableCategories = allCategories.filter(
    (cat) => !clinicCategories.some((clinicCat) => clinicCat.id === cat.id)
  );

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategoryIds.length === 0) return;

    try {
      // Backend links all of them in one $addToSet — a single request either
      // succeeds as a whole or fails as a whole, no partial-batch state to reconcile.
      await updateClinicCategoriesAsync({ action: 'add', categoryIds: selectedCategoryIds });
      await refetchClinicCategories();
      onAdded?.();
      onClose();
    } catch (err) {
      console.error('Failed to add categories:', err);
    }
  };

  if (!open) return null;

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_CLASS}>
        <div className="flex items-start justify-between border-b border-gray-200 px-6 pb-4 pt-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add categories</h2>
            <p className="mt-1 text-sm text-gray-500">Link one or more categories from the catalog.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleAdd} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {allCategoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : availableCategories.length === 0 ? (
              <p className="py-4 text-sm text-gray-500">All categories are already linked to this clinic.</p>
            ) : (
              <EntityPicker
                items={availableCategories.map((c) => ({ id: c.id, label: c.name }))}
                selectedIds={selectedCategoryIds}
                onToggle={toggleCategory}
                multiple
                placeholder="Search categories…"
                isError={allCategoriesError}
                errorMessage="Couldn't load categories."
                emptyMessage="No categories match your search."
                autoFocus
              />
            )}
          </div>
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || selectedCategoryIds.length === 0 || allCategoriesLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : selectedCategoryIds.length > 1 ? (
                `Add ${selectedCategoryIds.length} categories`
              ) : (
                'Add'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
