import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil, Trash2 } from 'lucide-react';
import { KebabMenu, KebabMenuItem } from './KebabMenu';

function renderMenu() {
  return render(
    <div className="group">
      <KebabMenu ariaLabel="Row actions">
        {(close) => (
          <>
            <KebabMenuItem icon={Pencil} onClick={close}>
              Edit
            </KebabMenuItem>
            <KebabMenuItem icon={Trash2} tone="danger" onClick={close}>
              Delete
            </KebabMenuItem>
          </>
        )}
      </KebabMenu>
    </div>
  );
}

/** Stubs the trigger button's own getBoundingClientRect and the viewport size the positioning heuristic reads. */
function mockGeometry(trigger: HTMLElement, rect: Partial<DOMRect>, viewport: { width: number; height: number }) {
  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  });
  vi.stubGlobal('innerWidth', viewport.width);
  vi.stubGlobal('innerHeight', viewport.height);
}

describe('KebabMenu', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is closed by default and opens the menu on trigger click', async () => {
    const user = userEvent.setup();
    renderMenu();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Row actions' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(within(screen.getByRole('menu')).getByText('Edit')).toBeInTheDocument();
    expect(within(screen.getByRole('menu')).getByText('Delete')).toBeInTheDocument();
  });

  it('closes when the trigger is clicked again', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Row actions' });

    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Row actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes when clicking the backdrop outside the menu', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Row actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // The full-screen click-catcher portaled alongside the menu, not the menu panel itself.
    const backdrop = document.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking a menu item closes the menu (via the render-prop close callback)', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Row actions' }));
    await user.click(screen.getByText('Delete'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens downward (top set, bottom unset) when there is plenty of room below the trigger', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Row actions' });

    // Trigger near the top of a tall viewport — lots of room below.
    mockGeometry(trigger, { top: 100, bottom: 132, left: 700, right: 740 }, { width: 1024, height: 800 });

    await user.click(trigger);
    const menu = screen.getByRole('menu');
    expect(menu.style.top).toBe('136px'); // rect.bottom + 4
    expect(menu.style.bottom).toBe('');
  });

  it('flips upward (bottom set, top unset) when the trigger is near the bottom of a short viewport', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Row actions' });

    // Trigger near the bottom of a short viewport — under 220px of room below, but plenty above.
    mockGeometry(trigger, { top: 600, bottom: 632, left: 700, right: 740 }, { width: 1024, height: 650 });

    await user.click(trigger);
    const menu = screen.getByRole('menu');
    expect(menu.style.bottom).toBe('54px'); // innerHeight(650) - rect.top(600) + 4
    expect(menu.style.top).toBe('');
  });
});
