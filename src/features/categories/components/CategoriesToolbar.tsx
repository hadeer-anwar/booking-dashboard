'use client';

import { Search, Filter, Plus } from 'lucide-react';

interface CategoriesToolbarProps {
  onAddCategory?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export const CategoriesToolbar = ({
  onAddCategory,
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search categories...',
}: CategoriesToolbarProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Categories management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search, filter, and manage the category catalog used across your clinics.
          </p>
        </div>
        {onAddCategory && (
          <button
            type="button"
            onClick={onAddCategory}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center w-full rounded-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-500 shadow-sm focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-900/5 transition-colors">
            <Search className="w-4 h-4 mr-2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent outline-none placeholder:text-gray-400 text-sm text-gray-900"
            />
          </div>
        </div>

        <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
};

