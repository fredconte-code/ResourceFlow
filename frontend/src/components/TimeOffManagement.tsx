import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Edit, 
  MapPin, 
  Users, 
  AlertTriangle,
  Loader2,
  Search,
  Filter,
  Clock,
  User,
  Building,
  Globe,
  CheckCircle,
  XCircle,
  MinusCircle,
  GripVertical,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { format, differenceInDays, isAfter, isBefore, addDays, isSameDay, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getCurrentEmployees, Employee } from "@/lib/employee-data";
import { holidaysApi, vacationsApi, Holiday as ApiHoliday, Vacation as ApiVacation } from "@/lib/api";

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
  type: 'Vacation' | 'Sick Leave' | 'Personal' | 'Other';
  notes?: string;
}

export const TimeOffManagement: React.FC = () => {
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [vacations, setVacations] = useState<VacationItem[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Form State
  const [holidayForm, setHolidayForm] = useState({
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
    type: 'Vacation' as 'Vacation' | 'Sick Leave' | 'Personal' | 'Other',
    notes: ''
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
      
      const [holidaysData, vacationsData, employeesData] = await Promise.all([
        holidaysApi.getAll(),
        vacationsApi.getAll(),
        getCurrentEmployees()
      ]);
      
      console.log('📊 Data loaded:', {
        holidays: holidaysData.length,
        vacations: vacationsData.length,
        employees: employeesData.length
      });
      
      // Convert API data to component format
      const convertedHolidays = holidaysData.map((holiday: ApiHoliday) => ({
        id: holiday.id.toString(),
        name: holiday.name,
        date: new Date(holiday.date),
        country: holiday.country as 'Canada' | 'Brazil' | 'Both',
        type: 'Company' as 'National' | 'Company' | 'Regional',
        isRecurring: false
      }));
      
      const convertedVacations = vacationsData.map((vacation: ApiVacation) => {
        const employee = employeesData.find(emp => emp.id === vacation.employeeId);
        return {
          id: vacation.id.toString(),
          employeeId: vacation.employeeId,
          employeeName: vacation.employeeName,
          employeeRole: employee?.role || 'Unknown',
          employeeCountry: employee?.country || 'Unknown',
          startDate: new Date(vacation.startDate),
          endDate: new Date(vacation.endDate),
          days: differenceInDays(new Date(vacation.endDate), new Date(vacation.startDate)) + 1,
          type: vacation.type as 'Vacation' | 'Sick Leave' | 'Personal' | 'Other',
          notes: ''
        };
      });
      
      setEmployees(employeesData);
      setHolidays(convertedHolidays);
      setVacations(convertedVacations);
      
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
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: "Error",
        description: "Failed to add holiday. Please try again.",
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
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete holiday. Please try again.",
        variant: "destructive",
      });
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

      if (isAfter(vacationForm.startDate, vacationForm.endDate)) {
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
        type: 'Vacation',
        notes: ''
      });
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Error adding vacation:', error);
      toast({
        title: "Error",
        description: "Failed to add vacation request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVacation = async (id: string) => {
    try {
      await vacationsApi.delete(parseInt(id));
      
      toast({
        title: "Success",
        description: "Vacation request deleted successfully.",
      });
      
      loadData(); // Refresh data
      
    } catch (error) {
      console.error('Error deleting vacation:', error);
      toast({
        title: "Error",
        description: "Failed to delete vacation request. Please try again.",
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

  const filteredVacations = vacations.filter(vacation => {
    const matchesSearch = vacation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacation.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === 'all' || vacation.employeeCountry === filterCountry;
    const matchesType = filterType === 'all' || vacation.type === filterType;
    return matchesSearch && matchesCountry && matchesType;
  });

  // Get type badge variant
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Vacation': return 'default';
      case 'Sick Leave': return 'destructive';
      case 'Personal': return 'secondary';
      case 'Other': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Time Off Management</h2>
            <p className="text-muted-foreground text-sm">
              Manage holidays and vacation schedules that affect team availability.
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
              Manage holidays and vacation schedules that affect team availability.
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
            Manage holidays and vacation schedules that affect team availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowHolidayForm(true)} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
          <Button onClick={() => setShowVacationForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Vacation
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Brazil">Brazil</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Vacation">Vacation</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="vacations">Vacations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Holidays</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{holidays.length}</div>
                <p className="text-xs text-muted-foreground">
                  Company and national holidays
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vacations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vacations.length}</div>
                <p className="text-xs text-muted-foreground">
                  Vacation requests
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...vacations, ...holidays]
                  .sort((a, b) => {
                    const dateA = 'startDate' in a ? a.startDate : a.date;
                    const dateB = 'startDate' in b ? b.startDate : b.date;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                  })
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium">
                            {'employeeName' in item ? item.employeeName : item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {'employeeName' in item ? item.type : 'Holiday'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format('startDate' in item ? item.startDate : item.date, 'MMM dd, yyyy')}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Holidays</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredHolidays.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No holidays found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding a company holiday.
                  </p>
                  <Button onClick={() => setShowHolidayForm(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holiday
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div>
                          <p className="font-medium">{holiday.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(holiday.date, 'MMM dd, yyyy')}</span>
                            <Globe className="h-3 w-3" />
                            <span>{holiday.country}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{holiday.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vacations Tab */}
        <TabsContent value="vacations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vacation Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredVacations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No vacation requests found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding a vacation request.
                  </p>
                  <Button onClick={() => setShowVacationForm(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vacation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVacations.map((vacation) => (
                    <div
                      key={vacation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{vacation.employeeName}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{vacation.employeeRole}</span>
                              <span>•</span>
                              <span>{vacation.employeeCountry}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(vacation.startDate, 'MMM dd')} - {format(vacation.endDate, 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vacation.days} day{vacation.days !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant={getTypeBadgeVariant(vacation.type)}>
                          {vacation.type}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteVacation(vacation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <div className="grid gap-2">
              <Label htmlFor="vacation-notes">Notes (Optional)</Label>
              <Textarea
                id="vacation-notes"
                value={vacationForm.notes}
                onChange={(e) => setVacationForm({ ...vacationForm, notes: e.target.value })}
                placeholder="Additional notes about this request..."
                rows={3}
              />
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