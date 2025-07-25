import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, MapPin, Calendar as CalendarDays } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Holiday {
  id: string;
  name: string;
  date: Date;
  country?: 'Canada' | 'Brazil' | 'Both';
  type: 'National' | 'Company' | 'Regional';
}

interface Vacation {
  id: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: 'Approved' | 'Pending' | 'Requested';
  notes?: string;
}

const countryFlags = {
  'Canada': '🇨🇦',
  'Brazil': '🇧🇷',
  'Both': '🌍'
};

export const TimeOffManagement = () => {
  const { toast } = useToast();
  
  // Sample data
  const [holidays, setHolidays] = useState<Holiday[]>([
    {
      id: '1',
      name: 'New Year\'s Day',
      date: new Date(2024, 0, 1),
      country: 'Both',
      type: 'National'
    },
    {
      id: '2',
      name: 'Canada Day',
      date: new Date(2024, 6, 1),
      country: 'Canada',
      type: 'National'
    },
    {
      id: '3',
      name: 'Independence Day (Brazil)',
      date: new Date(2024, 8, 7),
      country: 'Brazil',
      type: 'National'
    }
  ]);

  const [vacations, setVacations] = useState<Vacation[]>([
    {
      id: '1',
      employeeName: 'Sarah Chen',
      startDate: new Date(2024, 2, 15),
      endDate: new Date(2024, 2, 22),
      days: 5,
      status: 'Approved',
      notes: 'Spring vacation'
    },
    {
      id: '2',
      employeeName: 'Marco Silva',
      startDate: new Date(2024, 3, 10),
      endDate: new Date(2024, 3, 12),
      days: 3,
      status: 'Pending',
      notes: 'Family visit'
    }
  ]);

  const [newHoliday, setNewHoliday] = useState<Partial<Holiday>>({
    name: '',
    date: undefined,
    country: 'Both',
    type: 'Company'
  });

  const [newVacation, setNewVacation] = useState<Partial<Vacation>>({
    employeeName: '',
    startDate: undefined,
    endDate: undefined,
    days: 0,
    status: 'Requested',
    notes: ''
  });

  const handleAddHoliday = () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast({
        title: "Missing Information",
        description: "Please provide a holiday name and date.",
        variant: "destructive"
      });
      return;
    }

    const holiday: Holiday = {
      id: Date.now().toString(),
      name: newHoliday.name!,
      date: newHoliday.date!,
      country: newHoliday.country as 'Canada' | 'Brazil' | 'Both',
      type: newHoliday.type as 'National' | 'Company' | 'Regional'
    };

    setHolidays([...holidays, holiday]);
    setNewHoliday({
      name: '',
      date: undefined,
      country: 'Both',
      type: 'Company'
    });

    toast({
      title: "Holiday Added",
      description: `${holiday.name} has been added to the calendar.`,
    });
  };

  const handleAddVacation = () => {
    if (!newVacation.employeeName || !newVacation.startDate || !newVacation.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required vacation fields.",
        variant: "destructive"
      });
      return;
    }

    const vacation: Vacation = {
      id: Date.now().toString(),
      employeeName: newVacation.employeeName!,
      startDate: newVacation.startDate!,
      endDate: newVacation.endDate!,
      days: newVacation.days || 1,
      status: newVacation.status as 'Approved' | 'Pending' | 'Requested',
      notes: newVacation.notes || ''
    };

    setVacations([...vacations, vacation]);
    setNewVacation({
      employeeName: '',
      startDate: undefined,
      endDate: undefined,
      days: 0,
      status: 'Requested',
      notes: ''
    });

    toast({
      title: "Vacation Added",
      description: `Vacation for ${vacation.employeeName} has been added.`,
    });
  };

  const handleRemoveHoliday = (id: string) => {
    const holiday = holidays.find(h => h.id === id);
    setHolidays(holidays.filter(h => h.id !== id));
    toast({
      title: "Holiday Removed",
      description: `${holiday?.name} has been removed.`,
    });
  };

  const handleRemoveVacation = (id: string) => {
    const vacation = vacations.find(v => v.id === id);
    setVacations(vacations.filter(v => v.id !== id));
    toast({
      title: "Vacation Removed",
      description: `Vacation for ${vacation?.employeeName} has been removed.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-success text-success-foreground';
      case 'Pending': return 'bg-warning text-warning-foreground';
      case 'Requested': return 'bg-info text-info-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">Time Off Management</h2>
        <p className="text-xs text-muted-foreground">
          Manage holidays and vacation schedules that affect team availability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Holidays Section */}
        <Card className="text-xs p-1">
          <CardHeader className="p-2">
            <CardTitle className="flex items-center space-x-1 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>Holidays</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-2">
            {/* Add Holiday Form */}
            <div className="space-y-1 p-2 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-xs text-foreground">Add New Holiday</h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>Holiday Name</Label>
                  <Input
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                    placeholder="e.g., Christmas Day"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newHoliday.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newHoliday.date ? format(newHoliday.date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newHoliday.date}
                        onSelect={(date) => setNewHoliday({...newHoliday, date})}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select 
                      value={newHoliday.country} 
                      onValueChange={(value) => setNewHoliday({...newHoliday, country: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Both">🌍 Both Countries</SelectItem>
                        <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                        <SelectItem value="Brazil">🇧🇷 Brazil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newHoliday.type} 
                      onValueChange={(value) => setNewHoliday({...newHoliday, type: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="National">National</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Regional">Regional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleAddHoliday} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Holiday
              </Button>
            </div>

            {/* Holidays List */}
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Current Holidays ({holidays.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{holiday.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {holiday.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{format(holiday.date, "MMM dd, yyyy")}</span>
                        <span>{countryFlags[holiday.country!]} {holiday.country}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveHoliday(holiday.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacations Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Vacations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Vacation Form */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-foreground">Add New Vacation</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Employee Name</Label>
                  <Input
                    value={newVacation.employeeName}
                    onChange={(e) => setNewVacation({...newVacation, employeeName: e.target.value})}
                    placeholder="Select or enter employee name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newVacation.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newVacation.startDate ? format(newVacation.startDate, "MMM dd") : <span>Start</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newVacation.startDate}
                          onSelect={(date) => setNewVacation({...newVacation, startDate: date})}
                          initialFocus
                          className="p-3 pointer-events-auto"
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
                            !newVacation.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newVacation.endDate ? format(newVacation.endDate, "MMM dd") : <span>End</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newVacation.endDate}
                          onSelect={(date) => setNewVacation({...newVacation, endDate: date})}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Days</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newVacation.days}
                      onChange={(e) => setNewVacation({...newVacation, days: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={newVacation.status} 
                      onValueChange={(value) => setNewVacation({...newVacation, status: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Requested">Requested</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleAddVacation} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Vacation
              </Button>
            </div>

            {/* Vacations List */}
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Current Vacations ({vacations.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {vacations.map((vacation) => (
                  <div key={vacation.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{vacation.employeeName}</span>
                        <Badge className={cn("text-xs", getStatusColor(vacation.status))}>
                          {vacation.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(vacation.startDate, "MMM dd")} - {format(vacation.endDate, "MMM dd")} • {vacation.days} days
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveVacation(vacation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};