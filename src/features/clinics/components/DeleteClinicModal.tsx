'use client';

import type { Clinic } from '../types/types';
import { Trash2 } from 'lucide-react';
import { ConfirmActionModal } from '@/src/components/ui/ConfirmActionModal';

interface DeleteClinicModalProps {
  open: boolean;
  clinic: Clinic | null;
  onClose: () => void;
  onConfirm?: () => void;
}

export const DeleteClinicModal = ({
  open,
  clinic,
  onClose,
  onConfirm,
}: DeleteClinicModalProps) => {
  if (!clinic) return null;

  const handleConfirm = () => {
    // TODO: hook to delete-clinic API
    onConfirm?.();
    onClose();
  };

  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      icon={Trash2}
      title="Delete Clinic"
      description="This action cannot be undone. The clinic will be removed from the system."
      confirmLabel="Delete"
      cancelLabel="Cancel"
    >
      <p>
        Are you sure you want to delete{' '}
        <span className="font-semibold text-gray-900">{clinic.name}</span>?
      </p>
    </ConfirmActionModal>
  );
};
