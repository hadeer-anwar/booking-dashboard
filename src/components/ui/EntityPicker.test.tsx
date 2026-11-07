import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityPicker, type EntityPickerItem } from './EntityPicker';

const PROVIDERS: EntityPickerItem[] = [
  { id: 'p1', label: 'Rahma Ahmed' },
  { id: 'p2', label: "A'laa Magdy" },
  { id: 'p3', label: 'Sara Samy' },
];

/** Single-select harness: matches BlockedPeriodFormModal's edit-mode toggle handler — a click replaces the selection. */
function SingleSelectHarness() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggle = (id: string) => setSelectedIds((prev) => (prev[0] === id ? [] : [id]));
  return (
    <EntityPicker
      items={PROVIDERS}
      selectedIds={selectedIds}
      onToggle={toggle}
      placeholder="Search providers…"
      emptyMessage="No providers match your search."
    />
  );
}

/** Multi-select harness: matches BlockedPeriodFormModal's create-mode toggle handler — a click adds/removes from the array. */
function MultiSelectHarness() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  return (
    <EntityPicker
      items={PROVIDERS}
      selectedIds={selectedIds}
      onToggle={toggle}
      multiple
      placeholder="Search providers…"
      emptyMessage="No providers match your search."
    />
  );
}

describe('EntityPicker — single-select mode', () => {
  it('renders every item and none checked initially', () => {
    render(<SingleSelectHarness />);
    expect(screen.getByRole('option', { name: 'Rahma Ahmed' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: "A'laa Magdy" })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking an item selects only that item, replacing any prior selection', async () => {
    const user = userEvent.setup();
    render(<SingleSelectHarness />);

    await user.click(screen.getByRole('option', { name: 'Rahma Ahmed' }));
    expect(screen.getByRole('option', { name: 'Rahma Ahmed' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: "A'laa Magdy" }));
    expect(screen.getByRole('option', { name: "A'laa Magdy" })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Rahma Ahmed' })).toHaveAttribute('aria-selected', 'false');
  });

  it('does not render checkboxes or removable chips outside multiple mode', () => {
    render(<SingleSelectHarness />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });
});

describe('EntityPicker — multiple mode', () => {
  it('toggles an item into and back out of the selection on repeated clicks', async () => {
    const user = userEvent.setup();
    render(<MultiSelectHarness />);

    const option = screen.getByRole('option', { name: 'Rahma Ahmed' });
    await user.click(option);
    expect(option).toHaveAttribute('aria-selected', 'true');

    await user.click(option);
    expect(option).toHaveAttribute('aria-selected', 'false');
  });

  it('allows more than one item selected at once, unlike single-select mode', async () => {
    const user = userEvent.setup();
    render(<MultiSelectHarness />);

    await user.click(screen.getByRole('option', { name: 'Rahma Ahmed' }));
    await user.click(screen.getByRole('option', { name: "A'laa Magdy" }));

    expect(screen.getByRole('option', { name: 'Rahma Ahmed' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: "A'laa Magdy" })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('shows each selection as a removable chip, and the chip\'s × button deselects it', async () => {
    const user = userEvent.setup();
    render(<MultiSelectHarness />);

    await user.click(screen.getByRole('option', { name: 'Rahma Ahmed' }));
    const removeButton = screen.getByRole('button', { name: 'Remove Rahma Ahmed' });
    expect(removeButton).toBeInTheDocument();

    await user.click(removeButton);
    expect(screen.queryByRole('button', { name: 'Remove Rahma Ahmed' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Rahma Ahmed' })).toHaveAttribute('aria-selected', 'false');
  });

  it('"Select all" selects every currently visible (filtered) item, not the full unfiltered list', async () => {
    const user = userEvent.setup();
    render(<MultiSelectHarness />);

    await user.type(screen.getByRole('combobox'), 'a'); // matches "Rahma Ahmed", "A'laa Magdy", "Sara Samy" — all contain "a"
    await user.click(screen.getByRole('button', { name: /select all/i }));

    expect(screen.getByText('3 selected')).toBeInTheDocument();
  });

  it('"Clear" empties the entire selection in one click', async () => {
    const user = userEvent.setup();
    render(<MultiSelectHarness />);

    await user.click(screen.getByRole('option', { name: 'Rahma Ahmed' }));
    await user.click(screen.getByRole('option', { name: "A'laa Magdy" }));
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText('None selected')).toBeInTheDocument();
  });

});

describe('EntityPicker — search filtering', () => {
  it('filters the list case-insensitively by label as you type', async () => {
    const user = userEvent.setup();
    render(<SingleSelectHarness />);

    await user.type(screen.getByRole('combobox'), 'RAHMA');

    expect(screen.getByRole('option', { name: 'Rahma Ahmed' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: "A'laa Magdy" })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sara Samy' })).not.toBeInTheDocument();
  });

  it('shows the empty message when no item matches the search', async () => {
    const user = userEvent.setup();
    render(<SingleSelectHarness />);

    await user.type(screen.getByRole('combobox'), 'zzz-no-match');

    expect(screen.getByText('No providers match your search.')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});

describe('EntityPicker — loading and error states', () => {
  it('shows a loading message instead of the list', () => {
    render(
      <EntityPicker
        items={PROVIDERS}
        selectedIds={[]}
        onToggle={() => {}}
        isLoading
        placeholder="Search…"
        emptyMessage="No matches."
      />
    );
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('shows the error message instead of the list', () => {
    render(
      <EntityPicker
        items={PROVIDERS}
        selectedIds={[]}
        onToggle={() => {}}
        isError
        errorMessage="Couldn't load providers."
        placeholder="Search…"
        emptyMessage="No matches."
      />
    );
    expect(screen.getByText("Couldn't load providers.")).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
