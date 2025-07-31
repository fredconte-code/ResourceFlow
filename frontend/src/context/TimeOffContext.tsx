import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { vacationsApi } from '@/lib/api';

export interface ApiTimeOff {
  id: number;
  employee_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  type: string;
}

interface TimeOffContextType {
  timeOffs: ApiTimeOff[];
  setTimeOffs: React.Dispatch<React.SetStateAction<ApiTimeOff[]>>;
  refreshTimeOffs: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const TimeOffContext = createContext<TimeOffContextType | undefined>(undefined);

export const useTimeOffs = () => {
  const context = useContext(TimeOffContext);
  if (context === undefined) {
    throw new Error('useTimeOffs must be used within a TimeOffProvider');
  }
  return context;
};

interface TimeOffProviderProps {
  children: ReactNode;
}

export const TimeOffProvider: React.FC<TimeOffProviderProps> = ({ children }) => {
  const [timeOffs, setTimeOffs] = useState<ApiTimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTimeOffs = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTimeOffs = await vacationsApi.getAll();
      setTimeOffs(fetchedTimeOffs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load time off data');
      console.error('Error loading time off data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTimeOffs();
  }, []);

  const value: TimeOffContextType = {
    timeOffs,
    setTimeOffs,
    refreshTimeOffs,
    loading,
    error
  };

  return (
    <TimeOffContext.Provider value={value}>
      {children}
    </TimeOffContext.Provider>
  );
}; 