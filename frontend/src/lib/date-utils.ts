import { format, parseISO } from "date-fns";

// Date format constants
export const DATE_FORMATS = {
  API: 'yyyy-MM-dd',
  DISPLAY: 'MMM dd, yyyy',
  CALENDAR: 'PPP',
  SHORT: 'MMM dd',
  MONTH_YEAR: 'MMMM yyyy',
  TIME: 'HH:mm',
  COMPACT: 'dd/MM/yyyy'
} as const;

// Centralized date formatting functions
export const formatDateForAPI = (date: Date): string => 
  format(date, DATE_FORMATS.API);

export const formatDateForDisplay = (date: Date): string => 
  format(date, DATE_FORMATS.DISPLAY);

export const formatDateForCalendar = (date: Date): string => 
  format(date, DATE_FORMATS.CALENDAR);

export const formatDateShort = (date: Date): string => 
  format(date, DATE_FORMATS.SHORT);

export const formatDateMonthYear = (date: Date): string => 
  format(date, DATE_FORMATS.MONTH_YEAR);

export const formatDateCompact = (date: Date): string => 
  format(date, DATE_FORMATS.COMPACT);

export const formatDateRange = (startDate: Date, endDate: Date): string => 
  `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;

export const formatDateRangeShort = (startDate: Date, endDate: Date): string => 
  `${formatDateShort(startDate)} - ${formatDateForDisplay(endDate)}`;

export const parseDateFromAPI = (dateString: string): Date => 
  parseISO(dateString);

// Utility functions for date validation
export const isValidDate = (date: any): date is Date => 
  date instanceof Date && !isNaN(date.getTime());

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => 
  date >= startDate && date <= endDate;

export const isDateRangeValid = (startDate: Date, endDate: Date): boolean => 
  startDate <= endDate;

// Date comparison utilities
export const isSameDate = (date1: Date, date2: Date): boolean => 
  formatDateForAPI(date1) === formatDateForAPI(date2);

export const isDateBefore = (date1: Date, date2: Date): boolean => 
  date1 < date2;

export const isDateAfter = (date1: Date, date2: Date): boolean => 
  date1 > date2; 