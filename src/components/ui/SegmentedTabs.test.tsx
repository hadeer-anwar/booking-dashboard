import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Building2, Scissors, User } from 'lucide-react';
import { SegmentedTabs, type SegmentedTabOption } from './SegmentedTabs';

type Scope = 'clinic' | 'provider' | 'service';

const OPTIONS: SegmentedTabOption<Scope>[] = [
  { value: 'clinic', label: 'Entire clinic', icon: Building2 },
  { value: 'provider', label: 'A provider', icon: User },
  { value: 'service', label: 'A service', icon: Scissors },
];

/** Stateful wrapper — a real consumer re-renders with the new value after onChange, which the keyboard-nav tests below rely on across repeated key presses. */
function ControlledSegmentedTabs({ initial, options = OPTIONS }: { initial: Scope; options?: SegmentedTabOption<Scope>[] }) {
  const [value, setValue] = useState<Scope>(initial);
  return <SegmentedTabs options={options} value={value} onChange={setValue} ariaLabel="What are you blocking" />;
}

describe('SegmentedTabs', () => {
  it('renders every option label and marks only the current value as checked', () => {
    render(<ControlledSegmentedTabs initial="provider" />);
    expect(screen.getByRole('radio', { name: /entire clinic/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /a provider/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /a service/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with the clicked option\'s value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentedTabs options={OPTIONS} value="clinic" onChange={onChange} ariaLabel="scope" />);

    await user.click(screen.getByRole('radio', { name: /a service/i }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('service');
  });

  it('never fires onChange for a disabled option, even on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const options: SegmentedTabOption<Scope>[] = [
      OPTIONS[0],
      { ...OPTIONS[1], disabledReason: 'No providers in this clinic yet' },
      OPTIONS[2],
    ];
    render(<SegmentedTabs options={options} value="clinic" onChange={onChange} ariaLabel="scope" />);

    const providerOption = screen.getByRole('radio', { name: /a provider/i });
    expect(providerOption).toBeDisabled();
    expect(providerOption).toHaveAttribute('title', 'No providers in this clinic yet');

    await user.click(providerOption);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('ArrowRight moves selection to the next option, wrapping from the last back to the first', async () => {
    const user = userEvent.setup();
    render(<ControlledSegmentedTabs initial="service" />);

    // service -> clinic (wrap)
    screen.getByRole('radio', { name: /a service/i }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: /entire clinic/i })).toHaveAttribute('aria-checked', 'true');

    // clinic -> provider
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: /a provider/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('ArrowLeft moves selection to the previous option, wrapping from the first back to the last', async () => {
    const user = userEvent.setup();
    render(<ControlledSegmentedTabs initial="clinic" />);

    screen.getByRole('radio', { name: /entire clinic/i }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: /a service/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('keyboard navigation skips a disabled option entirely, landing on the next enabled one', async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [value, setValue] = useState<Scope>('clinic');
      const options: SegmentedTabOption<Scope>[] = [
        OPTIONS[0],
        { ...OPTIONS[1], disabledReason: 'unavailable' },
        OPTIONS[2],
      ];
      return <SegmentedTabs options={options} value={value} onChange={setValue} ariaLabel="scope" />;
    }
    render(<Wrapper />);

    screen.getByRole('radio', { name: /entire clinic/i }).focus();
    await user.keyboard('{ArrowRight}');

    // Provider is disabled, so ArrowRight from clinic should land on service, not provider.
    expect(screen.getByRole('radio', { name: /a service/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /a provider/i })).toHaveAttribute('aria-checked', 'false');
  });
});
