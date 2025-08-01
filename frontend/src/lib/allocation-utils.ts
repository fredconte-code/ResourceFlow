import { startOfMonth, endOfMonth, differenceInDays, addDays, parseISO, isSameDay } from "date-fns";
import { isWeekendDay } from "./calendar-utils";
import { getWorkingHoursForCountry } from "./working-hours";
import { Employee } from "./employee-data";
import { ProjectAllocation, Holiday, Vacation } from "./api";

// Shared allocation calculation functions that match the Calendar page logic exactly

export const calculateEmployeeBreakdown = (
  employee: Employee, 
  currentDate: Date,
  holidays: Holiday[],
  vacations: Vacation[],
  buffer: number
) => {
  const weeklyHours = getWorkingHoursForCountry(employee.country);
  const dailyHours = weeklyHours / 5; // Assuming 5 working days per week
  
  // Calculate total days in the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  let totalDaysInMonth = 0;
  let workingDaysInMonth = 0;
  let weekendDaysInMonth = 0;
  let checkDate = new Date(monthStart);
  
  while (checkDate <= monthEnd) {
    totalDaysInMonth++;
    if (!isWeekendDay(checkDate)) {
      workingDaysInMonth++;
    } else {
      weekendDaysInMonth++;
    }
    checkDate = addDays(checkDate, 1);
  }
  
  // Calculate total working hours for the month (excluding weekends)
  const monthlyHours = workingDaysInMonth * dailyHours;
  const weekendHours = weekendDaysInMonth * dailyHours;
  
  // Calculate buffer hours for the month
  const bufferHours = (monthlyHours * buffer) / 100;
  
  // Calculate holiday hours for the current month
  let holidayHours = 0;
  
  holidays.forEach(holiday => {
    const holidayDate = parseISO(holiday.date);
    
    if (holidayDate >= monthStart && holidayDate <= monthEnd) {
      // Check if holiday applies to employee's country
      if (holiday.country === 'Both' || holiday.country === employee.country) {
        // Only count if it's a working day (not weekend)
        if (!isWeekendDay(holidayDate)) {
          holidayHours += dailyHours;
        }
      }
    }
  });
  
  // Calculate vacation hours for the current month
  let vacationHours = 0;
  vacations.forEach(vacation => {
    if (vacation.employee_id === employee.id) {
      const vacationStart = parseISO(vacation.start_date);
      const vacationEnd = parseISO(vacation.end_date);
      
      // Calculate overlap with current month
      if (vacationEnd >= monthStart && vacationStart <= monthEnd) {
        const effectiveStart = vacationStart < monthStart ? monthStart : vacationStart;
        const effectiveEnd = vacationEnd > monthEnd ? monthEnd : vacationEnd;
        
        // Count working days in vacation period
        let workingDays = 0;
        let currentDate = new Date(effectiveStart);
        while (currentDate <= effectiveEnd) {
          if (!isWeekendDay(currentDate)) {
            workingDays++;
          }
          currentDate = addDays(currentDate, 1);
        }
        
        vacationHours += workingDays * dailyHours;
      }
    }
  });
  
  // Calculate total available hours
  const totalAvailableHours = monthlyHours - bufferHours - holidayHours - vacationHours;
  
  return {
    maxHoursPerMonth: monthlyHours,
    maxHoursPerWeek: weeklyHours,
    maxHoursPerDay: dailyHours,
    bufferHours,
    holidayHours,
    vacationHours,
    weekendHours: weekendHours, // Show actual weekend hours excluded
    totalAvailableHours
  };
};

export const calculateEmployeeAllocatedHoursForMonth = (
  employeeId: string,
  allocations: ProjectAllocation[],
  currentDate: Date,
  holidays: Holiday[] = [],
  employee?: Employee
) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const employeeAllocations = allocations.filter(allocation => allocation.employeeId === employeeId);
  return employeeAllocations.reduce((total, allocation) => {
    const allocationStart = new Date(allocation.startDate + 'T00:00:00');
    const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
    
    // Check if allocation overlaps with current month
    if (allocationEnd < monthStart || allocationStart > monthEnd) {
      return total;
    }
    
    // Calculate overlap with current month
    const effectiveStart = allocationStart < monthStart ? monthStart : allocationStart;
    const effectiveEnd = allocationEnd > monthEnd ? monthEnd : allocationEnd;
    
    // Count only working days (exclude weekends and holidays)
    let workingDays = 0;
    let currentDate = new Date(effectiveStart);
    while (currentDate <= effectiveEnd) {
      const isHoliday = employee && holidays.some(holiday => {
        const holidayDate = parseISO(holiday.date);
        return isSameDay(holidayDate, currentDate) && 
               (holiday.country === 'Both' || holiday.country === employee.country);
      });
      
      if (!isWeekendDay(currentDate) && !isHoliday) {
        workingDays++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return total + (allocation.hoursPerDay * workingDays);
  }, 0);
};

export const calculateEmployeeAllocationPercentage = (
  employee: Employee,
  allocations: ProjectAllocation[],
  currentDate: Date,
  holidays: Holiday[],
  vacations: Vacation[],
  buffer: number
) => {
  const allocatedHours = calculateEmployeeAllocatedHoursForMonth(employee.id, allocations, currentDate, holidays, employee);
  const breakdown = calculateEmployeeBreakdown(employee, currentDate, holidays, vacations, buffer);
  
  // Calculate percentage based on total available hours (after all deductions)
  const percentage = breakdown.totalAvailableHours > 0 ? (allocatedHours / breakdown.totalAvailableHours) * 100 : 0;
  
  return percentage; // Allow percentages over 100% for overallocation
};

export const getEmployeeAvailableHours = (
  employee: Employee,
  currentDate: Date,
  holidays: Holiday[],
  vacations: Vacation[],
  buffer: number
) => {
  const breakdown = calculateEmployeeBreakdown(employee, currentDate, holidays, vacations, buffer);
  return breakdown.totalAvailableHours;
}; 