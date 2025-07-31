export interface ApiError {
  error: string;
  message: string;
  details?: string;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  status: number;
  success: boolean;
}

export class ApiErrorHandler {
  static async handleError(response: Response): Promise<never> {
    let errorData: ApiError;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        error: 'Network Error',
        message: 'Failed to connect to server'
      };
    }
    
    const error = new Error(errorData.message);
    (error as any).apiError = errorData;
    (error as any).status = response.status;
    
    throw error;
  }
  
  static getErrorMessage(error: any): string {
    if (error.apiError) {
      return error.apiError.message;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }
  
  static getErrorDetails(error: any): string[] {
    if (error.apiError?.details) {
      return Array.isArray(error.apiError.details) 
        ? error.apiError.details 
        : [error.apiError.details];
    }
    
    return [];
  }
  
  static shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx status codes
    return !error.status || (error.status >= 500 && error.status < 600);
  }
  
  static isNetworkError(error: any): boolean {
    return !error.status || error.message?.includes('Failed to fetch');
  }
  
  static isValidationError(error: any): boolean {
    return error.status === 400 || error.apiError?.error === 'Validation Error';
  }
  
  static isNotFoundError(error: any): boolean {
    return error.status === 404 || error.apiError?.error === 'Not Found';
  }
  
  static isServerError(error: any): boolean {
    return error.status >= 500 && error.status < 600;
  }
  
  static isRateLimitError(error: any): boolean {
    return error.status === 429 || error.apiError?.error === 'Too Many Requests';
  }
  
  static getRetryDelay(attempt: number, baseDelay: number = 1000): number {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 10000); // Max 10 seconds
  }
  
  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.shouldRetry(error) || attempt === maxRetries) {
          throw error;
        }
        
        const delay = this.getRetryDelay(attempt, baseDelay);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static createUserFriendlyMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return 'Unable to connect to server. Please check your internet connection and try again.';
    }
    
    if (this.isValidationError(error)) {
      const details = this.getErrorDetails(error);
      if (details.length > 0) {
        return `Please fix the following issues:\n${details.join('\n')}`;
      }
      return 'Please check your input and try again.';
    }
    
    if (this.isNotFoundError(error)) {
      return 'The requested resource was not found.';
    }
    
    if (this.isServerError(error)) {
      return 'Server is temporarily unavailable. Please try again later.';
    }
    
    if (this.isRateLimitError(error)) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    return this.getErrorMessage(error);
  }
  
  static logError(error: any, context?: string): void {
    const errorInfo = {
      message: error.message,
      status: error.status,
      apiError: error.apiError,
      context,
      timestamp: new Date().toISOString(),
      url: error.url || 'unknown'
    };
    
    console.error('API Error:', errorInfo);
    
    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
} 