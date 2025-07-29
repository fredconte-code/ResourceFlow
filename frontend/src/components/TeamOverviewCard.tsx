import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTeamStats } from "@/lib/employee-data";
import { Users, Clock, MapPin, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export const TeamOverviewCard = () => {
  const { canadaHours, brazilHours, buffer } = useSettings();
  const stats = getTeamStats(canadaHours, brazilHours, buffer);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-allocation-low';
      case 'optimal': return 'text-allocation-optimal';
      case 'high': return 'text-allocation-high';
      case 'over': return 'text-allocation-over';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'low': return <TrendingUp className="h-4 w-4" />;
      case 'optimal': return <CheckCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'over': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="col-span-full lg:col-span-2 text-xs p-1">
      <CardHeader className="p-2">
        <CardTitle className="flex items-center space-x-1 text-base">
          <Users className="h-5 w-5 text-primary" />
          <span>Team Overview</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2 p-2">
        {/* Overall Allocation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Overall Team Allocation</span>
            <span className="text-xl font-bold text-primary">{Number(stats.overallAllocation).toFixed(1).replace(/\.0$/, '')}%</span>
          </div>
          <Progress 
            value={Math.min(stats.overallAllocation, 100)} 
            className="h-3"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{(stats.totalAllocated % 1 === 0 ? stats.totalAllocated : stats.totalAllocated.toFixed(1))}h allocated</span>
            <span>{(stats.totalAvailable % 1 === 0 ? stats.totalAvailable : stats.totalAvailable.toFixed(1))}h available</span>
          </div>
        </div>

        {/* Team Composition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary mr-1" />
            </div>
            <p className="text-xl font-bold text-foreground">{stats.totalEmployees}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </div>
          
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-5 w-5 text-info mr-1" />
            </div>
            <p className="text-xl font-bold text-foreground">{stats.canadianEmployees}</p>
            <p className="text-xs text-muted-foreground">Canada</p>
          </div>
          
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="h-5 w-5 text-success mr-1" />
            </div>
            <p className="text-xl font-bold text-foreground">{stats.brazilianEmployees}</p>
            <p className="text-xs text-muted-foreground">Brazil</p>
          </div>
        </div>

        {/* Allocation Status Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Allocation Status Distribution</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
            {Object.entries(stats.allocationByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className={getStatusColor(status)}>
                    {getStatusIcon(status)}
                  </span>
                  <span className="text-sm capitalize text-foreground">{status}</span>
                </div>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};