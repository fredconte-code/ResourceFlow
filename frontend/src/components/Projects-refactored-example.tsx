import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, Save, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { projectsApi, Project, ProjectStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PROJECT_COLORS, DEFAULT_ROLES, BUTTON_TEXT, FIELD_LABELS, TOAST_VARIANTS } from "@/lib/constants";
import { formatDateForAPI, formatDateForDisplay, parseDateFromAPI } from "@/lib/date-utils";
import { validateRequired, validateDateRange } from "@/lib/form-validation";
import { DatePicker } from "@/components/ui/date-picker";
import { FormDialog } from "@/components/ui/form-dialog";

const DEFAULT_PROJECT_STATUS: ProjectStatus = 'active';

export const ProjectsRefactored = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    color: '#3b82f6',
    status: DEFAULT_PROJECT_STATUS
  });

  const [editForm, setEditForm] = useState({
    name: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    color: '#3b82f6',
    status: DEFAULT_PROJECT_STATUS
  });

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: TOAST_VARIANTS.ERROR
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Handle allocation updates
  const handleAllocationUpdate = useCallback(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    window.addEventListener('projectAllocationsUpdate', handleAllocationUpdate);
    return () => {
      window.removeEventListener('projectAllocationsUpdate', handleAllocationUpdate);
    };
  }, [handleAllocationUpdate]);

  // Get project allocated hours
  const getProjectAllocatedHours = (projectId: number) => {
    // This would be calculated from allocations
    return 0;
  };

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setForm({ ...form, [field]: date });
  };

  // Add project with improved validation
  const handleAdd = async () => {
    // Use centralized validation
    if (!validateRequired(form.name, FIELD_LABELS.PROJECT_NAME)) {
      return;
    }

    // Use centralized date validation
    if (form.startDate && form.endDate && !validateDateRange(form.startDate, form.endDate)) {
      return;
    }

    try {
      const addedProject = await projectsApi.create({
        name: form.name,
        startDate: form.startDate ? formatDateForAPI(form.startDate) : undefined,
        endDate: form.endDate ? formatDateForAPI(form.endDate) : undefined,
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
        variant: TOAST_VARIANTS.SUCCESS
      });

      window.dispatchEvent(new CustomEvent('projectsUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add project.",
        variant: TOAST_VARIANTS.ERROR
      });
    }
  };

  // Edit handlers
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      name: project.name,
      startDate: project.startDate ? parseDateFromAPI(project.startDate) : undefined,
      endDate: project.endDate ? parseDateFromAPI(project.endDate) : undefined,
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

  // Save edit with improved validation
  const handleSaveEdit = async () => {
    if (!editingProject || !validateRequired(editForm.name, FIELD_LABELS.PROJECT_NAME)) {
      return;
    }

    if (editForm.startDate && editForm.endDate && !validateDateRange(editForm.startDate, editForm.endDate)) {
      return;
    }
    
    setSavingEdit(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedProject = await projectsApi.update(editingProject.id, {
        name: editForm.name,
        startDate: editForm.startDate ? formatDateForAPI(editForm.startDate) : undefined,
        endDate: editForm.endDate ? formatDateForAPI(editForm.endDate) : undefined,
        color: editForm.color,
        status: editForm.status
      });
      
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
      setEditingProject(null);
      setEditForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6', status: DEFAULT_PROJECT_STATUS });
      
      toast({
        title: "Success",
        description: "Project updated successfully.",
        variant: TOAST_VARIANTS.SUCCESS
      });

      window.dispatchEvent(new CustomEvent('projectsUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update project.",
        variant: TOAST_VARIANTS.ERROR
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6', status: DEFAULT_PROJECT_STATUS });
  };

  // Delete handlers
  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await projectsApi.delete(projectToDelete.id);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      
      toast({
        title: "Success",
        description: "Project deleted successfully.",
        variant: TOAST_VARIANTS.SUCCESS
      });

      window.dispatchEvent(new CustomEvent('projectsUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete project.",
        variant: TOAST_VARIANTS.ERROR
      });
    } finally {
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Projects</h1>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and their allocations.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card key={project.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(project)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {project.startDate && project.endDate && (
                  <div>
                    <span className="font-medium">Period:</span> {formatDateRange(parseDateFromAPI(project.startDate), parseDateFromAPI(project.endDate))}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span> {project.status}
                </div>
                <div>
                  <span className="font-medium">Allocated Hours:</span> {getProjectAllocatedHours(project.id)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Project Form Dialog */}
      <FormDialog
        open={showAddForm}
        onOpenChange={setShowAddForm}
        title="Add New Project"
        description="Create a new project with its details."
        onSave={handleAdd}
        saveText={BUTTON_TEXT.ADD}
        loading={false}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{FIELD_LABELS.PROJECT_NAME}</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter project name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.START_DATE}</Label>
            <DatePicker
              date={form.startDate}
              onDateChange={(date) => handleDateChange('startDate', date)}
              placeholder="Select start date"
            />
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.END_DATE}</Label>
            <DatePicker
              date={form.endDate}
              onDateChange={(date) => handleDateChange('endDate', date)}
              placeholder="Select end date"
            />
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.PROJECT_COLOR}</Label>
            <div className="grid grid-cols-10 gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-colors",
                    form.color === color ? "border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm({ ...form, color })}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.PROJECT_STATUS}</Label>
            <Select value={form.status} onValueChange={(value: ProjectStatus) => setForm({ ...form, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* Edit Project Dialog */}
      <FormDialog
        open={!!editingProject}
        onOpenChange={() => setEditingProject(null)}
        title="Edit Project"
        description="Update project details."
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        saveText={BUTTON_TEXT.SAVE}
        loading={savingEdit}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{FIELD_LABELS.PROJECT_NAME}</Label>
            <Input
              id="edit-name"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              placeholder="Enter project name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.START_DATE}</Label>
            <DatePicker
              date={editForm.startDate}
              onDateChange={(date) => handleEditDateChange('startDate', date)}
              placeholder="Select start date"
            />
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.END_DATE}</Label>
            <DatePicker
              date={editForm.endDate}
              onDateChange={(date) => handleEditDateChange('endDate', date)}
              placeholder="Select end date"
            />
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.PROJECT_COLOR}</Label>
            <div className="grid grid-cols-10 gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-colors",
                    editForm.color === color ? "border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setEditForm({ ...editForm, color })}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{FIELD_LABELS.PROJECT_STATUS}</Label>
            <Select value={editForm.status} onValueChange={(value: ProjectStatus) => setEditForm({ ...editForm, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <FormDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        onSave={handleConfirmDelete}
        saveText={BUTTON_TEXT.DELETE}
        cancelText={BUTTON_TEXT.CANCEL}
        showCancelButton={true}
        size="sm"
      >
        <div className="text-sm text-muted-foreground">
          This will also remove all associated project allocations.
        </div>
      </FormDialog>
    </div>
  );
}; 