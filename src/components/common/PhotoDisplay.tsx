'use client';

import React, { useState, useEffect } from 'react';
import { getPhotoSignedUrl } from '@/lib/supabase';
import { User, Package } from 'lucide-react';

interface PhotoDisplayProps {
  photoPath?: string | null;
  alt: string;
  className?: string;
  type?: 'visitor' | 'parcel';
  fallbackInitials?: string;
}

export const PhotoDisplay: React.FC<PhotoDisplayProps> = ({
  photoPath,
  alt,
  className = 'w-full h-full object-cover',
  type = 'visitor',
  fallbackInitials
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    photoPath && (photoPath.startsWith('http') || photoPath.startsWith('data:')) ? photoPath : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(photoPath && !resolvedUrl));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!photoPath) {
      setResolvedUrl(null);
      setIsLoading(false);
      return;
    }

    if (photoPath.startsWith('http') || photoPath.startsWith('data:')) {
      setResolvedUrl(photoPath);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    getPhotoSignedUrl(photoPath)
      .then((url) => {
        if (isMounted) {
          if (url) {
            setResolvedUrl(url);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [photoPath]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center">
        <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!resolvedUrl || hasError) {
    if (fallbackInitials) {
      return (
        <div className="w-full h-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm">
          {fallbackInitials}
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-slate-100 text-slate-400 flex items-center justify-center">
        {type === 'parcel' ? <Package className="w-6 h-6" /> : <User className="w-6 h-6" />}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
