'use client';

import type { Category } from '@/src/features/categories/types/types';
import { Trash2 } from 'lucide-react';
import { useDeleteCategoryMutation } from '@/src/features/categories/hooks/useCategories';
import { ConfirmActionModal } from '@/src/components/ui/ConfirmActionModal';

interface DeleteCategoryModalProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onConfirm?: () => void;
}

export const DeleteCategoryModal = ({
  open,
  category,
  onClose,
  onConfirm,
}: DeleteCategoryModalProps) => {
  const { mutate: deleteCategory, isPending } = useDeleteCategoryMutation();

  if (!category) return null;

  const handleConfirm = () => {
    deleteCategory(category.id, {
      onSuccess: () => {
        onConfirm?.();
        onClose();
      },
      onError: () => {
        onClose();
      },
    });
  };

  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      icon={Trash2}
      title="Delete Category"
      description="This action cannot be undone. The category will be removed from the system."
      confirmLabel="Delete"
      confirmingLabel="Deleting..."
      tone="dark"
      isSubmitting={isPending}
    >
      <p>
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900">{category.name}</span>?
      </p>
    </ConfirmActionModal>
  );
};
