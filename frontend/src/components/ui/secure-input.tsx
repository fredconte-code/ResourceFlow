import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeInput, sanitizeName, sanitizeEmail, sanitizeNumber, ValidationResult } from '@/lib/security';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface SecureInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  validationType?: 'text' | 'name' | 'email' | 'number' | 'date';
  validationOptions?: {
    min?: number;
    max?: number;
    allowDecimals?: boolean;
    required?: boolean;
  };
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  onChange?: (value: string, isValid: boolean) => void;
  showValidation?: boolean;
  className?: string;
  errorClassName?: string;
  successClassName?: string;
}

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  (
    {
      validationType = 'text',
      validationOptions = {},
      onValidationChange,
      onChange,
      showValidation = true,
      className,
      errorClassName,
      successClassName,
      value: externalValue,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState<string>('');
    const [validationResult, setValidationResult] = useState<ValidationResult>({
      isValid: true,
      sanitizedValue: '',
      errors: []
    });
    const [isDirty, setIsDirty] = useState(false);

    // Initialize value
    useEffect(() => {
      const initialValue = externalValue !== undefined ? String(externalValue) : String(defaultValue || '');
      setInternalValue(initialValue);
      validateInput(initialValue);
    }, [externalValue, defaultValue]);

    const validateInput = (input: string): ValidationResult => {
      let result: ValidationResult;

      switch (validationType) {
        case 'name':
          result = sanitizeName(input);
          break;
        case 'email':
          result = sanitizeEmail(input);
          break;
        case 'number':
          result = sanitizeNumber(input, validationOptions);
          break;
        case 'date':
          result = { isValid: true, sanitizedValue: input, errors: [] }; // Date validation handled by browser
          break;
        default:
          // Generic text validation
          const sanitized = sanitizeInput(input, { 
            stripHtml: true, 
            maxLength: validationOptions.max || 1000 
          });
          result = {
            isValid: true,
            sanitizedValue: sanitized,
            errors: []
          };
          
          if (validationOptions.required && !sanitized.trim()) {
            result.isValid = false;
            result.errors.push('This field is required');
          }
      }

      setValidationResult(result);
      onValidationChange?.(result.isValid, result.errors);
      return result;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setIsDirty(true);
      
      const result = validateInput(rawValue);
      setInternalValue(result.sanitizedValue);
      
      onChange?.(result.sanitizedValue, result.isValid);
      
      // Update the input value to the sanitized version
      e.target.value = result.sanitizedValue;
    };

    const shouldShowValidation = showValidation && isDirty;
    const hasError = shouldShowValidation && !validationResult.isValid;
    const hasSuccess = shouldShowValidation && validationResult.isValid && internalValue.length > 0;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={validationType === 'email' ? 'email' : validationType === 'number' ? 'number' : validationType === 'date' ? 'date' : 'text'}
          value={internalValue}
          onChange={handleChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasError && "border-red-500 focus-visible:ring-red-500",
            hasSuccess && "border-green-500 focus-visible:ring-green-500",
            className
          )}
          {...props}
        />
        
        {shouldShowValidation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {hasError && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            {hasSuccess && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
        
        {hasError && validationResult.errors.length > 0 && (
          <div className={cn("mt-1 text-sm text-red-500", errorClassName)}>
            {validationResult.errors[0]}
          </div>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

// Specialized secure input components
export const SecureNameInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>(
  (props, ref) => <SecureInput ref={ref} validationType="name" {...props} />
);

export const SecureEmailInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>(
  (props, ref) => <SecureInput ref={ref} validationType="email" {...props} />
);

export const SecureNumberInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>(
  (props, ref) => <SecureInput ref={ref} validationType="number" {...props} />
);

export const SecureDateInput = forwardRef<HTMLInputElement, Omit<SecureInputProps, 'validationType'>>(
  (props, ref) => <SecureInput ref={ref} validationType="date" {...props} />
);

SecureNameInput.displayName = 'SecureNameInput';
SecureEmailInput.displayName = 'SecureEmailInput';
SecureNumberInput.displayName = 'SecureNumberInput';
SecureDateInput.displayName = 'SecureDateInput'; 