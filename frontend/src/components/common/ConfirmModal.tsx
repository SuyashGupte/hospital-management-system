import React from 'react';
import { Modal } from '@carbon/react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  modalHeading?: string;
  danger?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  children: React.ReactNode;
  onConfirm: () => void;
  onRequestClose: () => void;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  modalHeading,
  danger = true,
  primaryButtonText = 'Confirm',
  secondaryButtonText = 'Cancel',
  children,
  onConfirm,
  onRequestClose,
  loading = false,
}) => {
  return (
    <Modal
      open={open}
      modalHeading={modalHeading || title}
      primaryButtonText={loading ? 'Processing...' : primaryButtonText}
      secondaryButtonText={secondaryButtonText}
      danger={danger}
      primaryButtonDisabled={loading}
      onRequestSubmit={onConfirm}
      onRequestClose={onRequestClose}
      size="sm"
    >
      <div style={{ padding: '0.5rem 0' }}>
        {children}
      </div>
    </Modal>
  );
};
