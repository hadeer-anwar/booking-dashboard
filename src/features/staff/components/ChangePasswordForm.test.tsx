import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangePasswordForm } from './ChangePasswordForm';

const changePasswordAsync = vi.fn();

vi.mock('@/src/features/auth/hooks/useChangePassword', () => ({
  useChangePassword: () => ({
    changePasswordAsync,
    isPending: false,
  }),
}));

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  { current, next, confirm }: { current?: string; next?: string; confirm?: string }
) {
  if (current !== undefined) await user.type(screen.getByLabelText('Current password'), current);
  if (next !== undefined) await user.type(screen.getByLabelText('New password'), next);
  if (confirm !== undefined) await user.type(screen.getByLabelText('Confirm new password'), confirm);
  await user.click(screen.getByRole('button', { name: /update password/i }));
}

describe('ChangePasswordForm', () => {
  it('requires all three fields before submitting', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(await screen.findByText('Current password is required')).toBeInTheDocument();
    expect(screen.getByText('New password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
    expect(changePasswordAsync).not.toHaveBeenCalled();
  });

  it('rejects a new password shorter than 8 characters', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await fillAndSubmit(user, { current: 'oldpass1', next: 'short', confirm: 'short' });

    expect(await screen.findByText('New password must be at least 8 characters')).toBeInTheDocument();
    expect(changePasswordAsync).not.toHaveBeenCalled();
  });

  it('rejects a new password identical to the current password (client-side mirror of the backend guard)', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await fillAndSubmit(user, { current: 'samepass1', next: 'samepass1', confirm: 'samepass1' });

    expect(
      await screen.findByText('New password must be different from the current password')
    ).toBeInTheDocument();
    expect(changePasswordAsync).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match the new password', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await fillAndSubmit(user, { current: 'oldpass1', next: 'newpass1', confirm: 'newpass2' });

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(changePasswordAsync).not.toHaveBeenCalled();
  });

  it('submits currentPassword, newPassword, and confirmPassword — the backend requires all three', async () => {
    const user = userEvent.setup();
    changePasswordAsync.mockResolvedValueOnce(undefined);
    render(<ChangePasswordForm />);

    await fillAndSubmit(user, { current: 'oldpass1', next: 'newpass1', confirm: 'newpass1' });

    expect(changePasswordAsync).toHaveBeenCalledOnce();
    expect(changePasswordAsync).toHaveBeenCalledWith({
      currentPassword: 'oldpass1',
      newPassword: 'newpass1',
      confirmPassword: 'newpass1',
    });
  });

  it('clears every field after a successful change', async () => {
    const user = userEvent.setup();
    changePasswordAsync.mockResolvedValueOnce(undefined);
    render(<ChangePasswordForm />);

    await fillAndSubmit(user, { current: 'oldpass1', next: 'newpass1', confirm: 'newpass1' });

    expect(await screen.findByLabelText('Current password')).toHaveValue('');
    expect(screen.getByLabelText('New password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm new password')).toHaveValue('');
  });

  it('keeps the typed values on a rejected submit (e.g. wrong current password) so the user can just fix one field', async () => {
    const user = userEvent.setup();
    changePasswordAsync.mockRejectedValueOnce(new Error('Current password is incorrect'));
    render(<ChangePasswordForm />);

    await fillAndSubmit(user, { current: 'wrongpass', next: 'newpass1', confirm: 'newpass1' });

    expect(await screen.findByLabelText('New password')).toHaveValue('newpass1');
    expect(screen.getByLabelText('Confirm new password')).toHaveValue('newpass1');
  });
});
