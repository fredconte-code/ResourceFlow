export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SaveResult<T = any> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Team Member validation
export const validateTeamMember = (member: Partial<any>): ValidationResult => {
  const errors: string[] = [];
  
  if (!member.name?.trim()) {
    errors.push('Name is required');
  } else if (member.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (member.name.trim().length > 100) {
    errors.push('Name must be less than 100 characters');
  }
  
  if (!member.role?.trim()) {
    errors.push('Role is required');
  } else if (member.role.trim().length < 2) {
    errors.push('Role must be at least 2 characters long');
  } else if (member.role.trim().length > 50) {
    errors.push('Role must be less than 50 characters');
  }
  
  if (!['Canada', 'Brazil'].includes(member.country || '')) {
    errors.push('Country must be Canada or Brazil');
  }
  
  if (member.allocatedHours !== undefined) {
    const hours = Number(member.allocatedHours);
    if (isNaN(hours) || hours < 0) {
      errors.push('Allocated hours must be a positive number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Project validation
export const validateProject = (project: Partial<any>): ValidationResult => {
  const errors: string[] = [];
  
  if (!project.name?.trim()) {
    errors.push('Project name is required');
  } else if (project.name.trim().length < 2) {
    errors.push('Project name must be at least 2 characters long');
  } else if (project.name.trim().length > 100) {
    errors.push('Project name must be less than 100 characters');
  }
  
  if (project.startDate && project.endDate) {
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    
    if (isNaN(start.getTime())) {
      errors.push('Start date must be a valid date');
    } else if (isNaN(end.getTime())) {
      errors.push('End date must be a valid date');
    } else if (start >= end) {
      errors.push('End date must be after start date');
    }
  }
  
  if (project.color && !/^#[0-9A-F]{6}$/i.test(project.color)) {
    errors.push('Color must be a valid hex color (e.g., #3b82f6)');
  }
  
  if (project.status && !['active', 'on_hold', 'finished', 'cancelled'].includes(project.status)) {
    errors.push('Status must be active, on_hold, finished, or cancelled');
  }
  
  if (project.allocatedHours !== undefined) {
    const hours = Number(project.allocatedHours);
    if (isNaN(hours) || hours < 0) {
      errors.push('Allocated hours must be a positive number');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Allocation validation
export const validateAllocation = (allocation: Partial<any>): ValidationResult => {
  const errors: string[] = [];
  
  if (!allocation.employeeId) {
    errors.push('Employee is required');
  }
  
  if (!allocation.projectId) {
    errors.push('Project is required');
  }
  
  if (!allocation.startDate) {
    errors.push('Start date is required');
  } else if (isNaN(new Date(allocation.startDate).getTime())) {
    errors.push('Start date must be a valid date');
  }
  
  if (!allocation.endDate) {
    errors.push('End date is required');
  } else if (isNaN(new Date(allocation.endDate).getTime())) {
    errors.push('End date must be a valid date');
  }
  
  if (allocation.startDate && allocation.endDate) {
    const start = new Date(allocation.startDate);
    const end = new Date(allocation.endDate);
    
    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }
  
  if (allocation.hoursPerDay !== undefined) {
    const hours = Number(allocation.hoursPerDay);
    if (isNaN(hours) || hours < 0) {
      errors.push('Hours per day must be a positive number');
    } else if (hours > 24) {
      errors.push('Hours per day cannot exceed 24');
    }
  }
  
  if (allocation.status && !['active', 'completed', 'cancelled'].includes(allocation.status)) {
    errors.push('Status must be active, completed, or cancelled');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Holiday validation
export const validateHoliday = (holiday: Partial<any>): ValidationResult => {
  const errors: string[] = [];
  
  if (!holiday.name?.trim()) {
    errors.push('Holiday name is required');
  } else if (holiday.name.trim().length < 2) {
    errors.push('Holiday name must be at least 2 characters long');
  } else if (holiday.name.trim().length > 100) {
    errors.push('Holiday name must be less than 100 characters');
  }
  
  if (!holiday.date) {
    errors.push('Holiday date is required');
  } else if (isNaN(new Date(holiday.date).getTime())) {
    errors.push('Holiday date must be a valid date');
  }
  
  if (!['Canada', 'Brazil', 'Both'].includes(holiday.country || '')) {
    errors.push('Country must be Canada, Brazil, or Both');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Vacation validation
export const validateVacation = (vacation: Partial<any>): ValidationResult => {
  const errors: string[] = [];
  
  if (!vacation.employee_id) {
    errors.push('Employee is required');
  }
  
  if (!vacation.employee_name?.trim()) {
    errors.push('Employee name is required');
  }
  
  if (!vacation.start_date) {
    errors.push('Start date is required');
  } else if (isNaN(new Date(vacation.start_date).getTime())) {
    errors.push('Start date must be a valid date');
  }
  
  if (!vacation.end_date) {
    errors.push('End date is required');
  } else if (isNaN(new Date(vacation.end_date).getTime())) {
    errors.push('End date must be a valid date');
  }
  
  if (vacation.start_date && vacation.end_date) {
    const start = new Date(vacation.start_date);
    const end = new Date(vacation.end_date);
    
    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }
  
  if (vacation.type && !['Vacation', 'Sick Leave', 'Compensation', 'Personal'].includes(vacation.type)) {
    errors.push('Type must be Vacation, Sick Leave, Compensation, or Personal');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Settings validation
export const validateSettings = (settings: Partial<any>): ValidationResult => {
  const errors: string[] = [];
  
  if (settings.buffer !== undefined) {
    const buffer = Number(settings.buffer);
    if (isNaN(buffer) || buffer < 0) {
      errors.push('Buffer must be a positive number');
    } else if (buffer > 100) {
      errors.push('Buffer cannot exceed 100%');
    }
  }
  
  if (settings.canadaHours !== undefined) {
    const hours = Number(settings.canadaHours);
    if (isNaN(hours) || hours <= 0) {
      errors.push('Canada hours must be a positive number');
    } else if (hours > 168) { // 7 days * 24 hours
      errors.push('Canada hours cannot exceed 168 hours per week');
    }
  }
  
  if (settings.brazilHours !== undefined) {
    const hours = Number(settings.brazilHours);
    if (isNaN(hours) || hours <= 0) {
      errors.push('Brazil hours must be a positive number');
    } else if (hours > 168) { // 7 days * 24 hours
      errors.push('Brazil hours cannot exceed 168 hours per week');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generic validation helper
export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return {
      isValid: false,
      errors: [`${fieldName} is required`]
    };
  }
  return {
    isValid: true,
    errors: []
  };
};

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errors: ['Email must be a valid email address']
    };
  }
  return {
    isValid: true,
    errors: []
  };
};

export const validateDateRange = (startDate: Date, endDate: Date): ValidationResult => {
  if (startDate >= endDate) {
    return {
      isValid: false,
      errors: ['End date must be after start date']
    };
  }
  return {
    isValid: true,
    errors: []
  };
}; 