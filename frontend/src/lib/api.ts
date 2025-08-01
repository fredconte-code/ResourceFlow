const API_BASE_URL = 'http://127.0.0.1:3001/api';

// Generic API helper functions
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Team Members API
export interface TeamMember {
  id: number;
  name: string;
  role: string;
  country: 'Canada' | 'Brazil';
  allocatedHours?: number; // Optional since we now use global settings
}

export const teamMembersApi = {
  getAll: async (): Promise<TeamMember[]> => {
    const data = await apiRequest('/team-members');
    // Transform snake_case to camelCase and filter active members
    return data
      .filter((member: any) => member.is_active !== 0) // Only include active members
      .map((member: any) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        country: member.country,
        allocatedHours: member.allocated_hours || 0
      }));
  },
  
  create: (member: Omit<TeamMember, 'id'>): Promise<TeamMember> => 
    apiRequest('/team-members', {
      method: 'POST',
      body: JSON.stringify(member),
    }),
  
  update: (id: number, member: Partial<TeamMember>): Promise<TeamMember> => 
    apiRequest(`/team-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    }),
  
  delete: (id: number): Promise<{ message: string }> => 
    apiRequest(`/team-members/${id}`, {
      method: 'DELETE',
    }),
};

// Project Status Types
export type ProjectStatus = 'active' | 'on_hold' | 'finished' | 'cancelled';

// Projects API
export interface Project {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  color: string;
  allocatedHours: number;
  status: ProjectStatus;
}

export const projectsApi = {
  getAll: (): Promise<Project[]> => apiRequest('/projects'),
  
  create: (project: Omit<Project, 'id'>): Promise<Project> => 
    apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),
  
  update: (id: number, project: Partial<Project>): Promise<Project> => 
    apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    }),
  
  delete: (id: number): Promise<{ message: string }> => 
    apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    }),
};

// Holidays API
export interface Holiday {
  id: number;
  name: string;
  date: string;
  country: string;
}

export const holidaysApi = {
  getAll: (): Promise<Holiday[]> => apiRequest('/holidays'),
  
  create: (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => 
    apiRequest('/holidays', {
      method: 'POST',
      body: JSON.stringify(holiday),
    }),
  
  update: (id: number, holiday: Partial<Holiday>): Promise<Holiday> => 
    apiRequest(`/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(holiday),
    }),
  
  delete: (id: number): Promise<{ message: string }> => 
    apiRequest(`/holidays/${id}`, {
      method: 'DELETE',
    }),
};

// Vacations API
export interface Vacation {
  id: number;
  employee_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  type: string;
}

export const vacationsApi = {
  getAll: (): Promise<Vacation[]> => apiRequest('/vacations'),
  
  create: (vacation: Omit<Vacation, 'id'>): Promise<Vacation> => 
    apiRequest('/vacations', {
      method: 'POST',
      body: JSON.stringify(vacation),
    }),
  
  update: (id: number, vacation: Partial<Vacation>): Promise<Vacation> => 
    apiRequest(`/vacations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vacation),
    }),
  
  delete: (id: number): Promise<{ message: string }> => 
    apiRequest(`/vacations/${id}`, {
      method: 'DELETE',
    }),
};

// Project Allocations API
export interface ProjectAllocation {
  id: number;
  employeeId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  status: string;
}

export const projectAllocationsApi = {
  getAll: (): Promise<ProjectAllocation[]> => apiRequest('/project-allocations'),
  
  create: (allocation: Omit<ProjectAllocation, 'id'>): Promise<ProjectAllocation> => 
    apiRequest('/project-allocations', {
      method: 'POST',
      body: JSON.stringify(allocation),
    }),
  
  update: (id: number, allocation: Partial<ProjectAllocation>): Promise<ProjectAllocation> => 
    apiRequest(`/project-allocations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(allocation),
    }),
  
  delete: (id: number): Promise<{ message: string }> => 
    apiRequest(`/project-allocations/${id}`, {
      method: 'DELETE',
    }),
};

// Settings API
export interface Settings {
  buffer: number;
  canadaHours: number;
  brazilHours: number;
}

export const settingsApi = {
  getAll: (): Promise<Settings> => apiRequest('/settings'),
  
  update: (settings: Partial<Settings>): Promise<{ message: string }> => 
    apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// Data Export/Import API
export interface ExportData {
  teamMembers: TeamMember[];
  projects: Project[];
  holidays: Holiday[];
  vacations: Vacation[];
  projectAllocations: ProjectAllocation[];
  settings: Settings;
}

export const dataApi = {
  export: (): Promise<ExportData> => apiRequest('/export'),
  
  import: (data: ExportData): Promise<{ message: string }> => 
    apiRequest('/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Test API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await apiRequest('/hello');
    return true;
  } catch (error) {
    console.error('API connection failed:', error);
    return false;
  }
}; 