import { teamMembersApi, TeamMember } from "@/lib/api";
import { getWorkingHoursForCountry, getMonthlyHours } from "./working-hours";

// Interface for Employee (used in components)
export interface Employee {
  id: string;
  name: string;
  role: string;
  country: 'Canada' | 'Brazil';
  allocatedHours: number;
  availableHours: number;
  vacationDays: number;
  holidayDays: number;
}

// Get current team data from API and convert to Employee format
export const getCurrentEmployees = async (): Promise<Employee[]> => {
  try {
    const teamMembers = await teamMembersApi.getAll();
    return teamMembers.map(member => ({
      id: member.id.toString(),
      name: member.name,
      role: member.role,
      country: member.country,
      allocatedHours: member.allocatedHours,
      availableHours: getMonthlyHours(getWorkingHoursForCountry(member.country)), // Use settings-based calculation
      vacationDays: 0, // Default values - could be enhanced with vacation data
      holidayDays: 0 // Default values - could be enhanced with holiday data
    }));
  } catch (error) {
    console.error('Error fetching team members from API:', error);
    return [];
  }
};

// Synchronous version for backward compatibility (returns empty array)
export const getCurrentEmployeesSync = (): Employee[] => {
  return [];
};

// Default employees data (for fallback) - using settings-based calculations
export const employees = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Developer',
    country: 'Canada' as const,
    allocatedHours: 120,
    availableHours: getMonthlyHours(getWorkingHoursForCountry('Canada')),
    vacationDays: 5,
    holidayDays: 2
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'Designer',
    country: 'Brazil' as const,
    allocatedHours: 80,
    availableHours: getMonthlyHours(getWorkingHoursForCountry('Brazil')),
    vacationDays: 3,
    holidayDays: 1
  },
  {
    id: '3',
    name: 'Mike Johnson',
    role: 'Scrum Master',
    country: 'Canada' as const,
    allocatedHours: 60,
    availableHours: getMonthlyHours(getWorkingHoursForCountry('Canada')),
    vacationDays: 2,
    holidayDays: 1
  }
];

// Function to check data consistency (now checks API data)
export const checkDataConsistency = async (): Promise<{ hasIssues: boolean; issues: string[] }> => {
  const issues: string[] = [];
  
  try {
    const teamMembers = await teamMembersApi.getAll();
    
    // Check for data integrity issues
    teamMembers.forEach((member, index) => {
      if (!member.name || member.name.trim() === '') {
        issues.push(`Team member at index ${index} has no name`);
      }
      if (!member.role || member.role.trim() === '') {
        issues.push(`Team member ${member.name} has no role`);
      }
      if (!member.country || !['Canada', 'Brazil'].includes(member.country)) {
        issues.push(`Team member ${member.name} has invalid country`);
      }
      if (typeof member.allocatedHours !== 'number' || member.allocatedHours < 0) {
        issues.push(`Team member ${member.name} has invalid allocated hours`);
      }
    });
    
  } catch (error) {
    issues.push('Failed to fetch team members from API');
  }
  
  return {
    hasIssues: issues.length > 0,
    issues
  };
};

// Function to fix data consistency issues
export const fixDataConsistency = async (): Promise<void> => {
  try {
    const { hasIssues, issues } = await checkDataConsistency();
    
    if (hasIssues) {
      console.warn('Data consistency issues found:', issues);
      
      // For now, we'll just log the issues
      // In a real application, you might want to implement automatic fixes
      // or provide a way for users to manually fix the issues
      
      // Dispatch events to refresh components
      window.dispatchEvent(new CustomEvent('teamUpdate'));
    }
  } catch (error) {
    console.error('Error fixing data consistency:', error);
  }
};

// Function to get allocation status based on percentage
export const getAllocationStatus = (percentage: number): 'low' | 'optimal' | 'high' | 'over' => {
  if (percentage < 60) return 'low';
  if (percentage >= 60 && percentage <= 90) return 'optimal';
  if (percentage > 90 && percentage <= 100) return 'high';
  return 'over';
};