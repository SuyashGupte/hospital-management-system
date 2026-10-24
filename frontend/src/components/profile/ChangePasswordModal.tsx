import React, { useState } from 'react';
import {
  Modal,
  Form,
  PasswordInput,
  InlineNotification,
  Stack,
} from '@carbon/react';
import { authService } from '../../services/authService';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { notifySuccess } = useNotification();

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setError('New password must be at least 3 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      notifySuccess('Password Changed', 'Your account credentials have been updated successfully.');
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      modalHeading="Change Account Password"
      primaryButtonText={loading ? 'Updating...' : 'Change Password'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={loading}
      onRequestSubmit={handleSubmit}
      onRequestClose={handleClose}
      size="sm"
    >
      <div style={{ padding: '0.5rem 0' }}>
        {error && (
          <InlineNotification
            kind="error"
            title="Update Failed"
            subtitle={error}
            style={{ marginBottom: '1.25rem' }}
          />
        )}

        <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <Stack gap={5}>
            <PasswordInput
              id="currentPassword"
              labelText="Current Password *"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <PasswordInput
              id="newPassword"
              labelText="New Password *"
              placeholder="Must be at least 3 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <PasswordInput
              id="confirmPassword"
              labelText="Confirm New Password *"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Stack>
        </Form>
      </div>
    </Modal>
  );
};
