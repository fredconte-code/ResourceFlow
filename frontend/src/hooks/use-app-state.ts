import { useCallback } from 'react';
import { useTeamMembers } from '@/context/TeamMembersContext';
import { useProjects } from '@/context/ProjectsContext';
import { useAllocations } from '@/context/AllocationsContext';
import { useHolidays } from '@/context/HolidayContext';
import { useTimeOffs } from '@/context/TimeOffContext';

export const useAppState = () => {
  const { 
    members, 
    refreshMembers, 
    loading: membersLoading, 
    error: membersError 
  } = useTeamMembers();
  
  const { 
    projects, 
    refreshProjects, 
    loading: projectsLoading, 
    error: projectsError 
  } = useProjects();
  
  const { 
    allocations, 
    refreshAllocations, 
    loading: allocationsLoading, 
    error: allocationsError 
  } = useAllocations();
  
  const { 
    holidays, 
    refreshHolidays, 
    loading: holidaysLoading, 
    error: holidaysError 
  } = useHolidays();
  
  const { 
    timeOffs, 
    refreshTimeOffs, 
    loading: timeOffsLoading, 
    error: timeOffsError 
  } = useTimeOffs();

  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        refreshMembers(),
        refreshProjects(),
        refreshAllocations(),
        refreshHolidays(),
        refreshTimeOffs()
      ]);
    } catch (error) {
      console.error('Error refreshing all data:', error);
      throw error;
    }
  }, [refreshMembers, refreshProjects, refreshAllocations, refreshHolidays, refreshTimeOffs]);

  const isLoading = membersLoading || projectsLoading || allocationsLoading || holidaysLoading || timeOffsLoading;
  
  const hasError = membersError || projectsError || allocationsError || holidaysError || timeOffsError;

  return {
    // Data
    members,
    projects,
    allocations,
    holidays,
    timeOffs,
    
    // Loading states
    isLoading,
    membersLoading,
    projectsLoading,
    allocationsLoading,
    holidaysLoading,
    timeOffsLoading,
    
    // Error states
    hasError,
    membersError,
    projectsError,
    allocationsError,
    holidaysError,
    timeOffsError,
    
    // Actions
    refreshAllData,
    refreshMembers,
    refreshProjects,
    refreshAllocations,
    refreshHolidays,
    refreshTimeOffs
  };
}; 