import { startOfMonth, endOfMonth, differenceInDays, addDays, parseISO, isSameDay } from "date-fns";
import { isWeekendDay } from "./calendar-utils";
import { getWorkingHoursForCountry } from "./working-hours";
import { Employee } from "./employee-data";
import { ProjectAllocation } from "./api";

// Shared allocation calculation functions that match the Calendar page logic exactly

export const calculateEmployeeBreakdown = (
  employee: Employee, 
  currentDate: Date,
  holidays: any[],
  vacations: any[],
  buffer: number
) => {
  const weeklyHours = getWorkingHoursForCountry(employee.country);
  const dailyHours = weeklyHours / 5; // Assuming 5 working days per week
  
  // Calculate total calendar hours for the month (including weekends)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const totalDaysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const monthlyHours = totalDaysInMonth * dailyHours; // Total calendar hours including weekends
  
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
  
  // Calculate weekend hours for the current month
  let weekendHours = 0;
  let weekendDate = new Date(monthStart);
  while (weekendDate <= monthEnd) {
    if (isWeekendDay(weekendDate)) {
      weekendHours += dailyHours;
    }
    weekendDate = addDays(weekendDate, 1);
  }
  
  // Calculate total available hours
  const totalAvailableHours = monthlyHours - bufferHours - holidayHours - vacationHours - weekendHours;
  
  return {
    maxHoursPerMonth: monthlyHours,
    maxHoursPerWeek: weeklyHours,
    maxHoursPerDay: dailyHours,
    bufferHours,
    holidayHours,
    vacationHours,
    weekendHours,
    totalAvailableHours
  };
};

export const calculateEmployeeAllocatedHoursForMonth = (
  employeeId: string,
  allocations: ProjectAllocation[],
  currentDate: Date,
  holidays: any[] = [],
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
  holidays: any[],
  vacations: any[],
  buffer: number
) => {
  const allocatedHours = calculateEmployeeAllocatedHoursForMonth(employee.id, allocations, currentDate);
  const breakdown = calculateEmployeeBreakdown(employee, currentDate, holidays, vacations, buffer);
  
  // Calculate percentage based on total available hours (after all deductions)
  const percentage = breakdown.totalAvailableHours > 0 ? (allocatedHours / breakdown.totalAvailableHours) * 100 : 0;
  
  return percentage; // Allow percentages over 100% for overallocation
};

export const getEmployeeAvailableHours = (
  employee: Employee,
  currentDate: Date,
  holidays: any[],
  vacations: any[],
  buffer: number
) => {
  const breakdown = calculateEmployeeBreakdown(employee, currentDate, holidays, vacations, buffer);
  return breakdown.totalAvailableHours;
}; 