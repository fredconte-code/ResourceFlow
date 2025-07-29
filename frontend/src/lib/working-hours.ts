import { useSettings } from "@/context/SettingsContext";

// Default values for working hours per country
export const DEFAULT_WORKING_HOURS = {
  CANADA: 37.5,
  BRAZIL: 44
} as const;

// Default buffer time percentage
export const DEFAULT_BUFFER_TIME = 20;

// Utility functions for working hours calculations
export const getWorkingHoursForCountry = (country: 'Canada' | 'Brazil', customHours?: number): number => {
  if (customHours && customHours > 0) {
    return customHours;
  }
  
  return country === 'Canada' ? DEFAULT_WORKING_HOURS.CANADA : DEFAULT_WORKING_HOURS.BRAZIL;
};

export const calculateAvailableHours = (
  totalHours: number, 
  bufferPercentage: number
): number => {
  const bufferHours = (totalHours * bufferPercentage) / 100;
  return totalHours - bufferHours;
};

export const calculateBufferHours = (
  totalHours: number, 
  bufferPercentage: number
): number => {
  return (totalHours * bufferPercentage) / 100;
};

// Hook to get current global settings
export const useWorkingHours = () => {
  const { buffer, canadaHours, brazilHours } = useSettings();
  
  return {
    buffer,
    canadaHours,
    brazilHours,
    getWorkingHoursForCountry: (country: 'Canada' | 'Brazil') => 
      getWorkingHoursForCountry(country, country === 'Canada' ? canadaHours : brazilHours),
    calculateAvailableHours: (totalHours: number) => calculateAvailableHours(totalHours, buffer),
    calculateBufferHours: (totalHours: number) => calculateBufferHours(totalHours, buffer)
  };
};

// Utility for formatting hours
export const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}h`;
};

// Utility for calculating daily hours from weekly hours
export const getDailyHours = (weeklyHours: number, workDaysPerWeek: number = 5): number => {
  return weeklyHours / workDaysPerWeek;
}; 