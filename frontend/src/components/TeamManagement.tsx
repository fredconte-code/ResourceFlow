import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, Save, MapPin, Edit2, X, Users, Clock, Calendar, Folder, AlertCircle, Info, ChevronLeft, ChevronRight, Download, Upload, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/SettingsContext";
import { AllocationBar } from "./AllocationBar";
import { getEmployeeProjectNamesWithCleanup, getEmployeeProjectAllocationsWithCleanup, initializeProjectData } from "@/lib/project-data";
import { useWorkingHours } from "@/lib/working-hours";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";
import { teamMembersApi, TeamMember } from "@/lib/api";
import { COUNTRY_FLAGS, DEFAULT_ROLES } from "@/lib/constants";

export const TeamManagement = () => {
  const { toast } = useToast();
  const { getWorkingHoursForCountry } = useWorkingHours();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // State for editing
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState<Partial<TeamMember>>({});

  // Load team members from API
  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamMembersApi.getAll();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team members');
      toast({
        title: "Error",
        description: "Failed to load team members. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    country: 'Canada'
  });

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<{name?: string, role?: string, country?: string}>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);



  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role || !newMember.country) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const addedMember = await teamMembersApi.create({
        name: newMember.name,
        role: newMember.role,
        country: newMember.country as 'Canada' | 'Brazil'
      });

      setMembers(prev => [...prev, addedMember]);
      setNewMember({ name: '', role: '', country: 'Canada', allocatedHours: 0 });
      setShowAddForm(false);
      setShowCustomRole(false);
      setCustomRole('');

      toast({
        title: "Success",
        description: "Team member added successfully.",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('teamUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add team member.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      role: member.role,
      country: member.country
    });
  };

  const [savingEdit, setSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    if (!editingMember || !editForm.name || !editForm.role || !editForm.country) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSavingEdit(true);
    try {
      // Add a small delay to make the animation visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedMember = await teamMembersApi.update(editingMember.id, {
        name: editForm.name,
        role: editForm.role,
        country: editForm.country as 'Canada' | 'Brazil'
      });

      setMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m));
      setEditingMember(null);
      setEditForm({});

      toast({
        title: "Success",
        description: "Team member updated successfully.",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('teamUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update team member.",
        variant: "destructive"
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      await teamMembersApi.delete(memberToDelete.id);
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      setShowDeleteDialog(false);
      setMemberToDelete(null);

      toast({
        title: "Success",
        description: "Team member deleted successfully.",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('teamUpdate'));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete team member.",
        variant: "destructive"
      });
    }
  };

  // Smart search that detects what you're searching for
  const filteredMembers = members.filter(member => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    
    // Check if search matches name, role, or country
    const matchesName = member.name.toLowerCase().includes(searchLower);
    const matchesRole = member.role.toLowerCase().includes(searchLower);
    const matchesCountry = member.country.toLowerCase().includes(searchLower);
    
    return matchesName || matchesRole || matchesCountry;
  });

  const handleRoleChange = (role: string) => {
    if (role === 'custom') {
      setShowCustomRole(true);
      setNewMember(prev => ({ ...prev, role: '' }));
    } else {
      setShowCustomRole(false);
      setNewMember(prev => ({ ...prev, role }));
    }
  };

  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomRole(e.target.value);
    setNewMember(prev => ({ ...prev, role: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading team members...</p>
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
          <Button onClick={loadTeamMembers}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage your team members and their allocations
          </p>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add New Team Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={newMember.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Role</SelectItem>
                  </SelectContent>
                </Select>
                {showCustomRole && (
                  <Input
                    value={customRole}
                    onChange={handleCustomRoleChange}
                    placeholder="Enter custom role"
                    className="mt-2"
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select 
                  value={newMember.country} 
                  onValueChange={(value) => setNewMember(prev => ({ ...prev, country: value as 'Canada' | 'Brazil' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                    <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Working Hours</Label>
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  {getWorkingHoursForCountry(newMember.country)} hours/week (from global settings)
                </div>
                <p className="text-xs text-muted-foreground">
                  Working hours are configured globally in Settings
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleAddMember} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setShowAddForm(false);
                setNewMember({ name: '', role: '', country: 'Canada' });
                setShowCustomRole(false);
                setCustomRole('');
              }}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="🔍 Smart search: name, role, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm pr-8"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          {search && (
            <div className="mt-1 text-xs text-muted-foreground">
              Found {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Team Members List */}
      <div className="grid gap-3">
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-24">
              <div className="text-center">
                <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  {search ? 'No team members found matching your search.' : 'No team members yet.'}
                </p>
                {!search && (
                  <Button onClick={() => setShowAddForm(true)} className="mt-2" size="sm">
                    Add your first team member
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMembers
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">{member.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{member.role}</span>
                        <span>•</span>
                        <span>{COUNTRY_FLAGS[member.country]} {member.country}</span>
                        <span>•</span>
                        <span>{getWorkingHoursForCountry(member.country)}h/week</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(member)}
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

      {/* Edit Member Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Select 
                  value={editForm.country || 'Canada'} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, country: value as 'Canada' | 'Brazil' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                    <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Working Hours</Label>
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  {getWorkingHoursForCountry(editForm.country || 'Canada')} hours/week (from global settings)
                </div>
                <p className="text-xs text-muted-foreground">
                  Working hours are configured globally in Settings
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>
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
            <DialogTitle>Delete Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {memberToDelete?.name}? This action cannot be undone.
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