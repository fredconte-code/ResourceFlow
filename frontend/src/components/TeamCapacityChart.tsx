import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, ComposedChart, Area } from 'recharts';
import { getCurrentEmployees } from "@/lib/employee-data";
import { getTeamStats } from "@/lib/employee-data";
import { TrendingUp, Users, Clock, Target, Activity } from "lucide-react";
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { useMemo } from "react";
import { useSettings } from "@/context/SettingsContext";

export const TeamCapacityChart = () => {
  const { canadaHours, brazilHours, buffer } = useSettings();
  const stats = getTeamStats(canadaHours, brazilHours, buffer);

  // Weekly capacity data
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return days.map(day => {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const baseCapacity = isWeekend ? 0 : 100;
      
      return {
        day: format(day, 'EEE'),
        date: format(day, 'MMM dd'),
        capacity: baseCapacity,
        utilization: isWeekend ? 0 : Math.floor(Math.random() * 40) + 60, // Mock utilization
        available: isWeekend ? 0 : Math.floor(Math.random() * 20) + 80,
        allocated: isWeekend ? 0 : Math.floor(Math.random() * 30) + 50
      };
    });
  }, []);

  // Monthly trend data
  const monthlyTrends = useMemo(() => {
    const months = [];
    const currentMonth = new Date().getMonth();
    
    for (let i = 5; i >= 0; i--) {
      const month = (currentMonth - i + 12) % 12;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      months.push({
        month: monthNames[month],
        allocation: Math.floor(Math.random() * 30) + 65,
        capacity: Math.floor(Math.random() * 15) + 85,
        efficiency: Math.floor(Math.random() * 20) + 75,
        projects: Math.floor(Math.random() * 5) + 3
      });
    }
    return months;
  }, []);

  // Team performance metrics
  const performanceMetrics = useMemo(() => {
    const employees = getCurrentEmployees();
    const canadianEmployees = employees.filter(emp => emp.country === 'Canada');
    const brazilianEmployees = employees.filter(emp => emp.country === 'Brazil');
    
    return [
      {
        metric: 'Overall Utilization',
        value: stats.overallAllocation,
        target: 85,
        unit: '%',
        color: 'hsl(var(--brp-yellow))',
        icon: <Target className="h-4 w-4" />
      },
      {
        metric: 'Team Efficiency',
        value: Math.floor(Math.random() * 20) + 80,
        target: 90,
        unit: '%',
        color: 'hsl(var(--brp-gray))',
        icon: <Activity className="h-4 w-4" />
      },
      {
        metric: 'Canada Team',
        value: canadianEmployees.length,
        target: 8,
        unit: 'members',
        color: 'hsl(var(--brp-silver))',
        icon: <Users className="h-4 w-4" />
      },
      {
        metric: 'Brazil Team',
        value: brazilianEmployees.length,
        target: 6,
        unit: 'members',
        color: 'hsl(var(--brp-black))',
        icon: <Users className="h-4 w-4" />
      }
    ];
  }, [stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
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
        <CardTitle className="flex items-center space-x-1 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Team Capacity & Performance</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 p-2">
        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{metric.metric}</span>
                <span style={{ color: metric.color }}>{metric.icon}</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-foreground">
                  {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
                </span>
                <span className="text-xs text-muted-foreground">{metric.unit}</span>
              </div>
              <div className="mt-1">
                <div className="w-full bg-muted rounded-full h-1">
                  <div 
                    className="h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
                      backgroundColor: metric.color
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Target: {metric.target}{metric.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Capacity Chart */}
        <div className="space-y-2">
          <h4 className="font-medium text-foreground text-sm">This Week's Capacity</h4>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="day" 
                  fontSize={10}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis fontSize={10} tick={{ fill: 'var(--muted-foreground)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend fontSize={10} />
                <Area 
                  type="monotone" 
                  dataKey="capacity" 
                  fill="hsl(var(--brp-silver))" 
                  stroke="hsl(var(--brp-gray))"
                  fillOpacity={0.3}
                  name="Capacity"
                />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="hsl(var(--brp-yellow))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--brp-yellow))', strokeWidth: 2, r: 4 }}
                  name="Utilization"
                />
                <Line 
                  type="monotone" 
                  dataKey="allocated" 
                  stroke="hsl(var(--brp-gray))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--brp-gray))', strokeWidth: 2, r: 4 }}
                  name="Allocated"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="space-y-2">
          <h4 className="font-medium text-foreground text-sm">6-Month Trends</h4>
          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="month" 
                  fontSize={10}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis fontSize={10} tick={{ fill: 'var(--muted-foreground)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend fontSize={10} />
                <Bar dataKey="allocation" fill="hsl(var(--brp-yellow))" radius={[2, 2, 0, 0]} name="Allocation %" />
                <Bar dataKey="efficiency" fill="hsl(var(--brp-gray))" radius={[2, 2, 0, 0]} name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'hsl(var(--brp-yellow))' }}>
              {stats.totalAllocated.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">Allocated</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'hsl(var(--brp-gray))' }}>
              {stats.totalAvailable.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'hsl(var(--brp-silver))' }}>
              {stats.totalEmployees}
            </div>
            <div className="text-xs text-muted-foreground">Team Size</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 