import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Theme as CarbonThemeProvider } from '@carbon/react';
import { STORAGE_KEYS } from '../utils/constants';

export type PaletteMode = 'system' | 'light' | 'dark';
export type CarbonTheme = 'white' | 'g10' | 'g90' | 'g100';

interface ThemeContextType {
  mode: PaletteMode;
  carbonTheme: CarbonTheme;
  setMode: (mode: PaletteMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as PaletteMode | null;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to system color scheme changes
  useEffect(() => {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const setMode = (newMode: PaletteMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
  };

  const carbonTheme: CarbonTheme = useMemo(() => {
    if (mode === 'light') return 'white';
    if (mode === 'dark') return 'g100';
    return systemIsDark ? 'g100' : 'white';
  }, [mode, systemIsDark]);

  // Sync data attribute with document element for CSS variables & Carbon theming
  useEffect(() => {
    document.documentElement.setAttribute('data-carbon-theme', carbonTheme);
    document.documentElement.className = `cds--theme-${carbonTheme} cds--${carbonTheme}`;
  }, [carbonTheme]);

  const toggleTheme = () => {
    if (mode === 'system') {
      setMode('light');
    } else if (mode === 'light') {
      setMode('dark');
    } else {
      setMode('system');
    }
  };

  const value = useMemo(
    () => ({
      mode,
      carbonTheme,
      setMode,
      toggleTheme,
    }),
    [mode, carbonTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <CarbonThemeProvider theme={carbonTheme}>
        <div className={`theme-${carbonTheme}`} style={{ minHeight: '100vh', width: '100%' }}>
          {children}
        </div>
      </CarbonThemeProvider>
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
