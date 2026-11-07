'use client';

import { UserPlus } from 'lucide-react';

interface AssignProviderButtonProps {
  onClick: (e: React.MouseEvent) => void;
  variant?: 'inline' | 'empty-state';
}

/**
 * Reusable "Assign Provider" button with two display variants:
 * - `inline`      → compact pill used inside the expanded providers panel header
 * - `empty-state` → full-width ghost button used when no providers are assigned
 */
export function AssignProviderButton({
  onClick,
  variant = 'inline',
}: AssignProviderButtonProps) {
  if (variant === 'empty-state') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className="
          inline-flex items-center gap-2
          rounded-lg border border-dashed border-gray-300
          bg-white px-4 py-2
          text-sm font-medium text-gray-600
          transition-all
          hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900
          active:scale-[0.98]
        "
      >
        <UserPlus className="h-3.5 w-3.5" />
        Assign a provider
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="
        inline-flex items-center gap-1.5
        rounded-lg border border-gray-200 bg-white
        px-3 py-1.5
        text-xs font-medium text-gray-700
        shadow-sm
        transition-all
        hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:shadow
        active:scale-[0.97]
      "
    >
      <UserPlus className="h-3 w-3" />
      Assign Provider
    </button>
  );
}