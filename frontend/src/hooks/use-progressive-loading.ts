import { useState, useEffect, useCallback } from 'react';

interface ProgressiveLoadingOptions {
  criticalData?: () => Promise<any>;
  secondaryData?: () => Promise<any>;
  onCriticalLoaded?: (data: any) => void;
  onSecondaryLoaded?: (data: any) => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

interface LoadingState {
  criticalLoading: boolean;
  secondaryLoading: boolean;
  error: string | null;
  retryCount: number;
}

export const useProgressiveLoading = (options: ProgressiveLoadingOptions) => {
  const [state, setState] = useState<LoadingState>({
    criticalLoading: false,
    secondaryLoading: false,
    error: null,
    retryCount: 0
  });

  const retryAttempts = options.retryAttempts || 3;
  const retryDelay = options.retryDelay || 1000;

  const loadCriticalData = useCallback(async () => {
    if (!options.criticalData) return;

    try {
      setState(prev => ({ ...prev, criticalLoading: true, error: null }));
      const criticalData = await options.criticalData();
      options.onCriticalLoaded?.(criticalData);
      setState(prev => ({ ...prev, criticalLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load critical data';
      setState(prev => ({ 
        ...prev, 
        criticalLoading: false, 
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [options]);

  const loadSecondaryData = useCallback(async () => {
    if (!options.secondaryData) return;

    try {
      setState(prev => ({ ...prev, secondaryLoading: true }));
      const secondaryData = await options.secondaryData();
      options.onSecondaryLoaded?.(secondaryData);
      setState(prev => ({ ...prev, secondaryLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load secondary data';
      setState(prev => ({ 
        ...prev, 
        secondaryLoading: false, 
        error: errorMessage 
      }));
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [options]);

  const retry = useCallback(async () => {
    if (state.retryCount >= retryAttempts) {
      setState(prev => ({ ...prev, error: 'Max retry attempts reached' }));
      return;
    }

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, state.retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    await loadCriticalData();
  }, [state.retryCount, retryAttempts, retryDelay, loadCriticalData]);

  const reset = useCallback(() => {
    setState({
      criticalLoading: false,
      secondaryLoading: false,
      error: null,
      retryCount: 0
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Load critical data first
      await loadCriticalData();
      
      // Load secondary data after critical data is loaded
      if (!state.error && !state.criticalLoading) {
        await loadSecondaryData();
      }
    };

    loadData();
  }, []);

  return {
    // Loading states
    criticalLoading: state.criticalLoading,
    secondaryLoading: state.secondaryLoading,
    isLoading: state.criticalLoading || state.secondaryLoading,
    
    // Error handling
    error: state.error,
    retryCount: state.retryCount,
    canRetry: state.retryCount < retryAttempts,
    
    // Actions
    retry,
    reset,
    
    // Convenience getters
    hasError: !!state.error,
    isFullyLoaded: !state.criticalLoading && !state.secondaryLoading && !state.error
  };
};

// Specialized hooks for common loading patterns
export const useTeamDataLoading = () => {
  return useProgressiveLoading({
    criticalData: async () => {
      const [members, projects] = await Promise.all([
        import('@/lib/api').then(m => m.teamMembersApi.getAll()),
        import('@/lib/api').then(m => m.projectsApi.getAll())
      ]);
      return { members, projects };
    },
    secondaryData: async () => {
      const [allocations, holidays, vacations] = await Promise.all([
        import('@/lib/api').then(m => m.projectAllocationsApi.getAll()),
        import('@/lib/api').then(m => m.holidaysApi.getAll()),
        import('@/lib/api').then(m => m.vacationsApi.getAll())
      ]);
      return { allocations, holidays, vacations };
    }
  });
};

export const useDashboardDataLoading = () => {
  return useProgressiveLoading({
    criticalData: async () => {
      const [members, projects, allocations] = await Promise.all([
        import('@/lib/api').then(m => m.teamMembersApi.getAll()),
        import('@/lib/api').then(m => m.projectsApi.getAll()),
        import('@/lib/api').then(m => m.projectAllocationsApi.getAll())
      ]);
      return { members, projects, allocations };
    },
    secondaryData: async () => {
      const [holidays, vacations, settings] = await Promise.all([
        import('@/lib/api').then(m => m.holidaysApi.getAll()),
        import('@/lib/api').then(m => m.vacationsApi.getAll()),
        import('@/lib/api').then(m => m.settingsApi.getAll())
      ]);
      return { holidays, vacations, settings };
    }
  });
};

export const useCalendarDataLoading = () => {
  return useProgressiveLoading({
    criticalData: async () => {
      const [members, allocations] = await Promise.all([
        import('@/lib/api').then(m => m.teamMembersApi.getAll()),
        import('@/lib/api').then(m => m.projectAllocationsApi.getAll())
      ]);
      return { members, allocations };
    },
    secondaryData: async () => {
      const [projects, holidays, vacations] = await Promise.all([
        import('@/lib/api').then(m => m.projectsApi.getAll()),
        import('@/lib/api').then(m => m.holidaysApi.getAll()),
        import('@/lib/api').then(m => m.vacationsApi.getAll())
      ]);
      return { projects, holidays, vacations };
    }
  });
};

// Loading state components
export const LoadingState = ({ 
  loading, 
  error, 
  onRetry, 
  canRetry = true,
  children 
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  canRetry?: boolean;
  children: React.ReactNode;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}; 