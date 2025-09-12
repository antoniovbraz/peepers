import { useState, useEffect } from 'react';

interface ImageLoaderState {
  isLoaded: boolean;
  hasError: boolean;
  isLoading: boolean;
}

interface UseImageLoaderReturn extends ImageLoaderState {
  handleLoad: () => void;
  handleError: () => void;
  reset: () => void;
}

/**
 * Custom hook for managing image loading state with robust error handling
 * Follows SOLID principles by having a single responsibility
 */
export function useImageLoader(src: string): UseImageLoaderReturn {
  const [state, setState] = useState<ImageLoaderState>({
    isLoaded: false,
    hasError: false,
    isLoading: true,
  });

  // Reset state when src changes
  useEffect(() => {
    setState({
      isLoaded: false,
      hasError: false,
      isLoading: true,
    });

    // Preload image to detect if it exists
    const img = new Image();
    
    img.onload = () => {
      setState({
        isLoaded: true,
        hasError: false,
        isLoading: false,
      });
    };

    img.onerror = () => {
      setState({
        isLoaded: false,
        hasError: true,
        isLoading: false,
      });
    };

    img.src = src;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  const handleLoad = () => {
    setState(prev => ({
      ...prev,
      isLoaded: true,
      hasError: false,
      isLoading: false,
    }));
  };

  const handleError = () => {
    setState(prev => ({
      ...prev,
      isLoaded: false,
      hasError: true,
      isLoading: false,
    }));
  };

  const reset = () => {
    setState({
      isLoaded: false,
      hasError: false,
      isLoading: true,
    });
  };

  return {
    ...state,
    handleLoad,
    handleError,
    reset,
  };
}
