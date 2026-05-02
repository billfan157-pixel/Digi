import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  skeletonClassName?: string;
  containerClassName?: string;
}

export default function ImageWithSkeleton({
  className,
  skeletonClassName,
  containerClassName,
  alt,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={twMerge('relative overflow-hidden', containerClassName)}>
      {/* Khối nền hiển thị hiệu ứng skeleton khi ảnh chưa load xong */}
      {!isLoaded && (
        <div
          className={twMerge(
            'absolute inset-0 bg-slate-800 animate-pulse',
            skeletonClassName
          )}
        />
      )}
      <img
        {...props}
        alt={alt || ''}
        loading="lazy" // Tự động trì hoãn tải ảnh cho đến khi nó gần vào viewport, giúp tăng tốc độ tải trang
        onLoad={(e) => {
          setIsLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
        onError={(e) => {
          // Ẩn skeleton ngay cả khi ảnh bị lỗi, để lộ ra icon ảnh vỡ của trình duyệt
          setIsLoaded(true);
          if (props.onError) props.onError(e);
        }}
        className={twMerge(
          'transition-opacity duration-300', // Fade in mượt mà khi ảnh load xong
          !isLoaded ? 'opacity-0' : 'opacity-100',
          className
        )}
      />
    </div>
  );
}