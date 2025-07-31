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
import { useHolidays } from "@/context/HolidayContext";
import { AllocationBar } from "./AllocationBar";
import { getEmployeeProjectNamesWithCleanup, getEmployeeProjectAllocationsWithCleanup, initializeProjectData } from "@/lib/project-data";
import { useWorkingHours } from "@/lib/working-hours";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, parseISO, addDays } from "date-fns";
import { teamMembersApi, TeamMember, projectAllocationsApi, vacationsApi, ProjectAllocation, Vacation } from "@/lib/api";
import { COUNTRY_FLAGS, DEFAULT_ROLES } from "@/lib/constants";
import { calculateEmployeeAllocationPercentage, getEmployeeAvailableHours, calculateEmployeeAllocatedHoursForMonth } from "@/lib/allocation-utils";
import { getAllocationStatus } from "@/lib/employee-data";
import { formatHours, isWeekendDay } from "@/lib/calendar-utils";

export const TeamManagement = () => {
  const { toast } = useToast();
  const { getWorkingHoursForCountry } = useWorkingHours();
  const { holidays } = useHolidays();
  const { buffer } = useSettings();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Month navigation functions (same as Calendar page)
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // State for editing
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState<Partial<TeamMember>>({});

  // Load team members and related data from API
  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel
      const [membersData, allocationsData, vacationsData] = await Promise.all([
        teamMembersApi.getAll(),
        projectAllocationsApi.getAll(),
        vacationsApi.getAll()
      ]);
      
      setMembers(membersData);
      setAllocations(allocationsData);
      setVacations(vacationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data');
      toast({
        title: "Error",
        description: "Failed to load team data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  // Listen for team updates to refresh data
  useEffect(() => {
    const handleTeamUpdate = () => {
      loadTeamData();
    };

    window.addEventListener('teamUpdate', handleTeamUpdate);
    
    return () => {
      window.removeEventListener('teamUpdate', handleTeamUpdate);
    };
  }, []);

  // Refresh data when month changes
  useEffect(() => {
    // The data will automatically update when currentDate changes
    // because getMemberAllocationData uses currentDate in its calculations
  }, [currentDate]);

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

  // Helper function to get allocation data for a team member
  const getMemberAllocationData = (member: TeamMember) => {
    // Convert TeamMember to Employee format for calculations
    const employee = {
      id: member.id.toString(),
      name: member.name,
      role: member.role,
      country: member.country,
      allocatedHours: member.allocatedHours,
      availableHours: 0, // Will be calculated
      vacationDays: 0,
      holidayDays: 0
    };

    // Calculate allocation percentage using the same logic as Calendar
    const allocationPercentage = calculateEmployeeAllocationPercentage(
      employee,
      allocations,
      currentDate,
      holidays,
      vacations,
      buffer
    );

    // Calculate available hours using the same logic as Calendar
    const availableHours = getEmployeeAvailableHours(
      employee,
      currentDate,
      holidays,
      vacations,
      buffer
    );

    // Calculate allocated hours for current month
    const allocatedHours = calculateEmployeeAllocatedHoursForMonth(
      employee.id,
      allocations,
      currentDate
    );

    // Calculate total days off for current month (holidays + vacations)
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    let totalDaysOff = 0;
    
    // Calculate holiday days
    holidays.forEach(holiday => {
      const holidayDate = parseISO(holiday.date);
      
      if (holidayDate >= monthStart && holidayDate <= monthEnd) {
        // Check if holiday applies to employee's country
        if (holiday.country === 'Both' || holiday.country === member.country) {
          // Only count if it's a working day (not weekend)
          if (!isWeekendDay(holidayDate)) {
            totalDaysOff += 1;
          }
        }
      }
    });
    
    // Calculate vacation days
    vacations.forEach(vacation => {
      if (vacation.employeeId === member.id.toString()) {
        const vacationStart = parseISO(vacation.startDate);
        const vacationEnd = parseISO(vacation.endDate);
        
        // Check if vacation overlaps with current month
        if (vacationEnd >= monthStart && vacationStart <= monthEnd) {
          const effectiveStart = vacationStart < monthStart ? monthStart : vacationStart;
          const effectiveEnd = vacationEnd > monthEnd ? monthEnd : vacationEnd;
          
          // Count working days in vacation period
          let workingDays = 0;
          let currentDate = new Date(effectiveStart);
          while (currentDate <= effectiveEnd) {
            if (!isWeekendDay(currentDate)) {
              workingDays++;
            }
            currentDate = addDays(currentDate, 1);
          }
          
          totalDaysOff += workingDays;
        }
      }
    });

    // Get allocation status
    const status = getAllocationStatus(allocationPercentage);

    return {
      percentage: allocationPercentage,
      allocatedHours,
      availableHours,
      status,
      weeklyHours: getWorkingHoursForCountry(member.country),
      vacationDays: totalDaysOff
    };
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
          <Button onClick={loadTeamData}>Retry</Button>
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
            Manage your team members and their allocations for {format(currentDate, 'MMMM yyyy')}
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

      {/* Search and Month Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
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
        
        {/* Month Navigation Control */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium min-w-[100px] text-center hidden sm:block">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <div className="text-sm font-medium min-w-[80px] text-center sm:hidden">
            {format(currentDate, 'MMM yyyy')}
          </div>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:block">
            Today
          </Button>
        </div>
      </div>

      {/* Team Members Grid - Unified UI with Allocation Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full">
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
          </div>
        ) : (
          filteredMembers
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((member) => {
              const allocationData = getMemberAllocationData(member);
              return (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    {/* Header with Avatar, Name, Role, and Location */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm">{member.name}</h3>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {member.country}
                      </Badge>
                    </div>

                    {/* Allocation Progress Bar */}
                    <div className="mb-4">
                      <AllocationBar 
                        percentage={allocationData.percentage}
                        height="sm"
                        showLabel={true}
                      />
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          {formatHours(allocationData.allocatedHours)}h
                        </div>
                        <div className="text-xs text-muted-foreground">Allocated</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          {formatHours(allocationData.availableHours)}h
                        </div>
                        <div className="text-xs text-muted-foreground">Available</div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          {allocationData.weeklyHours}h/week
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {allocationData.vacationDays > 0 ? `${allocationData.vacationDays} Days off` : 'No days off'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-1 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(member)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
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