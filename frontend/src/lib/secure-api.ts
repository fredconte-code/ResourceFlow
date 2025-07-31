import { 
  sanitizeInput, 
  sanitizeJson, 
  generateCSRFToken, 
  validateCSRFToken, 
  getSecurityHeaders, 
  logSecurityEvent,
  containsDangerousContent,
  SecureStorage
} from './security';

// ============================================================================
// SECURE API CLIENT
// ============================================================================

export interface SecureApiConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableCSRF?: boolean;
  enableRateLimiting?: boolean;
}

export interface SecureApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface SecureApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  success: boolean;
  errors?: string[];
}

export class SecureApiClient {
  private config: SecureApiConfig;
  private csrfToken: string | null = null;
  private requestCount = 0;
  private lastRequestTime = 0;
  private rateLimitWindow = 60000; // 1 minute

  constructor(config: SecureApiConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCSRF: true,
      enableRateLimiting: true,
      ...config
    };
    
    this.initializeCSRF();
  }

  private initializeCSRF(): void {
    if (this.config.enableCSRF) {
      this.csrfToken = generateCSRFToken();
      SecureStorage.setSecureItem('csrf_token', this.csrfToken);
    }
  }

  private validateRateLimit(): boolean {
    if (!this.config.enableRateLimiting) {
      return true;
    }

    const now = Date.now();
    if (now - this.lastRequestTime > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    this.requestCount++;
    
    // Allow 100 requests per minute
    if (this.requestCount > 100) {
      logSecurityEvent('rate_limit_exceeded', {
        requestCount: this.requestCount,
        window: this.rateLimitWindow
      });
      return false;
    }

    return true;
  }

  private sanitizeRequestData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      // Check for dangerous content
      if (containsDangerousContent(data)) {
        logSecurityEvent('dangerous_content_detected', { data });
        throw new Error('Dangerous content detected in request data');
      }
      return sanitizeInput(data, { stripHtml: true });
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeRequestData(item));
    }

    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        const sanitizedKey = sanitizeInput(key, { stripHtml: true, maxLength: 50 });
        sanitized[sanitizedKey] = this.sanitizeRequestData(value);
      }
      return sanitized;
    }

    return data;
  }

  private sanitizeParams(params: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(params)) {
      const sanitizedKey = sanitizeInput(key, { stripHtml: true, maxLength: 50 });
      const sanitizedValue = sanitizeInput(String(value), { stripHtml: true, maxLength: 100 });
      sanitized[sanitizedKey] = sanitizedValue;
    }
    
    return sanitized;
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const sanitizedEndpoint = sanitizeInput(endpoint, { stripHtml: true, maxLength: 200 });
    let url = `${this.config.baseUrl}${sanitizedEndpoint}`;
    
    if (params) {
      const sanitizedParams = this.sanitizeParams(params);
      const searchParams = new URLSearchParams(sanitizedParams);
      url += `?${searchParams.toString()}`;
    }
    
    return url;
  }

  private async makeRequest<T>(request: SecureApiRequest): Promise<SecureApiResponse<T>> {
    // Validate rate limiting
    if (!this.validateRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Sanitize request data
    const sanitizedData = request.data ? this.sanitizeRequestData(request.data) : undefined;
    
    // Build URL
    const url = this.buildUrl(request.endpoint, request.params);
    
    // Prepare headers
    const headers = {
      ...getSecurityHeaders(),
      ...request.headers
    };

    // Add CSRF token if enabled
    if (this.config.enableCSRF && this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    // Prepare request options
    const options: RequestInit = {
      method: request.method,
      headers,
      timeout: request.timeout || this.config.timeout
    };

    // Add body for non-GET requests
    if (sanitizedData && request.method !== 'GET') {
      options.body = JSON.stringify(sanitizedData);
    }

    try {
      const response = await fetch(url, options);
      
      // Validate CSRF token in response if enabled
      if (this.config.enableCSRF) {
        const responseCSRFToken = response.headers.get('X-CSRF-Token');
        if (responseCSRFToken && this.csrfToken) {
          if (!validateCSRFToken(responseCSRFToken, this.csrfToken)) {
            logSecurityEvent('csrf_token_mismatch', {
              received: responseCSRFToken,
              expected: this.csrfToken
            });
            throw new Error('CSRF token validation failed');
          }
        }
      }

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const jsonText = await response.text();
        const jsonResult = sanitizeJson(jsonText);
        
        if (!jsonResult.isValid) {
          throw new Error('Invalid JSON response');
        }
        
        data = JSON.parse(jsonResult.sanitizedValue);
      } else {
        const text = await response.text();
        data = sanitizeInput(text, { stripHtml: true }) as T;
      }

      return {
        data,
        status: response.status,
        headers: response.headers,
        success: response.ok,
        errors: response.ok ? undefined : [response.statusText]
      };

    } catch (error) {
      logSecurityEvent('api_request_failed', {
        url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  private async retryRequest<T>(request: SecureApiRequest, attempt: number = 1): Promise<SecureApiResponse<T>> {
    try {
      return await this.makeRequest<T>(request);
    } catch (error) {
      if (attempt < this.config.retryAttempts!) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay! * attempt));
        return this.retryRequest<T>(request, attempt + 1);
      }
      throw error;
    }
  }

  // Public API methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<SecureApiResponse<T>> {
    return this.retryRequest<T>({ endpoint, method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: any): Promise<SecureApiResponse<T>> {
    return this.retryRequest<T>({ endpoint, method: 'POST', data });
  }

  async put<T>(endpoint: string, data?: any): Promise<SecureApiResponse<T>> {
    return this.retryRequest<T>({ endpoint, method: 'PUT', data });
  }

  async delete<T>(endpoint: string): Promise<SecureApiResponse<T>> {
    return this.retryRequest<T>({ endpoint, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<SecureApiResponse<T>> {
    return this.retryRequest<T>({ endpoint, method: 'PATCH', data });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/api/hello');
      return response.success;
    } catch {
      return false;
    }
  }

  // Refresh CSRF token
  refreshCSRFToken(): void {
    if (this.config.enableCSRF) {
      this.initializeCSRF();
    }
  }

  // Get current rate limit status
  getRateLimitStatus(): { current: number; limit: number; window: number } {
    return {
      current: this.requestCount,
      limit: 100,
      window: this.rateLimitWindow
    };
  }
}

// ============================================================================
// SECURE API INSTANCES
// ============================================================================

export const secureApiClient = new SecureApiClient({
  baseUrl: 'http://127.0.0.1:3001/api',
  enableCSRF: true,
  enableRateLimiting: true,
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
});

// ============================================================================
// SECURE API WRAPPERS FOR EXISTING ENDPOINTS
// ============================================================================

export const secureTeamMembersApi = {
  getAll: () => secureApiClient.get('/team-members'),
  create: (data: any) => secureApiClient.post('/team-members', data),
  update: (id: string, data: any) => secureApiClient.put(`/team-members/${id}`, data),
  delete: (id: string) => secureApiClient.delete(`/team-members/${id}`)
};

export const secureProjectsApi = {
  getAll: () => secureApiClient.get('/projects'),
  create: (data: any) => secureApiClient.post('/projects', data),
  update: (id: string, data: any) => secureApiClient.put(`/projects/${id}`, data),
  delete: (id: string) => secureApiClient.delete(`/projects/${id}`)
};

export const secureAllocationsApi = {
  getAll: () => secureApiClient.get('/project-allocations'),
  create: (data: any) => secureApiClient.post('/project-allocations', data),
  update: (id: string, data: any) => secureApiClient.put(`/project-allocations/${id}`, data),
  delete: (id: string) => secureApiClient.delete(`/project-allocations/${id}`)
};

export const secureHolidaysApi = {
  getAll: () => secureApiClient.get('/holidays'),
  create: (data: any) => secureApiClient.post('/holidays', data),
  delete: (id: string) => secureApiClient.delete(`/holidays/${id}`)
};

export const secureVacationsApi = {
  getAll: () => secureApiClient.get('/vacations'),
  create: (data: any) => secureApiClient.post('/vacations', data),
  delete: (id: string) => secureApiClient.delete(`/vacations/${id}`)
};

export const secureSettingsApi = {
  get: () => secureApiClient.get('/settings'),
  update: (data: any) => secureApiClient.put('/settings', data)
};

export const secureDataApi = {
  export: () => secureApiClient.get('/export'),
  import: (data: any) => secureApiClient.post('/import', data)
}; 