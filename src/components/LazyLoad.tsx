import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyLoadProps {
  children: ReactNode;
  placeholder?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isVisible) {
      // Simuluj loading time pre lepší UX
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const defaultPlaceholder = (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="md" text="Načítavam..." />
    </div>
  );

  return (
    <div ref={ref} className={className}>
      {isLoaded ? children : (placeholder || defaultPlaceholder)}
    </div>
  );
};

export default React.memo(LazyLoad);








