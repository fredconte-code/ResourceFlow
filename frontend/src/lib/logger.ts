export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
}

export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isProduction = process.env.NODE_ENV === 'production';
  private static logBuffer: LogEntry[] = [];
  private static maxBufferSize = 100;
  
  static error(message: string, ...args: any[]): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      data: args.length > 0 ? args : undefined
    };
    
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.error(message, ...args);
    }
    
    // In production, send to error tracking service
    if (this.isProduction) {
      this.sendToErrorService(entry);
    }
  }
  
  static warn(message: string, ...args: any[]): void {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      data: args.length > 0 ? args : undefined
    };
    
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.warn(message, ...args);
    }
  }
  
  static info(message: string, ...args: any[]): void {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      data: args.length > 0 ? args : undefined
    };
    
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.info(message, ...args);
    }
  }
  
  static debug(message: string, ...args: any[]): void {
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      data: args.length > 0 ? args : undefined
    };
    
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.debug(message, ...args);
    }
  }
  
  // Performance logging
  static performance(label: string, fn: () => any): any {
    if (this.isDevelopment) {
      console.time(label);
      const result = fn();
      console.timeEnd(label);
      return result;
    }
    return fn();
  }
  
  static performanceAsync(label: string, fn: () => Promise<any>): Promise<any> {
    if (this.isDevelopment) {
      console.time(label);
      return fn().finally(() => console.timeEnd(label));
    }
    return fn();
  }
  
  // Context-aware logging
  static withContext(context: string) {
    return {
      error: (message: string, ...args: any[]) => 
        this.error(`[${context}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => 
        this.warn(`[${context}] ${message}`, ...args),
      info: (message: string, ...args: any[]) => 
        this.info(`[${context}] ${message}`, ...args),
      debug: (message: string, ...args: any[]) => 
        this.debug(`[${context}] ${message}`, ...args)
    };
  }
  
  // API error logging
  static apiError(endpoint: string, error: any, context?: string): void {
    const errorMessage = `API Error [${endpoint}]: ${error.message || error}`;
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      context,
      data: {
        endpoint,
        error: error.message || error,
        status: error.status,
        stack: error.stack
      }
    };
    
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.error(errorMessage, { endpoint, error, context });
    }
    
    if (this.isProduction) {
      this.sendToErrorService(entry);
    }
  }
  
  // Component error logging
  static componentError(componentName: string, error: any, props?: any): void {
    const errorMessage = `Component Error [${componentName}]: ${error.message || error}`;
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      context: componentName,
      data: {
        component: componentName,
        error: error.message || error,
        props,
        stack: error.stack
      }
    };
    
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.error(errorMessage, { component: componentName, error, props });
    }
    
    if (this.isProduction) {
      this.sendToErrorService(entry);
    }
  }
  
  // User action logging
  static userAction(action: string, data?: any): void {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: `User Action: ${action}`,
      timestamp: new Date().toISOString(),
      data
    };
    
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.info(`User Action: ${action}`, data);
    }
  }
  
  // Get log buffer for debugging
  static getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }
  
  // Clear log buffer
  static clearLogBuffer(): void {
    this.logBuffer = [];
  }
  
  // Export logs for debugging
  static exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
  
  private static addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }
  
  private static sendToErrorService(entry: LogEntry): void {
    // In production, send to error tracking service like Sentry
    // Example: Sentry.captureException(new Error(entry.message), { extra: entry });
    
    // For now, just store in buffer
    // In a real implementation, you would send this to your error tracking service
  }
}

// Convenience functions for common logging patterns
export const logApiError = (endpoint: string, error: any, context?: string) => 
  Logger.apiError(endpoint, error, context);

export const logComponentError = (componentName: string, error: any, props?: any) => 
  Logger.componentError(componentName, error, props);

export const logUserAction = (action: string, data?: any) => 
  Logger.userAction(action, data);

// Create context-specific loggers
export const createLogger = (context: string) => Logger.withContext(context); 