import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { employees, calculateAvailableHours } from "@/lib/employee-data";
import { useSettings } from "@/context/SettingsContext";
import { FolderOpen } from "lucide-react";

export const ProjectAllocationChart = () => {
  const { canadaHours, brazilHours } = useSettings();
  // Calculate total allocation and capacity using up-to-date settings
  const totalAllocated = employees.reduce((sum, emp) => sum + emp.allocatedHours, 0);
  const totalCapacity = employees.reduce((sum, emp) => {
    // Use the current settings for weekly hours
    const weeklyHours = emp.country === 'Canada' ? canadaHours : brazilHours;
    const monthlyHours = weeklyHours * 4;
    const vacationHours = emp.vacationDays * (weeklyHours / 5);
    const holidayHours = emp.holidayDays * (weeklyHours / 5);
    return sum + (monthlyHours - vacationHours - holidayHours);
  }, 0);
  const percent = totalCapacity > 0 ? ((totalAllocated / totalCapacity) * 100) : 0;
  const percentDisplay = percent.toFixed(1).replace(/\.0$/, '');
  const totalAllocatedDisplay = totalAllocated % 1 === 0 ? totalAllocated : totalAllocated.toFixed(1);
  const totalCapacityDisplay = totalCapacity % 1 === 0 ? totalCapacity : totalCapacity.toFixed(1);

  // Gauge chart data: value (allocated), rest (capacity - allocated)
  const gaugeData = [
    { value: Math.min(totalAllocated, totalCapacity), color: 'var(--primary)' },
    { value: Math.max(totalCapacity - totalAllocated, 0), color: 'var(--muted)' },
  ];

  // Gauge chart config
  const width = 300;
  const height = 180;
  const cx = width / 2;
  const cy = height;
  const startAngle = 180;
  const endAngle = 0;
  const innerRadius = 60;
  const outerRadius = 90;

  return (
    <Card className="text-xs p-1">
      <CardHeader className="p-2">
        <CardTitle className="flex items-center space-x-1 text-base">
          <FolderOpen className="h-5 w-5 text-primary" />
          <span>Project Allocation</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-2">
        <div className="flex flex-col items-center justify-center" style={{ height: height + 20 }}>
          <PieChart width={width} height={height}>
            <Pie
              data={gaugeData}
              dataKey="value"
              startAngle={startAngle}
              endAngle={endAngle}
              cx={cx}
              cy={cy}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              cornerRadius={10}
              stroke="none"
            >
              {gaugeData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute flex flex-col items-center justify-center" style={{ top: height / 2 - 10, left: 0, width: width }}>
            <span className="text-xl font-bold text-primary">{percentDisplay}%</span>
            <span className="text-[10px] text-muted-foreground">{totalAllocatedDisplay}h / {totalCapacityDisplay}h</span>
            <span className="text-[10px] text-muted-foreground">Team Allocation vs Capacity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};