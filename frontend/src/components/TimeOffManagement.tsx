import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { CalendarIcon, Plus, Edit, Trash2, Building, Users, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { holidaysApi, vacationsApi, Holiday as ApiHoliday, Vacation as ApiVacation } from "@/lib/api";
import { getCurrentEmployees, Employee } from "@/lib/employee-data";
import { useHolidays } from "@/context/HolidayContext";
import { useTimeOffs } from "@/context/TimeOffContext";

// Country flags mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'Canada': '🇨🇦',
  'Brazil': '🇧🇷',
  'Both': '🌎'
};

// Types - Using existing API interfaces and extending them
interface HolidayItem {
  id: string;
  name: string;
  date: Date;
  country: 'Canada' | 'Brazil' | 'Both';
  type: 'National' | 'Company' | 'Regional';
  isRecurring?: boolean;
}

interface VacationItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeCountry: string;
  startDate: Date;
  endDate: Date;
  days: number;
  type: 'Vacation' | 'Sick Leave' | 'Compensation' | 'Personal';
}

export const TimeOffManagement: React.FC = () => {
  const { toast } = useToast();
  const { holidays: globalHolidays, refreshHolidays } = useHolidays();
  const { timeOffs: globalTimeOffs, refreshTimeOffs } = useTimeOffs();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Convert global holidays to local format for display
  const holidays: HolidayItem[] = globalHolidays.map(holiday => ({
    id: holiday.id.toString(),
    name: holiday.name,
    date: parseISO(holiday.date), // Use parseISO to preserve local date
    country: holiday.country,
    type: 'Company' as const, // Default type since API doesn't store this
    isRecurring: false
  }));
  
  // Convert global time offs to local format for display
  const timeOffs: VacationItem[] = globalTimeOffs.map(timeOff => {
    const employee = employees.find(emp => emp.id === timeOff.employee_id);
    return {
      id: timeOff.id.toString(),
      employeeId: timeOff.employee_id,
      employeeName: timeOff.employee_name,
      employeeRole: employee?.role || 'Unknown',
      employeeCountry: employee?.country || 'Unknown',
      startDate: parseISO(timeOff.start_date),
      endDate: parseISO(timeOff.end_date),
      days: differenceInDays(parseISO(timeOff.end_date), parseISO(timeOff.start_date)) + 1,
      type: timeOff.type as 'Vacation' | 'Sick Leave' | 'Compensation' | 'Personal',
    };
  });
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Date picker state
  const [holidayDatePickerOpen, setHolidayDatePickerOpen] = useState(false);
  const [tempHolidayDate, setTempHolidayDate] = useState<Date | undefined>(undefined);
  
  // Edit state
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [showEditHolidayForm, setShowEditHolidayForm] = useState(false);
  const [editHolidayDatePickerOpen, setEditHolidayDatePickerOpen] = useState(false);
  const [tempEditHolidayDate, setTempEditHolidayDate] = useState<Date | undefined>(undefined);
  
  // Time Off Edit state
  const [editingVacation, setEditingVacation] = useState<VacationItem | null>(null);
  const [showEditVacationForm, setShowEditVacationForm] = useState(false);
  const [editVacationStartDatePickerOpen, setEditVacationStartDatePickerOpen] = useState(false);
  const [editVacationEndDatePickerOpen, setEditVacationEndDatePickerOpen] = useState(false);
  const [tempEditVacationStartDate, setTempEditVacationStartDate] = useState<Date | undefined>(undefined);
  const [tempEditVacationEndDate, setTempEditVacationEndDate] = useState<Date | undefined>(undefined);
  
  // Delete confirmation state
  const [showDeleteHolidayDialog, setShowDeleteHolidayDialog] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<HolidayItem | null>(null);
  const [showDeleteVacationDialog, setShowDeleteVacationDialog] = useState(false);
  const [vacationToDelete, setVacationToDelete] = useState<VacationItem | null>(null);
  
  // Form State
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: new Date(),
    country: 'Both' as 'Canada' | 'Brazil' | 'Both',
    type: 'Company' as 'National' | 'Company' | 'Regional',
    isRecurring: false
  });
  
  const [editHolidayForm, setEditHolidayForm] = useState({
    name: '',
    date: new Date(),
    country: 'Both' as 'Canada' | 'Brazil' | 'Both',
    type: 'Company' as 'National' | 'Company' | 'Regional',
    isRecurring: false
  });
  
  const [vacationForm, setVacationForm] = useState({
    employeeId: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'Vacation' as 'Vacation' | 'Sick Leave' | 'Compensation' | 'Personal',
  });

  const [editVacationForm, setEditVacationForm] = useState({
    employeeId: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'Vacation' as 'Vacation' | 'Sick Leave' | 'Compensation' | 'Personal',
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Loading TimeOffManagement data...');
      setLoading(true);
      setError(null);
      
      const employeesData = await getCurrentEmployees();
      
      console.log('📊 Data loaded:', {
        holidays: globalHolidays.length,
        timeOffs: globalTimeOffs.length,
        employees: employeesData.length
      });
      
      setEmployees(employeesData);
      
    } catch (error) {
      console.error('❌ Error loading TimeOffManagement data:', error);
      setError('Failed to load time off data. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load time off data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Holiday Management
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
        country: 'Both',
        type: 'Company',
        isRecurring: false
      });
      setTempHolidayDate(undefined);
      setHolidayDatePickerOpen(false);
      
      // Refresh global holidays and dispatch update event
      await refreshHolidays();
      window.dispatchEvent(new CustomEvent('holidaysUpdate'));
      
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: "Error",
        description: "Failed to add holiday. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditHoliday = (holiday: HolidayItem) => {
    setEditingHoliday(holiday);
    setEditHolidayForm({
      name: holiday.name,
      date: holiday.date,
      country: holiday.country,
      type: holiday.type,
      isRecurring: holiday.isRecurring || false
    });
    setTempEditHolidayDate(undefined);
    setShowEditHolidayForm(true);
  };

  const handleUpdateHoliday = async () => {
    if (!editingHoliday) return;
    
    try {
      if (!editHolidayForm.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Holiday name is required.",
          variant: "destructive",
        });
        return;
      }

      const updatedHoliday = {
        name: editHolidayForm.name,
        date: format(editHolidayForm.date, 'yyyy-MM-dd'),
        country: editHolidayForm.country
      };

      await holidaysApi.update(parseInt(editingHoliday.id), updatedHoliday);
      
      toast({
        title: "Success",
        description: "Holiday updated successfully.",
      });
      
      setShowEditHolidayForm(false);
      setEditingHoliday(null);
      setTempEditHolidayDate(undefined);
      setEditHolidayDatePickerOpen(false);
      
      // Refresh global holidays and dispatch update event
      await refreshHolidays();
      window.dispatchEvent(new CustomEvent('holidaysUpdate'));
      
    } catch (error) {
      console.error('Error updating holiday:', error);
      toast({
        title: "Error",
        description: "Failed to update holiday. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await holidaysApi.delete(parseInt(id));
      
      toast({
        title: "Success",
        description: "Holiday deleted successfully.",
      });
      
      // Refresh global holidays and dispatch update event
      await refreshHolidays();
      window.dispatchEvent(new CustomEvent('holidaysUpdate'));
      
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete holiday. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteHoliday = (holiday: HolidayItem) => {
    setHolidayToDelete(holiday);
    setShowDeleteHolidayDialog(true);
  };

  const executeDeleteHoliday = async () => {
    if (!holidayToDelete) return;
    
    try {
      await holidaysApi.delete(parseInt(holidayToDelete.id));
      
      toast({
        title: "Success",
        description: "Holiday deleted successfully.",
      });
      
      // Refresh global holidays and dispatch update event
      await refreshHolidays();
      window.dispatchEvent(new CustomEvent('holidaysUpdate'));
      
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete holiday. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteHolidayDialog(false);
      setHolidayToDelete(null);
    }
  };

  // Vacation Management
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

             if (vacationForm.startDate > vacationForm.endDate) {
        toast({
          title: "Validation Error",
          description: "Start date must be before end date.",
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
        employee_id: vacationForm.employeeId,
        employee_name: employee.name,
        start_date: format(vacationForm.startDate, 'yyyy-MM-dd'),
        end_date: format(vacationForm.endDate, 'yyyy-MM-dd'),
        type: vacationForm.type
      };

      await vacationsApi.create(newVacation);
      
      toast({
        title: "Success",
        description: "Time off request added successfully.",
      });
      
      setShowVacationForm(false);
      setVacationForm({
        employeeId: '',
        startDate: new Date(),
        endDate: new Date(),
        type: 'Vacation',
      });
      
      // Refresh global time offs and dispatch update event
      await refreshTimeOffs();
      window.dispatchEvent(new CustomEvent('timeOffsUpdate'));
      
    } catch (error) {
      console.error('Error adding vacation:', error);
      toast({
        title: "Error",
        description: "Failed to add time off request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVacation = async (id: string) => {
    try {
      await vacationsApi.delete(parseInt(id));
      
      toast({
        title: "Success",
        description: "Time off request deleted successfully.",
      });
      
      // Refresh global time offs and dispatch update event
      await refreshTimeOffs();
      window.dispatchEvent(new CustomEvent('timeOffsUpdate'));
      
    } catch (error) {
      console.error('Error deleting vacation:', error);
      toast({
        title: "Error",
        description: "Failed to delete time off request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteVacation = (vacation: VacationItem) => {
    setVacationToDelete(vacation);
    setShowDeleteVacationDialog(true);
  };

  const executeDeleteVacation = async () => {
    if (!vacationToDelete) return;
    
    try {
      await vacationsApi.delete(parseInt(vacationToDelete.id));
      
      toast({
        title: "Success",
        description: "Time off request deleted successfully.",
      });
      
      // Refresh global time offs and dispatch update event
      await refreshTimeOffs();
      window.dispatchEvent(new CustomEvent('timeOffsUpdate'));
      
    } catch (error) {
      console.error('Error deleting vacation:', error);
      toast({
        title: "Error",
        description: "Failed to delete time off request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteVacationDialog(false);
      setVacationToDelete(null);
    }
  };

  // Time Off Edit functions
  const handleEditVacation = (vacation: VacationItem) => {
    setEditingVacation(vacation);
    setEditVacationForm({
      employeeId: vacation.employeeId,
      startDate: vacation.startDate,
      endDate: vacation.endDate,
      type: vacation.type
    });
    setShowEditVacationForm(true);
  };

  const handleUpdateVacation = async () => {
    if (!editingVacation) return;

    try {
      const employee = employees.find(emp => emp.id === editVacationForm.employeeId);
      if (!employee) {
        toast({
          title: "Error",
          description: "Employee not found.",
          variant: "destructive",
        });
        return;
      }

      const updatedVacation = {
        employee_id: editVacationForm.employeeId,
        employee_name: employee.name,
        start_date: format(editVacationForm.startDate, 'yyyy-MM-dd'),
        end_date: format(editVacationForm.endDate, 'yyyy-MM-dd'),
        type: editVacationForm.type
      };

      await vacationsApi.update(parseInt(editingVacation.id), updatedVacation);
      
      toast({
        title: "Success",
        description: "Time off request updated successfully.",
      });
      
      setShowEditVacationForm(false);
      setEditingVacation(null);
      setEditVacationForm({
        employeeId: '',
        startDate: new Date(),
        endDate: new Date(),
        type: 'Vacation'
      });
      
      // Refresh global time offs and dispatch update event
      await refreshTimeOffs();
      window.dispatchEvent(new CustomEvent('timeOffsUpdate'));
      
    } catch (error) {
      console.error('Error updating vacation:', error);
      toast({
        title: "Error",
        description: "Failed to update time off request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter functions
  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === 'all' || holiday.country === filterCountry;
    return matchesSearch && matchesCountry;
  });

  const filteredVacations = timeOffs.filter(vacation => {
    const matchesSearch = vacation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacation.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === 'all' || vacation.employeeCountry === filterCountry;
    const matchesType = filterType === 'all' || vacation.type === filterType;
    return matchesSearch && matchesCountry && matchesType;
  });

  // Get type badge variant
  const getTypeBadgeVariant = (type: string) => {
    return 'outline';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Time Off Management</h2>
            <p className="text-muted-foreground text-sm">
              Manage holidays and time off schedules that affect team availability.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading time off data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Time Off Management</h2>
            <p className="text-muted-foreground text-sm">
              Manage holidays and time off schedules that affect team availability.
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} variant="outline">
          <Loader2 className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Time Off Management</h2>
          <p className="text-muted-foreground text-sm">
            Manage holidays and time off schedules that affect team availability.
          </p>
        </div>
      </div>

      {/* Side by Side Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holidays Container */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Holidays</CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {holidays.length}
                </Badge>
              </div>
              <Button onClick={() => setShowHolidayForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Manage company holidays and national days off that affect team availability.
            </p>
            <div className="h-4"></div>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <div className="text-center py-8">
                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No holidays configured yet</p>
                <Button onClick={() => setShowHolidayForm(true)} size="sm">
                  Add your first holiday
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {holidays
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3"></div>
                        <div>
                          <p className="font-medium text-sm">{holiday.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{format(holiday.date, 'MMM dd, yyyy')}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {holiday.type}
                            </Badge>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              {holiday.country === 'Both' ? (
                                <>
                                  <span>🌎</span>
                                  <span>Global</span>
                                </>
                              ) : (
                                <>
                                  <span>{COUNTRY_FLAGS[holiday.country]}</span>
                                  <span>{holiday.country}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditHoliday(holiday)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDeleteHoliday(holiday)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Off Container */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Time Off</CardTitle>
                <Badge variant="secondary" className="ml-2">
                  {timeOffs.length}
                </Badge>
              </div>
              <Button onClick={() => setShowVacationForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Time Off
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Manage employee time off requests including vacations, sick leave, compensation days, and personal time.
            </p>
          </CardHeader>
          <CardContent>
            {timeOffs.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No time off requests yet</p>
                <Button onClick={() => setShowVacationForm(true)} size="sm">
                  Add your first time off request
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {timeOffs
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((vacation) => (
                    <div key={vacation.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3"></div>
                        <div>
                          <p className="font-medium text-sm">{vacation.employeeName}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{format(vacation.startDate, 'MMM dd')} - {format(vacation.endDate, 'MMM dd, yyyy')}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {vacation.type}
                            </Badge>
                            <span>•</span>
                            <span>{vacation.days} days</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVacation(vacation)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDeleteVacation(vacation)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>



      {/* Add Holiday Dialog */}
      <Dialog open={showHolidayForm} onOpenChange={(open) => {
        setShowHolidayForm(open);
        if (!open) {
          setTempHolidayDate(undefined);
          setHolidayDatePickerOpen(false);
        }
      }}>
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
              <Popover open={holidayDatePickerOpen} onOpenChange={setHolidayDatePickerOpen}>
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
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={tempHolidayDate || holidayForm.date}
                      onSelect={(date) => setTempHolidayDate(date)}
                      initialFocus
                    />
                    <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempHolidayDate(undefined);
                          setHolidayDatePickerOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (tempHolidayDate) {
                            setHolidayForm({ ...holidayForm, date: tempHolidayDate });
                          }
                          setTempHolidayDate(undefined);
                          setHolidayDatePickerOpen(false);
                        }}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
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
                  <SelectItem value="Canada">
                    <div className="flex items-center space-x-2">
                      <span>{COUNTRY_FLAGS['Canada']}</span>
                      <span>Canada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Brazil">
                    <div className="flex items-center space-x-2">
                      <span>{COUNTRY_FLAGS['Brazil']}</span>
                      <span>Brazil</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Both">
                    <div className="flex items-center space-x-2">
                      <span>🌎</span>
                      <span>Global</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="holiday-type">Type</Label>
              <Select
                value={holidayForm.type}
                onValueChange={(value: 'National' | 'Company' | 'Regional') =>
                  setHolidayForm({ ...holidayForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National Holiday</SelectItem>
                  <SelectItem value="Company">Company Holiday</SelectItem>
                  <SelectItem value="Regional">Regional Holiday</SelectItem>
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

      {/* Edit Holiday Dialog */}
      <Dialog open={showEditHolidayForm} onOpenChange={(open) => {
        setShowEditHolidayForm(open);
        if (!open) {
          setTempEditHolidayDate(undefined);
          setEditHolidayDatePickerOpen(false);
          setEditingHoliday(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
            <DialogDescription>
              Update the holiday information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-holiday-name">Holiday Name</Label>
              <Input
                id="edit-holiday-name"
                value={editHolidayForm.name}
                onChange={(e) => setEditHolidayForm({ ...editHolidayForm, name: e.target.value })}
                placeholder="e.g., Christmas Day"
              />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover open={editHolidayDatePickerOpen} onOpenChange={setEditHolidayDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editHolidayForm.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editHolidayForm.date ? format(editHolidayForm.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={tempEditHolidayDate || editHolidayForm.date}
                      onSelect={(date) => setTempEditHolidayDate(date)}
                      initialFocus
                    />
                    <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempEditHolidayDate(undefined);
                          setEditHolidayDatePickerOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (tempEditHolidayDate) {
                            setEditHolidayForm({ ...editHolidayForm, date: tempEditHolidayDate });
                          }
                          setTempEditHolidayDate(undefined);
                          setEditHolidayDatePickerOpen(false);
                        }}
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-holiday-country">Country</Label>
              <Select
                value={editHolidayForm.country}
                onValueChange={(value: 'Canada' | 'Brazil' | 'Both') =>
                  setEditHolidayForm({ ...editHolidayForm, country: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canada">
                    <div className="flex items-center space-x-2">
                      <span>{COUNTRY_FLAGS['Canada']}</span>
                      <span>Canada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Brazil">
                    <div className="flex items-center space-x-2">
                      <span>{COUNTRY_FLAGS['Brazil']}</span>
                      <span>Brazil</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Both">
                    <div className="flex items-center space-x-2">
                      <span>🌎</span>
                      <span>Global</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-holiday-type">Type</Label>
              <Select
                value={editHolidayForm.type}
                onValueChange={(value: 'National' | 'Company' | 'Regional') =>
                  setEditHolidayForm({ ...editHolidayForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National">National Holiday</SelectItem>
                  <SelectItem value="Company">Company Holiday</SelectItem>
                  <SelectItem value="Regional">Regional Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditHolidayForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateHoliday}>
              Update Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Time Off Dialog */}
      <Dialog open={showVacationForm} onOpenChange={setShowVacationForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Time Off Request</DialogTitle>
            <DialogDescription>
              Create a new time off request for a team member.
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
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={vacationForm.startDate}
                        onSelect={(date) => date && setVacationForm({ ...vacationForm, startDate: date })}
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
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={vacationForm.endDate}
                        onSelect={(date) => date && setVacationForm({ ...vacationForm, endDate: date })}
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
            <div className="grid gap-2">
              <Label htmlFor="vacation-type">Type</Label>
              <Select
                value={vacationForm.type}
                onValueChange={(value: 'Vacation' | 'Sick Leave' | 'Compensation' | 'Personal') =>
                  setVacationForm({ ...vacationForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Compensation">Compensation</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVacationForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVacation}>
              Add Time Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Time Off Dialog */}
      <Dialog open={showEditVacationForm} onOpenChange={(open) => {
        setShowEditVacationForm(open);
        if (!open) {
          setEditVacationStartDatePickerOpen(false);
          setEditVacationEndDatePickerOpen(false);
          setEditingVacation(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Time Off Request</DialogTitle>
            <DialogDescription>
              Update the time off request information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-vacation-employee">Employee</Label>
              <Select
                value={editVacationForm.employeeId}
                onValueChange={(value) => setEditVacationForm({ ...editVacationForm, employeeId: value })}
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
                <Popover open={editVacationStartDatePickerOpen} onOpenChange={setEditVacationStartDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editVacationForm.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editVacationForm.startDate ? format(editVacationForm.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={tempEditVacationStartDate || editVacationForm.startDate}
                        onSelect={(date) => setTempEditVacationStartDate(date)}
                        initialFocus
                      />
                      <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTempEditVacationStartDate(undefined);
                            setEditVacationStartDatePickerOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (tempEditVacationStartDate) {
                              setEditVacationForm({ ...editVacationForm, startDate: tempEditVacationStartDate });
                            }
                            setTempEditVacationStartDate(undefined);
                            setEditVacationStartDatePickerOpen(false);
                          }}
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Popover open={editVacationEndDatePickerOpen} onOpenChange={setEditVacationEndDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editVacationForm.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editVacationForm.endDate ? format(editVacationForm.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <Calendar
                        mode="single"
                        selected={tempEditVacationEndDate || editVacationForm.endDate}
                        onSelect={(date) => setTempEditVacationEndDate(date)}
                        initialFocus
                      />
                      <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTempEditVacationEndDate(undefined);
                            setEditVacationEndDatePickerOpen(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (tempEditVacationEndDate) {
                              setEditVacationForm({ ...editVacationForm, endDate: tempEditVacationEndDate });
                            }
                            setTempEditVacationEndDate(undefined);
                            setEditVacationEndDatePickerOpen(false);
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
            <div className="grid gap-2">
              <Label htmlFor="edit-vacation-type">Type</Label>
              <Select
                value={editVacationForm.type}
                onValueChange={(value: 'Vacation' | 'Sick Leave' | 'Compensation' | 'Personal') =>
                  setEditVacationForm({ ...editVacationForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Compensation">Compensation</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditVacationForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVacation}>
              Update Time Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Confirmation Dialog */}
      <Dialog open={showDeleteHolidayDialog} onOpenChange={setShowDeleteHolidayDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Holiday</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{holidayToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteHolidayDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeDeleteHoliday}>
              Delete Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Time Off Confirmation Dialog */}
      <Dialog open={showDeleteVacationDialog} onOpenChange={setShowDeleteVacationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Time Off Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the time off request for "{vacationToDelete?.employeeName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteVacationDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeDeleteVacation}>
              Delete Time Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 