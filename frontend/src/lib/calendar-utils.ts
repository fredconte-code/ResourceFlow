import { format, getDay, addDays, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import { Employee, ProjectAllocation, ApiHoliday, ApiVacation } from "@/lib/api";

// Constants
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKS_PER_MONTH = 4.33;
export const WORKING_DAYS_PER_WEEK = 5;

// Utility functions
export const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export const getDayName = (date: Date) => DAY_NAMES[getDay(date)];

export const isWeekendDay = (date: Date) => {
  const day = getDay(date);
  return day === 0 || day === 6; // Sunday or Saturday
};

export const formatHours = (hours: number) => {
  return hours % 1 === 0 ? Math.round(hours) : Math.round(hours * 10) / 10;
};

// Color functions
export const getDailyAllocationColor = (percentage: number) => {
  if (percentage === 0) return 'bg-green-500/60'; // Green for no allocation
  if (percentage <= 25) return 'bg-green-400/60';
  if (percentage <= 50) return 'bg-green-300/60';
  if (percentage <= 75) return 'bg-yellow-500/60';
  if (percentage <= 100) return 'bg-orange-500/60';
  return 'bg-red-600/60'; // Red for overallocated days (>100%)
};

export const getAllocationColor = (percentage: number) => {
  if (percentage <= 60) return 'bg-green-500';
  if (percentage <= 80) return 'bg-blue-500';
  if (percentage <= 100) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Data filtering functions
export const getAllocationsForCell = (
  allocations: ProjectAllocation[], 
  employeeId: string, 
  date: Date
) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return allocations
    .filter(allocation => 
      allocation.employeeId === employeeId && 
      allocation.startDate <= dateStr && 
      allocation.endDate >= dateStr
    )
    .sort((a, b) => {
      const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
      return aId - bId;
    });
};

export const getVacationForCell = (
  vacations: ApiVacation[], 
  employeeId: string, 
  date: Date
) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return vacations.find(vacation => 
    vacation.employeeId === employeeId && 
    vacation.startDate <= dateStr && 
    vacation.endDate >= dateStr
  );
};

export const getHolidayForDate = (holidays: ApiHoliday[], date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return holidays.find(holiday => holiday.date === dateStr);
};

// Calculation functions
export const getDailyAllocatedHours = (
  allocations: ProjectAllocation[], 
  employeeId: string, 
  date: Date
) => {
  const dayAllocations = getAllocationsForCell(allocations, employeeId, date);
  return dayAllocations.reduce((total, allocation) => total + allocation.hoursPerDay, 0);
};

export const calculateEmployeeAllocatedHoursForMonth = (
  allocations: ProjectAllocation[], 
  employeeId: string, 
  currentDate: Date
) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const employeeAllocations = allocations.filter(allocation => allocation.employeeId === employeeId);
  return employeeAllocations.reduce((total, allocation) => {
    const allocationStart = new Date(allocation.startDate);
    const allocationEnd = new Date(allocation.endDate);
    
    if (allocationEnd < monthStart || allocationStart > monthEnd) {
      return total;
    }
    
    const effectiveStart = allocationStart < monthStart ? monthStart : allocationStart;
    const effectiveEnd = allocationEnd > monthEnd ? monthEnd : allocationEnd;
    
    let workingDays = 0;
    let currentDate = new Date(effectiveStart);
    while (currentDate <= effectiveEnd) {
      if (!isWeekendDay(currentDate)) {
        workingDays++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return total + (allocation.hoursPerDay * workingDays);
  }, 0);
};

export const calculateEmployeeAllocatedHours = (allocations: ProjectAllocation[], employeeId: string) => {
  const employeeAllocations = allocations.filter(allocation => allocation.employeeId === employeeId);
  return employeeAllocations.reduce((total, allocation) => {
    const startDate = new Date(allocation.startDate);
    const endDate = new Date(allocation.endDate);
    const days = differenceInDays(endDate, startDate) + 1;
    return total + (allocation.hoursPerDay * days);
  }, 0);
};

// Conflict detection
export const hasAllocationConflict = (
  allocations: ProjectAllocation[],
  employeeId: string,
  projectId: string,
  startDate: string,
  endDate: string,
  excludeAllocationId?: string
) => {
  return allocations.some(allocation => 
    allocation.id !== excludeAllocationId &&
    allocation.employeeId === employeeId && 
    allocation.projectId === projectId &&
    (
      (allocation.startDate <= startDate && allocation.endDate >= startDate) ||
      (allocation.startDate <= endDate && allocation.endDate >= endDate) ||
      (allocation.startDate >= startDate && allocation.endDate <= endDate)
    )
  );
}; 