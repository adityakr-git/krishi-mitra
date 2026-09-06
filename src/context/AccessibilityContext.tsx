import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (value: boolean | ((prev: boolean) => boolean)) => void;
  largeFont: boolean;
  setLargeFont: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleHighContrast: () => void;
  toggleLargeFont: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('highContrast') === 'true';
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

  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleLargeFont = () => setLargeFont((prev) => !prev);

  useEffect(() => {
    const root = document.documentElement; // Targets the <html> element
    
    if (highContrast) {
      root.classList.add('high-contrast-mode');
      root.classList.add('high-contrast');
      try {
        localStorage.setItem('highContrast', 'true');
      } catch {}
    } else {
      root.classList.remove('high-contrast-mode');
      root.classList.remove('high-contrast');
      try {
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
  }, [highContrast, largeFont]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        largeFont,
        setLargeFont,
        toggleHighContrast,
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
