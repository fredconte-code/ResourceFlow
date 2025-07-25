import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AllocationBar } from "./AllocationBar";
import { Employee, calculateAllocationPercentage, calculateAvailableHours } from "@/lib/employee-data";
import { MapPin, Calendar, Clock } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

interface EmployeeCardProps {
  employee: Employee;
}

export const EmployeeCard = ({ employee }: EmployeeCardProps) => {
  const { canadaHours, brazilHours } = useSettings();
  const allocationPercentage = calculateAllocationPercentage(employee);
  const availableHours = employee.country === 'Canada' ? canadaHours * 4 : brazilHours * 4; // Derived from settings
  const weeklyHours = employee.country === 'Canada' ? canadaHours : brazilHours; // Derived from settings
  const allocationDisplay = Number(allocationPercentage).toFixed(1).replace(/\.0$/, '');
  const availableHoursDisplay = availableHours % 1 === 0 ? availableHours : availableHours.toFixed(1);
  const weeklyHoursDisplay = weeklyHours % 1 === 0 ? weeklyHours : weeklyHours.toFixed(1);

  return (
    <Card className="hover:shadow-md transition-all duration-300 border-border/50 text-xs p-1">
      <CardHeader className="pb-1 p-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {employee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="flex items-center space-x-1 bg-muted/50"
          >
            <MapPin className="h-3 w-3" />
            <span>{employee.country}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <AllocationBar 
          percentage={allocationPercentage}
          height="lg"
        />
        
        <div className="grid grid-cols-3 gap-1 mt-1">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
            </div>
            <p className="font-medium text-foreground">{employee.allocatedHours}h</p>
            <p className="text-xs text-muted-foreground">Allocated</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
            </div>
            <p className="font-medium text-foreground">{availableHoursDisplay}h</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-xs text-muted-foreground">{weeklyHoursDisplay}h/week</span>
            </div>
            <p className="font-medium text-foreground">
              {employee.vacationDays + employee.holidayDays}
            </p>
            <p className="text-xs text-muted-foreground">Days off</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};