import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  text,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-blue-600 dark:border-blue-400',
    white: 'border-white',
    gray: 'border-gray-600 dark:border-gray-400'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]}
          border-2 border-t-transparent rounded-full animate-spin
          ${colorClasses[color]}
        `}
      />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

