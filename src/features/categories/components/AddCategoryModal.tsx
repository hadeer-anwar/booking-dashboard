'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateCategoryMutation } from '@/src/features/categories/hooks/useCategories';
import { MODAL_OVERLAY_CLASS, MODAL_PANEL_SCROLL_CLASS } from '@/src/components/ui/modal-shell';

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AddCategoryModal = ({ open, onClose, onSaved }: AddCategoryModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { mutateAsync: createCategory, isPending: isSubmitting } = useCreateCategoryMutation();

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      await createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      
      // The mutation hook already shows success toast, so we don't need to show another one
      onSaved?.();
      onClose();
    } catch (error) {
      // The mutation hook already handles error toast, but we can add additional logic if needed
      console.error('Failed to create category:', error);
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS}>
      <div className={MODAL_PANEL_SCROLL_CLASS}>
        <div className="flex items-start justify-between px-6 pt-6 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Category</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new service category to organize your clinic services.
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
            <label className="block text-xs font-medium text-gray-700">Category Name *</label>
            <input
              type="text"
              placeholder="e.g. Skin & Face"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700">Description</label>
            <textarea
              placeholder="Short description of this category"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="mt-2 flex flex-col-reverse justify-end gap-3 pt-2 border-t border-gray-100 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};