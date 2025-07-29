import { projectsApi, projectAllocationsApi, Project, ProjectAllocation } from "@/lib/api";

// Get projects from API
export const getProjects = async (): Promise<Project[]> => {
  try {
    return await projectsApi.getAll();
  } catch (error) {
    console.error('Error fetching projects from API:', error);
    return [];
  }
};

// Synchronous version for backward compatibility (returns empty array)
export const getProjectsSync = (): Project[] => {
  return [];
};

// Save projects to API
export const saveProjects = async (projects: Project[]): Promise<void> => {
  try {
    // This would need to be implemented as a bulk operation in the API
    // For now, we'll just log that this function is called
    console.log('saveProjects called with:', projects);
  } catch (error) {
    console.error('Error saving projects:', error);
  }
};

// Add a new project
export const addProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
  try {
    return await projectsApi.create(project);
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

// Update an existing project
export const updateProject = async (id: number, project: Partial<Project>): Promise<Project> => {
  try {
    return await projectsApi.update(id, project);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id: number): Promise<void> => {
  try {
    await projectsApi.delete(id);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Get project allocations from API
export const getProjectAllocations = async (): Promise<ProjectAllocation[]> => {
  try {
    return await projectAllocationsApi.getAll();
  } catch (error) {
    console.error('Error fetching project allocations from API:', error);
    return [];
  }
};

// Synchronous version for backward compatibility (returns empty array)
export const getProjectAllocationsSync = (): ProjectAllocation[] => {
  return [];
};

// Save project allocations to API
export const saveProjectAllocations = async (allocations: ProjectAllocation[]): Promise<void> => {
  try {
    // This would need to be implemented as a bulk operation in the API
    // For now, we'll just log that this function is called
    console.log('saveProjectAllocations called with:', allocations);
  } catch (error) {
    console.error('Error saving project allocations:', error);
  }
};

// Add a new project allocation
export const addProjectAllocation = async (allocation: Omit<ProjectAllocation, 'id'>): Promise<ProjectAllocation> => {
  try {
    return await projectAllocationsApi.create(allocation);
  } catch (error) {
    console.error('Error adding project allocation:', error);
    throw error;
  }
};

// Update an existing project allocation
export const updateProjectAllocation = async (id: number, allocation: Partial<ProjectAllocation>): Promise<ProjectAllocation> => {
  try {
    return await projectAllocationsApi.update(id, allocation);
  } catch (error) {
    console.error('Error updating project allocation:', error);
    throw error;
  }
};

// Remove a project allocation
export const removeProjectAllocation = async (id: number): Promise<void> => {
  try {
    await projectAllocationsApi.delete(id);
  } catch (error) {
    console.error('Error removing project allocation:', error);
    throw error;
  }
};

// Get project allocations for a specific employee
export const getEmployeeProjectAllocations = async (employeeId: string): Promise<ProjectAllocation[]> => {
  try {
    const allAllocations = await getProjectAllocations();
    return allAllocations.filter(allocation => allocation.employeeId === employeeId);
  } catch (error) {
    console.error('Error getting employee project allocations:', error);
    return [];
  }
};

// Synchronous version for backward compatibility
export const getEmployeeProjectAllocationsSync = (employeeId: string): ProjectAllocation[] => {
  return [];
};

// Get project allocations with cleanup (for backward compatibility)
export const getProjectAllocationsWithCleanup = async (): Promise<ProjectAllocation[]> => {
  return await getProjectAllocations();
};

// Synchronous version for backward compatibility
export const getProjectAllocationsWithCleanupSync = (): ProjectAllocation[] => {
  return [];
};

// Get employee project allocations with cleanup (for backward compatibility)
export const getEmployeeProjectAllocationsWithCleanup = async (employeeId: string): Promise<ProjectAllocation[]> => {
  return await getEmployeeProjectAllocations(employeeId);
};

// Synchronous version for backward compatibility
export const getEmployeeProjectAllocationsWithCleanupSync = (employeeId: string): ProjectAllocation[] => {
  return [];
};

// Get project names for an employee
export const getEmployeeProjectNames = async (employeeId: string): Promise<string[]> => {
  try {
    const allocations = await getEmployeeProjectAllocations(employeeId);
    const projects = await getProjects();
    
    const projectNames = allocations.map(allocation => {
      const project = projects.find(p => p.id.toString() === allocation.projectId);
      return project ? project.name : 'Unknown Project';
    });
    
    return [...new Set(projectNames)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting employee project names:', error);
    return [];
  }
};

// Synchronous version for backward compatibility
export const getEmployeeProjectNamesSync = (employeeId: string): string[] => {
  return [];
};

// Get employee project names with cleanup (for backward compatibility)
export const getEmployeeProjectNamesWithCleanup = async (employeeId: string): Promise<string[]> => {
  return await getEmployeeProjectNames(employeeId);
};

// Synchronous version for backward compatibility
export const getEmployeeProjectNamesWithCleanupSync = (employeeId: string): string[] => {
  return [];
};

// Initialize project data (for backward compatibility)
export const initializeProjectData = async (): Promise<void> => {
  try {
    // This function can be used to initialize any project-related data
    // For now, we'll just ensure the API is accessible
    await getProjects();
    await getProjectAllocations();
  } catch (error) {
    console.error('Error initializing project data:', error);
  }
};

// Synchronous version for backward compatibility
export const initializeProjectDataSync = (): void => {
  // No-op for synchronous version
};

// Debug project data (for backward compatibility)
export const debugProjectData = (): void => {
  console.log('Debug project data function called');
};

// Force project data cleanup (for backward compatibility)
export const forceProjectDataCleanup = (): void => {
  console.log('Force project data cleanup function called');
};

// Update project allocations (for backward compatibility)
export const updateProjectAllocations = (projects: Project[]): void => {
  console.log('Update project allocations function called with:', projects);
};

// Save projects with cleanup (for backward compatibility)
export const saveProjectsWithCleanup = async (projects: Project[]): Promise<void> => {
  await saveProjects(projects);
}; 