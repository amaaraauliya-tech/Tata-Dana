'use client';

// ==============================================================================
// TataDana Theme Provider
// Core Theme: Primary Orange & Pure White (Default Fintech)
// Alternate Theme: Generative UI Baby Pink & Soft Yellow Preset
// ==============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'fintech-orange' | 'baby-pink-yellow';

interface ThemeContextType {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>('fintech-orange');

  useEffect(() => {
    const saved = localStorage.getItem('tatadana_theme') as ThemePreset;
    if (saved === 'fintech-orange' || saved === 'baby-pink-yellow') {
      setThemeState(saved);
      applyThemeClasses(saved);
    } else {
      applyThemeClasses('fintech-orange');
    }
  }, []);

  const applyThemeClasses = (t: ThemePreset) => {
    const root = document.documentElement;
    if (t === 'baby-pink-yellow') {
      root.classList.add('theme-pink-yellow');
      root.style.setProperty('--brand-50', '#FFF1F2');
      root.style.setProperty('--brand-100', '#FFE4E6');
      root.style.setProperty('--brand-200', '#FECDD3');
      root.style.setProperty('--brand-300', '#FDA4AF');
      root.style.setProperty('--brand-400', '#FB7185');
      root.style.setProperty('--brand-500', '#F43F5E'); // Soft Pink Rose
      root.style.setProperty('--brand-600', '#E11D48');
      root.style.setProperty('--brand-700', '#BE123C');
      root.style.setProperty('--brand-800', '#9F1239');
      root.style.setProperty('--brand-900', '#881337');
    } else {
      root.classList.remove('theme-pink-yellow');
      root.style.setProperty('--brand-50', '#FFF7ED');
      root.style.setProperty('--brand-100', '#FFEDD5');
      root.style.setProperty('--brand-200', '#FED7AA');
      root.style.setProperty('--brand-300', '#FDBA74');
      root.style.setProperty('--brand-400', '#FB923C');
      root.style.setProperty('--brand-500', '#F97316'); // Core Fintech Orange
      root.style.setProperty('--brand-600', '#EA580C');
      root.style.setProperty('--brand-700', '#C2410C');
      root.style.setProperty('--brand-800', '#9A3412');
      root.style.setProperty('--brand-900', '#7C2D12');
    }
  };

  const setTheme = (t: ThemePreset) => {
    setThemeState(t);
    localStorage.setItem('tatadana_theme', t);
    applyThemeClasses(t);
  };

  const toggleTheme = () => {
    const next = theme === 'fintech-orange' ? 'baby-pink-yellow' : 'fintech-orange';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
