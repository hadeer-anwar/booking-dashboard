'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a value that only updates after `delay` ms have passed without it
 * changing. Use to debounce expensive work derived from rapidly-changing
 * inputs (typed search, sliders, etc.) so we send one network request after
 * the user stops typing instead of one per keystroke.
 *
 * Example:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebouncedValue(search, 350);
 *   const { data } = useQuery({
 *     queryKey: ['things', debouncedSearch],
 *     queryFn: () => api.list({ search: debouncedSearch }),
 *   });
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
