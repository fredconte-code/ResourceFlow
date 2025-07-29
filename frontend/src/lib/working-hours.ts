import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

export interface WorkingHoursConfig {
  canadaHours: number;
  brazilHours: number;
  buffer: number;
}

export interface AvailableHoursResult {
  weeklyHours: number;
  monthlyHours: number;
  workingDays: number;
  nonWorkingDays: number;
  breakdown: {
    weekends: number;
    holidays: number;
    vacations: number;
  };
}

// Helper function to check if a date is a holiday
const isHolidayDate = (date: Date, country: string): boolean => {
  const stored = localStorage.getItem('holidays');
  if (!stored) return false;
  
  const holidays = JSON.parse(stored);
  const dateString = format(date, 'yyyy-MM-dd');
  
  const isHoliday = holidays.some((holiday: any) => {
    const holidayDate = format(new Date(holiday.date), 'yyyy-MM-dd');
    return holidayDate === dateString && 
           (holiday.country === 'Both' || holiday.country === country);
  });
  

  
  return isHoliday;
};

// Helper function to get team members from localStorage
const getTeamMembers = () => {
  const stored = localStorage.getItem('teamMembers');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error parsing team members from localStorage:', error);
    return [];
  }
};

// Helper function to check if an employee is on vacation
const isEmployeeOnVacation = (employeeId: string, date: Date): boolean => {
  const stored = localStorage.getItem('vacations');
  if (!stored) return false;
  
  const vacations = JSON.parse(stored);
  const employees = getTeamMembers();
  const employee = employees.find((emp: any) => emp.id === employeeId);
  
  if (!employee) return false;
  
  return vacations.some((vacation: any) => {
    const vacationStart = new Date(vacation.startDate);
    const vacationEnd = new Date(vacation.endDate);
    return vacation.employeeName === employee.name && 
           date >= vacationStart && 
           date <= vacationEnd;
  });
};

/**
 * Calculate available working hours for a specific employee in a given week
 */
export const calculateWeeklyAvailableHours = (
  employeeId: string,
  weekStartDate: Date,
  config: WorkingHoursConfig
): AvailableHoursResult => {
  const employees = getTeamMembers();
  const employee = employees.find((emp: any) => emp.id === employeeId);
  
  if (!employee) {
    return {
      weeklyHours: 0,
      monthlyHours: 0,
      workingDays: 0,
      nonWorkingDays: 0,
      breakdown: { weekends: 0, holidays: 0, vacations: 0 }
    };
  }

  const weeklyHours = employee.country === 'Canada' ? config.canadaHours : config.brazilHours;
  const dailyHours = weeklyHours / 5;
  
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday start
  const daysInWeek = eachDayOfInterval({ start: weekStartDate, end: weekEndDate });
  
  let workingDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  let vacationDays = 0;
  
  daysInWeek.forEach(date => {
    const isWeekendDay = isWeekend(date);
    const isHolidayDay = isHolidayDate(date, employee.country);
    const isVacationDay = isEmployeeOnVacation(employeeId, date);
    
    if (isWeekendDay) {
      weekendDays++;
    } else if (isHolidayDay) {
      holidayDays++;
    } else if (isVacationDay) {
      vacationDays++;
    } else {
      workingDays++;
    }
  });
  
  const totalAvailableHours = workingDays * dailyHours;
  const bufferMultiplier = 1 - (config.buffer / 100);
  const adjustedAvailableHours = totalAvailableHours * bufferMultiplier;
  
  return {
    weeklyHours: Math.round(adjustedAvailableHours * 100) / 100,
    monthlyHours: 0, // Will be calculated separately
    workingDays,
    nonWorkingDays: weekendDays + holidayDays + vacationDays,
    breakdown: {
      weekends: weekendDays,
      holidays: holidayDays,
      vacations: vacationDays
    }
  };
};

/**
 * Calculate available working hours for a specific employee in a given month
 */
export const calculateMonthlyAvailableHours = (
  employeeId: string,
  monthStartDate: Date,
  config: WorkingHoursConfig
): AvailableHoursResult => {
  const employees = getTeamMembers();
  const employee = employees.find((emp: any) => emp.id === employeeId);
  
  if (!employee) {
    return {
      weeklyHours: 0,
      monthlyHours: 0,
      workingDays: 0,
      nonWorkingDays: 0,
      breakdown: { weekends: 0, holidays: 0, vacations: 0 }
    };
  }

  const weeklyHours = employee.country === 'Canada' ? config.canadaHours : config.brazilHours;
  const dailyHours = weeklyHours / 5;
  
  const monthEndDate = endOfMonth(monthStartDate);
  const daysInMonth = eachDayOfInterval({ start: monthStartDate, end: monthEndDate });
  
  let workingDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;
  let vacationDays = 0;
  
  daysInMonth.forEach(date => {
    const isWeekendDay = isWeekend(date);
    const isHolidayDay = isHolidayDate(date, employee.country);
    const isVacationDay = isEmployeeOnVacation(employeeId, date);
    
    if (isWeekendDay) {
      weekendDays++;
    } else if (isHolidayDay) {
      holidayDays++;
    } else if (isVacationDay) {
      vacationDays++;
    } else {
      workingDays++;
    }
  });
  

  
  const totalAvailableHours = workingDays * dailyHours;
  const bufferMultiplier = 1 - (config.buffer / 100);
  const adjustedAvailableHours = totalAvailableHours * bufferMultiplier;
  
  return {
    weeklyHours: 0, // Will be calculated separately
    monthlyHours: Math.round(adjustedAvailableHours * 100) / 100,
    workingDays,
    nonWorkingDays: weekendDays + holidayDays + vacationDays,
    breakdown: {
      weekends: weekendDays,
      holidays: holidayDays,
      vacations: vacationDays
    }
  };
};

/**
 * Calculate available working hours for a specific employee for both week and month
 */
export const calculateAvailableHours = (
  employeeId: string,
  date: Date,
  config: WorkingHoursConfig
): AvailableHoursResult => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const monthStart = startOfMonth(date);
  
  const weeklyResult = calculateWeeklyAvailableHours(employeeId, weekStart, config);
  const monthlyResult = calculateMonthlyAvailableHours(employeeId, monthStart, config);
  
  return {
    weeklyHours: weeklyResult.weeklyHours,
    monthlyHours: monthlyResult.monthlyHours,
    workingDays: monthlyResult.workingDays,
    nonWorkingDays: monthlyResult.nonWorkingDays,
    breakdown: monthlyResult.breakdown
  };
};

/**
 * Get working hours configuration from settings
 */
export const getWorkingHoursConfig = (): WorkingHoursConfig => {
  const canadaHours = parseInt(localStorage.getItem('canadaHours') || '37.5');
  const brazilHours = parseInt(localStorage.getItem('brazilHours') || '44');
  const buffer = parseInt(localStorage.getItem('buffer') || '10');
  
  return {
    canadaHours,
    brazilHours,
    buffer
  };
}; 