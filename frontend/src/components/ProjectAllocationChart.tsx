import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from 'recharts';
import { getCurrentEmployeesSync } from "@/lib/employee-data";
import { getProjectsSync } from "@/lib/project-data";
import { Calendar, TrendingUp, Users, Clock } from "lucide-react";
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from "date-fns";
import { useState, useEffect, useMemo } from "react";

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

export const ProjectAllocationChart = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'projects' | 'trends'>('attendance');
  
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(() => startOfMonth(today), [today]);
  const monthEnd = useMemo(() => endOfMonth(today), [today]);

  // Load holidays and vacations from localStorage
  useEffect(() => {
    const storedHolidays = localStorage.getItem('holidays');
    if (storedHolidays) {
      const parsed = JSON.parse(storedHolidays);
      setHolidays(parsed.map((holiday: { id: string; name: string; date: string; country?: 'Canada' | 'Brazil' | 'Both'; type: 'National' | 'Company' | 'Regional' }) => ({
        ...holiday,
        date: new Date(holiday.date)
      })));
    }

    const storedVacations = localStorage.getItem('vacations');
    if (storedVacations) {
      const parsed = JSON.parse(storedVacations);
      setVacations(parsed.map((vacation: { id: string; employeeName: string; startDate: string; endDate: string; days: number; status: 'Approved' | 'Pending' | 'Requested'; notes?: string }) => ({
        ...vacation,
        startDate: new Date(vacation.startDate),
        endDate: new Date(vacation.endDate)
      })));
    }
  }, []);

  // Calculate working vs time off for the current month
  const attendanceData = useMemo(() => {
    let workingCount = 0;
    let timeOffCount = 0;

    getCurrentEmployeesSync().forEach(employee => {
      let hasTimeOff = false;

      // Check if employee has vacation this month
      const employeeVacation = vacations.find(vacation => 
        vacation.employeeName === employee.name && 
        ((vacation.startDate >= monthStart && vacation.startDate <= monthEnd) ||
         (vacation.endDate >= monthStart && vacation.endDate <= monthEnd) ||
         (vacation.startDate <= monthStart && vacation.endDate >= monthEnd))
      );

      if (employeeVacation) {
        hasTimeOff = true;
      }

      // Check if there are holidays this month for the employee's country
      const monthHolidays = holidays.filter(holiday => {
        if (holiday.date < monthStart || holiday.date > monthEnd) return false;
        
        if (holiday.country === 'Both') return true;
        if (holiday.country === employee.country) return true;
        return false;
      });

      if (monthHolidays.length > 0) {
        hasTimeOff = true;
      }

      if (hasTimeOff) {
        timeOffCount++;
      } else {
        workingCount++;
      }
    });

    return [
      {
        name: 'Working',
        value: workingCount,
        color: 'hsl(var(--brp-yellow))',
        fill: 'hsl(var(--brp-yellow))'
      },
      {
        name: 'Time Off',
        value: timeOffCount,
        color: 'hsl(var(--brp-gray))',
        fill: 'hsl(var(--brp-gray))'
      }
    ];
  }, [holidays, vacations, monthStart, monthEnd]);

  // Project allocation data
  const projectData = useMemo(() => {
    const projects = getProjectsSync();
    const employees = getCurrentEmployeesSync();
    
    return projects.map(project => {
      const projectAllocations = JSON.parse(localStorage.getItem('projectAllocations') || '[]');
      const projectEmployeeCount = projectAllocations.filter((allocation: { projectId: string; employeeId: string; startDate: string; endDate: string; hoursPerDay: number }) => 
        allocation.projectId === project.id.toString()
      ).length;
      
      return {
        name: project.name,
        employees: projectEmployeeCount,
        color: 'hsl(var(--brp-yellow))'
      };
    }).filter(project => project.employees > 0);
  }, []);

  // Trend data for the last 6 months
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      // Calculate working days in this month
      const workingDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter(day => day.getDay() !== 0 && day.getDay() !== 6).length;
      
      months.push({
        month: format(date, 'MMM'),
        workingDays,
        allocation: Math.floor(Math.random() * 30) + 70, // Mock data for now
        capacity: Math.floor(Math.random() * 20) + 80
      });
    }
    return months;
  }, [today]);

  const totalMembers = getCurrentEmployeesSync().length;
  const workingPercentage = totalMembers > 0 ? ((attendanceData[0].value / totalMembers) * 100).toFixed(1) : '0';
  const timeOffPercentage = totalMembers > 0 ? ((attendanceData[1].value / totalMembers) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="text-xs p-1">
      <CardHeader className="p-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-1">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Resource Analytics</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                activeTab === 'attendance' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                activeTab === 'projects' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                activeTab === 'trends' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Trends
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-2">
        <div className="flex flex-col items-center justify-center" style={{ height: 250 }}>
          {activeTab === 'attendance' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  fontSize={10}
                  wrapperStyle={{ paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'projects' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={10}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis fontSize={10} tick={{ fill: 'var(--muted-foreground)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="employees" fill="hsl(var(--brp-yellow))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'trends' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="month" 
                  fontSize={10}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis fontSize={10} tick={{ fill: 'var(--muted-foreground)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="allocation" 
                  stackId="1"
                  stroke="hsl(var(--brp-yellow))" 
                  fill="hsl(var(--brp-yellow))" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="capacity" 
                  stackId="1"
                  stroke="hsl(var(--brp-gray))" 
                  fill="hsl(var(--brp-gray))" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">
              {activeTab === 'attendance' && `${format(monthStart, 'MMMM yyyy')} • Total: ${totalMembers} members`}
              {activeTab === 'projects' && `${projectData.length} active projects`}
              {activeTab === 'trends' && '6-month trend analysis'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};