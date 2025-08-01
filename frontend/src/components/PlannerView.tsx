import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { getCurrentEmployees, Employee } from "@/lib/employee-data";
import { holidaysApi, vacationsApi, projectsApi, projectAllocationsApi, teamMembersApi, Holiday as ApiHoliday, Vacation as ApiVacation, Project, ProjectAllocation } from "@/lib/api";
import { useWorkingHours } from "@/lib/working-hours";
import { useSettings } from "@/context/SettingsContext";
import { useHolidays } from "@/context/HolidayContext";
import { useTimeOffs } from "@/context/TimeOffContext";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, differenceInDays, getDate, isWeekend, getDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, GripVertical, Flame, ChevronDown, Filter, CalendarDays, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import {
  getContrastColor,
  getDayName,
  isWeekendDay,
  formatHours,
  getDailyAllocationColor,
  getAllocationColor,
  getAllocationsForCell,
  getVacationForCell,
  getHolidayForDate,
  getDailyAllocatedHours,
  calculateEmployeeAllocatedHours,
  hasAllocationConflict,
  WEEKS_PER_MONTH,
  WORKING_DAYS_PER_WEEK
} from "@/lib/calendar-utils";
import { calculateEmployeeAllocationPercentage, getEmployeeAvailableHours, calculateEmployeeAllocatedHoursForMonth, calculateEmployeeBreakdown } from "@/lib/allocation-utils";
import { COUNTRY_FLAGS, DRAG_THRESHOLD } from "@/lib/constants";

