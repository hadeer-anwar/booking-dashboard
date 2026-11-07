'use client';

import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';

export interface EntityPickerItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface EntityPickerProps {
  items: EntityPickerItem[];
  /** Always an array — a single-select picker just keeps this at length 0 or 1. */
  selectedIds: string[];
  /** Fires with the id that was clicked; the caller decides replace (single) vs toggle (multiple). */
  onToggle: (id: string) => void;
  placeholder: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage: string;
  autoFocus?: boolean;
  /** Enables checkboxes, a selected-count header with Select all/Clear, and removable chips for what's picked. */
  multiple?: boolean;
}

/**
 * Searchable select list — the "pick a provider" / "pick a service" step.
 * Replaces a plain `<select>`: clinics with dozens of providers or services
 * make a native dropdown slow to scan, and this is filterable client-side
 * against the (already-fetched) list passed in.
 *
 * In `multiple` mode, what's already picked surfaces as removable chips
 * above the search box — scanning "who's currently selected" shouldn't
 * require re-scrolling a filtered list to find the checked rows.
 */
export function EntityPicker({
  items,
  selectedIds,
  onToggle,
  placeholder,
  isLoading,
  isError,
  errorMessage,
  emptyMessage,
  autoFocus,
  multiple = false,
}: EntityPickerProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.sublabel?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) onToggle(item.id);
    } else if (e.key === 'Escape') {
      if (query) {
        e.stopPropagation();
        setQuery('');
      }
    }
  };

  return (
    <div>
      {multiple && selectedIds.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const item = itemsById.get(id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-tan-700 py-1 pl-2.5 pr-1.5 text-xs font-medium text-white"
              >
                {item?.label ?? id}
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  aria-label={`Remove ${item?.label ?? 'selection'}`}
                  className="rounded-full p-0.5 hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="entity-picker-listbox"
          aria-activedescendant={filtered[activeIndex] ? `entity-option-${filtered[activeIndex].id}` : undefined}
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {multiple && filtered.length > 0 && !isLoading && !isError && (
        <div className="mt-1.5 flex items-center justify-between px-0.5 text-xs text-gray-500">
          <span>{selectedIds.length > 0 ? `${selectedIds.length} selected` : 'None selected'}</span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => filtered.forEach((item) => !selectedSet.has(item.id) && onToggle(item.id))}
              className="font-medium text-gray-700 hover:text-gray-900"
            >
              Select all{query ? ' matching' : ''}
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => selectedIds.forEach((id) => onToggle(id))}
                className="font-medium text-gray-700 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </span>
        </div>
      )}

      <div
        id="entity-picker-listbox"
        role="listbox"
        aria-multiselectable={multiple}
        className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200"
      >
        {isLoading ? (
          <div className="px-3 py-6 text-center text-sm text-gray-400">Loading…</div>
        ) : isError ? (
          <div className="px-3 py-6 text-center text-sm text-amber-600">
            {errorMessage ?? 'Failed to load. Try again.'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-gray-400">{emptyMessage}</div>
        ) : (
          filtered.map((item, index) => {
            const selected = selectedSet.has(item.id);
            return (
              <button
                key={item.id}
                id={`entity-option-${item.id}`}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onToggle(item.id)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  multiple
                    ? index === activeIndex
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                    : selected
                    ? 'bg-tan-700 text-white'
                    : index === activeIndex
                    ? 'bg-gray-50 text-gray-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {multiple && (
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected ? 'border-tan-700 bg-tan-700' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </span>
                )}
                <span className={`min-w-0 flex-1 truncate ${multiple ? 'text-gray-700' : ''}`}>
                  {item.label}
                  {item.sublabel && (
                    <span className={`ml-1.5 text-xs ${!multiple && selected ? 'text-white/70' : 'text-gray-400'}`}>
                      {item.sublabel}
                    </span>
                  )}
                </span>
                {!multiple && selected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
