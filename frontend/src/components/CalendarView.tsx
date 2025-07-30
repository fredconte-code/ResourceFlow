import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getCurrentEmployees, Employee } from "@/lib/employee-data";
import { holidaysApi, vacationsApi, projectsApi, projectAllocationsApi, teamMembersApi, Holiday as ApiHoliday, Vacation as ApiVacation, Project, ProjectAllocation } from "@/lib/api";
import { useWorkingHours } from "@/lib/working-hours";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, differenceInDays, getDate, isWeekend, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, GripVertical, Flame } from "lucide-react";
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
  calculateEmployeeAllocatedHoursForMonth,
  calculateEmployeeAllocatedHours,
  hasAllocationConflict,
  WEEKS_PER_MONTH,
  WORKING_DAYS_PER_WEEK
} from "@/lib/calendar-utils";

export const CalendarView: React.FC = () => {
  const { toast } = useToast();
  const { getWorkingHoursForCountry } = useWorkingHours();
  
  // Basic state management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [holidays, setHolidays] = useState<ApiHoliday[]>([]);
  const [vacations, setVacations] = useState<ApiVacation[]>([]);
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
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAllocation, setDeletingAllocation] = useState<ProjectAllocation | null>(null);
  
  // Heatmap view state
  const [heatmapMode, setHeatmapMode] = useState(false);

  // Overallocation warning state
  const [overallocationDialogOpen, setOverallocationDialogOpen] = useState(false);
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
  const [allocationHours, setAllocationHours] = useState<{[key: string]: number}>({});

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



  // Calculate daily allocation percentage for a specific employee and date
  const getDailyAllocationPercentage = (employeeId: string, date: Date) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;
    
    // Skip weekends, holidays, and vacations
    if (isWeekendDay(date) || getHolidayForDate(date) || getVacationForCell(employeeId, date)) {
      return 0;
    }
    
    const dayAllocations = getAllocationsForCell(employeeId, date);
    const totalAllocatedHours = dayAllocations.reduce((total, allocation) => total + allocation.hoursPerDay, 0);
    const maxDailyHours = getWorkingHoursForCountry(employee.country) / WORKING_DAYS_PER_WEEK;
    
    return maxDailyHours > 0 ? Math.min((totalAllocatedHours / maxDailyHours) * 100, 100) : 0;
  };





  // Calculate allocation percentage for an employee for the current month
  const getEmployeeAllocationPercentage = (employee: Employee) => {
    const weeklyHours = getWorkingHoursForCountry(employee.country);
    const monthlyHours = weeklyHours * WEEKS_PER_MONTH;
    const allocatedHours = calculateEmployeeAllocatedHoursForMonth(employee.id);
    const percentage = monthlyHours > 0 ? (allocatedHours / monthlyHours) * 100 : 0;
    
    return Math.min(percentage, 100);
  };



  // Calculate total allocated hours for an employee
  const calculateEmployeeAllocatedHours = (employeeId: string) => {
    const employeeAllocations = allocations.filter(allocation => allocation.employeeId === employeeId);
    return employeeAllocations.reduce((total, allocation) => {
      const startDate = new Date(allocation.startDate);
      const endDate = new Date(allocation.endDate);
      const days = differenceInDays(endDate, startDate) + 1;
      return total + (allocation.hoursPerDay * days);
    }, 0);
  };

  // Calculate allocated hours for an employee for the current month only
  const calculateEmployeeAllocatedHoursForMonth = (employeeId: string) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const employeeAllocations = allocations.filter(allocation => allocation.employeeId === employeeId);
    return employeeAllocations.reduce((total, allocation) => {
      const allocationStart = new Date(allocation.startDate);
      const allocationEnd = new Date(allocation.endDate);
      
      // Check if allocation overlaps with current month
      if (allocationEnd < monthStart || allocationStart > monthEnd) {
        return total;
      }
      
      // Calculate overlap with current month
      const effectiveStart = allocationStart < monthStart ? monthStart : allocationStart;
      const effectiveEnd = allocationEnd > monthEnd ? monthEnd : allocationEnd;
      
      // Count only working days (exclude weekends)
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
      vacation.employeeId === employeeId && 
      vacation.startDate <= dateStr && 
      vacation.endDate >= dateStr
    );
  };
  
  // Get holiday for a specific date
  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.find(holiday => holiday.date === dateStr);
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
    
    // Only start dragging if it's not a resize handle or drag-to-delete handle
    const target = event.target as HTMLElement;
    if (target.closest('.resize-handle') || target.closest('.drag-to-delete')) {
      return;
    }
    
    // Only start dragging if clicking on the main allocation element or its direct children
    const allocationElement = event.currentTarget as HTMLElement;
    if (target !== allocationElement && !allocationElement.contains(target)) {
      return;
    }
    
    setDraggingAllocation({
      allocation,
      originalStartDate: new Date(allocation.startDate),
      originalEndDate: new Date(allocation.endDate),
      mouseOffset: { x: event.clientX, y: event.clientY }
    });
    setDragOverCell(null);
  };

  const handleAllocationDoubleClick = (allocation: ProjectAllocation) => {
    setEditingAllocation(allocation);
    setEditStartDate(new Date(allocation.startDate));
    setEditEndDate(new Date(allocation.endDate));
    setEditDialogOpen(true);
  };

  const handleSaveAllocation = async () => {
    if (!editingAllocation || !editStartDate || !editEndDate) return;
    
    if (editEndDate < editStartDate) {
      toast({
        title: "Invalid Dates",
        description: "End date cannot be before start date.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await projectAllocationsApi.update(parseInt(editingAllocation.id.toString()), {
        startDate: format(editStartDate, 'yyyy-MM-dd'),
        endDate: format(editEndDate, 'yyyy-MM-dd')
      });
      
      // Update local state
      setAllocations(prev => prev.map(allocation => 
        allocation.id === editingAllocation.id 
          ? { ...allocation, startDate: format(editStartDate, 'yyyy-MM-dd'), endDate: format(editEndDate, 'yyyy-MM-dd') }
          : allocation
      ));
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(editingAllocation.employeeId);
      
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
      
      // Check if the allocation is on a weekend
      const isWeekendAllocation = isWeekendDay(date);
      
      // Calculate hours per day based on country working hours (0 for weekends)
      const weeklyHours = getWorkingHoursForCountry(employee.country);
      const hoursPerDay = isWeekendAllocation ? 0 : weeklyHours / 5; // 0 hours for weekends, normal hours for weekdays
      
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
        
        setAllocationHours(hoursMap);
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
      

      
      toast({
        title: "Success",
        description: `${dragItem.name} assigned to ${employees.find(e => e.id === employeeId)?.name} on ${format(date, 'MMM dd, yyyy')} ${isWeekendAllocation ? '(weekend - no working hours)' : `(${formatHours(hoursPerDay)}h/day)`}`,
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

  const handleAllocationDrop = async (event: React.MouseEvent, employeeId: string, date: Date) => {
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
  };

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
        hoursPerDay: allocationHours['new'] || 0,
        status: 'active'
      };

      const createdAllocation = await projectAllocationsApi.create(newAllocation);
      
      // Update local allocations state
      setAllocations(prev => [...prev, createdAllocation]);
      
      // Update employee's allocated hours
      await updateEmployeeAllocatedHours(overallocationData.employeeId);
      
      toast({
        title: "Allocation Created",
        description: `${overallocationData.projectName} assigned to ${overallocationData.employeeName} with ${allocationHours['new'] || 0}h/day.`,
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
      setAllocationHours({});
    }
  };

  const handleOverallocationCancel = () => {
    setOverallocationDialogOpen(false);
    setOverallocationData(null);
    setAllocationHours({});
  };
  
  // Resize handlers
  const handleResizeStart = (event: React.MouseEvent, allocation: ProjectAllocation, isLeftEdge: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    

    
    setResizingAllocation({
      allocationId: allocation.id.toString(),
      startDate: new Date(allocation.startDate),
      endDate: new Date(allocation.endDate),
      isLeftEdge
    });
  };

  const handleResizeMove = (event: MouseEvent) => {
    if (!resizingAllocation) return;
    

    
    // Find the cell under the mouse cursor
    const target = event.target as HTMLElement;
    const cell = target.closest('[data-date]') as HTMLElement;
    
    if (cell) {
      const dateStr = cell.getAttribute('data-date');
      if (dateStr) {
        const targetDate = new Date(dateStr);
        
        if (resizingAllocation.isLeftEdge) {
          // Resizing left edge - update start date
          if (targetDate <= resizingAllocation.endDate) {
            setResizingAllocation({
              ...resizingAllocation,
              startDate: targetDate
            });
          }
        } else {
          // Resizing right edge - update end date
          if (targetDate >= resizingAllocation.startDate) {
            setResizingAllocation({
              ...resizingAllocation,
              endDate: targetDate
            });
          }
        }
      }
    }
  };

  const handleResizeEnd = async () => {
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
  };
  

  


  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [holidaysData, vacationsData, employeesData, projectsData, allocationsData] = await Promise.all([
          holidaysApi.getAll(),
          vacationsApi.getAll(),
          getCurrentEmployees(),
          projectsApi.getAll(),
          projectAllocationsApi.getAll()
        ]);
        
        setEmployees(employeesData);
        setProjects(projectsData);
        setHolidays(holidaysData);
        setVacations(vacationsData);
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
          if (draggingAllocation) {
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
          }
        };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingAllocation, draggingAllocation]);

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
            Drag projects from the sidebar to assign team members to tasks.
          </p>
        </div>

      </div>

      {/* Projects Sidebar - Top */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Projects - Drag to Calendar</CardTitle>
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
                    "flex items-center gap-1 min-w-[100px] max-w-[130px]"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project)}
                  style={{ 
                    backgroundColor: project.color,
                    borderColor: project.color,
                    color: getContrastColor(project.color) // Ensure text is readable
                  }}
                >
                  <GripVertical className="h-2.5 w-2.5 text-current opacity-70" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">{project.name}</p>
                    <p className="text-xs opacity-80 truncate">
                      {project.allocatedHours || 0}h
                    </p>
                  </div>
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
                <Button
                  variant={heatmapMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHeatmapMode(!heatmapMode)}
                  className={cn(
                    "flex items-center gap-2",
                    heatmapMode && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  <Flame className="h-4 w-4" />
                  Heatmap
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
                         <div className="overflow-x-auto">
               <div className="min-w-max" data-calendar-container>
                 {/* Header row with dates */}
                 <div className="grid" style={{ gridTemplateColumns: `150px repeat(${calendarDays.length}, 60px)` }}>
                   <div className="p-0.5 font-medium text-xs border-b border-r bg-muted/30">
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
                         {holiday && (
                           <div className="text-xs text-amber-600 font-medium truncate">
                             {holiday.name}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>

                 {/* Employee rows */}
                 {employees.map((employee) => (
                   <div
                     key={employee.id}
                     data-employee={employee.id}
                     className="grid"
                     style={{ gridTemplateColumns: `150px repeat(${calendarDays.length}, 60px)` }}
                   >
                                         <div className="p-0.5 border-b border-r bg-muted/10">
                       <div className="font-medium text-xs">{employee.name}</div>
                       <div className="text-xs text-muted-foreground truncate">{employee.role}</div>
                       <div className="mt-1">
                         <div className="w-full bg-gray-200 rounded-full h-1.5">
                           <div
                             className={cn(
                               "h-1.5 rounded-full transition-all duration-300",
                               getAllocationColor(getEmployeeAllocationPercentage(employee))
                             )}
                             style={{ width: `${getEmployeeAllocationPercentage(employee)}%` }}
                           />
                         </div>
                         <div className="text-xs text-muted-foreground mt-0.5">
                           {formatHours(calculateEmployeeAllocatedHoursForMonth(employee.id))}h / {formatHours(getWorkingHoursForCountry(employee.country) * 4.33)}h ({Math.round(getEmployeeAllocationPercentage(employee))}%)
                         </div>
                       </div>
                     </div>
                     {calendarDays.map((date) => {
                       const allocations = getAllocationsForCell(employee.id, date);
                       const vacation = getVacationForCell(employee.id, date);
                       const holiday = getHolidayForDate(date);
                       const isWeekendCell = isWeekendDay(date);
                       const isDragOver = dragOverCell?.employeeId === employee.id && isSameDay(dragOverCell.date, date);
                       
                       return (
                         <div
                           key={`${employee.id}-${date.toISOString()}`}
                           data-date={format(date, 'yyyy-MM-dd')}
                           className={cn(
                             "p-0.5 border-b border-r min-h-[40px] relative transition-all duration-200",
                             holiday && "bg-amber-50",
                             isWeekendCell && "weekend-cell",
                             "hover:bg-muted/30"
                           )}
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
                                 borderColor: dragItem?.color || '#3b82f6'
                               }}
                             >
                                                                <div 
                                   className="p-0.5 text-xs font-medium truncate flex items-center justify-center h-full text-gray-800"
                                 >
                                 <span className="drop-shadow-sm">
                                   {dragItem?.name || 'Moving allocation'}
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
                                 
                                 if (dailyPercentage === 0) {
                                   if (isWeekendCell) return "Weekend - No working hours";
                                   if (holiday) return `Holiday: ${holiday.name}`;
                                   if (vacation) return `Vacation: ${vacation.type}`;
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
                                 
                                 if (dailyPercentage === 0) return null;
                                 
                                 return (
                                   <>
                                     {/* Vertical progress bar */}
                                     <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-sm overflow-hidden">
                                       <div
                                         className={cn(
                                           "transition-all duration-300",
                                           getDailyAllocationColor(dailyPercentage)
                                         )}
                                         style={{ 
                                           height: `${dailyPercentage}%`,
                                           width: '100%'
                                         }}
                                       />
                                     </div>
                                     {/* Percentage text overlay */}
                                     <div className="absolute inset-0 flex items-center justify-center z-10">
                                       <span className="text-xs font-bold text-gray-800 drop-shadow-sm">
                                         {Math.round(dailyPercentage)}%
                                       </span>
                                     </div>
                                   </>
                                 );
                               })()}
                             </div>
                           ) : (
                             /* Normal View - Multiple allocations stacked vertically */
                             allocations.map((allocation, index) => {
                               const project = projects.find(p => p.id.toString() === allocation.projectId);
                               const isStartDate = isSameDay(new Date(allocation.startDate), date);
                               const isEndDate = isSameDay(new Date(allocation.endDate), date);
                               const isResizing = resizingAllocation?.allocationId === allocation.id.toString();
                               const isDragging = draggingAllocation?.allocation.id === allocation.id;
                               const isWeekendAllocation = isWeekendDay(date);
                               
                               return (
                                 <div
                                   key={allocation.id}
                                   className={cn(
                                     "p-0.5 rounded text-xs font-medium text-white truncate mb-0.5 relative cursor-ew-resize transition-all duration-200",
                                     isResizing && "opacity-75",
                                     isDragging && "opacity-50 scale-105 shadow-lg",
                                     isWeekendAllocation && "weekend-allocation"
                                   )}
                                   style={{ backgroundColor: project?.color || '#3b82f6' }}
                                   onMouseDown={(e) => handleAllocationDragStart(e, allocation)}
                                   onDoubleClick={() => handleAllocationDoubleClick(allocation)}
                                   title={isWeekendAllocation ? "Weekend allocation (no working hours) - Double-click to edit" : "Drag horizontally to move allocation (same employee only) - Double-click to edit"}
                                 >
                                   <div className="flex items-center justify-between pointer-events-none">
                                     <span className="text-xs">{project?.name || 'Unknown Project'}</span>
                                     {/* Drag to delete handle */}
                                     <div
                                       className="drag-to-delete ml-1 w-2 h-2 bg-white/30 rounded cursor-grab hover:bg-white/50 transition-colors pointer-events-auto"
                                       draggable
                                       onDragStart={(e) => {
                                         e.stopPropagation();
                                         handleAllocationDragStartFromTimeline(e, allocation);
                                       }}
                                       title="Drag to projects box to delete"
                                     />
                                   </div>
                                   
                                   {/* Left resize handle */}
                                   {isStartDate && (
                                     <div
                                       className="resize-handle absolute left-0 top-0 bottom-0 w-2 bg-white/70 cursor-ew-resize hover:bg-white/90 transition-colors z-10 border-r border-white/50"
                                       onMouseDown={(e) => {
                                         e.stopPropagation();
                                         handleResizeStart(e, allocation, true);
                                       }}
                                       title="Drag to resize start date"
                                     />
                                   )}
                                   
                                   {/* Right resize handle */}
                                   {isEndDate && (
                                     <div
                                       className="resize-handle absolute right-0 top-0 bottom-0 w-2 bg-white/70 cursor-ew-resize hover:bg-white/90 transition-colors z-10 border-l border-white/50"
                                       onMouseDown={(e) => {
                                         e.stopPropagation();
                                         handleResizeStart(e, allocation, false);
                                       }}
                                       title="Drag to resize end date"
                                     />
                                   )}
                                 </div>
                               );
                             })
                           )}
                           {vacation && allocations.length === 0 && (
                             <div className="p-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                               {vacation.type}
                             </div>
                           )}
                           {holiday && allocations.length === 0 && !vacation && (
                             <div className="p-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                               {holiday.name}
                             </div>
                           )}
                         </div>
                       );
                     })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Allocation Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
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
                    <div className="col-span-3">
                      <Input
                        id="startDate"
                        type="date"
                        value={editStartDate ? format(editStartDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setEditStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endDate" className="text-right">
                      End Date
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="endDate"
                        type="date"
                        value={editEndDate ? format(editEndDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setEditEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDeleteAllocation}>
                Delete
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAllocation}>
                Save Changes
              </Button>
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
                              value={allocationHours[allocation.id.toString()] || 0}
                              onChange={(e) => setAllocationHours(prev => ({
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
                          value={allocationHours['new'] || 0}
                          onChange={(e) => setAllocationHours(prev => ({
                            ...prev,
                            'new': parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Total: {Object.values(allocationHours).reduce((sum, hours) => sum + hours, 0)}h
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