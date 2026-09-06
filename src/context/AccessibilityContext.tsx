import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export interface AccessibilityContextType {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleDarkMode: () => void;
  highContrast: boolean;
  setHighContrast: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleHighContrast: () => void;
  largeFont: boolean;
  setLargeFont: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleLargeFont: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('darkMode') === 'true' || localStorage.getItem('highContrast') === 'true';
    } catch {
      return false;
    }
  });

  const [largeFont, setLargeFont] = useState<boolean>(() => {
    try {
      return localStorage.getItem('largeFont') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const toggleLargeFont = () => setLargeFont((prev) => !prev);

  useEffect(() => {
    const root = document.documentElement; // Targets the <html> element
    
    if (isDarkMode) {
      root.classList.add('dark-mode');
      root.classList.add('dark');
      try {
        localStorage.setItem('darkMode', 'true');
        localStorage.setItem('highContrast', 'true');
      } catch {}
    } else {
      root.classList.remove('dark-mode');
      root.classList.remove('dark');
      try {
        localStorage.setItem('darkMode', 'false');
        localStorage.setItem('highContrast', 'false');
      } catch {}
    }

    if (largeFont) {
      root.classList.add('large-font-mode');
      root.classList.add('large-text');
      try {
        localStorage.setItem('largeFont', 'true');
      } catch {}
    } else {
      root.classList.remove('large-font-mode');
      root.classList.remove('large-text');
      try {
        localStorage.setItem('largeFont', 'false');
      } catch {}
    }
  }, [isDarkMode, largeFont]);

  return (
    <AccessibilityContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        highContrast: isDarkMode,
        setHighContrast: setIsDarkMode,
        toggleHighContrast: toggleDarkMode,
        largeFont,
        setLargeFont,
        toggleLargeFont
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
