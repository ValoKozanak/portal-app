import { useState, useEffect, useRef, useCallback } from 'react';

interface ImageState {
  src: string;
  loaded: boolean;
  error: boolean;
  inView: boolean;
}

interface UseImageOptimizationOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
  fallback?: string;
  preload?: boolean;
}

export const useImageOptimization = (
  src: string,
  options: UseImageOptimizationOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YWFhYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
    fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmVlMmUyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2QzMGEwYSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
    preload = false
  } = options;

  const [state, setState] = useState<ImageState>({
    src: placeholder,
    loaded: false,
    error: false,
    inView: false
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadImage = useCallback(async (imageSrc: string) => {
    if (!imageSrc || imageSrc === placeholder || imageSrc === fallback) {
      return;
    }

    try {
      setState(prev => ({ ...prev, loaded: false, error: false }));

      // Preload image
      const img = new Image();
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
      });

      img.src = imageSrc;

      await loadPromise;

      setState(prev => ({
        ...prev,
        src: imageSrc,
        loaded: true,
        error: false
      }));

    } catch (error) {
      console.error('Image load error:', error);
      setState(prev => ({
        ...prev,
        src: fallback,
        loaded: false,
        error: true
      }));
    }
  }, [placeholder, fallback]);

  // Intersection Observer pre lazy loading
  useEffect(() => {
    if (!imgRef.current || preload) {
      loadImage(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setState(prev => ({ ...prev, inView: true }));
            loadImage(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, threshold, rootMargin, preload, loadImage]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    ref: imgRef,
    reload: () => loadImage(src)
  };
};

// Hook pre batch image loading
export const useBatchImageLoading = (images: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadBatch = useCallback(async (imageUrls: string[]) => {
    setLoading(true);
    
    const loadPromises = imageUrls.map(url => {
      return new Promise<{ url: string; success: boolean }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ url, success: true });
        img.onerror = () => resolve({ url, success: false });
        img.src = url;
      });
    });

    const results = await Promise.all(loadPromises);
    
    const successfulUrls = results
      .filter(result => result.success)
      .map(result => result.url);

    setLoadedImages(new Set(successfulUrls));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      loadBatch(images);
    }
  }, [images, loadBatch]);

  return {
    loadedImages,
    loading,
    loadBatch
  };
};

// Hook pre progressive image loading
export const useProgressiveImage = (
  lowResSrc: string,
  highResSrc: string,
  options: UseImageOptimizationOptions = {}
) => {
  const [currentSrc, setCurrentSrc] = useState(lowResSrc);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);

  const { placeholder, fallback } = options;

  useEffect(() => {
    // Load low res first
    const lowResImg = new Image();
    lowResImg.onload = () => {
      setCurrentSrc(lowResSrc);
      
      // Then load high res
      const highResImg = new Image();
      highResImg.onload = () => {
        setCurrentSrc(highResSrc);
        setIsHighResLoaded(true);
      };
      highResImg.onerror = () => {
        console.warn('High res image failed to load');
      };
      highResImg.src = highResSrc;
    };
    lowResImg.onerror = () => {
      setCurrentSrc(fallback || placeholder || '');
    };
    lowResImg.src = lowResSrc;
  }, [lowResSrc, highResSrc, placeholder, fallback]);

  return {
    src: currentSrc,
    isHighResLoaded,
    isLowResLoaded: currentSrc === lowResSrc
  };
};
