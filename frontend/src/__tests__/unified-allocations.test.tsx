import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarView } from '../components/CalendarView';

// Mock the API calls
vi.mock('../lib/api', () => ({
  holidaysApi: {
    getAll: vi.fn().mockResolvedValue([])
  },
  vacationsApi: {
    getAll: vi.fn().mockResolvedValue([])
  },
  projectsApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Test Project 1',
        color: '#3b82f6',
        allocatedHours: 0
      },
      {
        id: 2,
        name: 'Test Project 2',
        color: '#ef4444',
        allocatedHours: 0
      }
    ])
  },
  projectAllocationsApi: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 1,
        employeeId: '1',
        projectId: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        hoursPerDay: 8,
        status: 'active'
      },
      {
        id: 2,
        employeeId: '1',
        projectId: '2',
        startDate: '2024-01-03',
        endDate: '2024-01-07',
        hoursPerDay: 4,
        status: 'active'
      }
    ])
  },
  teamMembersApi: {
    update: vi.fn().mockResolvedValue({})
  }
}));

// Mock the employee data
vi.mock('../lib/employee-data', () => ({
  getCurrentEmployees: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'John Doe',
      role: 'Developer',
      country: 'US',
      allocatedHours: 0
    }
  ])
}));

// Mock the working hours hook
vi.mock('../lib/working-hours', () => ({
  useWorkingHours: vi.fn().mockReturnValue({
    getWorkingHoursForCountry: vi.fn().mockReturnValue(40)
  })
}));

describe('Unified Allocation System', () => {
  it('should render unified allocation rectangles', async () => {
    render(<CalendarView />);
    
    // Wait for the component to load
    await screen.findByText('John Doe');
    
    // Check that the unified allocations are rendered
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('should handle multiple allocations for the same employee', async () => {
    render(<CalendarView />);
    
    // Wait for the component to load
    await screen.findByText('John Doe');
    
    // Both projects should be visible
    const project1 = screen.getByText('Test Project 1');
    const project2 = screen.getByText('Test Project 2');
    
    expect(project1).toBeInTheDocument();
    expect(project2).toBeInTheDocument();
  });
}); 