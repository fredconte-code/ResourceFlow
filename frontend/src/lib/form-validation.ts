import { toast } from "@/hooks/use-toast";
import { isDateRangeValid } from "./date-utils";

export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const VALIDATION_RULES = {
  required: (fieldName: string): ValidationRule => ({
    test: (value: any) => value !== null && value !== undefined && value !== '',
    message: `${fieldName} is required.`
  }),
  
  dateRange: (startDate: Date, endDate: Date): ValidationRule => ({
    test: () => isDateRangeValid(startDate, endDate),
    message: "Start date must be before end date."
  }),
  
  positiveNumber: (fieldName: string): ValidationRule => ({
    test: (value: number) => value > 0,
    message: `${fieldName} must be a positive number.`
  }),
  
  numberRange: (min: number, max: number, fieldName: string): ValidationRule => ({
    test: (value: number) => value >= min && value <= max,
    message: `${fieldName} must be between ${min} and ${max}.`
  }),

  minLength: (min: number, fieldName: string): ValidationRule => ({
    test: (value: string) => value.length >= min,
    message: `${fieldName} must be at least ${min} characters long.`
  }),

  maxLength: (max: number, fieldName: string): ValidationRule => ({
    test: (value: string) => value.length <= max,
    message: `${fieldName} must be no more than ${max} characters long.`
  }),

  email: (fieldName: string): ValidationRule => ({
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: `${fieldName} must be a valid email address.`
  }),

  url: (fieldName: string): ValidationRule => ({
    test: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: `${fieldName} must be a valid URL.`
  })
};

export const validateForm = (rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.test(rule.value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAndShowToast = (rules: ValidationRule[]): boolean => {
  const result = validateForm(rules);
  
  if (!result.isValid) {
    toast({
      title: "Validation Error",
      description: result.errors[0], // Show first error
      variant: "destructive"
    });
    return false;
  }
  
  return true;
};

// Convenience functions for common validations
export const validateRequired = (value: any, fieldName: string): boolean => {
  return validateAndShowToast([VALIDATION_RULES.required(fieldName)]);
};

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return validateAndShowToast([VALIDATION_RULES.dateRange(startDate, endDate)]);
};

export const validatePositiveNumber = (value: number, fieldName: string): boolean => {
  return validateAndShowToast([VALIDATION_RULES.positiveNumber(fieldName)]);
};

export const validateNumberRange = (value: number, min: number, max: number, fieldName: string): boolean => {
  return validateAndShowToast([VALIDATION_RULES.numberRange(min, max, fieldName)]);
};

// Form validation helpers
export const createFormValidator = <T extends Record<string, any>>(validationSchema: Record<keyof T, ValidationRule[]>) => {
  return (formData: T): ValidationResult => {
    const allRules: ValidationRule[] = [];
    
    Object.entries(validationSchema).forEach(([field, rules]) => {
      rules.forEach(rule => {
        allRules.push({
          ...rule,
          test: (value: any) => rule.test(formData[field as keyof T])
        });
      });
    });
    
    return validateForm(allRules);
  };
}; 