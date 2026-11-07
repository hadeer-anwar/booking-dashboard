'use client';

import type { Service } from '@/src/features/services/types/types';
import { Trash2 } from 'lucide-react';
import { ConfirmActionModal } from '@/src/components/ui/ConfirmActionModal';

interface DeleteServiceModalProps {
  open: boolean;
  service: Service | null;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
}

export const DeleteServiceModal = ({
  open,
  service,
  onClose,
  onConfirm,
}: DeleteServiceModalProps) => {
  if (!service) return null;

  const handleConfirm = async () => {
    await onConfirm?.();
  };

  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      icon={Trash2}
      title="Delete Service"
      description="This action cannot be undone. The service will be removed from the system."
      confirmLabel="Delete"
      cancelLabel="Cancel"
    >
      <p>
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900">{service.name}</span>?
      </p>
    </ConfirmActionModal>
  );
};
