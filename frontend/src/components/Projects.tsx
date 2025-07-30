import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Trash2, Edit2, Save, X, Calendar as CalendarIcon, Plus, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { projectsApi, Project } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const Projects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", startDate: undefined as Date | undefined, endDate: undefined as Date | undefined, color: '#3b82f6' });
  
  // State for showing/hiding add form
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Predefined color palette for projects (20 colors - strong and light variants)
  const projectColors = [
    // Row 1: Strong Colors
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
    
    // Row 2: Light Colors (corresponding to strong colors above)
    '#93c5fd', // Light Blue
    '#fca5a5', // Light Red
    '#86efac', // Light Green
    '#fcd34d', // Light Amber
    '#c4b5fd', // Light Purple
    '#f9a8d4', // Light Pink
    '#67e8f9', // Light Cyan
    '#bef264', // Light Lime
    '#fdba74', // Light Orange
    '#a5b4fc', // Light Indigo
  ];
  
  // State for editing
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({ name: "", startDate: undefined as Date | undefined, endDate: undefined as Date | undefined, color: '#3b82f6' });
  
  // State for delete confirmation
  const [deleteProjectState, setDeleteProjectState] = useState<Project | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load projects from API
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.getAll();
      setProjects(data);
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
        allocatedHours: 0
      });
      
      setProjects(prev => [...prev, addedProject]);
      setForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6' });
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
      color: project.color
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
        color: editForm.color
      });
      
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
      setEditingProject(null);
      setEditForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6' });
      
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
    setEditForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6' });
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                  <Calendar
                    mode="single"
                    selected={form.startDate}
                    onSelect={(date) => handleDateChange('startDate', date)}
                    initialFocus
                  />
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
                  <Calendar
                    mode="single"
                    selected={form.endDate}
                    onSelect={(date) => handleDateChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

                          <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="grid grid-cols-10 gap-2">
                  {projectColors.map((color) => (
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
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Add Project
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setForm({ name: "", startDate: undefined, endDate: undefined, color: '#3b82f6' });
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
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: project.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-sm">{project.name}</h3>
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
                        {project.allocatedHours > 0 && (
                          <>
                            <span>•</span>
                            <span>{project.allocatedHours}h allocated</span>
                          </>
                        )}
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
                      <Calendar
                        mode="single"
                        selected={editForm.startDate}
                        onSelect={(date) => handleEditDateChange('startDate', date)}
                        initialFocus
                      />
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
                      <Calendar
                        mode="single"
                        selected={editForm.endDate}
                        onSelect={(date) => handleEditDateChange('endDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="grid grid-cols-10 gap-2">
                  {projectColors.map((color) => (
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