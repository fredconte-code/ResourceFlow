import { useState, useEffect, useCallback } from 'react';

interface ComponentStateOptions {
  resetOnUnmount?: boolean;
  persistInSession?: boolean;
  sessionKey?: string;
  debounceMs?: number;
}

export const useComponentState = <T>(
  initialState: T,
  options: ComponentStateOptions = {}
) => {
  const { 
    resetOnUnmount = true, 
    persistInSession = false, 
    sessionKey,
    debounceMs 
  } = options;

  const [state, setState] = useState<T>(() => {
    if (persistInSession && sessionKey) {
      try {
        const stored = sessionStorage.getItem(sessionKey);
        return stored ? JSON.parse(stored) : initialState;
      } catch (error) {
        console.error('Error loading state from session storage:', error);
        return initialState;
      }
    }
    return initialState;
  });

  // Reset state on unmount
  useEffect(() => {
    if (resetOnUnmount) {
      return () => {
        setState(initialState);
      };
    }
  }, [resetOnUnmount, initialState]);

  // Persist state in session storage
  useEffect(() => {
    if (persistInSession && sessionKey) {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(state));
      } catch (error) {
        console.error('Error saving state to session storage:', error);
      }
    }
  }, [state, persistInSession, sessionKey]);

  // Debounced state setter
  const setStateDebounced = useCallback((newState: T | ((prev: T) => T)) => {
    if (debounceMs) {
      const timeoutId = setTimeout(() => {
        setState(newState);
      }, debounceMs);
      
      return () => clearTimeout(timeoutId);
    } else {
      setState(newState);
    }
  }, [debounceMs]);

  // Reset state to initial value
  const resetState = useCallback(() => {
    setState(initialState);
  }, [initialState]);

  // Clear state (set to empty object/array based on type)
  const clearState = useCallback(() => {
    if (Array.isArray(initialState)) {
      setState([] as T);
    } else if (typeof initialState === 'object' && initialState !== null) {
      setState({} as T);
    } else {
      setState(initialState);
    }
  }, [initialState]);

  return {
    state,
    setState: debounceMs ? setStateDebounced : setState,
    resetState,
    clearState,
    isInitial: JSON.stringify(state) === JSON.stringify(initialState)
  };
}; 