export const PlannerView: React.FC = () => {
  const { toast } = useToast();
  const { getWorkingHoursForCountry } = useWorkingHours();
  const { holidays, refreshHolidays } = useHolidays();
  const { timeOffs: globalTimeOffs, refreshTimeOffs } = useTimeOffs();
  const { buffer } = useSettings();
  
  // Basic state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  // Use global time offs instead of local state
  const vacations = globalTimeOffs;
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Drag and drop state
  const [dragItem, setDragItem] = useState<Project | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{employeeId: string, date: Date} | null>(null);
  const [draggingAllocationFromTimeline, setDraggingAllocationFromTimeline] = useState<ProjectAllocation | null>(null);
  const [dragOverProjectsBox, setDragOverProjectsBox] = useState(false);
  
  // Resize state
  const [resizingAllocation, setResizingAllocation] = useState<{
    allocationId: string;
    startDate: Date;
    endDate: Date;
    isLeftEdge: boolean;
  } | null>(null);
  
  // Drag existing allocation state
  const [draggingAllocation, setDraggingAllocation] = useState<{
    allocation: ProjectAllocation;
    originalStartDate: Date;
    originalEndDate: Date;
    mouseOffset: { x: number; y: number };
  } | null>(null);
  
  // Edit allocation dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<ProjectAllocation | null>(null);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [editHoursPerDay, setEditHoursPerDay] = useState<number>(0);
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAllocation, setDeletingAllocation] = useState<ProjectAllocation | null>(null);
  
  // Heatmap view state
  const [heatmapMode, setHeatmapMode] = useState(false);

  // Holiday visibility state
  const [showHolidays, setShowHolidays] = useState(false);
  


  // Smart filter state
  const [smartFilter, setSmartFilter] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<{
    projects: string[];
    countries: string[];
    roles: string[];
    names: string[];
  }>({
    projects: [],
    countries: [],
    roles: [],
    names: []
  });

  // Overallocation warning state
  const [overallocationDialogOpen, setOverallocationDialogOpen] = useState(false);
  
  // Tooltip state
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const [overallocationData, setOverallocationData] = useState<{
    employeeId: string;
    employeeName: string;
    date: Date;
    projectId: string;
    projectName: string;
    currentAllocatedHours: number;
    maxDailyHours: number;
    conflictingAllocations: ProjectAllocation[];
  } | null>(null);

  // Overallocation hours tracking
  const [overallocationHours, setOverallocationHours] = useState<{[key: string]: number}>({});

  // Double-click detection state
  const [doubleClickTimeout, setDoubleClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDoubleClicking, setIsDoubleClicking] = useState(false);

  // Drag distance tracking
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);

  // Check for overallocation when adding a new project
  const checkForOverallocation = (employeeId: string, date: Date, projectId: string, hoursPerDay: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    const maxDailyHours = getWorkingHoursForCountry(employee.country) / 5;
    const existingAllocations = getAllocationsForCell(employeeId, date);
    const currentAllocatedHours = existingAllocations.reduce((total, allocation) => total + allocation.hoursPerDay, 0);
    const newTotalHours = currentAllocatedHours + hoursPerDay;

    if (newTotalHours > maxDailyHours) {
      const project = projects.find(p => p.id.toString() === projectId);
      return {
        employeeId,
        employeeName: employee.name,
        date,
        projectId,
        projectName: project?.name || 'Unknown Project',
        currentAllocatedHours,
        maxDailyHours,
        conflictingAllocations: existingAllocations
      };
    }

    return null;
  };

  // Calendar navigation
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  // Get calendar days for the current month
  const getCalendarDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  // Get unique roles from employees
  const getUniqueRoles = () => {
    return Array.from(new Set(employees.map(emp => emp.role))).sort();
  };

  // Smart filter parsing function
  const parseSmartFilter = (filterText: string) => {
    const filters = {
      projects: [] as string[],
      countries: [] as string[],
      roles: [] as string[],
      names: [] as string[]
    };

    const tokens = filterText.toLowerCase().split(/\s+/).filter(token => token.length > 0);
    
    tokens.forEach(token => {
      // Check for project names
      const project = projects.find(p => p.name.toLowerCase().includes(token));
      if (project) {
        filters.projects.push(project.id.toString());
        return;
      }

      // Check for countries
      if (['canada', 'brazil'].includes(token)) {
        filters.countries.push(token.charAt(0).toUpperCase() + token.slice(1));
        return;
      }

      // Check for roles
      const role = getUniqueRoles().find(r => r.toLowerCase().includes(token));
      if (role) {
        filters.roles.push(role);
        return;
      }

      // Check for employee names
      const employee = employees.find(e => e.name.toLowerCase().includes(token));
      if (employee) {
        filters.names.push(employee.name);
        return;
      }

      // If no specific match, treat as name search
      filters.names.push(token);
    });

    return filters;
  };

  // Filter employees based on smart filters
  const getFilteredEmployees = () => {
    const filters = parseSmartFilter(smartFilter);
    
    return employees.filter(employee => {
      // Filter by name
      if (filters.names.length > 0) {
        const nameMatch = filters.names.some(name => 
          employee.name.toLowerCase().includes(name.toLowerCase())
        );
        if (!nameMatch) return false;
      }
      
      // Filter by country
      if (filters.countries.length > 0 && !filters.countries.includes(employee.country)) {
        return false;
      }
      
      // Filter by role
      if (filters.roles.length > 0 && !filters.roles.includes(employee.role)) {
        return false;
      }
      
      // Filter by project (check if employee has allocations for the selected projects)
      if (filters.projects.length > 0) {
        const hasProjectAllocation = allocations.some(allocation => 
          allocation.employeeId === employee.id && filters.projects.includes(allocation.projectId)
        );
        if (!hasProjectAllocation) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSmartFilter('');
    setActiveFilters({
      projects: [],
      countries: [],
      roles: [],
      names: []
    });
  };

  // Get active filter tags for display
  const getActiveFilterTags = () => {
    const filters = parseSmartFilter(smartFilter);
    const tags = [];
    
    filters.projects.forEach(projectId => {
      const project = projects.find(p => p.id.toString() === projectId);
      if (project) tags.push({ type: 'project', label: project.name, value: projectId });
    });
    
    filters.countries.forEach(country => {
      tags.push({ type: 'country', label: country, value: country });
    });
    
    filters.roles.forEach(role => {
      tags.push({ type: 'role', label: role, value: role });
    });
    
    filters.names.forEach(name => {
      tags.push({ type: 'name', label: name, value: name });
    });
    
    return tags;
  };



  // Calculate daily allocation percentage for a specific employee and date
  const getDailyAllocationPercentage = (employeeId: string, date: Date) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;
    
    // Skip holidays and vacations
    if (getHolidayForEmployeeAndDate(employee, date) || getVacationForCell(employeeId, date)) {
      return 0;
    }
    
    const dayAllocations = getAllocationsForCell(employeeId, date);
    const totalAllocatedHours = dayAllocations.reduce((total, allocation) => total + allocation.hoursPerDay, 0);
    
    // For weekends, return a special value to indicate weekend allocation
    if (isWeekendDay(date)) {
      return dayAllocations.length > 0 ? -1 : 0; // -1 indicates weekend allocation
    }
    
    const maxDailyHours = getWorkingHoursForCountry(employee.country) / WORKING_DAYS_PER_WEEK;
    // Allow percentages to exceed 100% for overallocated days
    return maxDailyHours > 0 ? (totalAllocatedHours / maxDailyHours) * 100 : 0;
  };





  // Calculate allocation percentage for an employee for the current month
  const getEmployeeAllocationPercentage = (employee: Employee) => {
    return calculateEmployeeAllocationPercentage(
      employee,
      allocations,
      currentDate,
      holidays,
      vacations,
      buffer
    );
  };

  // Helper function to get available hours for an employee (after buffer deduction)
  const getEmployeeAvailableHoursLocal = (employee: Employee) => {
    return getEmployeeAvailableHours(
      employee,
      currentDate,
      holidays,
      vacations,
      buffer
    );
  };





  // Calculate total allocated hours for an employee
  const calculateEmployeeAllocatedHours = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;
    
    const employeeAllocations = allocations.filter(allocation => allocation.employeeId === employeeId);
    return employeeAllocations.reduce((total, allocation) => {
      const startDate = parseISO(allocation.startDate);
      const endDate = parseISO(allocation.endDate);
      
      // Count only working days (exclude weekends and holidays)
      let workingDays = 0;
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (!isWeekendDay(currentDate) && !getHolidayForEmployeeAndDate(employee, currentDate)) {
          workingDays++;
        }
        currentDate = addDays(currentDate, 1);
      }
      
      return total + (allocation.hoursPerDay * workingDays);
    }, 0);
  };

  // Calculate allocated hours for an employee for the current month only
  const calculateEmployeeAllocatedHoursForMonthLocal = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;
    
    return calculateEmployeeAllocatedHoursForMonth(employeeId, allocations, currentDate, holidays, employee);
  };

  // Update employee's allocated hours
  const updateEmployeeAllocatedHours = async (employeeId: string) => {
    try {
      const totalAllocatedHours = calculateEmployeeAllocatedHours(employeeId);
      const employee = employees.find(e => e.id === employeeId);
      if (employee) {
        await teamMembersApi.update(parseInt(employeeId), {
          allocatedHours: totalAllocatedHours
        });
        // Update local state
        setEmployees(prev => prev.map(emp => 
          emp.id === employeeId 
            ? { ...emp, allocatedHours: totalAllocatedHours }
            : emp
        ));
      }
    } catch (error) {
      console.error('Error updating employee allocated hours:', error);
    }
  };
  
  // Get allocations for a specific employee and date
  const getAllocationsForCell = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations
      .filter(allocation => 
        allocation.employeeId === employeeId && 
        allocation.startDate <= dateStr && 
        allocation.endDate >= dateStr
      )
      .sort((a, b) => {
        // Sort by creation time (id is timestamp-based)
        // Handle both string and number IDs
        const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
        const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
        return aId - bId; // First created (smaller ID) comes first
      });
  };

  // New function to get unified allocations for an employee across the entire month
  const getUnifiedAllocationsForEmployee = (employeeId: string) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Get all allocations for this employee that overlap with the current month
    const employeeAllocations = allocations
      .filter(allocation => allocation.employeeId === employeeId)
      .filter(allocation => {
        const allocationStart = new Date(allocation.startDate + 'T00:00:00');
        const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
        return allocationEnd >= monthStart && allocationStart <= monthEnd;
      })
      .sort((a, b) => {
        // Sort by creation time (id is timestamp-based)
        const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
        const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
        return aId - bId; // First created (smaller ID) comes first
      });

    return employeeAllocations;
  };

  // New function to get only overlapping allocations for rendering
  const getOverlappingAllocationsForEmployee = (employeeId: string) => {
    try {
      const calendarDays = getCalendarDays();
      const overlappingAllocations = new Set<ProjectAllocation>();
      
      // Find all allocations that overlap on any day
      calendarDays.forEach(date => {
        const dayAllocations = getAllocationsForCell(employeeId, date);
        dayAllocations.forEach(allocation => {
          overlappingAllocations.add(allocation);
        });
      });
      
      // Convert to array and sort by creation time
      return Array.from(overlappingAllocations).sort((a, b) => {
        const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
        const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
        return aId - bId;
      });
    } catch (error) {
      console.error('Error getting overlapping allocations for employee:', error, { employeeId });
      return [];
    }
  };

  // New function to calculate the visual position and dimensions for unified allocations
  const getUnifiedAllocationStyle = (allocation: ProjectAllocation, index: number, totalAllocations: number) => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarDays = getCalendarDays();
      
      // Calculate the effective start and end dates within the current month view
      const allocationStart = new Date(allocation.startDate + 'T00:00:00');
      const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
      
      // Validate dates
      if (isNaN(allocationStart.getTime()) || isNaN(allocationEnd.getTime())) {
        console.error('Invalid allocation dates:', { startDate: allocation.startDate, endDate: allocation.endDate });
        return { display: 'none' };
      }
      
      const effectiveStart = allocationStart < monthStart ? monthStart : allocationStart;
      const effectiveEnd = allocationEnd > monthEnd ? monthEnd : allocationEnd;
      
      // Find the column indices for start and end dates
      const startColIndex = calendarDays.findIndex(date => isSameDay(date, effectiveStart));
      const endColIndex = calendarDays.findIndex(date => isSameDay(date, effectiveEnd));
      
      if (startColIndex === -1 || endColIndex === -1) {
        console.warn('Allocation outside current month view:', { 
          allocationId: allocation.id,
          startColIndex, 
          endColIndex,
          effectiveStart: effectiveStart.toISOString(),
          effectiveEnd: effectiveEnd.toISOString()
        });
        return { display: 'none' };
      }
      
      // Calculate position and width
      const left = `${startColIndex * 60}px`; // 60px per day column
      const width = `${(endColIndex - startColIndex + 1) * 60}px`; // Width spans all days
      
      // Calculate vertical position for stacking - start from top of calendar cell
      const allocationHeight = 24; // Height of each allocation rectangle
      const verticalSpacing = 4; // Spacing between allocations
      const top = `${index * (allocationHeight + verticalSpacing)}px`; // Start from top-left corner of calendar cell
      
      const style = {
        position: 'absolute' as const,
        left,
        top,
        width,
        height: `${allocationHeight}px`,
        zIndex: 10 + index, // Higher index allocations appear on top
      };
      
      return style;
    } catch (error) {
      console.error('Error calculating unified allocation style:', error, { allocation, index, totalAllocations });
      return { display: 'none' };
    }
  };

  // New function to calculate the total height needed for an employee row
  const getEmployeeRowHeight = (employeeId: string) => {
    // Find the maximum number of overlapping allocations on any single day in the current month
    const calendarDays = getCalendarDays();
    let maxOverlappingAllocations = 0;
    
    calendarDays.forEach(date => {
      const dayAllocations = getAllocationsForCell(employeeId, date);
      maxOverlappingAllocations = Math.max(maxOverlappingAllocations, dayAllocations.length);
    });
    
    if (maxOverlappingAllocations === 0) {
      return 40; // Minimum height for empty rows
    }
    
    const allocationHeight = 24;
    const verticalSpacing = 4;
    const baseHeight = 40; // Base height for the row (employee info area)
    
    // Calculate total height: base height + space for maximum overlapping allocations on any day
    return baseHeight + (maxOverlappingAllocations * (allocationHeight + verticalSpacing)) - verticalSpacing;
  };
  
  // Get allocation that starts on a specific date (for left edge resize)
  const getAllocationStartingOnDate = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations.find(allocation => 
      allocation.employeeId === employeeId && 
      allocation.startDate === dateStr
    );
  };
  
  // Get allocation that ends on a specific date (for right edge resize)
  const getAllocationEndingOnDate = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations.find(allocation => 
      allocation.employeeId === employeeId && 
      allocation.endDate === dateStr
    );
  };
  
  // Get vacation for a specific employee and date
  const getVacationForCell = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return vacations.find(vacation => 
      vacation.employee_id === employeeId && 
      vacation.start_date <= dateStr && 
      vacation.end_date >= dateStr
    );
  };
  
  // Get holiday for a specific date
  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.find(holiday => holiday.date === dateStr);
  };

  const getHolidayForEmployeeAndDate = (employee: Employee, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(holiday => holiday.date === dateStr);
    if (!holiday) return null;
    
    // Check if the holiday applies to this employee's country
    if (holiday.country === 'Both' || holiday.country === employee.country) {
      return holiday;
    }
    
    return null;
  };
  
  // Drag and drop handlers
  const handleDragStart = (event: React.DragEvent, project: Project) => {
    setDragItem(project);
    event.dataTransfer.effectAllowed = 'copy';
    setDraggingAllocationFromTimeline(null);
  };

  const handleAllocationDragStartFromTimeline = (event: React.DragEvent, allocation: ProjectAllocation) => {
    setDraggingAllocationFromTimeline(allocation);
    event.dataTransfer.effectAllowed = 'move';
    setDragItem(null);
  };

  const handleAllocationDragStart = (event: React.MouseEvent, allocation: ProjectAllocation) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Don't start dragging if we're in a double-click state
    if (isDoubleClicking) {
      return;
    }
    
    // Only start dragging if it's not a resize handle or delete button
    const target = event.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('.drag-to-delete')) {
      return;
    }
    
    // Only start dragging if clicking on the main allocation element or its direct children
    const allocationElement = event.currentTarget as HTMLElement;
    if (target !== allocationElement && !allocationElement.contains(target)) {
      return;
    }
    
    // Record the starting position for drag distance calculation
    setDragStartPosition({ x: event.clientX, y: event.clientY });
    
    setDraggingAllocation({
      allocation,
      originalStartDate: new Date(allocation.startDate + 'T00:00:00'),
      originalEndDate: new Date(allocation.endDate + 'T00:00:00'),
      mouseOffset: { x: event.clientX, y: event.clientY }
    });
    setDragOverCell(null);
  };

  const handleAllocationDoubleClick = (allocation: ProjectAllocation) => {
    // Set double-clicking state to prevent drag
    setIsDoubleClicking(true);
    
    // Clear any existing timeout
    if (doubleClickTimeout) {
      clearTimeout(doubleClickTimeout);
    }
    
    // Reset double-clicking state after a short delay
    const timeout = setTimeout(() => {
      setIsDoubleClicking(false);
    }, 300);
    
    setDoubleClickTimeout(timeout);
    
    // Open edit dialog
    setEditingAllocation(allocation);
    // Fix timezone issue by parsing dates correctly
    setEditStartDate(new Date(allocation.startDate + 'T00:00:00'));
    setEditEndDate(new Date(allocation.endDate + 'T00:00:00'));
    // Set hours per day from allocation
    setEditHoursPerDay(allocation.hoursPerDay);
    // Reset date picker states
    setStartDatePickerOpen(false);
    setEndDatePickerOpen(false);
    setEditDialogOpen(true);
  };

  const handleSaveAllocation = async () => {
    if (!editingAllocation || !editStartDate || !editEndDate) return;
    
    if (editEndDate < editStartDate) {
      toast({
        title: "Invalid Date Range",
        description: "End date cannot be before start date. Please select a valid date range.",
        variant: "destructive",
      });
      return;
    }


    
    try {
      await projectAllocationsApi.update(parseInt(editingAllocation.id.toString()), {
        startDate: format(editStartDate, 'yyyy-MM-dd'),
        endDate: format(editEndDate, 'yyyy-MM-dd'),
        hoursPerDay: editHoursPerDay
      });
      
      // Update local state
      setAllocations(prev => prev.map(allocation => 
        allocation.id === editingAllocation.id 
          ? { ...allocation, startDate: format(editStartDate, 'yyyy-MM-dd'), endDate: format(editEndDate, 'yyyy-MM-dd'), hoursPerDay: editHoursPerDay }
          : allocation
      ));
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(editingAllocation.employeeId);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('projectAllocationsUpdate'));
      
      toast({
        title: "Success",
        description: "Allocation updated successfully.",
      });
      
      setEditDialogOpen(false);
      setEditingAllocation(null);
      
    } catch (error) {
      console.error('Error updating allocation:', error);
      toast({
        title: "Error",
        description: "Failed to update allocation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllocation = () => {
    if (!editingAllocation) return;
    setDeletingAllocation(editingAllocation);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAllocation = async () => {
    if (!deletingAllocation) return;
    
    try {
      await projectAllocationsApi.delete(deletingAllocation.id);
      
      // Update local state
      setAllocations(prev => prev.filter(allocation => allocation.id !== deletingAllocation.id));
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(deletingAllocation.employeeId);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('projectAllocationsUpdate'));
      
      toast({
        title: "Success",
        description: "Allocation deleted successfully.",
      });
      
      setDeleteDialogOpen(false);
      setDeletingAllocation(null);
      setEditDialogOpen(false);
      setEditingAllocation(null);
      
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast({
        title: "Error",
        description: "Failed to delete allocation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent, employeeId: string, date: Date) => {
    event.preventDefault();
    setDragOverCell({ employeeId, date });
  };

  const handleAllocationDragOver = (event: React.MouseEvent, employeeId: string, date: Date) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggingAllocation) {
      // Only allow dragging within the same employee row
      if (draggingAllocation.allocation.employeeId === employeeId) {
        setDragOverCell({ employeeId, date });
      }
    }
  };

  // New function to handle unified allocation drag over
  const handleUnifiedAllocationDragOver = (event: React.MouseEvent, employeeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (draggingAllocation) {
      // Only allow dragging within the same employee row
      if (draggingAllocation.allocation.employeeId === employeeId) {
        // Find the date under the mouse cursor
        const calendarContainer = document.querySelector('[data-calendar-container]') as HTMLElement;
        if (calendarContainer) {
          const rect = calendarContainer.getBoundingClientRect();
          const x = event.clientX - rect.left - 150; // Subtract employee column width
          const dayIndex = Math.floor(x / 60); // 60px per day column
          const calendarDays = getCalendarDays();
          
          if (dayIndex >= 0 && dayIndex < calendarDays.length) {
            const targetDate = calendarDays[dayIndex];
            setDragOverCell({ employeeId, date: targetDate });
          }
        }
      }
    }
  };

  const handleDrop = async (event: React.DragEvent, employeeId: string, date: Date) => {
    event.preventDefault();
    
    if (!dragItem || !dragItem.id) return;
    
    // Check if this project is already allocated to this employee on this date
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingAllocation = allocations.find(allocation => 
      allocation.employeeId === employeeId && 
      allocation.projectId === dragItem.id.toString() &&
      allocation.startDate <= dateStr && 
      allocation.endDate >= dateStr
    );
    
    if (existingAllocation) {
      toast({
        title: "Duplicate Project",
        description: `${dragItem.name} is already allocated to this employee on this date.`,
        variant: "destructive",
      });
      setDragItem(null);
      setDragOverCell(null);
      return;
    }
    
    try {
      // Get the employee to determine their country and working hours
      const employee = employees.find(e => e.id === employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // Check if the allocation is on a weekend or holiday
      const isWeekendAllocation = isWeekendDay(date);
      const holiday = getHolidayForEmployeeAndDate(employee, date);
      const isHolidayAllocation = holiday !== null;
      
      // Calculate hours per day based on country working hours (0 for weekends and holidays)
      const weeklyHours = getWorkingHoursForCountry(employee.country);
      const hoursPerDay = (isWeekendAllocation || isHolidayAllocation) ? 0 : weeklyHours / 5; // 0 hours for weekends and holidays, normal hours for weekdays
      
      // Check for overallocation
      const overallocationInfo = checkForOverallocation(employeeId, date, dragItem.id.toString(), hoursPerDay);
      
      if (overallocationInfo) {
        // Initialize hours for all allocations including the new one
        const hoursMap: {[key: string]: number} = {};
        
        // Set hours for existing allocations
        overallocationInfo.conflictingAllocations.forEach(allocation => {
          hoursMap[allocation.id.toString()] = allocation.hoursPerDay;
        });
        
        // Set hours for the new allocation
        hoursMap['new'] = hoursPerDay;
        
        setOverallocationHours(hoursMap);
        setOverallocationData(overallocationInfo);
        setOverallocationDialogOpen(true);
        setDragItem(null);
        setDragOverCell(null);
        return;
      }
      
      const newAllocation = {
        employeeId: employeeId,
        projectId: dragItem.id.toString(),
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd'), // Start with single day, can be resized
        hoursPerDay: hoursPerDay,
        status: 'active'
      };

      const createdAllocation = await projectAllocationsApi.create(newAllocation);
      
      // Update local allocations state immediately
      setAllocations(prev => [...prev, createdAllocation]);
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(employeeId);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('projectAllocationsUpdate'));
      

      
      toast({
        title: "Success",
        description: `${dragItem.name} assigned to ${employees.find(e => e.id === employeeId)?.name} on ${format(date, 'MMM dd, yyyy')} ${isWeekendAllocation ? '(weekend - no working hours)' : isHolidayAllocation ? `(holiday - no working hours)` : `(${formatHours(hoursPerDay)}h/day)`}`,
      });
      
    } catch (error) {
      console.error('Error creating allocation:', error);
      toast({
        title: "Error",
        description: "Failed to create allocation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDragItem(null);
      setDragOverCell(null);
    }
  };

  const handleAllocationDrop = useCallback(async (event: React.MouseEvent, employeeId: string, date: Date) => {
    if (!draggingAllocation) return;
    
    // Only allow horizontal movement (same employee)
    if (draggingAllocation.allocation.employeeId !== employeeId) {
      toast({
        title: "Invalid Move",
        description: "Allocations can only be moved horizontally within the same employee row. To assign a project to a different employee, drag from the Projects box above.",
        variant: "destructive",
      });
      setDraggingAllocation(null);
      setDragOverCell(null);
      return;
    }
    
    // Calculate the new position based on the drop target
    const allocationDuration = differenceInDays(
      new Date(draggingAllocation.originalEndDate), 
      new Date(draggingAllocation.originalStartDate)
    );
    
    // The drop date becomes the new start date
    const newStartDate = date;
    const newEndDate = addDays(date, allocationDuration);
    
    // Check for conflicts with other allocations (excluding the current one being moved)
    const conflictingAllocation = allocations.find(allocation => 
      allocation.id !== draggingAllocation.allocation.id && // Exclude current allocation
      allocation.employeeId === employeeId && 
      allocation.projectId === draggingAllocation.allocation.projectId &&
      (
        (allocation.startDate <= format(newStartDate, 'yyyy-MM-dd') && allocation.endDate >= format(newStartDate, 'yyyy-MM-dd')) ||
        (allocation.startDate <= format(newEndDate, 'yyyy-MM-dd') && allocation.endDate >= format(newEndDate, 'yyyy-MM-dd')) ||
        (allocation.startDate >= format(newStartDate, 'yyyy-MM-dd') && allocation.endDate <= format(newEndDate, 'yyyy-MM-dd'))
      )
    );
    
    if (conflictingAllocation) {
      const projectName = projects.find(p => p.id.toString() === draggingAllocation.allocation.projectId)?.name || 'Project';
      toast({
        title: "Duplicate Project",
        description: `${projectName} is already allocated to this employee during this period.`,
        variant: "destructive",
      });
      setDraggingAllocation(null);
      setDragOverCell(null);
      return;
    }
    
    try {
      await projectAllocationsApi.update(parseInt(draggingAllocation.allocation.id.toString()), {
        employeeId: employeeId, // Same employee (horizontal movement only)
        projectId: draggingAllocation.allocation.projectId,
        startDate: format(newStartDate, 'yyyy-MM-dd'),
        endDate: format(newEndDate, 'yyyy-MM-dd')
      });
      
      // Update allocated hours for the employee
      await updateEmployeeAllocatedHours(employeeId);
      
      toast({
        title: "Success",
        description: "Allocation moved successfully.",
      });
      
      // Reload data
      const allocationsData = await projectAllocationsApi.getAll();
      setAllocations(allocationsData);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('projectAllocationsUpdate'));
      
    } catch (error) {
      console.error('Error moving allocation:', error);
      toast({
        title: "Error",
        description: "Failed to move allocation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDraggingAllocation(null);
    }
  }, [draggingAllocation, allocations, projects, toast, updateEmployeeAllocatedHours]);

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleProjectsBoxDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (draggingAllocationFromTimeline) {
      setDragOverProjectsBox(true);
    }
  };

  const handleProjectsBoxDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOverProjectsBox(false);
  };

  const handleProjectsBoxDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggingAllocationFromTimeline) return;
    
    try {
      // Get the employee ID before deleting the allocation
      const employeeId = draggingAllocationFromTimeline.employeeId;
      
      // Delete the allocation
      await projectAllocationsApi.delete(draggingAllocationFromTimeline.id);
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(employeeId);
      
      toast({
        title: "Allocation Removed",
        description: `Project allocation has been removed from the timeline.`,
      });
      
      // Reload data
      const allocationsData = await projectAllocationsApi.getAll();
      setAllocations(allocationsData);
      
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast({
        title: "Error",
        description: "Failed to remove allocation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDraggingAllocationFromTimeline(null);
      setDragOverProjectsBox(false);
    }
  };

  // Overallocation dialog handlers
  const handleOverallocationConfirm = async () => {
    if (!overallocationData) return;
    
    try {
      const newAllocation = {
        employeeId: overallocationData.employeeId,
        projectId: overallocationData.projectId,
        startDate: format(overallocationData.date, 'yyyy-MM-dd'),
        endDate: format(overallocationData.date, 'yyyy-MM-dd'),
        hoursPerDay: overallocationHours['new'] || 0,
        status: 'active'
      };

      const createdAllocation = await projectAllocationsApi.create(newAllocation);
      
      // Update local allocations state
      setAllocations(prev => [...prev, createdAllocation]);
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(overallocationData.employeeId);
      
      toast({
        title: "Allocation Created",
        description: `${overallocationData.projectName} assigned to ${overallocationData.employeeName} with ${overallocationHours['new'] || 0}h/day.`,
      });
      
    } catch (error) {
      console.error('Error creating overallocated allocation:', error);
      toast({
        title: "Error",
        description: "Failed to create allocation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOverallocationDialogOpen(false);
      setOverallocationData(null);
      setOverallocationHours({});
    }
  };

  const handleOverallocationCancel = () => {
            setOverallocationDialogOpen(false);
        setOverallocationData(null);
        setOverallocationHours({});
  };
  
  // Resize handlers
  const handleResizeStart = (event: React.MouseEvent, allocation: ProjectAllocation, isLeftEdge: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Resize start:', { isLeftEdge, allocation: allocation.id });
    
    setResizingAllocation({
      allocationId: allocation.id.toString(),
      startDate: new Date(allocation.startDate + 'T00:00:00'),
      endDate: new Date(allocation.endDate + 'T00:00:00'),
      isLeftEdge
    });
  };

  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!resizingAllocation) return;
    
    // Find the cell under the mouse cursor using elementFromPoint
    const elementAtPoint = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    const cell = elementAtPoint?.closest('[data-date]') as HTMLElement;
    
    if (cell) {
      const dateStr = cell.getAttribute('data-date');
      if (dateStr) {
        const targetDate = new Date(dateStr + 'T00:00:00');
        
        console.log('Resize move:', { 
          isLeftEdge: resizingAllocation.isLeftEdge, 
          targetDate: dateStr,
          currentStart: format(resizingAllocation.startDate, 'yyyy-MM-dd'),
          currentEnd: format(resizingAllocation.endDate, 'yyyy-MM-dd')
        });
        
        if (resizingAllocation.isLeftEdge) {
          // Resizing left edge - update start date
          // Allow moving the start date in any direction as long as it doesn't go past the end date
          if (targetDate <= resizingAllocation.endDate) {
            setResizingAllocation({
              ...resizingAllocation,
              startDate: targetDate
            });
          }
        } else {
          // Resizing right edge - update end date
          // Allow moving the end date in any direction as long as it doesn't go before the start date
          if (targetDate >= resizingAllocation.startDate) {
            setResizingAllocation({
              ...resizingAllocation,
              endDate: targetDate
            });
          }
        }
      }
    }
  }, [resizingAllocation]);

  const handleResizeEnd = useCallback(async () => {
    if (!resizingAllocation) return;
    

    
    try {
      const employeeId = allocations.find(a => a.id.toString() === resizingAllocation.allocationId)?.employeeId || '';
      
      await projectAllocationsApi.update(parseInt(resizingAllocation.allocationId), {
        employeeId: employeeId,
        projectId: allocations.find(a => a.id.toString() === resizingAllocation.allocationId)?.projectId || '',
        startDate: format(resizingAllocation.startDate, 'yyyy-MM-dd'),
        endDate: format(resizingAllocation.endDate, 'yyyy-MM-dd')
      });
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(employeeId);
      
      toast({
        title: "Success",
        description: "Allocation resized successfully.",
      });
      
      // Reload data
      const allocationsData = await projectAllocationsApi.getAll();
      setAllocations(allocationsData);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('projectAllocationsUpdate'));
      
    } catch (error) {
      console.error('Error resizing allocation:', error);
      toast({
        title: "Error",
        description: "Failed to resize allocation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResizingAllocation(null);
    }
  }, [resizingAllocation, allocations, toast, updateEmployeeAllocatedHours]);
  

  


  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [employeesData, projectsData, allocationsData] = await Promise.all([
          getCurrentEmployees(),
          projectsApi.getAll(),
          projectAllocationsApi.getAll()
        ]);
        
        setEmployees(employeesData);
        setProjects(projectsData);
        setAllocations(allocationsData);
        
      } catch (error) {
        console.error('Error loading Calendar data:', error);
        setError('Failed to load calendar data. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load calendar data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

    // Listen for settings updates to trigger recalculations
  useEffect(() => {
    const handleSettingsUpdate = () => {
      // Force re-render by updating a state that triggers recalculation
      setCurrentDate(new Date(currentDate));
    };

    const handleHolidaysUpdate = () => {
      // Refresh holidays and force re-render
      refreshHolidays();
      setCurrentDate(new Date(currentDate));
    };

    const handleTimeOffsUpdate = () => {
      // Refresh time offs and force re-render
      refreshTimeOffs();
      setCurrentDate(new Date(currentDate));
    };

    window.addEventListener('settingsUpdate', handleSettingsUpdate);
    window.addEventListener('holidaysUpdate', handleHolidaysUpdate);
    window.addEventListener('timeOffsUpdate', handleTimeOffsUpdate);

    return () => {
      window.removeEventListener('settingsUpdate', handleSettingsUpdate);
      window.removeEventListener('holidaysUpdate', handleHolidaysUpdate);
      window.removeEventListener('timeOffsUpdate', handleTimeOffsUpdate);
    };
      }, [currentDate, refreshHolidays, refreshTimeOffs]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openTooltipId && !(event.target as Element).closest('[data-tooltip-trigger]')) {
        setOpenTooltipId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openTooltipId]);

  // Cleanup double-click timeout on unmount
  useEffect(() => {
    return () => {
      if (doubleClickTimeout) {
        clearTimeout(doubleClickTimeout);
      }
    };
  }, [doubleClickTimeout]);

  // Add resize and drag event listeners
          useEffect(() => {
      if (resizingAllocation || draggingAllocation) {
        const handleMouseMove = (e: MouseEvent) => {
          if (resizingAllocation) {
            handleResizeMove(e);
          }
          if (draggingAllocation) {
            // Update drag preview position if needed
            // The drag preview is handled by the cell's onMouseOver event
          }
        };
              const handleMouseUp = (e: MouseEvent) => {
          if (resizingAllocation) {
            handleResizeEnd();
          }
          if (draggingAllocation && dragStartPosition) {
            // Calculate drag distance
            const dragDistance = Math.sqrt(
              Math.pow(e.clientX - dragStartPosition.x, 2) + 
              Math.pow(e.clientY - dragStartPosition.y, 2)
            );
            
            // Only process drop if we've moved enough to consider it a drag
            if (dragDistance >= DRAG_THRESHOLD) {
              // Find the cell under the mouse cursor at the exact moment of drop
              // Use the same offset as the drag preview positioning
              const adjustedX = e.clientX + 10;
              const adjustedY = e.clientY - 20;
              const elementAtPoint = document.elementFromPoint(adjustedX, adjustedY) as HTMLElement;
              const cell = elementAtPoint?.closest('[data-date]') as HTMLElement;
              
              if (cell) {
                const dateStr = cell.getAttribute('data-date');
                const employeeId = cell.closest('[data-employee]')?.getAttribute('data-employee');
                
                if (dateStr && employeeId) {
                  const targetDate = new Date(dateStr);
                  handleAllocationDrop(e as unknown as React.MouseEvent, employeeId, targetDate);
                } else {
                  // If we can't find a valid drop target, cancel the drag
                  setDraggingAllocation(null);
                  setDragOverCell(null);
                }
              } else {
                // If we can't find a cell, cancel the drag
                setDraggingAllocation(null);
                setDragOverCell(null);
              }
            } else {
              // If we haven't moved enough, just cancel the drag without showing any toast
              setDraggingAllocation(null);
              setDragOverCell(null);
            }
            
            // Reset drag start position
            setDragStartPosition(null);
          }
        };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingAllocation, draggingAllocation, dragStartPosition, handleAllocationDrop, handleResizeEnd, handleResizeMove]);

  // Handle clicking outside date pickers to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.date-picker-container')) {
        setStartDatePickerOpen(false);
        setEndDatePickerOpen(false);
      }
    };

    if (startDatePickerOpen || endDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [startDatePickerOpen, endDatePickerOpen]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Calendar View</h1>
        <p>Loading calendar data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Calendar View</h1>
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }
  
  const calendarDays = getCalendarDays();
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Resource Calendar</h2>
          <p className="text-muted-foreground text-sm">
            Drag and drop projects to allocate tasks, and resize durations by dragging rectangles horizontally.
          </p>
        </div>

      </div>

      {/* Projects Sidebar - Top */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Projects</CardTitle>
          <p className="text-muted-foreground text-sm">
            Drag and drop projects to allocate team members.
          </p>
        </CardHeader>
        <CardContent
          onDragOver={handleProjectsBoxDragOver}
          onDragLeave={handleProjectsBoxDragLeave}
          onDrop={handleProjectsBoxDrop}
          className={cn(
            "transition-colors duration-200",
            dragOverProjectsBox && "bg-red-50 border-red-200"
          )}
        >
          <div className="flex flex-wrap gap-2">
            {/* Drop zone indicator */}
            {dragOverProjectsBox && (
              <div className="w-full p-4 border-2 border-dashed border-red-400 bg-red-50 rounded-md text-center text-red-600 font-medium">
                Drop here to remove allocation
              </div>
            )}
            {projects
              .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
              .map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "p-1.5 border rounded-md cursor-move hover:bg-muted/50 transition-colors",
                    "flex items-center justify-center min-w-[100px] max-w-[130px] h-8"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project)}
                  style={{ 
                    backgroundColor: project.color,
                    borderColor: project.color,
                    color: getContrastColor(project.color) // Ensure text is readable
                  }}
                >
                  <GripVertical className="h-2.5 w-2.5 text-current opacity-70 mr-1" />
                  <span className="font-medium text-xs truncate">{project.name}</span>
                </div>
              ))}
            {projects.length === 0 && (
              <div className="text-center py-4 text-muted-foreground w-full">
                <p>No projects available</p>
                <p className="text-xs">Create projects in the Projects tab</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid - Below */}
      <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {/* Smart Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="relative">
                    <Input
                      placeholder="🔍 Smart search: name, role, country, or project..."
                      value={smartFilter}
                      onChange={(e) => setSmartFilter(e.target.value)}
                      className="w-80 h-8 pr-8"
                    />
                    {smartFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSmartFilter("")}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  

                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHeatmapMode(!heatmapMode)}
                  className={cn(
                    "flex items-center gap-2 h-8 transition-all duration-200",
                    heatmapMode && "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  )}
                >
                  <Flame className="h-4 w-4" />
                  Heatmap
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHolidays(!showHolidays)}
                  className={cn(
                    "flex items-center gap-2 h-8 transition-all duration-200",
                    showHolidays && "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  Holidays + Time Off
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
                         <div className="overflow-x-auto">
               <div className="min-w-max" data-calendar-container>
                 {/* Header row with dates */}
                 <div className="grid" style={{ gridTemplateColumns: `220px repeat(${calendarDays.length}, 60px)` }}>
                   <div className="p-0.5 font-medium text-xs border-b border-r bg-muted/30 flex items-center justify-center">
                     Team Members
                   </div>
                                        {calendarDays.map((date) => {
                       const holiday = getHolidayForDate(date);
                       const isWeekendCell = isWeekendDay(date);
                       return (
                       <div
                         key={date.toISOString()}
                         className={cn(
                           "p-0.5 text-center text-xs border-b border-r bg-muted/30",
                           isSameDay(date, new Date()) && "bg-primary/10 font-semibold",
                           isWeekendCell && "weekend-cell"
                         )}
                       >
                         <div className="text-xs text-muted-foreground font-medium">{getDayName(date)}</div>
                         <div className="font-medium">{getDate(date)}</div>
                       </div>
                     );
                   })}
                 </div>

                 {/* Employee rows */}
                 {getFilteredEmployees().length === 0 ? (
                   <div className="col-span-full p-8 text-center text-muted-foreground">
                     <p>No employees match the selected filters.</p>
                     <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                       Clear Filters
                     </Button>
                   </div>
                 ) : (
                   <>
                     {smartFilter && (
                       <div className="col-span-full p-2 bg-muted/30 border-b text-xs text-muted-foreground">
                         Showing {getFilteredEmployees().length} of {employees.length} employees
                       </div>
                     )}
                     {getFilteredEmployees().map((employee) => {
                   try {
                     const overlappingAllocations = getOverlappingAllocationsForEmployee(employee.id);
                     const rowHeight = getEmployeeRowHeight(employee.id);
                   
                   return (
                     <div
                       key={employee.id}
                       data-employee={employee.id}
                       className="grid relative"
                       style={{ 
                         gridTemplateColumns: `220px repeat(${calendarDays.length}, 60px)`,
                         minHeight: `${rowHeight}px`
                       }}
                     >
                       {/* Employee info column */}
                       <div className="p-2 border-b border-r bg-muted/10">
                         <div className="flex items-center space-x-2 mb-2">
                           <Avatar className="h-8 w-8">
                             <AvatarFallback className="text-xs bg-primary/10 text-primary">
                               {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                             </AvatarFallback>
                           </Avatar>
                           <div className="flex-1 min-w-0">
                             <div className="font-medium text-sm truncate flex items-center space-x-1">
                               <span>{employee.name}</span>
                               <span>{COUNTRY_FLAGS[employee.country]}</span>
                             </div>
                             <div className="text-xs text-muted-foreground truncate">
                               <span>{employee.role}</span>
                             </div>
                           </div>
                         </div>
                         <div className="mt-2">
                           <div className="w-full bg-gray-200 rounded-full h-1.5">
                             <div
                               className={cn(
                                 "h-1.5 rounded-full transition-all duration-300",
                                 getAllocationColor(getEmployeeAllocationPercentage(employee))
                               )}
                               style={{ width: `${Math.min(getEmployeeAllocationPercentage(employee), 100)}%` }}
                             />
                           </div>
                           <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-between">
                             <span className={cn(
                               getEmployeeAllocationPercentage(employee) > 100 && "text-red-600 font-medium"
                             )}>
                               {formatHours(calculateEmployeeAllocatedHoursForMonthLocal(employee.id))}h / {formatHours(getEmployeeAvailableHoursLocal(employee))}h ({Math.round(getEmployeeAllocationPercentage(employee))}%)
                               {getEmployeeAllocationPercentage(employee) > 100 && " ⚠️"}
                             </span>
                             <TooltipProvider>
                               <Tooltip open={openTooltipId === employee.id} onOpenChange={(open) => setOpenTooltipId(open ? employee.id : null)}>
                                 <TooltipTrigger asChild>
                                   <button 
                                     className="ml-1 p-0.5 rounded-full hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                                     data-tooltip-trigger
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setOpenTooltipId(openTooltipId === employee.id ? null : employee.id);
                                     }}
                                   >
                                     <svg className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                     </svg>
                                   </button>
                                 </TooltipTrigger>
                                 <TooltipContent side="right" className="max-w-xs" sideOffset={5}>
                                   <div className="space-y-2">
                                     <div className="font-semibold text-sm border-b pb-1">Allocation Breakdown</div>
                                     {(() => {
                                       const breakdown = calculateEmployeeBreakdown(employee, currentDate, holidays, vacations, buffer);
                                       return (
                                         <div className="space-y-1 text-xs">
                                           <div className="flex justify-between">
                                             <span>Max hours / month:</span>
                                             <span className="font-medium">{formatHours(breakdown.maxHoursPerMonth)}</span>
                                           </div>
                                           <div className="flex justify-between">
                                             <span>Max hours / week:</span>
                                             <span className="font-medium">{formatHours(breakdown.maxHoursPerWeek)}</span>
                                           </div>
                                           <div className="flex justify-between">
                                             <span>Max hours / day:</span>
                                             <span className="font-medium">{formatHours(breakdown.maxHoursPerDay)}</span>
                                           </div>
                                           {breakdown.bufferHours > 0 && (
                                             <div className="flex justify-between text-red-600">
                                               <span>Deducted buffer time:</span>
                                               <span className="font-medium">-{formatHours(breakdown.bufferHours)}</span>
                                             </div>
                                           )}
                                           {breakdown.bufferHours === 0 && (
                                             <div className="flex justify-between text-red-600">
                                               <span>Deducted buffer time:</span>
                                               <span className="font-medium">0</span>
                                             </div>
                                           )}
                                           {breakdown.holidayHours > 0 && (
                                             <div className="flex justify-between text-red-600">
                                               <span>Deducted holiday time:</span>
                                               <span className="font-medium">-{formatHours(breakdown.holidayHours)}</span>
                                             </div>
                                           )}
                                           {breakdown.holidayHours === 0 && (
                                             <div className="flex justify-between text-red-600">
                                               <span>Deducted holiday time:</span>
                                               <span className="font-medium">0</span>
                                             </div>
                                           )}
                                           {breakdown.vacationHours > 0 && (
                                             <div className="flex justify-between text-red-600">
                                               <span>Deducted time off:</span>
                                               <span className="font-medium">-{formatHours(breakdown.vacationHours)}</span>
                                             </div>
                                           )}
                                           {breakdown.vacationHours === 0 && (
                                             <div className="flex justify-between text-red-600">
                                               <span>Deducted time off:</span>
                                               <span className="font-medium">0</span>
                                             </div>
                                           )}
                                           <div className="flex justify-between text-red-600">
                                             <span>Deducted weekends time:</span>
                                             <span className="font-medium">-{formatHours(breakdown.weekendHours)}</span>
                                           </div>
                                           <div className="flex justify-between border-t pt-1">
                                             <span>Total available hours:</span>
                                             <span className="font-medium">{formatHours(breakdown.totalAvailableHours)}</span>
                                           </div>
                                           <div className="flex justify-between border-t pt-1">
                                             <span>Allocated hours:</span>
                                             <span className={cn(
                                               "font-medium",
                                               getEmployeeAllocationPercentage(employee) > 100 ? "text-red-600" : "text-green-600"
                                             )}>
                                               {formatHours(calculateEmployeeAllocatedHoursForMonthLocal(employee.id))}
                                             </span>
                                           </div>
                                           <div className="flex justify-between">
                                             <span>Allocation percentage:</span>
                                             <span className={cn(
                                               "font-medium",
                                               getEmployeeAllocationPercentage(employee) > 100 ? "text-red-600" : "text-green-600"
                                             )}>
                                               {Math.round(getEmployeeAllocationPercentage(employee))}%
                                               {getEmployeeAllocationPercentage(employee) > 100 && " (OVERALLOCATED)"}
                                             </span>
                                           </div>
                                         </div>
                                       );
                                     })()}
                                   </div>
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                           </div>
                         </div>
                       </div>
                       
                       {/* Calendar day columns */}
                       {calendarDays.map((date) => {
                         const allocations = getAllocationsForCell(employee.id, date);
                         const vacation = getVacationForCell(employee.id, date);
                         const holiday = getHolidayForEmployeeAndDate(employee, date);
                         const isWeekendCell = isWeekendDay(date);
                         const isDragOver = dragOverCell?.employeeId === employee.id && isSameDay(dragOverCell.date, date);
                         
                         return (
                           <div
                             key={`${employee.id}-${date.toISOString()}`}
                             data-date={format(date, 'yyyy-MM-dd')}
                             className={cn(
                               "p-0.5 border-b border-r relative transition-all duration-200",
                               isWeekendCell && "weekend-cell",
                               holiday && showHolidays && "holiday-cell",
                               vacation && showHolidays && "timeoff-cell",
                               "hover:bg-muted/30"
                             )}
                             style={{ minHeight: `${rowHeight}px` }}
                             onDragOver={(e) => handleDragOver(e, employee.id, date)}
                             onDrop={(e) => handleDrop(e, employee.id, date)}
                             onDragLeave={handleDragLeave}
                             onMouseOver={(e) => draggingAllocation && handleAllocationDragOver(e, employee.id, date)}
                             onMouseUp={(e) => draggingAllocation && handleAllocationDrop(e, employee.id, date)}
                           >
                                                                                         {/* Drag shadow preview */}
                              {isDragOver && (dragItem || draggingAllocation) && (
                                <div
                                  className="absolute inset-1 rounded-md border-2 border-dashed opacity-50 z-10 pointer-events-none"
                                  style={{ 
                                    borderColor: '#6b7280' // Grey color for drag shadow
                                  }}
                                >
                                  <div 
                                    className="p-0.5 text-xs font-medium truncate flex items-center justify-center h-full text-gray-800"
                                  >
                                    <span className="drop-shadow-sm">
                                      {dragItem ? dragItem.name : 'Moving allocation'}
                                    </span>
                                  </div>
                                </div>
                              )}
                             
                             {/* Heatmap View */}
                             {heatmapMode ? (
                               <div 
                                 className="relative w-full h-full"
                                 title={(() => {
                                   const dailyPercentage = getDailyAllocationPercentage(employee.id, date);
                                   const dayAllocations = getAllocationsForCell(employee.id, date);
                                   const dailyHours = dayAllocations.reduce((total, allocation) => total + allocation.hoursPerDay, 0);
                                   const employeeData = employees.find(e => e.id === employee.id);
                                   const maxDailyHours = employeeData ? getWorkingHoursForCountry(employeeData.country) / 5 : 8;
                                   
                                   if (isWeekendCell) {
                                     return "Weekend - No working hours";
                                   }
                                   
                                   if (holiday && showHolidays) {
                                     return `Holiday: ${holiday.name}`;
                                   }
                                   
                                   if (vacation && showHolidays) {
                                     return `Time Off: ${vacation.type}`;
                                   }
                                   
                                   if (dailyPercentage === 0) {
                                     return "No allocations";
                                   }
                                   
                                   return `${Math.round(dailyPercentage)}% allocated – ${formatHours(dailyHours)} out of ${formatHours(maxDailyHours)} hours used`;
                                 })()}
                               >
                                 {/* Background progress bar */}
                                 {(() => {
                                   const dailyPercentage = getDailyAllocationPercentage(employee.id, date);
                                   const dayAllocations = getAllocationsForCell(employee.id, date);
                                   const dailyHours = dayAllocations.reduce((total, allocation) => total + allocation.hoursPerDay, 0);
                                   const employeeData = employees.find(e => e.id === employee.id);
                                   const maxDailyHours = employeeData ? getWorkingHoursForCountry(employeeData.country) / 5 : 8;
                                   
                                   // Handle weekends - show empty cell (no background, no text)
                                   if (isWeekendCell) {
                                     return null;
                                   }
                                   
                                   // Handle holidays - show empty cell when holidays toggle is ON
                                   if (holiday && showHolidays) {
                                     return null;
                                   }
                                   
                                   // Handle time off periods - show empty cell when holidays toggle is ON
                                   if (vacation && showHolidays) {
                                     return null;
                                   }
                                   
                                   // Handle regular allocation percentages (excluding holidays and time off when toggle is ON)
                                   return (
                                     <>
                                       {/* Full cell background color */}
                                       <div 
                                         className={cn(
                                           "absolute inset-0 rounded-sm transition-all duration-300",
                                           getDailyAllocationColor(dailyPercentage)
                                         )}
                                       />
                                       {/* Percentage text overlay */}
                                       <div className="absolute inset-0 flex items-center justify-center z-10">
                                         <span className="text-xs heatmap-text">
                                           {Math.round(dailyPercentage)}%
                                         </span>
                                       </div>
                                     </>
                                   );
                                 })()}
                               </div>
                                                            ) : (
                                 /* Normal View - Show vacation and holiday info */
                                 <>
                                   {holiday && showHolidays && allocations.length === 0 && (
                                     <div className="p-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                       Holiday
                                     </div>
                                   )}
                                   {vacation && showHolidays && allocations.length === 0 && (
                                     <div className="p-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                       {vacation.type}
                                     </div>
                                   )}

                                 </>
                               )}
                           </div>
                         );
                       })}
                       
                        {/* Unified Allocation Rectangles - Positioned absolutely over the calendar */}
                        {!heatmapMode && (
                          <div 
                            className="absolute pointer-events-none" 
                                       style={{
             left: '220px',
             right: 0,
             top: '0px'
           }}
                            onMouseOver={(e) => handleUnifiedAllocationDragOver(e, employee.id)}
                          >
                            {overlappingAllocations.map((allocation, index) => {
                              try {
                                const project = projects.find(p => p.id.toString() === allocation.projectId);
                                const isResizing = resizingAllocation?.allocationId === allocation.id.toString();
                                const isDragging = draggingAllocation?.allocation.id === allocation.id;
                                const allocationStart = new Date(allocation.startDate + 'T00:00:00');
                                const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
                                
                                // Validate dates
                                if (isNaN(allocationStart.getTime()) || isNaN(allocationEnd.getTime())) {
                                  console.error('Invalid allocation dates in rendering:', { 
                                    allocationId: allocation.id,
                                    startDate: allocation.startDate, 
                                    endDate: allocation.endDate 
                                  });
                                  return null;
                                }
                                
                                const isStartDate = calendarDays.some(date => isSameDay(date, allocationStart));
                                const isEndDate = calendarDays.some(date => isSameDay(date, allocationEnd));
                                
                                return (
                                <div
                                  key={allocation.id}
                                  className={cn(
                                    "unified-allocation text-xs font-medium text-white truncate relative cursor-move pointer-events-auto",
                                    isResizing && "resizing",
                                    isDragging && "dragging"
                                  )}
                                  style={{
                                    ...getUnifiedAllocationStyle(allocation, index, overlappingAllocations.length),
                                    backgroundColor: project?.color || '#3b82f6'
                                  }}
                                  onMouseDown={(e) => handleAllocationDragStart(e, allocation)}
                                  onDoubleClick={() => handleAllocationDoubleClick(allocation)}
                                  title={`${project?.name || 'Unknown Project'} - Drag to move, Double-click to edit`}
                                >
                                  <div className="flex items-center justify-center h-full px-1">
                                    <span className="text-xs truncate">{project?.name || 'Unknown Project'}</span>
                                  </div>
                                  
                                  {/* Left resize area */}
                                  {isStartDate && (
                                    <div
                                      className="resize-handle absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize z-10"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResizeStart(e, allocation, true);
                                      }}
                                      title="Drag to resize start date"
                                    />
                                  )}
                                  
                                  {/* Right resize area */}
                                  {isEndDate && (
                                    <div
                                      className="resize-handle absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize z-10"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleResizeStart(e, allocation, false);
                                      }}
                                      title="Drag to resize end date"
                                    />
                                  )}
                                </div>
                              );
                              } catch (error) {
                                console.error('Error rendering allocation:', error, { allocation, index });
                                return null;
                              }
                            })}
                          </div>
                        )}
                     </div>
                   );
                   } catch (error) {
                     console.error('Error rendering employee row:', error, { employeeId: employee.id });
                     return null;
                   }
                 })}
                   </>
                 )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Allocation Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Allocation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {editingAllocation && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="project" className="text-right">
                      Project
                    </Label>
                    <div className="col-span-3">
                      <Badge 
                        style={{ 
                          backgroundColor: projects.find(p => p.id.toString() === editingAllocation.projectId)?.color || '#3b82f6',
                          color: 'white'
                        }}
                      >
                        {projects.find(p => p.id.toString() === editingAllocation.projectId)?.name || 'Unknown Project'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="employee" className="text-right">
                      Employee
                    </Label>
                    <div className="col-span-3">
                      {employees.find(e => e.id === editingAllocation.employeeId)?.name || 'Unknown Employee'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startDate" className="text-right">
                      Start Date
                    </Label>
                    <div className="col-span-3 relative date-picker-container">
                      <div
                        className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setStartDatePickerOpen(!startDatePickerOpen)}
                      >
                        <span className="text-sm">
                          {editStartDate ? format(editStartDate, 'dd/MM/yyyy') : 'Select start date'}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${startDatePickerOpen ? 'rotate-180' : ''}`} />
                      </div>
                      {startDatePickerOpen && (
                        <div className="absolute top-full left-0 z-50 mt-1 bg-background border rounded-md shadow-lg">
                          <div className="p-3">
                            <Calendar
                              mode="single"
                              selected={editStartDate}
                              onSelect={(date) => {
                                setEditStartDate(date);
                              }}
                              className="rounded-md"
                              disabled={(date) => editEndDate ? date > editEndDate : false}
                            />
                            <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStartDatePickerOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setStartDatePickerOpen(false)}
                              >
                                OK
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endDate" className="text-right">
                      End Date
                    </Label>
                    <div className="col-span-3 relative date-picker-container">
                      <div
                        className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setEndDatePickerOpen(!endDatePickerOpen)}
                      >
                        <span className="text-sm">
                          {editEndDate ? format(editEndDate, 'dd/MM/yyyy') : 'Select end date'}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${endDatePickerOpen ? 'rotate-180' : ''}`} />
                      </div>
                      {endDatePickerOpen && (
                        <div className="absolute top-full left-0 z-50 mt-1 bg-background border rounded-md shadow-lg">
                          <div className="p-3">
                            <Calendar
                              mode="single"
                              selected={editEndDate}
                              onSelect={(date) => {
                                setEditEndDate(date);
                              }}
                              className="rounded-md"
                              disabled={(date) => editStartDate ? date < editStartDate : false}
                            />
                            <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEndDatePickerOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setEndDatePickerOpen(false)}
                              >
                                OK
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="hoursPerDay" className="text-right">
                      Hours/Day
                    </Label>
                    <div className="col-span-3">
                                                                    <Input
                         id="hoursPerDay"
                         type="number"
                         min="0"
                         step="0.5"
                         value={editHoursPerDay}
                         onChange={(e) => setEditHoursPerDay(parseFloat(e.target.value) || 0)}
                         placeholder={(() => {
                           const employee = employees.find(e => e.id === editingAllocation.employeeId);
                           if (employee) {
                             const maxDailyHours = getWorkingHoursForCountry(employee.country) / 5;
                             return `Recommended: ${formatHours(maxDailyHours)}h`;
                           }
                           return "Enter hours per day";
                         })()}
                       />
                       {(() => {
                         const employee = employees.find(e => e.id === editingAllocation.employeeId);
                         if (employee) {
                           const maxDailyHours = getWorkingHoursForCountry(employee.country) / 5;
                           return (
                             <p className="text-xs text-muted-foreground mt-1">
                               Recommended daily hours for {employee.country}: {formatHours(maxDailyHours)}h (can be exceeded)
                             </p>
                           );
                         }
                         return null;
                       })()}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="destructive" onClick={handleDeleteAllocation} className="mr-auto">
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAllocation}>
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Allocation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this allocation? This action cannot be undone.
                {deletingAllocation && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <strong>Project:</strong> {projects.find(p => p.id.toString() === deletingAllocation.projectId)?.name || 'Unknown Project'}<br />
                    <strong>Employee:</strong> {employees.find(e => e.id === deletingAllocation.employeeId)?.name || 'Unknown Employee'}<br />
                    <strong>Period:</strong> {format(new Date(deletingAllocation.startDate), 'MMM dd, yyyy')} - {format(new Date(deletingAllocation.endDate), 'MMM dd, yyyy')}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteAllocation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Overallocation Warning Dialog */}
        <Dialog open={overallocationDialogOpen} onOpenChange={setOverallocationDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Overallocation Warning</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {overallocationData && (
                <>
                  <div className="p-4 bg-muted/50 border rounded-lg">
                    <p className="text-sm mb-2">
                      <strong>{overallocationData.employeeName}</strong> is already allocated to other projects on{' '}
                      <strong>{format(overallocationData.date, 'MMM dd, yyyy')}</strong>.
                    </p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Maximum daily hours:</span>
                        <span className="font-medium">{overallocationData.maxDailyHours}h</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Adjust hours for each project:</Label>
                    <div className="space-y-2">
                      {/* Existing allocations */}
                      {overallocationData.conflictingAllocations.map((allocation) => {
                        const project = projects.find(p => p.id.toString() === allocation.projectId);
                        return (
                          <div key={allocation.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <span className="text-sm font-medium">{project?.name || 'Unknown Project'}</span>
                            <Input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={overallocationHours[allocation.id.toString()] || 0}
                              onChange={(e) => setOverallocationHours(prev => ({
                                ...prev,
                                [allocation.id.toString()]: parseFloat(e.target.value) || 0
                              }))}
                              className="w-20 h-8 text-sm"
                            />
                          </div>
                        );
                      })}
                      
                      {/* New allocation */}
                      <div className="flex items-center justify-between p-2 bg-primary/10 border border-primary/20 rounded">
                        <span className="text-sm font-medium">{overallocationData.projectName} (new)</span>
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={overallocationHours['new'] || 0}
                          onChange={(e) => setOverallocationHours(prev => ({
                            ...prev,
                            'new': parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Total: {Object.values(overallocationHours).reduce((sum, hours) => sum + hours, 0)}h
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleOverallocationCancel}>
                Cancel
              </Button>
              <Button onClick={handleOverallocationConfirm}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };