import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, Save, X, Calendar as CalendarIcon, Plus, AlertCircle, Loader2, Shield } from "lucide-react";
import { format, startOfMonth, endOfMonth, addDays, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { secureProjectsApi, secureAllocationsApi, secureTeamMembersApi, Project, ProjectAllocation, ProjectStatus, TeamMember } from "@/lib/secure-api";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_COLORS } from "@/lib/constants";
import { getContrastColor, isWeekendDay } from "@/lib/calendar-utils";
import { useHolidays } from "@/context/HolidayContext";
import { 
  getProjectStatusConfig, 
  getProjectStatusOptions, 
  DEFAULT_PROJECT_STATUS
} from "@/lib/project-status";
import { 
  SecureInput, 
  SecureNameInput, 
  SecureDateInput, 
  SecureNumberInput 
} from "@/components/ui/secure-input";
import { logSecurityEvent } from "@/lib/security";

export const ProjectsSecure = () => {
  const { toast } = useToast();
  const { holidays } = useHolidays();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Secure form state with validation
  const [form, setForm] = useState({ 
    name: "", 
    startDate: undefined as Date | undefined, 
    endDate: undefined as Date | undefined, 
    color: '#3b82f6',
    status: DEFAULT_PROJECT_STATUS as ProjectStatus
  });
  const [formValidation, setFormValidation] = useState({
    name: { isValid: true, errors: [] },
    startDate: { isValid: true, errors: [] },
    endDate: { isValid: true, errors: [] }
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
  const [editFormValidation, setEditFormValidation] = useState({
    name: { isValid: true, errors: [] },
    startDate: { isValid: true, errors: [] },
    endDate: { isValid: true, errors: [] }
  });
  
  // State for delete confirmation
  const [deleteProjectState, setDeleteProjectState] = useState<{
    show: boolean;
    project: Project | null;
  }>({ show: false, project: null });

  // Load data securely
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [projectsResponse, allocationsResponse, employeesResponse] = await Promise.all([
        secureProjectsApi.getAll(),
        secureAllocationsApi.getAll(),
        secureTeamMembersApi.getAll()
      ]);

      if (projectsResponse.success) {
        setProjects(projectsResponse.data);
      } else {
        throw new Error('Failed to load projects');
      }

      if (allocationsResponse.success) {
        setAllocations(allocationsResponse.data);
      }

      if (employeesResponse.success) {
        setEmployees(employeesResponse.data);
      }

      logSecurityEvent('projects_data_loaded', {
        projectsCount: projectsResponse.data?.length || 0,
        allocationsCount: allocationsResponse.data?.length || 0,
        employeesCount: employeesResponse.data?.length || 0
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      logSecurityEvent('projects_load_error', { error: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Secure form validation
  const validateForm = (formData: typeof form) => {
    const validation = {
      name: { isValid: true, errors: [] as string[] },
      startDate: { isValid: true, errors: [] as string[] },
      endDate: { isValid: true, errors: [] as string[] }
    };

    // Validate name
    if (!formData.name.trim()) {
      validation.name.isValid = false;
      validation.name.errors.push('Project name is required');
    } else if (formData.name.length > 200) {
      validation.name.isValid = false;
      validation.name.errors.push('Project name must be less than 200 characters');
    }

    // Validate dates
    if (!formData.startDate) {
      validation.startDate.isValid = false;
      validation.startDate.errors.push('Start date is required');
    }

    if (!formData.endDate) {
      validation.endDate.isValid = false;
      validation.endDate.errors.push('End date is required');
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      validation.endDate.isValid = false;
      validation.endDate.errors.push('End date must be after start date');
    }

    return validation;
  };

  // Handle secure form changes
  const handleFormChange = (field: keyof typeof form, value: any) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    
    const validation = validateForm(newForm);
    setFormValidation(validation);
  };

  const handleEditFormChange = (field: keyof typeof editForm, value: any) => {
    const newForm = { ...editForm, [field]: value };
    setEditForm(newForm);
    
    const validation = validateForm(newForm);
    setEditFormValidation(validation);
  };

  // Secure project creation
  const handleCreateProject = async () => {
    const validation = validateForm(form);
    setFormValidation(validation);

    if (!validation.name.isValid || !validation.startDate.isValid || !validation.endDate.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const projectData = {
        name: form.name.trim(),
        start_date: form.startDate!.toISOString().split('T')[0],
        end_date: form.endDate!.toISOString().split('T')[0],
        color: form.color,
        status: form.status
      };

      const response = await secureProjectsApi.create(projectData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Project created successfully.",
        });
        
        setForm({ 
          name: "", 
          startDate: undefined, 
          endDate: undefined, 
          color: '#3b82f6',
          status: DEFAULT_PROJECT_STATUS
        });
        setShowAddForm(false);
        loadProjects();
        
        logSecurityEvent('project_created', { 
          projectName: projectData.name,
          projectId: response.data?.id 
        });
      } else {
        throw new Error(response.errors?.[0] || 'Failed to create project');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      logSecurityEvent('project_creation_error', { error: errorMessage });
    }
  };

  // Secure project update
  const handleUpdateProject = async () => {
    if (!editingProject) return;

    const validation = validateForm(editForm);
    setEditFormValidation(validation);

    if (!validation.name.isValid || !validation.startDate.isValid || !validation.endDate.isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const projectData = {
        name: editForm.name.trim(),
        start_date: editForm.startDate!.toISOString().split('T')[0],
        end_date: editForm.endDate!.toISOString().split('T')[0],
        color: editForm.color,
        status: editForm.status
      };

      const response = await secureProjectsApi.update(editingProject.id, projectData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Project updated successfully.",
        });
        
        setEditingProject(null);
        setEditForm({ 
          name: "", 
          startDate: undefined, 
          endDate: undefined, 
          color: '#3b82f6',
          status: DEFAULT_PROJECT_STATUS
        });
        loadProjects();
        
        logSecurityEvent('project_updated', { 
          projectId: editingProject.id,
          projectName: projectData.name 
        });
      } else {
        throw new Error(response.errors?.[0] || 'Failed to update project');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      logSecurityEvent('project_update_error', { error: errorMessage });
    }
  };

  // Secure project deletion
  const handleDeleteProject = async () => {
    if (!deleteProjectState.project) return;

    try {
      const response = await secureProjectsApi.delete(deleteProjectState.project.id);

      if (response.success) {
        toast({
          title: "Success",
          description: "Project deleted successfully.",
        });
        
        setDeleteProjectState({ show: false, project: null });
        loadProjects();
        
        logSecurityEvent('project_deleted', { 
          projectId: deleteProjectState.project.id,
          projectName: deleteProjectState.project.name 
        });
      } else {
        throw new Error(response.errors?.[0] || 'Failed to delete project');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      logSecurityEvent('project_deletion_error', { error: errorMessage });
    }
  };

  // Start editing project
  const startEditing = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      startDate: project.start_date ? parseISO(project.start_date) : undefined,
      endDate: project.end_date ? parseISO(project.end_date) : undefined,
      color: project.color || '#3b82f6',
      status: project.status || DEFAULT_PROJECT_STATUS
    });
    setEditFormValidation({
      name: { isValid: true, errors: [] },
      startDate: { isValid: true, errors: [] },
      endDate: { isValid: true, errors: [] }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500">{error}</p>
          <Button onClick={loadProjects} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Secure Mode: All inputs are validated and sanitized for security
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const statusConfig = getProjectStatusConfig(project.status);
          const projectAllocations = allocations.filter(
            (allocation) => allocation.project_id === project.id
          );
          const totalAllocatedHours = projectAllocations.reduce(
            (sum, allocation) => sum + (allocation.hours_per_day || 0),
            0
          );

          return (
            <Card key={project.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(project)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteProjectState({ show: true, project })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className={`text-sm px-2 py-1 rounded ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Start:</span>{" "}
                    {project.start_date ? format(parseISO(project.start_date), "MMM dd, yyyy") : "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">End:</span>{" "}
                    {project.end_date ? format(parseISO(project.end_date), "MMM dd, yyyy") : "Not set"}
                  </div>
                  <div>
                    <span className="font-medium">Allocated Hours:</span> {totalAllocatedHours}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Project Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Create a new project with secure input validation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <SecureNameInput
                id="name"
                value={form.name}
                onChange={(value, isValid) => handleFormChange('name', value)}
                onValidationChange={(isValid, errors) => 
                  setFormValidation(prev => ({ ...prev, name: { isValid, errors } }))
                }
                placeholder="Enter project name"
                validationOptions={{ required: true, maxLength: 200 }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <SecureDateInput
                value={form.startDate?.toISOString().split('T')[0] || ''}
                onChange={(value) => handleFormChange('startDate', value ? new Date(value) : undefined)}
                onValidationChange={(isValid, errors) => 
                  setFormValidation(prev => ({ ...prev, startDate: { isValid, errors } }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <SecureDateInput
                value={form.endDate?.toISOString().split('T')[0] || ''}
                onChange={(value) => handleFormChange('endDate', value ? new Date(value) : undefined)}
                onValidationChange={(isValid, errors) => 
                  setFormValidation(prev => ({ ...prev, endDate: { isValid, errors } }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => handleFormChange('status', value as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getProjectStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details with secure validation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <SecureNameInput
                id="edit-name"
                value={editForm.name}
                onChange={(value, isValid) => handleEditFormChange('name', value)}
                onValidationChange={(isValid, errors) => 
                  setEditFormValidation(prev => ({ ...prev, name: { isValid, errors } }))
                }
                placeholder="Enter project name"
                validationOptions={{ required: true, maxLength: 200 }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <SecureDateInput
                value={editForm.startDate?.toISOString().split('T')[0] || ''}
                onChange={(value) => handleEditFormChange('startDate', value ? new Date(value) : undefined)}
                onValidationChange={(isValid, errors) => 
                  setEditFormValidation(prev => ({ ...prev, startDate: { isValid, errors } }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <SecureDateInput
                value={editForm.endDate?.toISOString().split('T')[0] || ''}
                onChange={(value) => handleEditFormChange('endDate', value ? new Date(value) : undefined)}
                onValidationChange={(isValid, errors) => 
                  setEditFormValidation(prev => ({ ...prev, endDate: { isValid, errors } }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => handleEditFormChange('status', value as ProjectStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getProjectStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject}>
              Update Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteProjectState.show} onOpenChange={(open) => setDeleteProjectState({ show: open, project: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteProjectState.project?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectState({ show: false, project: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 