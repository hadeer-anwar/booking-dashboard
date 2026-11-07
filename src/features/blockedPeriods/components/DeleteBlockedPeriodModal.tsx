'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmActionModal } from '@/src/components/ui/ConfirmActionModal';
import { useDeleteBlockedPeriodMutation } from '../hooks/useBlockedPeriods';
import { getBlockScope } from '../utils/scope';
import type { BlockedPeriod } from '../types/types';

interface DeleteBlockedPeriodModalProps {
  open: boolean;
  clinicId: string;
  blockedPeriod: BlockedPeriod | null;
  onClose: () => void;
  onConfirm?: () => void;
}

export function DeleteBlockedPeriodModal({
  open,
  clinicId,
  blockedPeriod,
  onClose,
  onConfirm,
}: DeleteBlockedPeriodModalProps) {
  const { deleteBlockedPeriod, isPending } = useDeleteBlockedPeriodMutation(clinicId);

  if (!blockedPeriod) return null;

  const handleConfirm = () => {
    deleteBlockedPeriod(blockedPeriod.id, {
      onSuccess: () => {
        onConfirm?.();
        onClose();
      },
      onError: () => {
        onClose();
      },
    });
  };

  const scope = getBlockScope(blockedPeriod);
  const scopeLabel =
    scope === 'provider'
      ? 'this provider block'
      : scope === 'service'
      ? 'this service block'
      : 'this clinic-wide block';

  return (
    <ConfirmActionModal
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      icon={Trash2}
      title="Delete Blocked Period"
      description="This action cannot be undone. The blocked period will be removed and the time will become bookable again."
      confirmLabel="Delete"
      confirmingLabel="Deleting…"
      cancelLabel="Cancel"
      isSubmitting={isPending}
    >
      <p>
        Are you sure you want to delete {scopeLabel} on{' '}
        <span className="font-semibold text-gray-900">{blockedPeriod.date}</span>
        {blockedPeriod.allDay ? ' (all day)' : ` (${blockedPeriod.start}–${blockedPeriod.end})`}?
      </p>
    </ConfirmActionModal>
  );
}
