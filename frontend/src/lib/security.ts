import DOMPurify from 'dompurify';

// ============================================================================
// INPUT SANITIZATION & VALIDATION
// ============================================================================

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedSchemes?: string[];
  stripHtml?: boolean;
  maxLength?: number;
  allowScripts?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (
  input: string,
  options: SanitizationOptions = {}
): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    allowedTags = [],
    allowedAttributes = [],
    allowedSchemes = ['http', 'https', 'mailto'],
    stripHtml = true,
    maxLength = 1000,
    allowScripts = false
  } = options;

  // Truncate if too long
  let sanitized = input.slice(0, maxLength);

  if (stripHtml) {
    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Use DOMPurify for HTML sanitization
    const purifyConfig = {
      ALLOWED_TAGS: allowScripts ? allowedTags : [],
      ALLOWED_ATTR: allowedAttributes,
      ALLOWED_URI_REGEXP: new RegExp(
        `^(${allowedSchemes.join('|')}):`,
        'i'
      ),
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
    };

    sanitized = DOMPurify.sanitize(sanitized, purifyConfig);
  }

  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
};

/**
 * Validate and sanitize email addresses
 */
export const sanitizeEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, sanitizedValue: '', errors };
  }

  const sanitized = sanitizeInput(email, { stripHtml: true, maxLength: 254 });
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors
  };
};

/**
 * Validate and sanitize names
 */
export const sanitizeName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name) {
    errors.push('Name is required');
    return { isValid: false, sanitizedValue: '', errors };
  }

  const sanitized = sanitizeInput(name, { stripHtml: true, maxLength: 100 });
  
  if (sanitized.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (sanitized.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(sanitized)) {
    errors.push('Name contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors
  };
};

/**
 * Validate and sanitize dates
 */
export const sanitizeDate = (date: string | Date): ValidationResult => {
  const errors: string[] = [];
  
  if (!date) {
    errors.push('Date is required');
    return { isValid: false, sanitizedValue: '', errors };
  }

  let sanitized: string;
  
  if (date instanceof Date) {
    sanitized = date.toISOString().split('T')[0];
  } else {
    sanitized = sanitizeInput(date, { stripHtml: true, maxLength: 10 });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(sanitized)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  } else {
    const parsedDate = new Date(sanitized);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid date');
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors
  };
};

/**
 * Validate and sanitize numeric input
 */
export const sanitizeNumber = (
  value: string | number,
  options: { min?: number; max?: number; allowDecimals?: boolean } = {}
): ValidationResult => {
  const errors: string[] = [];
  const { min, max, allowDecimals = true } = options;
  
  if (value === null || value === undefined || value === '') {
    errors.push('Number is required');
    return { isValid: false, sanitizedValue: '', errors };
  }

  const sanitized = sanitizeInput(String(value), { stripHtml: true, maxLength: 20 });
  
  const numberRegex = allowDecimals ? /^-?\d*\.?\d+$/ : /^-?\d+$/;
  if (!numberRegex.test(sanitized)) {
    errors.push('Invalid number format');
  } else {
    const num = parseFloat(sanitized);
    if (isNaN(num)) {
      errors.push('Invalid number');
    } else {
      if (min !== undefined && num < min) {
        errors.push(`Number must be at least ${min}`);
      }
      if (max !== undefined && num > max) {
        errors.push(`Number must be at most ${max}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitized,
    errors
  };
};

// ============================================================================
// XSS PROTECTION
// ============================================================================

/**
 * Escape HTML to prevent XSS
 */
export const escapeHtml = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Safe innerHTML with sanitization
 */
export const safeInnerHTML = (html: string, options: SanitizationOptions = {}): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options.allowedTags || [],
    ALLOWED_ATTR: options.allowedAttributes || [],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });
};

/**
 * Validate and sanitize JSON data
 */
export const sanitizeJson = (jsonString: string): ValidationResult => {
  const errors: string[] = [];
  
  try {
    const sanitized = sanitizeInput(jsonString, { stripHtml: true, maxLength: 10000 });
    const parsed = JSON.parse(sanitized);
    
    // Recursively sanitize object values
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeInput(obj, { stripHtml: true });
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[sanitizeInput(key, { stripHtml: true })] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    const sanitizedData = sanitizeObject(parsed);
    
    return {
      isValid: true,
      sanitizedValue: JSON.stringify(sanitizedData),
      errors: []
    };
  } catch (error) {
    errors.push('Invalid JSON format');
    return {
      isValid: false,
      sanitizedValue: '',
      errors
    };
  }
};

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate CSRF token
 */
export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  if (!token || !storedToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  if (token.length !== storedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
  }
  
  return result === 0;
};

// ============================================================================
// SECURE STORAGE
// ============================================================================

/**
 * Secure storage with encryption (basic implementation)
 */
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = 'resourceflow-secure-key';
  
  static setSecureItem(key: string, value: any): void {
    try {
      const sanitizedKey = sanitizeInput(key, { stripHtml: true, maxLength: 50 });
      const sanitizedValue = typeof value === 'string' 
        ? sanitizeInput(value, { stripHtml: true })
        : JSON.stringify(value);
      
      // In a real application, you would encrypt this data
      // For now, we'll use a simple encoding
      const encoded = btoa(sanitizedValue);
      localStorage.setItem(`secure_${sanitizedKey}`, encoded);
    } catch (error) {
      console.error('Error setting secure item:', error);
    }
  }
  
  static getSecureItem<T>(key: string, defaultValue: T): T {
    try {
      const sanitizedKey = sanitizeInput(key, { stripHtml: true, maxLength: 50 });
      const encoded = localStorage.getItem(`secure_${sanitizedKey}`);
      
      if (!encoded) {
        return defaultValue;
      }
      
      const decoded = atob(encoded);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error getting secure item:', error);
      return defaultValue;
    }
  }
  
  static removeSecureItem(key: string): void {
    try {
      const sanitizedKey = sanitizeInput(key, { stripHtml: true, maxLength: 50 });
      localStorage.removeItem(`secure_${sanitizedKey}`);
    } catch (error) {
      console.error('Error removing secure item:', error);
    }
  }
  
  static clearSecureStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('secure_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing secure storage:', error);
    }
  }
}

// ============================================================================
// SECURITY HEADERS & CONFIGURATION
// ============================================================================

/**
 * Security configuration for the application
 */
export const securityConfig = {
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'http://127.0.0.1:3001'],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"]
  },
  
  // Input validation rules
  validation: {
    maxNameLength: 100,
    maxEmailLength: 254,
    maxDescriptionLength: 1000,
    maxProjectNameLength: 200,
    minPasswordLength: 8,
    maxPasswordLength: 128
  },
  
  // Rate limiting
  rateLimit: {
    maxRequestsPerMinute: 100,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  }
};

/**
 * Generate security headers for API requests
 */
export const getSecurityHeaders = (): Record<string, string> => {
  const csrfToken = generateCSRFToken();
  
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-CSRF-Token': csrfToken
  };
};

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Check if a string contains potentially dangerous content
 */
export const containsDangerousContent = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Log security events
 */
export const logSecurityEvent = (event: string, details: any = {}): void => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.warn('Security Event:', securityLog);
  
  // In production, send to security monitoring service
  // sendToSecurityMonitoring(securityLog);
};

/**
 * Validate file uploads
 */
export const validateFileUpload = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): ValidationResult => {
  const errors: string[] = [];
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, sanitizedValue: '', errors };
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeInput(file.name, { stripHtml: true, maxLength: 255 });

  return {
    isValid: errors.length === 0,
    sanitizedValue: sanitizedFilename,
    errors
  };
}; 