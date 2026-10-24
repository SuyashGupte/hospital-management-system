import React from 'react';
import { ToastNotification } from '@carbon/react';
import { useNotification } from '../../hooks/useNotification';

export const NotificationContainer: React.FC = () => {
  const { notifications, dismissNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '3.5rem',
        right: '1.5rem',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '28rem',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {notifications.map((n) => (
        <div key={n.id} style={{ pointerEvents: 'auto', width: '100%' }}>
          <ToastNotification
            kind={n.kind}
            title={n.title}
            subtitle={n.subtitle}
            caption={n.caption}
            timeout={0}
            onClose={() => dismissNotification(n.id)}
            onCloseButtonClick={() => dismissNotification(n.id)}
            style={{ width: '100%' }}
          />
        </div>
      ))}
    </div>
  );
};
