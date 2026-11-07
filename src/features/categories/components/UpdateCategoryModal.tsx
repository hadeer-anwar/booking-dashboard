'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@/src/features/categories/types/types';
import { X } from 'lucide-react';
import { useUpdateCategoryMutation } from '@/src/features/categories/hooks/useCategories';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from '@/src/components/ui/modal-shell';

interface UpdateCategoryModalProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved?: () => void;
}

export const UpdateCategoryModal = ({
  open,
  category,
  onClose,
  onSaved,
}: UpdateCategoryModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { mutateAsync: updateCategory, isPending } = useUpdateCategoryMutation();

  useEffect(() => {
    if (category && open) {
      setName(category.name);
      setDescription(category.description ?? '');
    }
  }, [category, open]);

  if (!open || !category) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !category) return;

    try {
      await updateCategory({
        id: category.id,
        payload: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      });
      
      // The mutation hook already shows success toast
      onSaved?.();
      onClose();
    } catch (error) {
      // The mutation hook already handles error toast
      console.error('Failed to update category:', error);
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Edit Category</h2>
            <p className="mt-1 text-sm text-gray-500">
              Update the name and description of this service category.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2.5 hover:bg-gray-100 text-gray-500 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-3 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Category Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="mt-2 flex flex-col-reverse justify-end gap-3 pt-2 border-t border-gray-100 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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