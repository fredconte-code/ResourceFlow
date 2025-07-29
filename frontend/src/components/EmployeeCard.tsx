import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AllocationBar } from "./AllocationBar";
import { Employee, calculateAllocationPercentage, calculateAvailableHours, calculateActualAvailableHours } from "@/lib/employee-data";
import { MapPin, Calendar, Clock, AlertCircle, Folder } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useState, useEffect } from "react";
import { getEmployeeProjectNamesWithCleanup, getEmployeeProjectAllocationsWithCleanup, ProjectAllocation, initializeProjectData } from "@/lib/project-data";

interface EmployeeCardProps {
  employee: Employee;
}

export const EmployeeCard = ({ employee }: EmployeeCardProps) => {
  const { canadaHours, brazilHours, buffer } = useSettings();
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocation[]>([]);
  const [employeeProjectNames, setEmployeeProjectNames] = useState<string[]>([]);
  
  const allocationPercentage = calculateAllocationPercentage(employee);
  const actualAvailableHours = calculateActualAvailableHours(employee, canadaHours, brazilHours, buffer);
  const availableHours = employee.country === 'Canada' ? canadaHours * 4 : brazilHours * 4; // Derived from settings
  const weeklyHours = employee.country === 'Canada' ? canadaHours : brazilHours; // Derived from settings
  const allocationDisplay = Number(allocationPercentage).toFixed(1).replace(/\.0$/, '');
  const availableHoursDisplay = availableHours % 1 === 0 ? availableHours : availableHours.toFixed(1);
  const weeklyHoursDisplay = weeklyHours % 1 === 0 ? weeklyHours : weeklyHours.toFixed(1);

  // Initialize project data and load project allocations
  useEffect(() => {
    // Initialize project data on first load
    initializeProjectData();
    
    const loadProjectData = () => {
      const allocations = getEmployeeProjectAllocationsWithCleanup(employee.id);
      const projectNames = getEmployeeProjectNamesWithCleanup(employee.id);
      setProjectAllocations(allocations);
      setEmployeeProjectNames(projectNames);
    };

    // Load initial data
    loadProjectData();

    // Listen for updates
    const handleProjectAllocationsUpdate = () => {
      loadProjectData();
    };

    const handleProjectsUpdate = () => {
      loadProjectData();
    };

    window.addEventListener('projectAllocationsUpdate', handleProjectAllocationsUpdate);
    window.addEventListener('projectsUpdate', handleProjectsUpdate);
    
    return () => {
      window.removeEventListener('projectAllocationsUpdate', handleProjectAllocationsUpdate);
      window.removeEventListener('projectsUpdate', handleProjectsUpdate);
    };
  }, [employee.id]);

  return (
    <Card className="hover:shadow-md transition-all duration-300 border-border/50 text-xs p-1 w-full max-w-md">
      <CardHeader className="pb-2 p-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{employee.name}</h3>
              <p className="text-xs text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="flex items-center space-x-1 bg-muted/30 text-muted-foreground border-border"
          >
            <MapPin className="h-3 w-3" />
            <span className="text-xs">{employee.country}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 p-2">
        <AllocationBar 
          percentage={allocationPercentage}
          height="md"
        />
        
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-3 w-3 text-muted-foreground mr-1" />
            </div>
            <p className="font-medium text-foreground text-xs">{employee.allocatedHours}h</p>
            <p className="text-[10px] text-muted-foreground">Allocated</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
            </div>
            {actualAvailableHours !== null ? (
              <p className="font-medium text-foreground text-xs">{actualAvailableHours}h</p>
            ) : (
              <div className="flex items-center justify-center group">
                <AlertCircle className="h-3 w-3 text-destructive mr-1" />
                <span className="text-[10px] text-destructive group-hover:underline" title="Weekly Hours or Buffer Time not defined in Settings.">N/A</span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">Available</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-[10px] text-muted-foreground">{weeklyHoursDisplay}h/w</span>
            </div>
            <p className="font-medium text-foreground text-xs">
              {employee.vacationDays + employee.holidayDays}
            </p>
            <p className="text-[10px] text-muted-foreground">Days off</p>
          </div>
        </div>

        {/* Project Allocations */}
        {employeeProjectNames.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Folder className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Projects:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {employeeProjectNames.slice(0, 3).map((projectName, index) => (
                <Badge 
                  key={index}
                  variant="outline" 
                  className="text-[9px] px-1.5 py-0.5 bg-muted/20 border-border text-muted-foreground"
                >
                  {projectName}
                </Badge>
              ))}
              {employeeProjectNames.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-[9px] px-1.5 py-0.5 bg-muted/20 border-border text-muted-foreground"
                >
                  +{employeeProjectNames.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};