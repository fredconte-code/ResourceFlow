import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { useState } from "react";
import { employees, projects } from "@/lib/employee-data";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, getDaysInMonth, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import holidays from "@/lib/holidays";
import { useSettings } from "@/context/SettingsContext";

interface WeeklyAllocation {
  week: Date;
  allocations: {
    employeeId: string;
    hours: number;
    projects: { name: string; hours: number; color: string }[];
  }[];
}

const mockProjects = projects.map(p => ({ name: p.name, color: p.color }));

const generateMockWeeklyData = (): WeeklyAllocation[] => {
  const weeks: WeeklyAllocation[] = [];
  let currentWeek = startOfWeek(new Date());
  for (let i = 0; i < 8; i++) {
    const weekData: WeeklyAllocation = {
      week: currentWeek,
      allocations: employees.map(emp => ({
        employeeId: emp.id,
        hours: Math.floor(Math.random() * 40) + 20,
        // Randomly assign 1-3 projects from the full list of 16
        projects: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => {
          const project = mockProjects[Math.floor(Math.random() * mockProjects.length)];
          return {
            name: project.name,
            hours: Math.floor(Math.random() * 20) + 5,
            color: project.color
          };
        })
      }))
    };
    weeks.push(weekData);
    currentWeek = addWeeks(currentWeek, 1);
  }
  return weeks;
};

const countryFlags = {
  'Canada': '🇨🇦',
  'Brazil': '🇧🇷'
};

// Helper to check if a date is a holiday for a given city, returns the holiday object if found
const getHoliday = (date: Date, city: 'campinas' | 'montreal') => {
  const dateStr = date.toISOString().slice(0, 10);
  return holidays[city].find(h => h.date.startsWith(dateStr));
};

export const CalendarView = () => {
  const { canadaHours, brazilHours, buffer } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [weeklyData] = useState<WeeklyAllocation[]>(generateMockWeeklyData());

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
    setSelectedMonth(direction === 'prev' ? subMonths(currentMonth, 1).getMonth() : addMonths(currentMonth, 1).getMonth());
    setSelectedYear(direction === 'prev' ? subMonths(currentMonth, 1).getFullYear() : addMonths(currentMonth, 1).getFullYear());
  };

  // Calendar grid generation
  const getMonthGrid = (month: Date) => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  // Find allocations for a given day (mock logic: distribute weekly allocations across the month)
  const getAllocationsForDay = (date: Date, employeeId: string) => {
    // For demo, just use the first week of mock data and distribute hours evenly
    const weekData = weeklyData[0];
    const allocation = weekData.allocations.find(a => a.employeeId === employeeId);
    if (!allocation) return null;
    // Distribute hours across working days in the month
    const daysInMonth = getDaysInMonth(currentMonth);
    const dailyHours = Math.floor(allocation.hours * 4 / daysInMonth); // Approximate for demo
    return {
      dailyHours,
      projects: allocation.projects.map(project => ({
        ...project,
        hours: Math.floor(project.hours * 4 / daysInMonth)
      }))
    };
  };

  const monthGrid = getMonthGrid(currentMonth);
  const weeks = [];
  for (let i = 0; i < monthGrid.length; i += 7) {
    weeks.push(monthGrid.slice(i, i + 7));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Calendar View</h2>
        <p className="text-muted-foreground">
          View monthly allocation timelines and project distribution across team members.
        </p>
      </div>

      {/* Month/Year Selector */}
      <Card className="mt-2 text-xs p-1">
        <CardHeader className="p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-1">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span>Period Selection</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={selectedMonth.toString()} onValueChange={(value) => {
              setSelectedMonth(parseInt(value));
              setCurrentMonth(new Date(selectedYear, parseInt(value), 1));
            }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => {
              setSelectedYear(parseInt(value));
              setCurrentMonth(new Date(parseInt(value), selectedMonth, 1));
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => {
              const now = new Date();
              setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedMonth(now.getMonth());
              setSelectedYear(now.getFullYear());
            }}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Month Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">{months[selectedMonth]} {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left text-xs font-medium text-muted-foreground"></th>
                  {monthGrid.map((day, idx) => (
                    <th key={idx} className="p-1 text-center text-xs font-medium text-muted-foreground">{Number(format(day, "d")).toFixed(1).replace(/\.0$/, '')}</th>
                  ))}
                </tr>
                <tr>
                  <th className="p-1 text-left text-xs font-medium text-muted-foreground">Team Member</th>
                  {monthGrid.map((day, idx) => (
                    <th key={idx} className="p-1 text-center text-xs font-medium text-muted-foreground">{format(day, 'EEE')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border">
                    {/* Employee Info */}
                    <td className="p-1 align-top min-w-[180px] w-[200px]">
                      <div className="flex items-start space-x-2">
                        <div className="h-7 w-7 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                          <span className="text-xs font-semibold text-primary">
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center font-medium text-foreground text-xs">
                            {employee.name}
                            <span className="ml-2 text-lg" title={employee.country}>{countryFlags[employee.country]}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{employee.role}</div>
                        </div>
                      </div>
                    </td>
                    {/* Calendar Days */}
                    {monthGrid.map((day, dayIdx) => {
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isToday = isSameDay(day, new Date());
                      const allocation = getAllocationsForDay(day, employee.id);
                      const city = employee.country === 'Canada' ? 'montreal' : 'campinas';
                      const holiday = getHoliday(day, city);
                      return (
                        <td
                          key={dayIdx}
                          className={cn(
                            "align-top p-1 min-w-[40px] h-10 border border-dashed relative",
                            isCurrentMonth ? "bg-background" : "bg-muted/20",
                            isToday && "ring-2 ring-primary",
                            holiday && "bg-yellow-100",
                            holiday && "bg-blue-100"
                          )}
                          {...(holiday ? { title: holiday.name } : {})}
                        >
                          <div className="flex flex-col items-center">
                            {/* Holiday indicator */}
                            {holiday && (
                              <span
                                className="absolute top-1 right-1 text-[10px] text-yellow-700 bg-yellow-200 rounded px-1"
                              >
                                {city === 'montreal' ? 'CA' : 'BR'}
                              </span>
                            )}
                            {holiday && (
                              <span
                                className="absolute top-1 left-1 text-[10px] text-blue-700 bg-blue-200 rounded px-1"
                              >
                                {city === 'montreal' ? 'CA' : 'BR'}
                              </span>
                            )}
                            {allocation && (
                              <div className="mt-1 space-y-1 w-full">
                                <div className="flex items-center justify-between">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium text-foreground">{allocation.dailyHours}h</span>
                                </div>
                                <div className="space-y-1">
                                  {allocation.projects.slice(0, 2).map((project, projectIndex) => (
                                    <div
                                      key={projectIndex}
                                      className="h-1 rounded-full"
                                      style={{ backgroundColor: project.color }}
                                      title={`${project.name}: ${project.hours}h`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-3">Project Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {mockProjects.map((project, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-xs text-foreground">{project.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};