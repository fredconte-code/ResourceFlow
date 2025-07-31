import { ApiErrorHandler, ApiError, ApiResponse } from './api-error-handler';

export interface ApiClientConfig {
  baseUrl: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export class EnhancedApiClient {
  private baseUrl: string;
  private retryAttempts: number;
  private retryDelay: number;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  
  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.timeout = config.timeout || 10000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers
    };
  }
  
  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {},
    attempt = 1
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...options.headers };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        await ApiErrorHandler.handleError(response);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      if (attempt < this.retryAttempts && ApiErrorHandler.shouldRetry(error)) {
        const delay = ApiErrorHandler.getRetryDelay(attempt, this.retryDelay);
        await this.delay(delay);
        return this.makeRequest(endpoint, options, attempt + 1);
      }
      
      throw error;
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Enhanced API methods with better error handling
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.makeRequest(`${endpoint}${queryString}`);
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
    });
  }
  
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.makeRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  
  // Batch operations
  async batch<T>(operations: Array<{ method: string; endpoint: string; data?: any }>): Promise<T[]> {
    const results = await Promise.allSettled(
      operations.map(op => {
        switch (op.method.toLowerCase()) {
          case 'get':
            return this.get(op.endpoint);
          case 'post':
            return this.post(op.endpoint, op.data);
          case 'put':
            return this.put(op.endpoint, op.data);
          case 'delete':
            return this.delete(op.endpoint);
          case 'patch':
            return this.patch(op.endpoint, op.data);
          default:
            throw new Error(`Unsupported method: ${op.method}`);
        }
      })
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        ApiErrorHandler.logError(result.reason, `Batch operation ${index}`);
        throw result.reason;
      }
    });
  }
  
  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/hello');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Connection test with timeout
  async testConnection(timeoutMs: number = 5000): Promise<{ connected: boolean; latency: number }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      await fetch(`${this.baseUrl}/hello`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const latency = Date.now() - startTime;
      return { connected: true, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      return { connected: false, latency };
    }
  }
}

// Enhanced API client instance for the application
export const apiClient = new EnhancedApiClient({
  baseUrl: 'http://127.0.0.1:3001/api',
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 10000
});

// Enhanced API methods that use the new client
export const enhancedTeamMembersApi = {
  getAll: () => apiClient.get<TeamMember[]>('/team-members'),
  getById: (id: string) => apiClient.get<TeamMember>(`/team-members/${id}`),
  create: (member: Omit<TeamMember, 'id'>) => apiClient.post<TeamMember>('/team-members', member),
  update: (id: string, member: Partial<TeamMember>) => apiClient.put<TeamMember>(`/team-members/${id}`, member),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/team-members/${id}`),
  
  // Batch operations
  createBatch: (members: Omit<TeamMember, 'id'>[]) => 
    apiClient.batch(members.map(member => ({ method: 'POST', endpoint: '/team-members', data: member }))),
  
  updateBatch: (updates: Array<{ id: string; data: Partial<TeamMember> }>) =>
    apiClient.batch(updates.map(({ id, data }) => ({ method: 'PUT', endpoint: `/team-members/${id}`, data })))
};

export const enhancedProjectsApi = {
  getAll: () => apiClient.get<Project[]>('/projects'),
  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  create: (project: Omit<Project, 'id'>) => apiClient.post<Project>('/projects', project),
  update: (id: string, project: Partial<Project>) => apiClient.put<Project>(`/projects/${id}`, project),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/projects/${id}`),
  
  // Search and filter
  search: (query: string) => apiClient.get<Project[]>('/projects', { search: query }),
  filterByStatus: (status: ProjectStatus) => apiClient.get<Project[]>('/projects', { status }),
  
  // Batch operations
  createBatch: (projects: Omit<Project, 'id'>[]) =>
    apiClient.batch(projects.map(project => ({ method: 'POST', endpoint: '/projects', data: project })))
};

export const enhancedAllocationsApi = {
  getAll: () => apiClient.get<ProjectAllocation[]>('/project-allocations'),
  getById: (id: string) => apiClient.get<ProjectAllocation>(`/project-allocations/${id}`),
  create: (allocation: Omit<ProjectAllocation, 'id'>) => apiClient.post<ProjectAllocation>('/project-allocations', allocation),
  update: (id: string, allocation: Partial<ProjectAllocation>) => apiClient.put<ProjectAllocation>(`/project-allocations/${id}`, allocation),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/project-allocations/${id}`),
  
  // Filter by employee or project
  getByEmployee: (employeeId: string) => apiClient.get<ProjectAllocation[]>('/project-allocations', { employeeId }),
  getByProject: (projectId: string) => apiClient.get<ProjectAllocation[]>('/project-allocations', { projectId }),
  
  // Batch operations
  createBatch: (allocations: Omit<ProjectAllocation, 'id'>[]) =>
    apiClient.batch(allocations.map(allocation => ({ method: 'POST', endpoint: '/project-allocations', data: allocation })))
};

// Re-export types for convenience
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  country: 'Canada' | 'Brazil';
  allocatedHours?: number;
}

export interface Project {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  color: string;
  allocatedHours: number;
  status: 'active' | 'on_hold' | 'finished' | 'cancelled';
}

export type ProjectStatus = Project['status'];

export interface ProjectAllocation {
  id: string;
  employeeId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  status: string;
} 