import { useState, useEffect, useCallback } from 'react';

export function useDarkMode() {
  // Načítame preferenciu z localStorage alebo použijeme systémovú preferenciu
  const getInitialTheme = (): boolean => {
    // Skontrolujeme localStorage
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    
    // Ak nie je v localStorage, použijeme systémovú preferenciu
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);

  // Funkcia na prepínanie dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Funkcia na nastavenie konkrétneho režimu
  const setDarkMode = useCallback((dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('darkMode', JSON.stringify(dark));
  }, []);

  // Aplikujeme dark mode na body element
  useEffect(() => {
    const body = document.body;
    if (isDarkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sledujeme zmeny systémových preferencií
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Aktualizujeme len ak používateľ nemá uloženú preferenciu
      if (localStorage.getItem('darkMode') === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode
  };
}
