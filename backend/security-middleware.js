const crypto = require('crypto');

// ============================================================================
// INPUT SANITIZATION & VALIDATION
// ============================================================================

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
const sanitizeInput = (input, options = {}) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const {
    stripHtml = true,
    maxLength = 1000,
    allowScripts = false
  } = options;

  // Truncate if too long
  let sanitized = input.slice(0, maxLength);

  if (stripHtml) {
    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (!email) return { isValid: false, error: 'Email is required' };
  
  const sanitized = sanitizeInput(email, { stripHtml: true, maxLength: 254 });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate name format
 */
const validateName = (name) => {
  if (!name) return { isValid: false, error: 'Name is required' };
  
  const sanitized = sanitizeInput(name, { stripHtml: true, maxLength: 100 });
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(sanitized)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate date format
 */
const validateDate = (date) => {
  if (!date) return { isValid: false, error: 'Date is required' };
  
  const sanitized = sanitizeInput(date, { stripHtml: true, maxLength: 10 });
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
  }
  
  const parsedDate = new Date(sanitized);
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate numeric input
 */
const validateNumber = (value, options = {}) => {
  const { min, max, allowDecimals = true } = options;
  
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: 'Number is required' };
  }
  
  const sanitized = sanitizeInput(String(value), { stripHtml: true, maxLength: 20 });
  const numberRegex = allowDecimals ? /^-?\d*\.?\d+$/ : /^-?\d+$/;
  
  if (!numberRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid number format' };
  }
  
  const num = parseFloat(sanitized);
  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid number' };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `Number must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Number must be at most ${max}` };
  }
  
  return { isValid: true, sanitized: num };
};

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate CSRF token with timing-safe comparison
 */
const validateCSRFToken = (token, storedToken) => {
  if (!token || !storedToken) {
    return false;
  }
  
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
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none'"
  );
  
  // Other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  next();
};

/**
 * CSRF protection middleware
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'];
  const storedToken = req.session?.csrfToken;
  
  if (!token || !storedToken) {
    return res.status(403).json({ error: 'CSRF token missing' });
  }
  
  if (!validateCSRFToken(token, storedToken)) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  
  next();
};

/**
 * Rate limiting middleware
 */
const rateLimit = (() => {
  const requests = new Map();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 0, resetTime: now + windowMs });
    }
    
    const record = requests.get(ip);
    
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    
    record.count++;
    
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    next();
  };
})();

/**
 * Input validation middleware
 */
const validateInput = (validationRules) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate body
    if (req.body) {
      for (const [field, rules] of Object.entries(validationRules)) {
        const value = req.body[field];
        
        if (rules.required && (!value || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }
        
        if (value) {
          let validation;
          
          switch (rules.type) {
            case 'email':
              validation = validateEmail(value);
              break;
            case 'name':
              validation = validateName(value);
              break;
            case 'date':
              validation = validateDate(value);
              break;
            case 'number':
              validation = validateNumber(value, rules);
              break;
            case 'string':
              validation = { 
                isValid: true, 
                sanitized: sanitizeInput(value, { 
                  stripHtml: true, 
                  maxLength: rules.maxLength || 1000 
                }) 
              };
              break;
            default:
              validation = { isValid: true, sanitized: value };
          }
          
          if (!validation.isValid) {
            errors.push(validation.error);
          } else {
            req.body[field] = validation.sanitized;
          }
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }
    
    next();
  };
};

/**
 * SQL injection protection middleware
 */
const sqlInjectionProtection = (req, res, next) => {
  const dangerousPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,
    /(--|\/\*|\*\/|xp_|sp_)/i,
    /(\b(and|or)\b\s+\d+\s*=\s*\d+)/i,
    /(\b(and|or)\b\s+['"]\w+['"]\s*=\s*['"]\w+['"])/i
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};

/**
 * XSS protection middleware
 */
const xssProtection = (req, res, next) => {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({ error: 'XSS attack detected' });
  }
  
  next();
};

/**
 * Log security events
 */
const logSecurityEvent = (event, details = {}) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: details.userAgent || 'unknown',
    ip: details.ip || 'unknown'
  };
  
  console.warn('Security Event:', securityLog);
  
  // In production, send to security monitoring service
  // sendToSecurityMonitoring(securityLog);
};

/**
 * Comprehensive security middleware
 */
const securityMiddleware = {
  // Apply all security measures
  all: (req, res, next) => {
    securityHeaders(req, res, () => {
      rateLimit(req, res, () => {
        sqlInjectionProtection(req, res, () => {
          xssProtection(req, res, next);
        });
      });
    });
  },
  
  // Individual middleware
  headers: securityHeaders,
  csrf: csrfProtection,
  rateLimit,
  validateInput,
  sqlInjection: sqlInjectionProtection,
  xss: xssProtection
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

const validationRules = {
  teamMember: {
    name: { type: 'name', required: true },
    role: { type: 'string', required: true, maxLength: 100 },
    country: { type: 'string', required: true, maxLength: 50 },
    allocated_hours: { type: 'number', min: 0, max: 168 }
  },
  
  project: {
    name: { type: 'string', required: true, maxLength: 200 },
    start_date: { type: 'date', required: true },
    end_date: { type: 'date', required: true },
    color: { type: 'string', maxLength: 7 },
    status: { type: 'string', maxLength: 20 }
  },
  
  holiday: {
    name: { type: 'string', required: true, maxLength: 100 },
    date: { type: 'date', required: true },
    country: { type: 'string', required: true, maxLength: 50 }
  },
  
  vacation: {
    employee_id: { type: 'string', required: true, maxLength: 50 },
    employee_name: { type: 'name', required: true },
    start_date: { type: 'date', required: true },
    end_date: { type: 'date', required: true },
    type: { type: 'string', maxLength: 20 }
  },
  
  allocation: {
    employee_id: { type: 'string', required: true, maxLength: 50 },
    project_id: { type: 'string', required: true, maxLength: 50 },
    start_date: { type: 'date', required: true },
    end_date: { type: 'date', required: true },
    hours_per_day: { type: 'number', min: 0, max: 24, allowDecimals: true }
  },
  
  settings: {
    buffer: { type: 'number', min: 0, max: 100 },
    canadaHours: { type: 'number', min: 0, max: 168 },
    brazilHours: { type: 'number', min: 0, max: 168 }
  }
};

module.exports = {
  sanitizeInput,
  validateEmail,
  validateName,
  validateDate,
  validateNumber,
  generateCSRFToken,
  validateCSRFToken,
  securityMiddleware,
  validateInput,
  validationRules,
  logSecurityEvent
}; 