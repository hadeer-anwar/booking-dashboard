'use client';

import { Briefcase, Plus } from 'lucide-react';
import { EmptyState } from '@/src/components/ui/EmptyState';

interface ServicesEmptyStateProps {
  onAddService: () => void;
}


export function ServicesEmptyState({ onAddService }: ServicesEmptyStateProps) {
  return (
    <EmptyState
      icon={Briefcase}
      title="No services yet"
      description="Get started by adding the first service for this clinic."
      variant="subtle"
      action={{ label: 'Add Your First Service', icon: Plus, onClick: onAddService }}
    />
  );
}
