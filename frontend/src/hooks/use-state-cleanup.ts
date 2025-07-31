import { useRef, useCallback, useEffect } from 'react';

export const useStateCleanup = () => {
  const cleanupRef = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRef.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    cleanupRef.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    cleanupRef.current = [];
  }, []);

  const removeCleanup = useCallback((cleanup: () => void) => {
    const index = cleanupRef.current.indexOf(cleanup);
    if (index > -1) {
      cleanupRef.current.splice(index, 1);
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { 
    addCleanup, 
    removeCleanup, 
    cleanup,
    cleanupCount: cleanupRef.current.length 
  };
}; 