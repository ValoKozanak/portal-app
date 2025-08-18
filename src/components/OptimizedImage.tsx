import React, { forwardRef } from 'react';
import { useImageOptimization, useProgressiveImage, useBatchImageLoading } from '../hooks/useImageOptimization';

interface OptimizedImageProps {
  src: string;
  lowResSrc?: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  placeholder?: string;
  fallback?: string;
  preload?: boolean;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      lowResSrc,
      alt,
      className = '',
      width,
      height,
      placeholder,
      fallback,
      preload = false,
      threshold = 0.1,
      rootMargin = '50px',
      onLoad,
      onError,
      style,
      ...props
    },
    ref
  ) => {
    // Ak máme low res verziu, použijeme progressive loading
    const progressiveImage = useProgressiveImage(
      lowResSrc || src,
      src,
      { placeholder, fallback }
    );

    // Inak použijeme obyčajný lazy loading
    const lazyImage = useImageOptimization(src, {
      threshold,
      rootMargin,
      placeholder,
      fallback,
      preload
    });

    const imageState = lowResSrc ? progressiveImage : lazyImage;
    const imgRef = lowResSrc ? undefined : lazyImage.ref;

    const handleLoad = () => {
      onLoad?.();
    };

    const handleError = () => {
      onError?.();
    };

    // Type-safe opacity calculation
    const getOpacity = () => {
      if (lowResSrc) {
        return 'isHighResLoaded' in imageState && imageState.isHighResLoaded ? 1 : 0.7;
      } else {
        return 'loaded' in imageState && imageState.loaded ? 1 : 0.7;
      }
    };

    const imageStyle: React.CSSProperties = {
      ...style,
      transition: 'opacity 0.3s ease-in-out',
      opacity: getOpacity()
    };

    return (
      <img
        ref={ref || imgRef}
        src={imageState.src}
        alt={alt}
        className={`optimized-image ${className}`}
        width={width}
        height={height}
        style={imageStyle}
        onLoad={handleLoad}
        onError={handleError}
        loading={preload ? 'eager' : 'lazy'}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// Komponent pre batch loading obrázkov
interface BatchImageProps {
  images: string[];
  renderImage: (src: string, loaded: boolean) => React.ReactNode;
  className?: string;
}

export const BatchImageLoader: React.FC<BatchImageProps> = ({
  images,
  renderImage,
  className = ''
}) => {
  const { loadedImages, loading } = useBatchImageLoading(images);

  return (
    <div className={`batch-image-loader ${className}`}>
      {images.map((src, index) => (
        <div key={`${src}-${index}`}>
          {renderImage(src, loadedImages.has(src))}
        </div>
      ))}
      {loading && (
        <div className="batch-loading-indicator">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

// Komponent pre image gallery s virtualizáciou
interface ImageGalleryProps {
  images: string[];
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  itemHeight = 200,
  containerHeight = 600,
  className = ''
}) => {
  return (
    <div className={`image-gallery ${className}`} style={{ height: containerHeight }}>
      {images.map((src, index) => (
        <OptimizedImage
          key={`${src}-${index}`}
          src={src}
          alt={`Gallery image ${index + 1}`}
          height={itemHeight}
          className="gallery-image"
          style={{ objectFit: 'cover' }}
        />
      ))}
    </div>
  );
};
