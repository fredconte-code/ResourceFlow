import { cn } from "@/lib/utils";
import { getAllocationStatus } from "@/lib/employee-data";

interface AllocationBarProps {
  percentage: number;
  height?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export const AllocationBar = ({ 
  percentage, 
  height = "md", 
  showLabel = true,
  className 
}: AllocationBarProps) => {
  // Handle NaN and invalid values
  const safePercentage = isNaN(percentage) || !isFinite(percentage) ? 0 : percentage;
  const status = getAllocationStatus(safePercentage);
  
  const heightClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  const statusColors = {
    low: "bg-allocation-low",
    optimal: "bg-allocation-optimal", 
    high: "bg-allocation-high",
    over: "bg-allocation-over"
  };

  const clampedPercentage = Math.min(safePercentage, 100);

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "w-full bg-muted rounded-full overflow-hidden",
        heightClasses[height]
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            statusColors[status]
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1">
          <span className={cn(
            "text-xs font-medium",
            status === "over" ? "text-destructive" : "text-muted-foreground"
          )}>
            {Math.round(safePercentage)}% allocated
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {status === "over" ? "Over-allocated" : status}
          </span>
        </div>
      )}
    </div>
  );
};