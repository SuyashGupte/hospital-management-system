import React from 'react';
import { Tile } from '@carbon/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  badge,
  onClick,
  style,
}) => {
  return (
    <Tile
      style={{
        padding: '1.25rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', fontWeight: 500 }}>
            {title}
          </span>
          {icon && <div style={{ color: 'var(--cds-interactive)' }}>{icon}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
            {value}
          </span>
          {badge}
        </div>
      </div>
      {subtitle && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
          {subtitle}
        </div>
      )}
    </Tile>
  );
};
