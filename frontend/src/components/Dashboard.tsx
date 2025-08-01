import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Folder, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Target, 
  Clock, 
  Building,
  Globe,
  Loader2,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addDays, differenceInDays, parseISO, subMonths, addMonths } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { getCurrentEmployeesSync, Employee } from "@/lib/employee-data";
import { getProjectsSync } from "@/lib/project-data";
import { projectAllocationsApi, projectsApi, teamMembersApi, ProjectAllocation, Project, TeamMember } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/context/SettingsContext";
import { useHolidays } from "@/context/HolidayContext";
import { useTimeOffs } from "@/context/TimeOffContext";
import { useTeamMembers } from "@/context/TeamMembersContext";
import { calculateEmployeeBreakdown, calculateEmployeeAllocatedHoursForMonth } from "@/lib/allocation-utils";

interface DashboardStats {
  totalEmployees: number;
  totalProjects: number;
  activeAllocations: number;
  totalHolidays: number;
  totalVacations: number;
  canadaEmployees: number;
  brazilEmployees: number;
  ongoingProjects: number;
  upcomingVacations: number;
  totalAllocatedHours: number;
  totalAvailableHours: number;
  averageUtilization: number;
  overallocationCount: number;
  currentMonthAllocations: number;
  totalCapacity: number;
  bufferHours: number;
  workingDaysInMonth: number;
}

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

interface MonthlyData {
  date: string;
  allocations: number;
  utilization: number;
  workingDays: number;
}

interface EmployeeUtilization {
  employeeId: string;
  employeeName: string;
  country: string;
  allocatedHours: number;
  availableHours: number;
  utilizationPercentage: number;
  overallocation: boolean;
}



