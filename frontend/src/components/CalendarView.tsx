import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentEmployees, Employee } from "@/lib/employee-data";
import { holidaysApi, vacationsApi, projectsApi, projectAllocationsApi, Holiday as ApiHoliday, Vacation as ApiVacation, Project, ProjectAllocation } from "@/lib/api";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, differenceInDays, getDate } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export const CalendarView: React.FC = () => {
  console.log('CalendarView component rendering...');
  const { toast } = useToast();
  
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
  const [dragItem, setDragItem] = useState<any>(null);
  const [dragOverCell, setDragOverCell] = useState<{employeeId: string, date: Date} | null>(null);
  
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
  
  // Form state
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showVacationForm, setShowVacationForm] = useState(false);
  
  // Form data
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: new Date(),
    country: 'Both' as 'Canada' | 'Brazil' | 'Both'
  });
  
  const [vacationForm, setVacationForm] = useState({
    employeeId: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'Vacation' as 'Vacation' | 'Sick Leave' | 'Personal' | 'Other'
  });
  
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
  };

  const handleAllocationDragStart = (event: React.MouseEvent, allocation: ProjectAllocation) => {
    event.preventDefault();
    event.stopPropagation();
    

    
    setDraggingAllocation({
      allocation,
      originalStartDate: new Date(allocation.startDate),
      originalEndDate: new Date(allocation.endDate),
      mouseOffset: { x: event.clientX, y: event.clientY }
    });
    setDragOverCell(null);
  };

  const handleDragOver = (event: React.DragEvent, employeeId: string, date: Date) => {
    event.preventDefault();
    setDragOverCell({ employeeId, date });
  };

  const handleAllocationDragOver = (event: React.MouseEvent, employeeId: string, date: Date) => {
    event.preventDefault();
    if (draggingAllocation) {
      setDragOverCell({ employeeId, date });
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
      const newAllocation = {
        employeeId: employeeId,
        projectId: dragItem.id.toString(),
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd'), // Start with single day, can be resized
        hoursPerDay: 8,
        status: 'active'
      };

      await projectAllocationsApi.create(newAllocation);
      
      toast({
        title: "Success",
        description: `${dragItem.name} assigned to ${employees.find(e => e.id === employeeId)?.name} on ${format(date, 'MMM dd, yyyy')}`,
      });
      
      // Reload data
      const allocationsData = await projectAllocationsApi.getAll();
      setAllocations(allocationsData);
      
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
    
    // Check if this project is already allocated to this employee on the target date range
    const daysDiff = differenceInDays(date, new Date(draggingAllocation.originalStartDate));
    const newStartDate = addDays(draggingAllocation.originalStartDate, daysDiff);
    const newEndDate = addDays(draggingAllocation.originalEndDate, daysDiff);
    
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
        employeeId: draggingAllocation.allocation.employeeId,
        projectId: draggingAllocation.allocation.projectId,
        startDate: format(newStartDate, 'yyyy-MM-dd'),
        endDate: format(newEndDate, 'yyyy-MM-dd')
      });
      
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
      await projectAllocationsApi.update(parseInt(resizingAllocation.allocationId), {
        employeeId: allocations.find(a => a.id.toString() === resizingAllocation.allocationId)?.employeeId || '',
        projectId: allocations.find(a => a.id.toString() === resizingAllocation.allocationId)?.projectId || '',
        startDate: format(resizingAllocation.startDate, 'yyyy-MM-dd'),
        endDate: format(resizingAllocation.endDate, 'yyyy-MM-dd')
      });
      
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
  
  // Form handlers
  const handleAddHoliday = async () => {
    try {
      if (!holidayForm.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Holiday name is required.",
          variant: "destructive",
        });
        return;
      }

      const newHoliday = {
        name: holidayForm.name,
        date: format(holidayForm.date, 'yyyy-MM-dd'),
        country: holidayForm.country
      };

      await holidaysApi.create(newHoliday);
      
      toast({
        title: "Success",
        description: "Holiday added successfully.",
      });
      
      setShowHolidayForm(false);
      setHolidayForm({
        name: '',
        date: new Date(),
        country: 'Both'
      });
      
      // Reload data
      const holidaysData = await holidaysApi.getAll();
      setHolidays(holidaysData);
      
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: "Error",
        description: "Failed to add holiday. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddVacation = async () => {
    try {
      if (!vacationForm.employeeId) {
        toast({
          title: "Validation Error",
          description: "Please select an employee.",
          variant: "destructive",
        });
        return;
      }

      const employee = employees.find(emp => emp.id === vacationForm.employeeId);
      if (!employee) {
        toast({
          title: "Validation Error",
          description: "Selected employee not found.",
          variant: "destructive",
        });
        return;
      }

      const newVacation = {
        employeeId: vacationForm.employeeId,
        employeeName: employee.name,
        startDate: format(vacationForm.startDate, 'yyyy-MM-dd'),
        endDate: format(vacationForm.endDate, 'yyyy-MM-dd'),
        type: vacationForm.type
      };

      await vacationsApi.create(newVacation);
      
      toast({
        title: "Success",
        description: "Vacation request added successfully.",
      });
      
      setShowVacationForm(false);
      setVacationForm({
        employeeId: '',
        startDate: new Date(),
        endDate: new Date(),
        type: 'Vacation'
      });
      
      // Reload data
      const vacationsData = await vacationsApi.getAll();
      setVacations(vacationsData);
      
    } catch (error) {
      console.error('Error adding vacation:', error);
      toast({
        title: "Error",
        description: "Failed to add vacation request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading Calendar data...');
        setLoading(true);
        setError(null);
        
        const [holidaysData, vacationsData, employeesData, projectsData, allocationsData] = await Promise.all([
          holidaysApi.getAll(),
          vacationsApi.getAll(),
          getCurrentEmployees(),
          projectsApi.getAll(),
          projectAllocationsApi.getAll()
        ]);
        
        console.log('📊 Calendar data loaded:', {
          holidays: holidaysData.length,
          vacations: vacationsData.length,
          employees: employeesData.length,
          projects: projectsData.length,
          allocations: allocationsData.length
        });
        
        setEmployees(employeesData);
        setProjects(projectsData);
        setHolidays(holidaysData);
        setVacations(vacationsData);
        setAllocations(allocationsData);
        
      } catch (error) {
        console.error('❌ Error loading Calendar data:', error);
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
                handleAllocationDrop(e as any, employeeId, targetDate);
              }
            }
            
            setDraggingAllocation(null);
            setDragOverCell(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resource Calendar</h2>
          <p className="text-muted-foreground">
            Drag projects from the sidebar to assign team members to tasks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHolidayForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowVacationForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vacation
          </Button>
        </div>
      </div>

      {/* Projects Sidebar - Top */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projects - Drag to Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className={cn(
                  "p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors",
                  "flex items-center gap-2 min-w-[200px]"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, project)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div 
                  className="w-4 h-4 rounded-full border-2"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.allocatedHours || 0} hours allocated
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
            </div>
          </CardHeader>
          <CardContent>
                         <div className="overflow-x-auto">
               <div className="min-w-max" data-calendar-container>
                 {/* Header row with dates */}
                 <div className="grid" style={{ gridTemplateColumns: `180px repeat(${calendarDays.length}, 80px)` }}>
                   <div className="p-1 font-medium text-xs border-b border-r bg-muted/30">
                     Team Members
                   </div>
                   {calendarDays.map((date) => {
                     const holiday = getHolidayForDate(date);
                     return (
                       <div
                         key={date.toISOString()}
                         className={cn(
                           "p-1 text-center text-xs border-b border-r bg-muted/30",
                           isSameDay(date, new Date()) && "bg-primary/10 font-semibold"
                         )}
                       >
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
                     style={{ gridTemplateColumns: `180px repeat(${calendarDays.length}, 80px)` }}
                   >
                                         <div className="p-1 border-b border-r bg-muted/10">
                       <div className="font-medium text-xs">{employee.name}</div>
                       <div className="text-xs text-muted-foreground truncate">{employee.role}</div>
                     </div>
                     {calendarDays.map((date) => {
                       const allocations = getAllocationsForCell(employee.id, date);
                       const vacation = getVacationForCell(employee.id, date);
                       const holiday = getHolidayForDate(date);
                       const isDragOver = dragOverCell?.employeeId === employee.id && isSameDay(dragOverCell.date, date);
                       
                       return (
                         <div
                           key={`${employee.id}-${date.toISOString()}`}
                           data-date={format(date, 'yyyy-MM-dd')}
                           className={cn(
                             "p-1 border-b border-r min-h-[50px] relative",
                             holiday && "bg-amber-50",
                             "hover:bg-muted/30 transition-colors"
                           )}
                           onDragOver={(e) => handleDragOver(e, employee.id, date)}
                           onDrop={(e) => handleDrop(e, employee.id, date)}
                           onDragLeave={handleDragLeave}
                           onMouseOver={(e) => draggingAllocation && handleAllocationDragOver(e, employee.id, date)}
                         >
                           {/* Multiple allocations stacked vertically */}
                           {allocations.map((allocation, index) => {
                             const project = projects.find(p => p.id.toString() === allocation.projectId);
                             const isStartDate = isSameDay(new Date(allocation.startDate), date);
                             const isEndDate = isSameDay(new Date(allocation.endDate), date);
                             const isResizing = resizingAllocation?.allocationId === allocation.id.toString();
                             const isDragging = draggingAllocation?.allocation.id === allocation.id;
                             
                             return (
                               <div
                                 key={allocation.id}
                                 className={cn(
                                   "p-1 rounded text-xs font-medium text-white truncate mb-1 relative cursor-move",
                                   isResizing && "opacity-75",
                                   isDragging && "opacity-50"
                                 )}
                                 style={{ backgroundColor: project?.color || '#3b82f6' }}
                                 onMouseDown={(e) => handleAllocationDragStart(e, allocation)}
                                 title="Drag to move allocation"
                               >
                                 {project?.name || 'Unknown Project'}
                                 
                                 {/* Left resize handle */}
                                 {isStartDate && (
                                   <div
                                     className="absolute left-0 top-0 bottom-0 w-2 bg-white/70 cursor-ew-resize hover:bg-white/90 transition-colors z-10 border-r border-white/50"
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
                                     className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 cursor-ew-resize hover:bg-white/90 transition-colors z-10 border-l border-white/50"
                                     onMouseDown={(e) => {
                                       e.stopPropagation();
                                       handleResizeStart(e, allocation, false);
                                     }}
                                     title="Drag to resize end date"
                                   />
                                 )}
                               </div>
                             );
                           })}
                           {vacation && allocations.length === 0 && (
                             <div className="p-1 rounded text-xs font-medium bg-green-100 text-green-800">
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

      {/* Add Holiday Dialog */}
      <Dialog open={showHolidayForm} onOpenChange={setShowHolidayForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Company Holiday</DialogTitle>
            <DialogDescription>
              Add a new company holiday that will affect team availability.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="holiday-name">Holiday Name</Label>
              <Input
                id="holiday-name"
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                placeholder="e.g., Christmas Day"
              />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !holidayForm.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {holidayForm.date ? format(holidayForm.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={holidayForm.date}
                    onSelect={(date) => date && setHolidayForm({ ...holidayForm, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="holiday-country">Country</Label>
              <Select
                value={holidayForm.country}
                onValueChange={(value: 'Canada' | 'Brazil' | 'Both') =>
                  setHolidayForm({ ...holidayForm, country: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Brazil">Brazil</SelectItem>
                  <SelectItem value="Both">Both Countries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHolidayForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHoliday}>
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vacation Dialog */}
      <Dialog open={showVacationForm} onOpenChange={setShowVacationForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Vacation Request</DialogTitle>
            <DialogDescription>
              Create a new vacation request for a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vacation-employee">Employee</Label>
              <Select
                value={vacationForm.employeeId}
                onValueChange={(value) => setVacationForm({ ...vacationForm, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.role} - {employee.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !vacationForm.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {vacationForm.startDate ? format(vacationForm.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={vacationForm.startDate}
                      onSelect={(date) => date && setVacationForm({ ...vacationForm, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !vacationForm.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {vacationForm.endDate ? format(vacationForm.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={vacationForm.endDate}
                      onSelect={(date) => date && setVacationForm({ ...vacationForm, endDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vacation-type">Type</Label>
              <Select
                value={vacationForm.type}
                onValueChange={(value: 'Vacation' | 'Sick Leave' | 'Personal' | 'Other') =>
                  setVacationForm({ ...vacationForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVacationForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVacation}>
              Add Vacation Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      


    </div>
  );
};