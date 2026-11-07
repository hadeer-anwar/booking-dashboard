'use client';

import { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  /** When set, the option is disabled and this text is shown as a native tooltip. */
  disabledReason?: string;
}

interface SegmentedTabsProps<T extends string> {
  options: SegmentedTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /**
   * Default: each pill grows to share the row equally (looks intentional
   * for a small, fixed set like blocked periods' 3-way scope picker). Pass
   * `true` for a wider option set (5+, e.g. settings' section tabs) — pills
   * shrink to their own label width instead of a shared equal-width
   * minimum, so more of them fit on one line before wrapping.
   */
  fitContent?: boolean;
}

/**
 * A `role="radiogroup"` pill selector — picks one of N sections/scopes and
 * shows only that section's fields below it, instead of a long page of every
 * section stacked at once. Originally built for blocked periods' "what are
 * you blocking" scope picker; promoted here so any feature with the same
 * "choose one, see just that" need (e.g. clinic settings' section picker)
 * can reuse it instead of re-implementing the same radiogroup/keyboard-nav
 * logic. `flex-wrap` (not a fixed grid) so it works whether there are 3
 * options or 5+ — extra options simply wrap to a second row if they still
 * don't fit even with `fitContent`.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  fitContent = false,
}: SegmentedTabsProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusAndSelect = (fromIndex: number, direction: 1 | -1) => {
    const count = options.length;
    let next = fromIndex;
    for (let i = 0; i < count; i++) {
      next = (next + direction + count) % count;
      if (!options[next].disabledReason) break;
    }
    onChange(options[next].value);
    buttonRefs.current[next]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusAndSelect(index, 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusAndSelect(index, -1);
    }
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={Boolean(option.disabledReason)}
            title={option.disabledReason}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`flex flex-row items-center justify-center gap-1.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-40 ${
              fitContent ? 'flex-none px-2.5 py-2' : 'flex-1 basis-[110px] px-3 py-2.5'
            } ${
              isSelected
                ? 'border-brand-400 bg-brand-400 text-gray-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap text-xs font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