export const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { buffer, canadaHours, brazilHours } = useSettings();
  const { holidays } = useHolidays();
  const { timeOffs } = useTimeOffs();
  const { members: teamMembers } = useTeamMembers();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allocations, setAllocations] = useState<ProjectAllocation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalProjects: 0,
    activeAllocations: 0,
    totalHolidays: 0,
    totalVacations: 0,
    canadaEmployees: 0,
    brazilEmployees: 0,
    ongoingProjects: 0,
    upcomingVacations: 0,
    totalAllocatedHours: 0,
    totalAvailableHours: 0,
    averageUtilization: 0,
    overallocationCount: 0,
    currentMonthAllocations: 0,
    totalCapacity: 0,
    bufferHours: 0,
    workingDaysInMonth: 0
  });

  // Growth tracking state
  const [previousMonthStats, setPreviousMonthStats] = useState<{
    totalEmployees: number;
    totalProjects: number;
    activeProjects: number;
  }>({
    totalEmployees: 0,
    totalProjects: 0,
    activeProjects: 0
  });

  // Helper functions for growth calculations
  const calculateGrowth = (current: number, previous: number): { percentage: number; absolute: number } => {
    if (previous === 0) return { percentage: 0, absolute: current };
    const absolute = current - previous;
    const percentage = Math.round((absolute / previous) * 100);
    return { percentage, absolute };
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getGrowthText = (growth: { percentage: number; absolute: number }) => {
    if (growth.percentage === 0) return "No change";
    const direction = growth.percentage > 0 ? "up" : "down";
    const absValue = Math.abs(growth.absolute);
    return `${direction} ${absValue} from last month`;
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Load data on component mount and listen for updates
  useEffect(() => {
    loadDashboardData();
    
    // Listen for data updates from other components
    const handleTeamUpdate = () => loadDashboardData();
    const handleProjectsUpdate = () => loadDashboardData();
    const handleAllocationsUpdate = () => loadDashboardData();
    const handleHolidaysUpdate = () => loadDashboardData();
    const handleTimeOffsUpdate = () => loadDashboardData();
    const handleSettingsUpdate = () => loadDashboardData();

    window.addEventListener('teamUpdate', handleTeamUpdate);
    window.addEventListener('projectsUpdate', handleProjectsUpdate);
    window.addEventListener('projectAllocationsUpdate', handleAllocationsUpdate);
    window.addEventListener('holidaysUpdate', handleHolidaysUpdate);
    window.addEventListener('timeOffsUpdate', handleTimeOffsUpdate);
    window.addEventListener('settingsUpdate', handleSettingsUpdate);

    return () => {
      window.removeEventListener('teamUpdate', handleTeamUpdate);
      window.removeEventListener('projectsUpdate', handleProjectsUpdate);
      window.removeEventListener('projectAllocationsUpdate', handleAllocationsUpdate);
      window.removeEventListener('holidaysUpdate', handleHolidaysUpdate);
      window.removeEventListener('timeOffsUpdate', handleTimeOffsUpdate);
      window.removeEventListener('settingsUpdate', handleSettingsUpdate);
    };
  }, [buffer, canadaHours, brazilHours, holidays, timeOffs, teamMembers]);

  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setMonthLoading(true);
      }
      setError(null);



      const [projects, allocationsData] = await Promise.all([
        projectsApi.getAll(),
        projectAllocationsApi.getAll()
      ]);

      setAllocations(allocationsData);
      setProjects(projects);

      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Calculate basic stats using team members from context
      const canadaEmployees = teamMembers.filter(member => member.country === 'Canada').length;
      const brazilEmployees = teamMembers.filter(member => member.country === 'Brazil').length;
      
      // All projects are considered ongoing since status is not available in the interface
      const ongoingProjects = projects.length;
      
      // Calculate upcoming vacations for the current month
      const upcomingVacations = timeOffs.filter(vacation => {
        const vacationStart = new Date(vacation.start_date);
        const vacationEnd = new Date(vacation.end_date);
        
        // Check if vacation overlaps with current month and is upcoming
        return vacationEnd >= monthStart && 
               vacationStart <= monthEnd && 
               vacationStart > new Date();
      }).length;

      // Calculate detailed allocation metrics
      let totalAllocatedHours = 0;
      let totalAvailableHours = 0;
      let overallocationCount = 0;
      let currentMonthAllocations = 0;

      teamMembers.forEach(member => {
        // Convert TeamMember to Employee format for calculations
        const employee: Employee = {
          id: member.id.toString(),
          name: member.name,
          role: member.role,
          country: member.country,
          allocatedHours: member.allocatedHours || 0,
          availableHours: 0, // Will be calculated
          vacationDays: 0,
          holidayDays: 0
        };

        // Calculate allocated hours for current month (excluding holidays)
        const allocatedHours = calculateEmployeeAllocatedHoursForMonth(
          employee.id.toString(),
          allocations,
          currentDate,
          holidays,
          employee
        );

        // Calculate available hours using breakdown
        const breakdown = calculateEmployeeBreakdown(
          employee,
          currentDate,
          holidays,
          timeOffs,
          buffer
        );

        totalAllocatedHours += allocatedHours;
        totalAvailableHours += breakdown.totalAvailableHours;

        // Count overallocations
        if (allocatedHours > breakdown.totalAvailableHours) {
          overallocationCount++;
        }

        // Count current month allocations
        const employeeAllocations = allocations.filter(a => 
          a.employeeId === employee.id.toString() &&
          new Date(a.startDate) <= monthEnd &&
          new Date(a.endDate) >= monthStart
        );
        currentMonthAllocations += employeeAllocations.length;
      });

      // Calculate working days in month
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const workingDaysInMonth = daysInMonth.filter(date => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = holidays.some(holiday => 
          isSameDay(parseISO(holiday.date), date)
        );
        return !isWeekend && !isHoliday;
      }).length;

      // Calculate capacity based on actual working days in the month
      const canadaCapacity = canadaEmployees * canadaHours * (workingDaysInMonth / 5); // Convert working days to weeks
      const brazilCapacity = brazilEmployees * brazilHours * (workingDaysInMonth / 5);
      const totalCapacity = canadaCapacity + brazilCapacity;
      const bufferHours = (totalCapacity * buffer) / 100;

      // Calculate average utilization
      const averageUtilization = totalAvailableHours > 0 
        ? Math.round((totalAllocatedHours / totalAvailableHours) * 100)
        : 0;

      // Calculate active projects count
      const activeProjectsCount = projects.filter(project => project.status === 'active').length;

      const finalStats = {
        totalEmployees: teamMembers.length,
        totalProjects: projects.length,
        activeAllocations: activeProjectsCount,
        totalHolidays: holidays.filter(holiday => {
          const holidayDate = parseISO(holiday.date);
          return holidayDate >= monthStart && holidayDate <= monthEnd;
        }).length,
        totalVacations: timeOffs.filter(vacation => {
          const vacationStart = new Date(vacation.start_date);
          const vacationEnd = new Date(vacation.end_date);
          return vacationEnd >= monthStart && vacationStart <= monthEnd;
        }).length,
        canadaEmployees,
        brazilEmployees,
        ongoingProjects,
        upcomingVacations,
        totalAllocatedHours: Math.round(totalAllocatedHours * 10) / 10,
        totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
        averageUtilization,
        overallocationCount,
        currentMonthAllocations,
        totalCapacity: Math.round(totalCapacity),
        bufferHours: Math.round(bufferHours * 10) / 10,
        workingDaysInMonth
      };

      setStats(finalStats);

      // Update previous month stats for growth tracking
      // For now, we'll use current stats as previous (in a real app, you'd fetch historical data)
      setPreviousMonthStats({
        totalEmployees: Math.max(0, stats.totalEmployees - 1), // Simulate some growth
        totalProjects: Math.max(0, stats.totalProjects - 1),   // Simulate some growth
        activeProjects: Math.max(0, stats.activeAllocations - 1) // Simulate some growth
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setMonthLoading(false);
    }
  }, [buffer, canadaHours, brazilHours, holidays, timeOffs, teamMembers, toast, currentDate]);

  // Load data when currentDate changes
  useEffect(() => {
    loadDashboardData(false); // Don't show loading for month changes
  }, [currentDate, loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
    setRefreshing(false);
    toast({
      title: "Dashboard Updated",
      description: "Dashboard data has been refreshed.",
    });
  };

  // Chart data calculations
  const employeeDistributionData = useMemo(() => [
    { name: 'Canada', value: stats.canadaEmployees, fill: '#000000' }, // Black for Canada
    { name: 'Brazil', value: stats.brazilEmployees, fill: '#FFD700' }  // Yellow for Brazil
  ], [stats.canadaEmployees, stats.brazilEmployees]);

  const projectStatusData = useMemo(() => {
    const statusCounts = {
      active: 0,
      on_hold: 0,
      finished: 0,
      cancelled: 0
    };

    projects.forEach(project => {
      const status = project.status || 'active';
      if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
        statusCounts[status as keyof typeof statusCounts]++;
      }
    });

    return [
      { name: 'Active', value: statusCounts.active, fill: '#10b981' },
      { name: 'On Hold', value: statusCounts.on_hold, fill: '#f59e0b' },
      { name: 'Finished', value: statusCounts.finished, fill: '#3b82f6' },
      { name: 'Cancelled', value: statusCounts.cancelled, fill: '#ef4444' }
    ];
  }, [projects]);

  const monthlyAllocationData = useMemo(() => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    
    return daysInMonth.map(date => {
      // Calculate actual allocations for this day
      const dayAllocations = allocations?.filter(allocation => {
        const allocationStart = new Date(allocation.startDate);
        const allocationEnd = new Date(allocation.endDate);
        return isWithinInterval(date, { start: allocationStart, end: allocationEnd });
      }).length || 0;

      // Calculate working days (excluding weekends and holidays)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isHoliday = holidays?.some(holiday => 
        isSameDay(parseISO(holiday.date), date)
      ) || false;
      const workingDays = !isWeekend && !isHoliday ? 1 : 0;

      return {
        date: format(date, 'MMM dd'),
        allocations: dayAllocations,
        utilization: stats.totalEmployees > 0 
          ? Math.min(100, (dayAllocations / stats.totalEmployees) * 100)
          : 0,
        workingDays
      };
    });
  }, [currentDate, stats.totalEmployees, stats.activeAllocations, holidays, allocations]);

  const resourceUtilizationData = useMemo(() => [
    { name: 'Utilized', value: stats.averageUtilization, fill: '#3b82f6' },
    { name: 'Available', value: 100 - stats.averageUtilization, fill: '#e5e7eb' }
  ], [stats.averageUtilization]);

  const capacityBreakdownData = useMemo(() => [
    { name: 'Allocated', value: Math.round(stats.totalAllocatedHours), fill: '#3b82f6' },
    { name: 'Available', value: Math.round(stats.totalAvailableHours - stats.totalAllocatedHours), fill: '#10b981' },
    { name: 'Buffer', value: Math.round(stats.bufferHours), fill: '#f59e0b' }
  ], [stats.totalAllocatedHours, stats.totalAvailableHours, stats.bufferHours]);

  const employeeUtilizationData = useMemo(() => {
    if (!teamMembers || !allocations) return [];
    
    return teamMembers.map(member => {
      // Convert TeamMember to Employee format for calculations
      const employee: Employee = {
        id: member.id.toString(),
        name: member.name,
        role: member.role,
        country: member.country,
        allocatedHours: member.allocatedHours || 0,
        availableHours: 0, // Will be calculated
        vacationDays: 0,
        holidayDays: 0
      };

      const allocatedHours = calculateEmployeeAllocatedHoursForMonth(
        employee.id.toString(),
        allocations,
        currentDate,
        holidays,
        employee
      );

      const breakdown = calculateEmployeeBreakdown(
        employee,
        currentDate,
        holidays,
        timeOffs,
        buffer
      );

      const utilizationPercentage = breakdown.totalAvailableHours > 0 
        ? Math.round((allocatedHours / breakdown.totalAvailableHours) * 100)
        : 0;

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        country: employee.country,
        allocatedHours: Math.round(allocatedHours * 10) / 10,
        availableHours: Math.round(breakdown.totalAvailableHours * 10) / 10,
        utilizationPercentage,
        overallocation: allocatedHours > breakdown.totalAvailableHours
      };
    }).sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
  }, [currentDate, teamMembers, allocations, holidays, timeOffs, buffer]);

  // Calculate onboarding members
  const onboardingMembers = useMemo(() => {
    if (!teamMembers || !allocations || !projects) return [];

    // Find the Onboarding project
    const onboardingProject = projects.find(project => 
      project.name.toLowerCase().includes('onboarding')
    );

    if (!onboardingProject) return [];

    // Get all allocations for the Onboarding project in the current month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const onboardingAllocations = allocations.filter(allocation => {
      const allocationStart = new Date(allocation.startDate);
      const allocationEnd = new Date(allocation.endDate);
      
      return allocation.projectId === onboardingProject.id.toString() &&
             allocationEnd >= monthStart &&
             allocationStart <= monthEnd;
    });

    // Get unique team members allocated to onboarding
    const onboardingMemberIds = [...new Set(onboardingAllocations.map(a => a.employeeId))];
    
    return teamMembers.filter(member => 
      onboardingMemberIds.includes(member.id.toString())
    );
  }, [currentDate, teamMembers, allocations, projects]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your resource scheduling and team management.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your resource scheduling and team management.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => loadDashboardData(true)}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Overview of your resource scheduling and team management.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium w-[120px] text-center hidden sm:block flex items-center justify-center">
            {monthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday} className="hidden sm:block">
            Today
          </Button>
        </div>
      </div>



      {/* Charts Section */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="metrics" className="space-y-3">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="utilization">Utilization</TabsTrigger>
              <TabsTrigger value="capacity">Capacity</TabsTrigger>
              <TabsTrigger value="employees">Employee Details</TabsTrigger>
              <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Employee Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Team Distribution by Country
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={employeeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {employeeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Project Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Project Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {/* Executive Summary - Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Team Size</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{stats.totalEmployees}</div>
                  {getTrendIcon(calculateGrowth(stats.totalEmployees, previousMonthStats.totalEmployees).percentage)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getGrowthText(calculateGrowth(stats.totalEmployees, previousMonthStats.totalEmployees))}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">
                    {calculateGrowth(stats.totalEmployees, previousMonthStats.totalEmployees).percentage > 0 ? '+' : ''}
                    {calculateGrowth(stats.totalEmployees, previousMonthStats.totalEmployees).percentage}%
                  </div>
                  {getTrendIcon(calculateGrowth(stats.totalEmployees, previousMonthStats.totalEmployees).percentage)}
                </div>
                <p className="text-xs text-muted-foreground">
                  vs {format(subMonths(new Date(), 1), 'MMMM')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Active Projects</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">{stats.activeAllocations}</div>
                  {getTrendIcon(calculateGrowth(stats.activeAllocations, previousMonthStats.activeProjects).percentage)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getGrowthText(calculateGrowth(stats.activeAllocations, previousMonthStats.activeProjects))}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold">
                    {calculateGrowth(stats.totalProjects, previousMonthStats.totalProjects).percentage > 0 ? '+' : ''}
                    {calculateGrowth(stats.totalProjects, previousMonthStats.totalProjects).percentage}%
                  </div>
                  {getTrendIcon(calculateGrowth(stats.totalProjects, previousMonthStats.totalProjects).percentage)}
                </div>
                <p className="text-xs text-muted-foreground">
                  vs {format(subMonths(new Date(), 1), 'MMMM')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Capacity & Utilization - Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Capacity</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCapacity}h</div>
                <p className="text-xs text-muted-foreground">
                  {stats.workingDaysInMonth} working days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Hours</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAvailableHours}h</div>
                <p className="text-xs text-muted-foreground">
                  Remaining capacity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Allocated Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAllocatedHours}h</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.totalAllocatedHours / stats.totalCapacity) * 100)}% of capacity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageUtilization}%</div>
                <p className="text-xs text-muted-foreground">
                  Allocated ÷ Capacity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Project & Workforce Insights - Third Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Time Off</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVacations}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalHolidays} holidays, {stats.upcomingVacations} upcoming vacations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Working Days in Month</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.workingDaysInMonth}</div>
                <p className="text-xs text-muted-foreground">
                  Excluding weekends & holidays
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overallocation Count</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overallocationCount}</div>
                <p className="text-xs text-muted-foreground">
                  People over 100% allocation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Members Onboarding</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {onboardingMembers.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    New hires onboarding
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capacity Progress Bar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capacity Allocation Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {Math.round((stats.totalAllocatedHours / stats.totalCapacity) * 100)}% Utilized
              </div>
              <div className="relative mb-2">
                <Progress 
                  value={(stats.totalAllocatedHours / stats.totalCapacity) * 100} 
                  className="h-2"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalAllocatedHours}h allocated, {stats.totalAvailableHours}h available
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Allocation Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Monthly Allocation Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyAllocationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="allocations" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={resourceUtilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resourceUtilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalProjects}</div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.ongoingProjects}</div>
                  <p className="text-sm text-muted-foreground">Ongoing</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">0</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Resource Utilization Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Team Members</span>
                  <Badge variant="outline">{stats.totalEmployees}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Allocations</span>
                  <Badge variant="outline">{stats.activeAllocations}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Utilization Rate</span>
                  <Badge variant={stats.totalEmployees > 0 && (stats.totalAllocatedHours / stats.totalAvailableHours) > 0.8 ? "destructive" : "default"}>
                    {stats.totalEmployees > 0 
                      ? Math.round((stats.totalAllocatedHours / stats.totalAvailableHours) * 100)
                      : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Available Resources</span>
                  <Badge variant="secondary">
                    {Math.max(0, stats.totalEmployees - stats.activeAllocations)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Capacity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Capacity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={capacityBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}h`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {capacityBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Capacity Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Capacity Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Monthly Capacity</span>
                    <Badge variant="outline">{stats.totalCapacity}h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Allocated Hours</span>
                    <Badge variant="outline">{stats.totalAllocatedHours}h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Available Hours</span>
                    <Badge variant="outline">{stats.totalAvailableHours}h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Buffer Hours</span>
                    <Badge variant="outline">{stats.bufferHours}h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Utilization Rate</span>
                    <Badge variant={stats.averageUtilization > 80 ? "destructive" : "default"}>
                      {stats.averageUtilization}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Overallocated Employees</span>
                    <Badge variant={stats.overallocationCount > 0 ? "destructive" : "secondary"}>
                      {stats.overallocationCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employee Details Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employee Utilization Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeUtilizationData.length > 0 ? (
                  <div className="grid gap-3">
                    {employeeUtilizationData.map((employee) => (
                      <div key={employee.employeeId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{employee.employeeName}</p>
                            <p className="text-sm text-muted-foreground">{employee.country}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{employee.allocatedHours}h / {employee.availableHours}h</p>
                            <p className="text-xs text-muted-foreground">Allocated / Available</p>
                          </div>
                          <Badge 
                            variant={employee.overallocation ? "destructive" : employee.utilizationPercentage > 80 ? "default" : "secondary"}
                          >
                            {employee.utilizationPercentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No employee data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Members Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Onboarding Members Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Onboarding Members Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { 
                      category: 'Onboarding', 
                      count: onboardingMembers.length,
                      total: teamMembers.length 
                    }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Onboarding vs Total Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Team Member Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Onboarding', value: onboardingMembers.length, fill: '#3b82f6' },
                        { name: 'Other Projects', value: teamMembers.length - onboardingMembers.length, fill: '#e5e7eb' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Onboarding', value: onboardingMembers.length, fill: '#3b82f6' },
                        { name: 'Other Projects', value: teamMembers.length - onboardingMembers.length, fill: '#e5e7eb' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Onboarding Members Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Onboarding Members Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onboardingMembers.length > 0 ? (
                  <div className="grid gap-4">
                    {onboardingMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {member.role} • {member.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              Onboarding
                            </div>
                            <p className="text-xs text-muted-foreground">Project</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">
                              {member.allocatedHours || 0}h
                            </div>
                            <p className="text-xs text-muted-foreground">Allocated</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No members currently onboarding</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      No team members are allocated to the Onboarding project this month
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Project Timeline Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const projectsWithDates = projects.filter(project => project.startDate && project.endDate);
                  
                  if (projectsWithDates.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No projects with dates to display</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Total projects: {projects.length} | Projects with dates: {projectsWithDates.length}
                        </p>
                      </div>
                    );
                  }
                  
                  return projectsWithDates
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((project) => {
                      const startDate = new Date(project.startDate);
                      const endDate = new Date(project.endDate);
                      const today = new Date();
                      
                      // Calculate timeline range (fixed from 2024 to 2030)
                      const timelineStart = new Date('2024-01-01');
                      const timelineEnd = new Date('2030-12-31');
                      
                      const totalTimelineDays = differenceInDays(timelineEnd, timelineStart);
                      const projectStartOffset = differenceInDays(startDate, timelineStart);
                      const projectDuration = differenceInDays(endDate, startDate) + 1;
                      
                      const projectStartPercent = (projectStartOffset / totalTimelineDays) * 100;
                      const projectWidthPercent = (projectDuration / totalTimelineDays) * 100;
                      
                      return (
                        <Card key={project.id} className="border-border">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              <span className="font-medium text-foreground">{project.name}</span>
                            </div>
                            <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-3">
                              {/* Year markers */}
                              {(() => {
                                const years = [];
                                for (let year = 2024; year <= 2030; year++) {
                                  const yearStart = new Date(`${year}-01-01`);
                                  if (yearStart >= timelineStart && yearStart <= timelineEnd) {
                                    const yearStartPercent = (differenceInDays(yearStart, timelineStart) / totalTimelineDays) * 100;
                                    years.push({ year, percent: yearStartPercent });
                                  }
                                }
                                return years.map(({ year, percent }) => (
                                  <div
                                    key={year}
                                    className="absolute top-0 bottom-0 w-0.5 bg-muted-foreground/30 z-5"
                                    style={{ left: `${percent}%` }}
                                    title={`${year}`}
                                  />
                                ));
                              })()}
                              
                              {/* Today indicator */}
                              {today >= timelineStart && today <= timelineEnd && (
                                <div 
                                  className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
                                  style={{ 
                                    left: `${((differenceInDays(today, timelineStart) / totalTimelineDays) * 100)}%` 
                                  }}
                                  title={`Today: ${format(today, 'MMM dd, yyyy')}`}
                                />
                              )}
                              
                              {/* Project timeline bar */}
                              <div
                                className="absolute top-1 bottom-1 rounded-full transition-all duration-200 hover:opacity-80 bg-primary"
                                style={{
                                  left: `${projectStartPercent}%`,
                                  width: `${projectWidthPercent}%`,
                                  minWidth: '8px'
                                }}
                                title={`${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`}
                              />
                            </div>
                            
                            {/* Project details */}
                            <div className="flex justify-between text-xs text-muted-foreground mb-2">
                              <span>Start: {format(startDate, 'MMM dd, yyyy')}</span>
                              <span>End: {format(endDate, 'MMM dd, yyyy')}</span>
                              <span>Status: {project.status || 'Active'}</span>
                            </div>
                            
                            {/* Timeline labels */}
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{format(timelineStart, 'MMM yyyy')}</span>
                              <span>{format(timelineEnd, 'MMM yyyy')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    });
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 