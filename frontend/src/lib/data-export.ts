import { 
  teamMembersApi, 
  projectsApi, 
  holidaysApi, 
  vacationsApi, 
  projectAllocationsApi, 
  settingsApi,
  TeamMember,
  Project,
  Holiday,
  Vacation,
  ProjectAllocation,
  Settings
} from './api';

export interface ExportData {
  teamMembers: TeamMember[];
  projects: Project[];
  holidays: Holiday[];
  vacations: Vacation[];
  projectAllocations: ProjectAllocation[];
  settings: Settings;
  exportDate: string;
  version: string;
  metadata: {
    totalRecords: number;
    exportSource: string;
    exportType: 'full' | 'incremental';
  };
}

export interface ImportData {
  data: ExportData;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// Export all data from the application
export const exportAllData = async (): Promise<ExportData> => {
  try {
    const [members, projects, holidays, vacations, allocations, settings] = await Promise.all([
      teamMembersApi.getAll(),
      projectsApi.getAll(),
      holidaysApi.getAll(),
      vacationsApi.getAll(),
      projectAllocationsApi.getAll(),
      settingsApi.getAll()
    ]);
    
    const totalRecords = members.length + projects.length + holidays.length + 
                        vacations.length + allocations.length + Object.keys(settings).length;
    
    return {
      teamMembers: members,
      projects,
      holidays,
      vacations,
      projectAllocations: allocations,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      metadata: {
        totalRecords,
        exportSource: 'resourceflow',
        exportType: 'full'
      }
    };
  } catch (error) {
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Download data as JSON file
export const downloadData = async (filename?: string): Promise<void> => {
  try {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `resourceflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validate import data
export const validateImportData = (data: any): ImportData => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if data has required structure
  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format');
    return { data: data as ExportData, validation: { isValid: false, errors, warnings } };
  }
  
  // Check required fields
  const requiredFields = ['teamMembers', 'projects', 'holidays', 'vacations', 'projectAllocations', 'settings'];
  requiredFields.forEach(field => {
    if (!Array.isArray(data[field])) {
      errors.push(`Missing or invalid ${field} array`);
    }
  });
  
  // Check version compatibility
  if (data.version && data.version !== '1.0.0') {
    warnings.push(`Data version ${data.version} may not be compatible with current version 1.0.0`);
  }
  
  // Validate team members
  if (Array.isArray(data.teamMembers)) {
    data.teamMembers.forEach((member: any, index: number) => {
      if (!member.name || !member.role || !member.country) {
        errors.push(`Team member at index ${index} is missing required fields`);
      }
    });
  }
  
  // Validate projects
  if (Array.isArray(data.projects)) {
    data.projects.forEach((project: any, index: number) => {
      if (!project.name) {
        errors.push(`Project at index ${index} is missing name`);
      }
    });
  }
  
  // Validate allocations
  if (Array.isArray(data.projectAllocations)) {
    data.projectAllocations.forEach((allocation: any, index: number) => {
      if (!allocation.employeeId || !allocation.projectId) {
        errors.push(`Allocation at index ${index} is missing required fields`);
      }
    });
  }
  
  return {
    data: data as ExportData,
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  };
};

// Import data from JSON file
export const importData = async (file: File): Promise<ImportData> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return validateImportData(data);
  } catch (error) {
    return {
      data: {} as ExportData,
      validation: {
        isValid: false,
        errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      }
    };
  }
};

// Get data statistics
export const getDataStats = async (): Promise<{
  teamMembers: number;
  projects: number;
  holidays: number;
  vacations: number;
  allocations: number;
  totalRecords: number;
}> => {
  try {
    const [members, projects, holidays, vacations, allocations] = await Promise.all([
      teamMembersApi.getAll(),
      projectsApi.getAll(),
      holidaysApi.getAll(),
      vacationsApi.getAll(),
      projectAllocationsApi.getAll()
    ]);
    
    return {
      teamMembers: members.length,
      projects: projects.length,
      holidays: holidays.length,
      vacations: vacations.length,
      allocations: allocations.length,
      totalRecords: members.length + projects.length + holidays.length + vacations.length + allocations.length
    };
  } catch (error) {
    throw new Error(`Failed to get data statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create data summary for reporting
export const createDataSummary = async (): Promise<{
  summary: string;
  details: Record<string, any>;
}> => {
  try {
    const stats = await getDataStats();
    const settings = await settingsApi.getAll();
    
    const summary = `ResourceFlow Data Summary:
- Team Members: ${stats.teamMembers}
- Projects: ${stats.projects}
- Holidays: ${stats.holidays}
- Vacations: ${stats.vacations}
- Allocations: ${stats.allocations}
- Total Records: ${stats.totalRecords}
- Settings: Buffer ${settings.buffer}%, Canada ${settings.canadaHours}h, Brazil ${settings.brazilHours}h`;
    
    return {
      summary,
      details: {
        stats,
        settings,
        exportDate: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`Failed to create data summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 