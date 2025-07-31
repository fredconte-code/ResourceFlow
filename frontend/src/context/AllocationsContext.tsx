import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { projectAllocationsApi, ProjectAllocation } from '@/lib/api';

interface AllocationsContextType {
  allocations: ProjectAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<ProjectAllocation[]>>;
  refreshAllocations: () => Promise<void>;
  loading: boolean;
  error: string | null;
  addAllocation: (allocation: Omit<ProjectAllocation, 'id'>) => Promise<void>;
  updateAllocation: (id: number, allocation: Partial<ProjectAllocation>) => Promise<void>;
  deleteAllocation: (id: number) => Promise<void>;
}

const AllocationsContext = createContext<AllocationsContextType | undefined>(undefined);

export const useAllocations = () => {
  const context = useContext(AllocationsContext);
  if (context === undefined) {
    throw new Error('useAllocations must be used within an AllocationsProvider');
  }
  return context;
};

interface AllocationsProviderProps {
  children: ReactNode;
}

export const AllocationsProvider: React.FC<AllocationsProviderProps> = ({ children }) => {
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAllocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectAllocationsApi.getAll();
      setAllocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allocations');
      console.error('Error loading allocations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAllocation = useCallback(async (allocation: Omit<ProjectAllocation, 'id'>) => {
    try {
      const newAllocation = await projectAllocationsApi.create(allocation);
      setAllocations(prev => [...prev, newAllocation]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add allocation');
    }
  }, []);

  const updateAllocation = useCallback(async (id: number, allocation: Partial<ProjectAllocation>) => {
    try {
      const updatedAllocation = await projectAllocationsApi.update(id, allocation);
      setAllocations(prev => prev.map(a => a.id === id ? updatedAllocation : a));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update allocation');
    }
  }, []);

  const deleteAllocation = useCallback(async (id: number) => {
    try {
      await projectAllocationsApi.delete(id);
      setAllocations(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete allocation');
    }
  }, []);

  useEffect(() => {
    refreshAllocations();
  }, [refreshAllocations]);

  const value: AllocationsContextType = {
    allocations,
    setAllocations,
    refreshAllocations,
    loading,
    error,
    addAllocation,
    updateAllocation,
    deleteAllocation
  };

  return (
    <AllocationsContext.Provider value={value}>
      {children}
    </AllocationsContext.Provider>
  );
}; 