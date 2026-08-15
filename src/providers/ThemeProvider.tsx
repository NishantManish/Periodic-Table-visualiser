import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme, highContrast, reducedMotion, fontSizeScale } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;

    // Handle Theme class
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // High Contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced Motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Font Scale
    root.setAttribute('data-font-scale', fontSizeScale);
  }, [theme, highContrast, reducedMotion, fontSizeScale]);

  return <>{children}</>;
};
