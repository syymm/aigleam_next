'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const themeColors = {
  light: {
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
      chat: '#e0e0e0',
    },
    text: {
      primary: '#000000',
      secondary: '#757575',
    },
  },
  dark: {
    background: {
      default: '#202020',
      paper: '#101010',
      chat: '#303030',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
};

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  theme: ReturnType<typeof createTheme>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    document.body.classList.toggle('dark-theme', themeMode === 'dark');
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          ...themeColors[themeMode],
        },
      }),
    [themeMode]
  );

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, theme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};