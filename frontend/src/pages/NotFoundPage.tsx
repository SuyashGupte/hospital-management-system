import React from 'react';
import { Button, Tile } from '@carbon/react';
import { Home } from '@carbon/icons-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '2rem',
      }}
    >
      <Tile style={{ maxWidth: '500px', textAlign: 'center', padding: '3rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: 0, color: 'var(--cds-interactive)' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '2rem' }}>
          The requested page could not be found or you do not have permission to view it.
        </p>
        <Button renderIcon={Home} as={Link} to={ROUTES.HOME}>
          Return to Dashboard
        </Button>
      </Tile>
    </div>
  );
};
