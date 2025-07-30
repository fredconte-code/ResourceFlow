import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { holidaysApi } from '@/lib/api';

export interface ApiHoliday {
  id: number;
  name: string;
  date: string;
  country: 'Canada' | 'Brazil' | 'Both';
}

interface HolidayContextType {
  holidays: ApiHoliday[];
  setHolidays: React.Dispatch<React.SetStateAction<ApiHoliday[]>>;
  refreshHolidays: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const HolidayContext = createContext<HolidayContextType | undefined>(undefined);

export const useHolidays = () => {
  const context = useContext(HolidayContext);
  if (context === undefined) {
    throw new Error('useHolidays must be used within a HolidayProvider');
  }
  return context;
};

interface HolidayProviderProps {
  children: ReactNode;
}

export const HolidayProvider: React.FC<HolidayProviderProps> = ({ children }) => {
  const [holidays, setHolidays] = useState<ApiHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedHolidays = await holidaysApi.getAll();
      setHolidays(fetchedHolidays);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load holidays');
      console.error('Error loading holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHolidays();
  }, []);

  const value: HolidayContextType = {
    holidays,
    setHolidays,
    refreshHolidays,
    loading,
    error
  };

  return (
    <HolidayContext.Provider value={value}>
      {children}
    </HolidayContext.Provider>
  );
}; 