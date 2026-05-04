import { createContext, PropsWithChildren, useContext } from 'react';

import { AppColorScheme, AppColors } from './theme';

type ThemeContextValue = {
  colors: AppColors;
  scheme: AppColorScheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, value }: PropsWithChildren<{ value: ThemeContextValue }>) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }

  return context;
}
