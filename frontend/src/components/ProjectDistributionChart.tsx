import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { getProjectsSync } from "@/lib/project-data";
import { getCurrentEmployeesSync } from "@/lib/employee-data";
import { Folder, Users, Clock, Target } from "lucide-react";
import { format, isAfter, isBefore, startOfMonth, endOfMonth } from "date-fns";
import { useMemo, useState } from "react";

export const ProjectDistributionChart = () => {
  const [activeView, setActiveView] = useState<'distribution' | 'timeline' | 'metrics'>('distribution');

  // Project distribution data
  const projectData = useMemo(() => {
    const projects = getProjectsSync();
    // Use the existing getCurrentEmployeesSync() to source team member names and allocations,
    // ensuring a single, consistent data source across the app.
    const employees = getCurrentEmployeesSync();
    // Since the sync functions return empty arrays, we'll use mock data for now
    const projectAllocations: Array<{ projectId: string; hoursPerDay: number; startDate: string; endDate: string; employeeId: string }> = [];

    return projects.map(project => {
      const projectAllocs = projectAllocations.filter((allocation: { projectId: string; hoursPerDay: number; startDate: string; endDate: string }) =>
        allocation.projectId === project.id.toString()
      );
      
      // Calculate employee count and total hours
      const employeeCount = projectAllocs.length;
      const totalHours = projectAllocs.reduce((sum, alloc) => sum + (alloc.hoursPerDay || 0), 0);
      
      // Calculate project status
      let status = 'Planning';
      if (project.startDate && project.endDate) {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const today = new Date();
        
        if (isBefore(today, startDate)) {
          status = 'Upcoming';
        } else if (isAfter(today, endDate)) {
          status = 'Completed';
        } else {
          status = 'Active';
        }
      }
      
      return {
        name: project.name,
        employees: employeeCount,
        hours: totalHours,
        status,
        startDate: project.startDate,
        endDate: project.endDate,
        color: 'hsl(var(--brp-yellow))'
      };
    }).filter(project => project.employees > 0 || project.status === 'Planning');
  }, []);

  // Timeline data
  const timelineData = useMemo(() => {
    const projects = getProjectsSync().filter(project => project.startDate && project.endDate);
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const activeProjects = projects.filter(project => {
        const startDate = new Date(project.startDate!);
        const endDate = new Date(project.endDate!);
        return (startDate <= monthEnd && endDate >= monthStart);
      });
      
      months.push({
        month: format(monthDate, 'MMM yyyy'),
        projects: activeProjects.length,
        totalHours: activeProjects.length * 160, // Mock hours
        activeTeams: activeProjects.length * 2 // Mock team count
      });
    }
    
    return months;
  }, []);

  // Project metrics
  const projectMetrics = useMemo(() => {
    const projects = getProjectsSync();
    const activeProjects = projects.filter(project => {
      if (!project.startDate || !project.endDate) return false;
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const today = new Date();
      return today >= startDate && today <= endDate;
    });
    
    const completedProjects = projects.filter(project => {
      if (!project.endDate) return false;
      const endDate = new Date(project.endDate);
      const today = new Date();
      return today > endDate;
    });
    
    const upcomingProjects = projects.filter(project => {
      if (!project.startDate) return false;
      const startDate = new Date(project.startDate);
      const today = new Date();
      return today < startDate;
    });
    
    return [
      {
        metric: 'Active Projects',
        value: activeProjects.length,
        total: projects.length,
        icon: <Target className="h-4 w-4" />,
        color: 'hsl(var(--brp-yellow))'
      },
      {
        metric: 'Completed',
        value: completedProjects.length,
        total: projects.length,
        icon: <Clock className="h-4 w-4" />,
        color: 'hsl(var(--brp-gray))'
      },
      {
        metric: 'Upcoming',
        value: upcomingProjects.length,
        total: projects.length,
        icon: <Folder className="h-4 w-4" />,
        color: 'hsl(var(--brp-silver))'
      },
      {
        metric: 'Team Members',
        value: getCurrentEmployeesSync().length,
        total: 20, // Target team size
        icon: <Users className="h-4 w-4" />,
        color: 'hsl(var(--brp-black))'
      }
    ];
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'hsl(var(--brp-yellow))';
      case 'Completed': return 'hsl(var(--brp-gray))';
      case 'Upcoming': return 'hsl(var(--brp-silver))';
      case 'Planning': return 'hsl(var(--brp-black))';
      default: return 'hsl(var(--brp-black))';
    }
  };

  return (
    <Card className="text-xs p-1">
      <CardHeader className="p-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-1">
            <Folder className="h-5 w-5 text-primary" />
            <span>Project Distribution</span>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveView('distribution')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                activeView === 'distribution' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Distribution
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                activeView === 'timeline' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveView('metrics')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                activeView === 'metrics' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Metrics
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-2">
        <div className="space-y-4">
          {activeView === 'distribution' && (
            <div style={{ height: 250 }}>
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
                  <Legend fontSize={10} />
                  <Bar dataKey="employees" fill="hsl(var(--brp-yellow))" radius={[4, 4, 0, 0]} name="Team Members" />
                  <Bar dataKey="hours" fill="hsl(var(--brp-gray))" radius={[4, 4, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeView === 'timeline' && (
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={10}
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis fontSize={10} tick={{ fill: 'var(--muted-foreground)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend fontSize={10} />
                  <Bar dataKey="projects" fill="hsl(var(--brp-yellow))" radius={[4, 4, 0, 0]} name="Active Projects" />
                  <Bar dataKey="activeTeams" fill="hsl(var(--brp-gray))" radius={[4, 4, 0, 0]} name="Teams" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeView === 'metrics' && (
            <div className="space-y-4">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {projectMetrics.map((metric, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{metric.metric}</span>
                      <span style={{ color: metric.color }}>{metric.icon}</span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-lg font-bold text-foreground">
                        {metric.value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {metric.total}
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-muted rounded-full h-1">
                        <div 
                          className="h-1 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((metric.value / metric.total) * 100, 100)}%`,
                            backgroundColor: metric.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project Status Distribution */}
              <div className="space-y-2">
                <h4 className="font-medium text-foreground text-sm">Project Status</h4>
                <div style={{ height: 150 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="employees"
                      >
                        {projectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend fontSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <span className="text-[10px] text-muted-foreground">
              {activeView === 'distribution' && `${projectData.length} projects with team allocation`}
              {activeView === 'timeline' && '6-month project timeline forecast'}
              {activeView === 'metrics' && 'Project portfolio overview'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 