import { useState, useEffect, useCallback } from 'react';

export function useDarkMode() {
  // Na�TA�tame preferenciu z localStorage alebo pouLlijeme systA�movAs preferenciu
  const getInitialTheme = (): boolean => {
    // Skontrolujeme localStorage
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    
    // Ak nie je v localStorage, pouLlijeme systA�movAs preferenciu
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);

  // Funkcia na prepA�nanie dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Funkcia na nastavenie konkrA�tneho reLlimu
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

  // Sledujeme zmeny systA�movA?ch preferenciA�
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Aktualizujeme len ak pouLlA�vate�l nemA? uloLlenAs preferenciu
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

