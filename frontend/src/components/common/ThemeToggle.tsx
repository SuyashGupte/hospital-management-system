import React from 'react';
import { HeaderGlobalAction } from '@carbon/react';
import { Asleep, Light, BrightnessContrast } from '@carbon/icons-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme();

  let Icon = BrightnessContrast;
  let label = 'Theme: System (click to switch to Light)';

  if (mode === 'light') {
    Icon = Light;
    label = 'Theme: Light (click to switch to Dark)';
  } else if (mode === 'dark') {
    Icon = Asleep;
    label = 'Theme: Dark (click to switch to System)';
  }

  return (
    <HeaderGlobalAction aria-label={label} tooltipAlignment="end" onClick={toggleTheme}>
      <Icon size={20} />
    </HeaderGlobalAction>
  );
};
