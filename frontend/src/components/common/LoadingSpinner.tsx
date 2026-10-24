import React from 'react';
import { Loading } from '@carbon/react';

interface LoadingSpinnerProps {
  description?: string;
  small?: boolean;
  active?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  description = 'Loading...',
  small = false,
  active = true,
  overlay = false,
}) => {
  if (overlay) {
    return <Loading description={description} withOverlay={true} active={active} small={small} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1rem',
      }}
    >
      <Loading description={description} withOverlay={false} active={active} small={small} />
      {description && <span style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>{description}</span>}
    </div>
  );
};
