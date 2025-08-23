import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

interface DarkModeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        ${sizeClasses[size]}
        rounded-lg
        flex items-center justify-center
        transition-all duration-200 ease-in-out
        hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-offset-2
        bg-gray-100 hover:bg-gray-200
        dark:bg-dark-700 dark:hover:bg-dark-600
        text-gray-600 dark:text-gray-300
        ${className}
      `}
      aria-label={isDarkMode ? 'Prepni na svetlý režim' : 'Prepni na tmavý režim'}
      title={isDarkMode ? 'Prepni na svetlý režim' : 'Prepni na tmavý režim'}
    >
      {isDarkMode ? (
        <SunIcon className={`${iconSizes[size]} text-yellow-500`} />
      ) : (
        <MoonIcon className={`${iconSizes[size]} text-gray-600`} />
      )}
    </button>
  );
};

export default DarkModeToggle;
