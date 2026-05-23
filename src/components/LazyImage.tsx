import { useState, useRef, useEffect } from 'react';

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: string;
}

export function LazyImage({ src, alt, className, fallback }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            img.src = src;
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(img);

    return () => observer.disconnect();
  }, [src]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setError(true);

  if (!src) return null;
  if (error && fallback) return <img src={fallback} alt={alt} className={className} />;
  if (error) return null;

  return (
    <img
      ref={imgRef}
      alt={alt}
      className={className}
      style={{
        filter: isLoaded ? 'none' : 'blur(8px)',
        transition: 'filter 0.3s ease-in-out',
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
