'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import type { PaginationMeta } from '@/src/types';

export type { PaginationMeta };

interface PaginationProps {
  /** Current 1-based page. */
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  isFetching?: boolean;

  alwaysShow?: boolean;
}


export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel = 'item',
  onPageChange,
  isFetching = false,
  alwaysShow = true,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  const plural = total === 1 ? itemLabel : `${itemLabel}s`;

  if (!alwaysShow && total <= pageSize && safeTotalPages <= 1) return null;

  const canPrev = safePage > 1 && !isFetching;
  const canNext = safePage < safeTotalPages && !isFetching;

  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {total === 0 ? (
          <span>No {plural} to show</span>
        ) : (
          <span>
            Showing <span className="font-medium text-gray-700">{from}</span>–
            <span className="font-medium text-gray-700">{to}</span> of{' '}
            <span className="font-medium text-gray-700">{total}</span> {plural}
          </span>
        )}
        {isFetching ? (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => onPageChange(1)}
          disabled={!canPrev}
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(safePage - 1)}
          disabled={!canPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </PageButton>

        <span className="px-2 text-[11px] font-medium text-gray-600 whitespace-nowrap">
          Page <span className="text-gray-900">{safePage}</span> of{' '}
          <span className="text-gray-900">{safeTotalPages}</span>
        </span>

        <PageButton
          onClick={() => onPageChange(safePage + 1)}
          disabled={!canNext}
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(safeTotalPages)}
          disabled={!canNext}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </PageButton>
      </div>
    </div>
  );
}

interface PageButtonProps {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  ['aria-label']: string;
}

function PageButton({ onClick, disabled, children, ...rest }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rest['aria-label']}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600"
    >
      {children}
    </button>
  );
}
