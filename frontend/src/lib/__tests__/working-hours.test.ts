import { describe, it, expect, beforeEach } from 'vitest';
import {
  getWorkingHoursForCountry,
  calculateAvailableHours,
  calculateBufferHours,
  calculateAvailableHoursForEmployee,
  calculateAllocatedHoursForEmployee,
  calculateTimeOffDays,
  calculateAllocationPercentage,
  calculateActualAvailableHours,
  getMonthlyHours,
  getDailyHours,
  DEFAULT_WORKING_HOURS,
  DEFAULT_BUFFER_TIME,
  WorkingHoursSettings,
  CalculationContext
} from '../working-hours';
import { Employee } from '../employee-data';
import { Holiday, Vacation, ProjectAllocation } from '../api';

describe('Working Hours Calculations', () => {
  let mockSettings: WorkingHoursSettings;
  let mockEmployee: Employee;
  let mockHolidays: Holiday[];
  let mockVacations: Vacation[];
  let mockAllocations: ProjectAllocation[];

  beforeEach(() => {
    mockSettings = {
      canadaHours: 37.5,
      brazilHours: 44,
      buffer: 20
    };

    mockEmployee = {
      id: '1',
      name: 'John Doe',
      role: 'Developer',
      country: 'Canada',
      allocatedHours: 120,
      availableHours: 150,
      vacationDays: 5,
      holidayDays: 2
    };

    mockHolidays = [
      {
        id: 1,
        name: 'Christmas',
        date: '2024-12-25',
        country: 'Both'
      },
      {
        id: 2,
        name: 'Canada Day',
        date: '2024-07-01',
        country: 'Canada'
      }
    ];

    mockVacations = [
      {
        id: 1,
        employeeId: '1',
        employeeName: 'John Doe',
        startDate: '2024-06-01',
        endDate: '2024-06-05',
        type: 'Vacation',
        notes: 'Summer vacation'
      }
    ];

    mockAllocations = [
      {
        id: 1,
        employeeId: '1',
        projectId: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        hoursPerDay: 8,
        status: 'active'
      }
    ];
  });

  describe('getWorkingHoursForCountry', () => {
    it('should return default Canada hours when no custom hours provided', () => {
      const result = getWorkingHoursForCountry('Canada');
      expect(result).toBe(DEFAULT_WORKING_HOURS.CANADA);
    });

    it('should return default Brazil hours when no custom hours provided', () => {
      const result = getWorkingHoursForCountry('Brazil');
      expect(result).toBe(DEFAULT_WORKING_HOURS.BRAZIL);
    });

    it('should return custom hours when provided', () => {
      const result = getWorkingHoursForCountry('Canada', 40);
      expect(result).toBe(40);
    });

    it('should return custom hours for Brazil when provided', () => {
      const result = getWorkingHoursForCountry('Brazil', 45);
      expect(result).toBe(45);
    });
  });

  describe('calculateAvailableHours', () => {
    it('should calculate available hours with buffer', () => {
      const totalHours = 100;
      const bufferPercentage = 20;
      const result = calculateAvailableHours(totalHours, bufferPercentage);
      expect(result).toBe(80); // 100 - (100 * 0.2)
    });

    it('should handle zero buffer', () => {
      const totalHours = 100;
      const bufferPercentage = 0;
      const result = calculateAvailableHours(totalHours, bufferPercentage);
      expect(result).toBe(100);
    });

    it('should handle 100% buffer', () => {
      const totalHours = 100;
      const bufferPercentage = 100;
      const result = calculateAvailableHours(totalHours, bufferPercentage);
      expect(result).toBe(0);
    });
  });

  describe('calculateBufferHours', () => {
    it('should calculate buffer hours correctly', () => {
      const totalHours = 100;
      const bufferPercentage = 20;
      const result = calculateBufferHours(totalHours, bufferPercentage);
      expect(result).toBe(20); // 100 * 0.2
    });

    it('should handle zero buffer', () => {
      const totalHours = 100;
      const bufferPercentage = 0;
      const result = calculateBufferHours(totalHours, bufferPercentage);
      expect(result).toBe(0);
    });
  });

  describe('calculateAvailableHoursForEmployee', () => {
    it('should calculate complete employee availability', () => {
      const context: CalculationContext = {
        settings: mockSettings,
        holidays: mockHolidays,
        vacations: mockVacations,
        allocations: mockAllocations
      };

      const result = calculateAvailableHoursForEmployee(mockEmployee, context);

      expect(result).toHaveProperty('totalHours');
      expect(result).toHaveProperty('allocatedHours');
      expect(result).toHaveProperty('availableHours');
      expect(result).toHaveProperty('bufferHours');
      expect(result).toHaveProperty('vacationDays');
      expect(result).toHaveProperty('holidayDays');
      expect(result).toHaveProperty('utilizationPercentage');

      // Canada employee: 37.5 hours/week * 4 weeks = 150 total hours
      expect(result.totalHours).toBe(150);
      
      // Buffer: 150 * 0.2 = 30 hours
      expect(result.bufferHours).toBe(30);
      
      // Available: 150 - 30 = 120 hours
      expect(result.availableHours).toBe(120);
    });

    it('should handle Brazil employee correctly', () => {
      const brazilEmployee: Employee = {
        ...mockEmployee,
        country: 'Brazil'
      };

      const context: CalculationContext = {
        settings: mockSettings,
        holidays: mockHolidays,
        vacations: mockVacations,
        allocations: mockAllocations
      };

      const result = calculateAvailableHoursForEmployee(brazilEmployee, context);

      // Brazil employee: 44 hours/week * 4 weeks = 176 total hours
      expect(result.totalHours).toBe(176);
      
      // Buffer: 176 * 0.2 = 35.2 hours
      expect(result.bufferHours).toBe(35.2);
      
      // Available: 176 - 35.2 = 140.8 hours
      expect(result.availableHours).toBe(140.8);
    });

    it('should calculate for specific date range', () => {
      const context: CalculationContext = {
        settings: mockSettings,
        holidays: mockHolidays,
        vacations: mockVacations,
        allocations: mockAllocations,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      };

      const result = calculateAvailableHoursForEmployee(mockEmployee, context);

      // 31 days = ~4.4 weeks
      const expectedWeeks = Math.ceil(31 / 7);
      const expectedTotalHours = 37.5 * expectedWeeks;
      
      expect(result.totalHours).toBe(expectedTotalHours);
    });
  });

  describe('calculateAllocatedHoursForEmployee', () => {
    it('should calculate allocated hours for employee', () => {
      const result = calculateAllocatedHoursForEmployee(mockEmployee, mockAllocations);
      
      // 31 days * 8 hours/day = 248 hours
      expect(result).toBe(248);
    });

    it('should handle no allocations', () => {
      const result = calculateAllocatedHoursForEmployee(mockEmployee, []);
      expect(result).toBe(0);
    });

    it('should calculate for specific date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-15');
      
      const result = calculateAllocatedHoursForEmployee(mockEmployee, mockAllocations, startDate, endDate);
      
      // 15 days * 8 hours/day = 120 hours
      expect(result).toBe(120);
    });
  });

  describe('calculateTimeOffDays', () => {
    it('should calculate vacation and holiday days', () => {
      const result = calculateTimeOffDays(mockEmployee, mockHolidays, mockVacations);
      
      // Vacation: 5 days (June 1-5)
      expect(result.vacationDays).toBe(5);
      
      // Holidays: 2 days (Christmas and Canada Day)
      expect(result.holidayDays).toBe(2);
    });

    it('should handle no time off', () => {
      const result = calculateTimeOffDays(mockEmployee, [], []);
      expect(result.vacationDays).toBe(0);
      expect(result.holidayDays).toBe(0);
    });

    it('should calculate for specific date range', () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');
      
      const result = calculateTimeOffDays(mockEmployee, mockHolidays, mockVacations, startDate, endDate);
      
      // Vacation: 5 days in June
      expect(result.vacationDays).toBe(5);
      
      // Holidays: 0 days in June
      expect(result.holidayDays).toBe(0);
    });
  });

  describe('calculateAllocationPercentage', () => {
    it('should calculate allocation percentage for Canada employee', () => {
      const result = calculateAllocationPercentage(mockEmployee);
      
      // 120 allocated / 150 total = 80%
      expect(result).toBe(80);
    });

    it('should handle zero allocated hours', () => {
      const employeeWithNoAllocation = { ...mockEmployee, allocatedHours: 0 };
      const result = calculateAllocationPercentage(employeeWithNoAllocation);
      expect(result).toBe(0);
    });

    it('should handle Brazil employee', () => {
      const brazilEmployee = { ...mockEmployee, country: 'Brazil', allocatedHours: 88 };
      const result = calculateAllocationPercentage(brazilEmployee);
      
      // 88 allocated / 176 total = 50%
      expect(result).toBe(50);
    });
  });

  describe('calculateActualAvailableHours', () => {
    it('should calculate actual available hours', () => {
      const result = calculateActualAvailableHours(mockEmployee, 37.5, 44, 20);
      
      // Total: 37.5 * 4 = 150
      // Buffer: 150 * 0.2 = 30
      // Available: 150 - 30 - 120 = 0
      expect(result).toBe(0);
    });

    it('should return null for invalid settings', () => {
      const result = calculateActualAvailableHours(mockEmployee, 0, 44, 20);
      expect(result).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should calculate monthly hours correctly', () => {
      const result = getMonthlyHours(40);
      expect(result).toBe(160); // 40 * 4
    });

    it('should calculate daily hours correctly', () => {
      const result = getDailyHours(40);
      expect(result).toBe(8); // 40 / 5
    });

    it('should handle custom work days per week', () => {
      const result = getDailyHours(40, 4);
      expect(result).toBe(10); // 40 / 4
    });
  });

  describe('Edge Cases', () => {
    it('should handle employee with no allocated hours', () => {
      const employeeWithNoAllocation = { ...mockEmployee, allocatedHours: 0 };
      const context: CalculationContext = {
        settings: mockSettings,
        holidays: [],
        vacations: [],
        allocations: []
      };

      const result = calculateAvailableHoursForEmployee(employeeWithNoAllocation, context);
      expect(result.allocatedHours).toBe(0);
      expect(result.utilizationPercentage).toBe(0);
    });

    it('should handle over-allocation', () => {
      const overAllocatedEmployee = { ...mockEmployee, allocatedHours: 200 };
      const context: CalculationContext = {
        settings: mockSettings,
        holidays: [],
        vacations: [],
        allocations: []
      };

      const result = calculateAvailableHoursForEmployee(overAllocatedEmployee, context);
      expect(result.utilizationPercentage).toBe(100); // Capped at 100%
    });

    it('should handle zero buffer', () => {
      const zeroBufferSettings = { ...mockSettings, buffer: 0 };
      const context: CalculationContext = {
        settings: zeroBufferSettings,
        holidays: [],
        vacations: [],
        allocations: []
      };

      const result = calculateAvailableHoursForEmployee(mockEmployee, context);
      expect(result.bufferHours).toBe(0);
      expect(result.availableHours).toBe(result.totalHours);
    });
  });
}); 