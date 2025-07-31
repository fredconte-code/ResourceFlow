import { Skeleton } from "@/components/ui/skeleton";

// Team Member Skeleton
export const TeamMemberSkeleton = () => (
  <div className="space-y-4 p-4 border rounded-lg">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  </div>
);

// Team Members List Skeleton
export const TeamMembersListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <TeamMemberSkeleton key={i} />
    ))}
  </div>
);

// Project Skeleton
export const ProjectSkeleton = () => (
  <div className="space-y-4 p-4 border rounded-lg">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
);

// Projects List Skeleton
export const ProjectsListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProjectSkeleton key={i} />
    ))}
  </div>
);

// Calendar Skeleton
export const CalendarSkeleton = () => (
  <div className="space-y-4">
    {/* Calendar Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-32" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    
    {/* Calendar Grid */}
    <div className="grid grid-cols-7 gap-2">
      {/* Day headers */}
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-8 w-full" />
      ))}
      
      {/* Calendar cells */}
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={`cell-${i}`} className="h-20 w-full" />
      ))}
    </div>
  </div>
);

// Dashboard Skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6 border rounded-lg">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="p-6 border rounded-lg">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
    
    {/* Recent Activity */}
    <div className="p-6 border rounded-lg">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Settings Skeleton
export const SettingsSkeleton = () => (
  <div className="space-y-6">
    {/* Server Status */}
    <div className="p-6 border rounded-lg">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex items-center space-x-3">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    
    {/* Working Hours */}
    <div className="p-6 border rounded-lg">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
    
    {/* Data Management */}
    <div className="p-6 border rounded-lg">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="flex space-x-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  </div>
);

// Time Off Management Skeleton
export const TimeOffManagementSkeleton = () => (
  <div className="space-y-6">
    {/* Tabs */}
    <div className="flex space-x-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24" />
      ))}
    </div>
    
    {/* Content */}
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-2">
    {/* Header */}
    <div className="flex space-x-2">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-8 flex-1" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-2">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-12 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Form Skeleton
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-3 pt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
);

// Card Skeleton
export const CardSkeleton = () => (
  <div className="p-6 border rounded-lg">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

// Loading Spinner
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]}`}></div>
    </div>
  );
};

// Page Loading Skeleton
export const PageLoadingSkeleton = () => (
  <div className="min-h-screen p-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    
    {/* Content */}
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  </div>
); 