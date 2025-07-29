import { useSettings } from "@/context/SettingsContext";
import { Employee } from "./employee-data";
import { Holiday, Vacation, ProjectAllocation } from "./api";
import { format, isWithinInterval, isSameDay, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

// Default values for working hours per country
export const DEFAULT_WORKING_HOURS = {
  CANADA: 37.5,
  BRAZIL: 44
} as const;

// Default buffer time percentage
export const DEFAULT_BUFFER_TIME = 20;

// Interface for settings
export interface WorkingHoursSettings {
  canadaHours: number;
  brazilHours: number;
  buffer: number;
}

// Interface for calculation context
export interface CalculationContext {
  settings: WorkingHoursSettings;
  holidays: Holiday[];
  vacations: Vacation[];
  allocations: ProjectAllocation[];
  startDate?: Date;
  endDate?: Date;
}

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

// Main function: Calculate available hours for an employee
export const calculateAvailableHoursForEmployee = (
  employee: Employee,
  context: CalculationContext
): {
  totalHours: number;
  allocatedHours: number;
  availableHours: number;
  bufferHours: number;
  vacationDays: number;
  holidayDays: number;
  utilizationPercentage: number;
} => {
  const { settings, holidays, vacations, allocations, startDate, endDate } = context;
  
  // Get working hours for employee's country
  const weeklyHours = getWorkingHoursForCountry(
    employee.country, 
    employee.country === 'Canada' ? settings.canadaHours : settings.brazilHours
  );
  
  // Calculate total hours for the period (default to 4 weeks if no period specified)
  const periodWeeks = startDate && endDate 
    ? Math.max(1, Math.ceil(differenceInDays(endDate, startDate) / 7))
    : 4;
  
  const totalHours = weeklyHours * periodWeeks;
  
  // Calculate buffer hours
  const bufferHours = calculateBufferHours(totalHours, settings.buffer);
  
  // Calculate available hours (total - buffer)
  const availableHours = totalHours - bufferHours;
  
  // Calculate allocated hours from project allocations
  const allocatedHours = calculateAllocatedHoursForEmployee(employee, allocations, startDate, endDate);
  
  // Calculate vacation and holiday days
  const { vacationDays, holidayDays } = calculateTimeOffDays(
    employee, 
    holidays, 
    vacations, 
    startDate, 
    endDate
  );
  
  // Calculate utilization percentage
  const utilizationPercentage = availableHours > 0 
    ? Math.min(100, (allocatedHours / availableHours) * 100)
    : 0;
  
  return {
    totalHours,
    allocatedHours,
    availableHours,
    bufferHours,
    vacationDays,
    holidayDays,
    utilizationPercentage
  };
};

// Calculate allocated hours for an employee
export const calculateAllocatedHoursForEmployee = (
  employee: Employee,
  allocations: ProjectAllocation[],
  startDate?: Date,
  endDate?: Date
): number => {
  const employeeAllocations = allocations.filter(allocation => 
    allocation.employeeId === employee.id
  );
  
  if (!startDate || !endDate) {
    // If no period specified, sum all allocations
    return employeeAllocations.reduce((total, allocation) => {
      return total + (allocation.hoursPerDay || 8);
    }, 0);
  }
  
  // Calculate hours for specific period
  return employeeAllocations.reduce((total, allocation) => {
    const allocationStart = new Date(allocation.startDate);
    const allocationEnd = new Date(allocation.endDate);
    
    // Check if allocation overlaps with the period
    if (isWithinInterval(allocationStart, { start: startDate, end: endDate }) ||
        isWithinInterval(allocationEnd, { start: startDate, end: endDate }) ||
        isWithinInterval(startDate, { start: allocationStart, end: allocationEnd })) {
      
      // Calculate overlapping days
      const overlapStart = allocationStart > startDate ? allocationStart : startDate;
      const overlapEnd = allocationEnd < endDate ? allocationEnd : endDate;
      const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
      
      return total + ((allocation.hoursPerDay || 8) * overlapDays);
    }
    
    return total;
  }, 0);
};

// Calculate time off days for an employee
export const calculateTimeOffDays = (
  employee: Employee,
  holidays: Holiday[],
  vacations: Vacation[],
  startDate?: Date,
  endDate?: Date
): { vacationDays: number; holidayDays: number } => {
  let vacationDays = 0;
  let holidayDays = 0;
  
  // Calculate vacation days
  const employeeVacations = vacations.filter(vacation => 
    vacation.employeeId === employee.id
  );
  
  employeeVacations.forEach(vacation => {
    const vacationStart = new Date(vacation.startDate);
    const vacationEnd = new Date(vacation.endDate);
    
    if (!startDate || !endDate) {
      // If no period specified, count all vacation days
      vacationDays += differenceInDays(vacationEnd, vacationStart) + 1;
    } else {
      // Calculate overlapping days
      if (isWithinInterval(vacationStart, { start: startDate, end: endDate }) ||
          isWithinInterval(vacationEnd, { start: startDate, end: endDate }) ||
          isWithinInterval(startDate, { start: vacationStart, end: vacationEnd })) {
        
        const overlapStart = vacationStart > startDate ? vacationStart : startDate;
        const overlapEnd = vacationEnd < endDate ? vacationEnd : endDate;
        vacationDays += differenceInDays(overlapEnd, overlapStart) + 1;
      }
    }
  });
  
  // Calculate holiday days
  const periodStart = startDate || startOfMonth(new Date());
  const periodEnd = endDate || endOfMonth(new Date());
  
  holidays.forEach(holiday => {
    const holidayDate = new Date(holiday.date);
    
    if (isWithinInterval(holidayDate, { start: periodStart, end: periodEnd })) {
      // Check if holiday applies to employee's country
      if (holiday.country === 'Both' || holiday.country === employee.country) {
        holidayDays += 1;
      }
    }
  });
  
  return { vacationDays, holidayDays };
};

// Calculate allocation percentage for an employee
export const calculateAllocationPercentage = (employee: Employee): number => {
  // This is a simplified calculation - in practice, you'd want to use the full calculation
  const totalHours = employee.country === 'Canada' ? 150 : 176; // 4 weeks
  return totalHours > 0 ? (employee.allocatedHours / totalHours) * 100 : 0;
};

// Calculate actual available hours for an employee (legacy function for backward compatibility)
export const calculateActualAvailableHours = (
  employee: Employee,
  canadaHours: number,
  brazilHours: number,
  buffer: number
): number | null => {
  if (!canadaHours || !brazilHours || !buffer) {
    return null;
  }
  
  const weeklyHours = employee.country === 'Canada' ? canadaHours : brazilHours;
  const totalHours = weeklyHours * 4; // 4 weeks
  const bufferHours = (totalHours * buffer) / 100;
  
  return totalHours - bufferHours - employee.allocatedHours;
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

// Utility for calculating monthly hours from weekly hours
export const getMonthlyHours = (weeklyHours: number, weeksPerMonth: number = 4): number => {
  return weeklyHours * weeksPerMonth;
};

// Utility for calculating quarterly hours from weekly hours
export const getQuarterlyHours = (weeklyHours: number, weeksPerQuarter: number = 13): number => {
  return weeklyHours * weeksPerQuarter;
};

// Utility for calculating yearly hours from weekly hours
export const getYearlyHours = (weeklyHours: number, weeksPerYear: number = 52): number => {
  return weeklyHours * weeksPerYear;
}; 