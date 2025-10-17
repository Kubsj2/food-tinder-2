import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { dark, light, type ThemeColors } from './tokens';

type Mode = 'light' | 'dark' | 'system';

type ThemeCtx = {
  colors: ThemeColors;
  mode: Mode;
  setMode: (m: Mode) => void;
};

const ThemeContext = createContext<ThemeCtx>({
  colors: dark,
  mode: 'dark',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('dark');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark'>(Appearance.getColorScheme() ?? 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme as 'light' | 'dark') ?? 'light');
    });
    return () => sub.remove();
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = useMemo(() => (isDark ? dark : light), [isDark]);

  const value = useMemo(() => ({ colors, mode, setMode }), [colors, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
