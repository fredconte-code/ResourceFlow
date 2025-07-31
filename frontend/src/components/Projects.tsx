import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Edit2, Save, X, Calendar as CalendarIcon, Plus, AlertCircle, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, differenceInDays, addDays, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { projectsApi, projectAllocationsApi, teamMembersApi, holidaysApi, vacationsApi, Project, ProjectAllocation, ProjectStatus, TeamMember, Holiday, Vacation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_COLORS } from "@/lib/constants";
import { getContrastColor, isWeekendDay } from "@/lib/calendar-utils";
import { useSettings } from "@/context/SettingsContext";
import { useHolidays } from "@/context/HolidayContext";
import { useTimeOffs } from "@/context/TimeOffContext";
import { 
  getProjectStatusConfig, 
  getProjectStatusOptions, 
  DEFAULT_PROJECT_STATUS,
  getProjectStatusLabel,
  getProjectStatusColor,
  getProjectStatusIcon
} from "@/lib/project-status";

export const Projects = () => {
  const { toast } = useToast();
  const { buffer } = useSettings();
  const { holidays } = useHolidays();
  const { timeOffs: vacations } = useTimeOffs();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    name: "", 
    startDate: undefined as Date | undefined, 
    endDate: undefined as Date | undefined, 
    color: '#3b82f6',
    status: DEFAULT_PROJECT_STATUS as ProjectStatus
  });
  
  // State for showing/hiding add form
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State for editing
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: "", 
    startDate: undefined as Date | undefined, 
    endDate: undefined as Date | undefined, 
    color: '#3b82f6',
    status: DEFAULT_PROJECT_STATUS as ProjectStatus
  });
  
  // State for delete confirmation
  const [deleteProjectState, setDeleteProjectState] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load projects and allocations from API
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsData, allocationsData, employeesData] = await Promise.all([
        projectsApi.getAll(),
        projectAllocationsApi.getAll(),
        teamMembersApi.getAll()
      ]);
      setProjects(projectsData);
      setAllocations(allocationsData);
      setEmployees(employeesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // Listen for allocation updates to refresh data
  useEffect(() => {
    const handleAllocationUpdate = () => {
      loadProjects();
    };

    window.addEventListener('projectAllocationsUpdate', handleAllocationUpdate);
    
    return () => {
      window.removeEventListener('projectAllocationsUpdate', handleAllocationUpdate);
    };
  }, []);

  // Calculate allocated hours for a specific project using the same logic as Calendar
  const getProjectAllocatedHours = (projectId: number) => {
    // Get all allocations for this project
    const projectAllocations = allocations.filter(allocation => 
      allocation.projectId === projectId.toString()
    );
    
    if (projectAllocations.length === 0) return 0;
    
    // Find the month with the most allocations for this project
    const monthAllocationCounts: { [key: string]: number } = {};
    
    projectAllocations.forEach(allocation => {
      const allocationStart = new Date(allocation.startDate + 'T00:00:00');
      const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
      
      // Check each month that this allocation spans
      let currentDate = new Date(allocationStart);
      while (currentDate <= allocationEnd) {
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
        monthAllocationCounts[monthKey] = (monthAllocationCounts[monthKey] || 0) + 1;
        currentDate = addDays(currentDate, 1);
      }
    });
    
    // Find the month with the most allocations
    const mostActiveMonth = Object.keys(monthAllocationCounts).reduce((a, b) => 
      monthAllocationCounts[a] > monthAllocationCounts[b] ? a : b
    );
    
    const [year, month] = mostActiveMonth.split('-').map(Number);
    const currentDate = new Date(year, month, 1); // Use the most active month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    let totalHours = 0;
    
    projectAllocations.forEach(allocation => {
      const allocationStart = new Date(allocation.startDate + 'T00:00:00');
      const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
      
      // Check if allocation overlaps with current month
      if (allocationEnd < monthStart || allocationStart > monthEnd) {
        return; // Skip if no overlap
      }
      
      // Calculate overlap with current month
      const effectiveStart = allocationStart < monthStart ? monthStart : allocationStart;
      const effectiveEnd = allocationEnd > monthEnd ? monthEnd : allocationEnd;
      
      // Find the employee for this allocation
      const employee = employees.find(emp => emp.id.toString() === allocation.employeeId);
      
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
      
      totalHours += allocation.hoursPerDay * workingDays;
    });
    
    return totalHours;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setForm({ ...form, [field]: date });
  };

  const handleAdd = async () => {
    if (!form.name) {
      toast({
        title: "Validation Error",
        description: "Project name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const addedProject = await projectsApi.create({
        name: form.name,
        startDate: form.startDate ? format(form.startDate, 'yyyy-MM-dd') : undefined,
        endDate: form.endDate ? format(form.endDate, 'yyyy-MM-dd') : undefined,
        color: form.color,
        status: form.status,
        allocatedHours: 0
      });
      
      setProjects(prev => [...prev, addedProject]);
      setForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6', status: DEFAULT_PROJECT_STATUS });
      setShowAddForm(false);
      
      toast({
        title: "Success",
        description: "Project added successfully.",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('projectsUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add project.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      endDate: project.endDate ? new Date(project.endDate) : undefined,
      color: project.color,
      status: project.status || DEFAULT_PROJECT_STATUS
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setEditForm({ ...editForm, [field]: date });
  };

  const [savingEdit, setSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    if (!editingProject || !editForm.name) {
      toast({
        title: "Validation Error",
        description: "Project name is required.",
        variant: "destructive"
      });
      return;
    }
    
    setSavingEdit(true);
    try {
      // Add a small delay to make the animation visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedProject = await projectsApi.update(editingProject.id, {
        name: editForm.name,
        startDate: editForm.startDate ? format(editForm.startDate, 'yyyy-MM-dd') : undefined,
        endDate: editForm.endDate ? format(editForm.endDate, 'yyyy-MM-dd') : undefined,
        color: editForm.color,
        status: editForm.status
      });
      
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
      setEditingProject(null);
      setEditForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6', status: DEFAULT_PROJECT_STATUS });
      
      toast({
        title: "Success",
        description: "Project updated successfully.",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('projectsUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update project.",
        variant: "destructive"
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6', status: DEFAULT_PROJECT_STATUS });
  };

  const handleDeleteClick = (project: Project) => {
    setDeleteProjectState(project);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProjectState) return;
    
    try {
      await projectsApi.delete(deleteProjectState.id);
      setProjects(prev => prev.filter(p => p.id !== deleteProjectState.id));
      setShowDeleteDialog(false);
      setDeleteProjectState(null);
      
      toast({
        title: "Success",
        description: "Project deleted successfully.",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('projectsUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete project.",
        variant: "destructive"
      });
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadProjects}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground text-sm">
            Manage your projects and their timelines
          </p>
        </div>
      </div>

      {/* Add Project Button */}
      <div className="flex items-center gap-4">
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Add Project Form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter project name"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.startDate ? format(form.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={form.startDate}
                      onSelect={(date) => handleDateChange('startDate', date)}
                      initialFocus
                    />
                    <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Close the popover
                          const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                          if (popover) {
                            const closeEvent = new Event('pointerdown', { bubbles: true });
                            popover.dispatchEvent(closeEvent);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Close the popover
                          const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                          if (popover) {
                            const closeEvent = new Event('pointerdown', { bubbles: true });
                            popover.dispatchEvent(closeEvent);
                          }
                        }}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.endDate ? format(form.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={form.endDate}
                      onSelect={(date) => handleDateChange('endDate', date)}
                      initialFocus
                    />
                    <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Close the popover
                          const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                          if (popover) {
                            const closeEvent = new Event('pointerdown', { bubbles: true });
                            popover.dispatchEvent(closeEvent);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Close the popover
                          const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                          if (popover) {
                            const closeEvent = new Event('pointerdown', { bubbles: true });
                            popover.dispatchEvent(closeEvent);
                          }
                        }}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

                          <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="grid grid-cols-10 gap-2">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        form.color === color 
                          ? "border-gray-800 scale-110" 
                          : "border-gray-300 hover:border-gray-500"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setForm({ ...form, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project Status</Label>
                <Select value={form.status} onValueChange={(value: ProjectStatus) => setForm({ ...form, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProjectStatusOptions().map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div style={{ color: option.color }}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Add Project
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6', status: DEFAULT_PROJECT_STATUS });
              setShowAddForm(false);
            }}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

            {/* Projects List */}
      <div className="grid gap-3">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-24">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">No projects yet.</p>
                <Button onClick={() => setShowAddForm(true)} className="mt-2" size="sm">
                  Add your first project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          projects
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((project) => (
            <Card key={project.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="px-3 py-1.5 border rounded-md flex items-center justify-center min-w-[120px] max-w-[150px] h-8"
                          style={{ 
                            backgroundColor: project.color,
                            borderColor: project.color,
                            color: getContrastColor(project.color)
                          }}
                        >
                          <span className="font-medium text-xs truncate">{project.name}</span>
                        </div>
                                                 <span className="text-muted-foreground font-medium text-xs">Status:</span>
                         {(() => {
                           const statusConfig = getProjectStatusConfig(project.status || DEFAULT_PROJECT_STATUS);
                           const IconComponent = statusConfig.icon;
                           return (
                             <div className="flex items-center gap-1">
                               <div style={{ color: statusConfig.color }}>
                                 <IconComponent className="h-4 w-4" />
                               </div>
                               <span className="text-muted-foreground font-medium text-xs">{statusConfig.label}</span>
                             </div>
                           );
                         })()}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {project.startDate && (
                          <>
                            <span>Start: {format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
                            <span>•</span>
                          </>
                        )}
                        {project.endDate && (
                          <span>End: {format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                        )}
                        {(() => {
                          const allocatedHours = getProjectAllocatedHours(project.id);
                          return allocatedHours > 0 ? (
                            <>
                              <span>•</span>
                              <span>Resources Hours Allocated: {allocatedHours.toFixed(1)}h</span>
                            </>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(project)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Project Dialog */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editForm.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editForm.startDate ? format(editForm.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="p-3">
                        <Calendar
                          mode="single"
                          selected={editForm.startDate}
                          onSelect={(date) => handleEditDateChange('startDate', date)}
                          initialFocus
                        />
                        <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Close the popover
                              const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                              if (popover) {
                                const closeEvent = new Event('pointerdown', { bubbles: true });
                                popover.dispatchEvent(closeEvent);
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Close the popover
                              const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                              if (popover) {
                                const closeEvent = new Event('pointerdown', { bubbles: true });
                                popover.dispatchEvent(closeEvent);
                              }
                            }}
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editForm.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editForm.endDate ? format(editForm.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <div className="p-3">
                        <Calendar
                          mode="single"
                          selected={editForm.endDate}
                          onSelect={(date) => handleEditDateChange('endDate', date)}
                          initialFocus
                        />
                        <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Close the popover
                              const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                              if (popover) {
                                const closeEvent = new Event('pointerdown', { bubbles: true });
                                popover.dispatchEvent(closeEvent);
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              // Close the popover
                              const popover = document.querySelector('[data-radix-popper-content-wrapper]');
                              if (popover) {
                                const closeEvent = new Event('pointerdown', { bubbles: true });
                                popover.dispatchEvent(closeEvent);
                              }
                            }}
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="grid grid-cols-10 gap-2">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        editForm.color === color 
                          ? "border-gray-800 scale-110" 
                          : "border-gray-300 hover:border-gray-500"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditForm({ ...editForm, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project Status</Label>
                <Select value={editForm.status} onValueChange={(value: ProjectStatus) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProjectStatusOptions().map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div style={{ color: option.color }}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteProjectState?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 