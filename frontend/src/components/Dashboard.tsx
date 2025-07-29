import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  AlertTriangle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from "date-fns";
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
import { getProjectsSync, Project } from "@/lib/project-data";
import { holidaysApi, vacationsApi, projectAllocationsApi, Holiday, Vacation, ProjectAllocation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalEmployees: number;
  totalProjects: number;
  activeAllocations: number;
  totalHolidays: number;
  totalVacations: number;
  canadaEmployees: number;
  brazilEmployees: number;
  completedProjects: number;
  ongoingProjects: number;
  upcomingVacations: number;
}

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalProjects: 0,
    activeAllocations: 0,
    totalHolidays: 0,
    totalVacations: 0,
    canadaEmployees: 0,
    brazilEmployees: 0,
    completedProjects: 0,
    ongoingProjects: 0,
    upcomingVacations: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [employees, projects, holidays, vacations, allocations] = await Promise.all([
        getCurrentEmployeesSync(),
        getProjectsSync(),
        holidaysApi.getAll(),
        vacationsApi.getAll(),
        projectAllocationsApi.getAll()
      ]);

      // Calculate stats
      const canadaEmployees = employees.filter(emp => emp.country === 'Canada').length;
      const brazilEmployees = employees.filter(emp => emp.country === 'Brazil').length;
      
      const ongoingProjects = projects.filter(project => 
        project.status === 'Active' || project.status === 'In Progress'
      ).length;
      const completedProjects = projects.filter(project => 
        project.status === 'Completed'
      ).length;

      const currentDate = new Date();
      const upcomingVacations = vacations.filter(vacation => 
        new Date(vacation.startDate) > currentDate
      ).length;

      setStats({
        totalEmployees: employees.length,
        totalProjects: projects.length,
        activeAllocations: allocations.length,
        totalHolidays: holidays.length,
        totalVacations: vacations.length,
        canadaEmployees,
        brazilEmployees,
        completedProjects,
        ongoingProjects,
        upcomingVacations
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
    }
  };

  // Chart data calculations
  const employeeDistributionData = useMemo(() => [
    { name: 'Canada', value: stats.canadaEmployees, fill: '#3b82f6' },
    { name: 'Brazil', value: stats.brazilEmployees, fill: '#10b981' }
  ], [stats.canadaEmployees, stats.brazilEmployees]);

  const projectStatusData = useMemo(() => [
    { name: 'Ongoing', value: stats.ongoingProjects, fill: '#f59e0b' },
    { name: 'Completed', value: stats.completedProjects, fill: '#10b981' }
  ], [stats.ongoingProjects, stats.completedProjects]);

  const monthlyAllocationData = useMemo(() => {
    const currentDate = new Date();
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    
    return daysInMonth.map(date => {
      const dayAllocations = stats.activeAllocations; // Simplified for demo
      return {
        date: format(date, 'MMM dd'),
        allocations: dayAllocations,
        utilization: Math.min(100, (dayAllocations / stats.totalEmployees) * 100)
      };
    });
  }, [stats.activeAllocations, stats.totalEmployees]);

  const resourceUtilizationData = useMemo(() => {
    const utilization = stats.totalEmployees > 0 
      ? Math.round((stats.activeAllocations / stats.totalEmployees) * 100)
      : 0;
    
    return [
      { name: 'Utilized', value: utilization, fill: '#3b82f6' },
      { name: 'Available', value: 100 - utilization, fill: '#e5e7eb' }
    ];
  }, [stats.activeAllocations, stats.totalEmployees]);

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
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <span className="ml-2 text-destructive">{error}</span>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <Loader2 className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your resource scheduling and team management.
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <Activity className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.ongoingProjects} ongoing, {stats.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEmployees > 0 
                ? Math.round((stats.activeAllocations / stats.totalEmployees) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAllocations} active allocations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Off</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVacations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingVacations} upcoming vacations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
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
                  <div className="text-3xl font-bold text-green-600">{stats.completedProjects}</div>
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
                  <Badge variant={stats.totalEmployees > 0 && (stats.activeAllocations / stats.totalEmployees) > 0.8 ? "destructive" : "default"}>
                    {stats.totalEmployees > 0 
                      ? Math.round((stats.activeAllocations / stats.totalEmployees) * 100)
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
      </Tabs>
    </div>
  );
}; 