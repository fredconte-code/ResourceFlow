import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Index } from '../pages/Index';
import { SettingsContext } from '../context/SettingsContext';

// Mock the API calls
vi.mock('../lib/api', () => ({
  teamMembersApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  projectsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  projectAllocationsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  holidaysApi: {
    getAll: vi.fn()
  },
  vacationsApi: {
    getAll: vi.fn()
  }
}));

// Mock the working hours calculations
vi.mock('../lib/working-hours', () => ({
  calculateAvailableHoursForEmployee: vi.fn(),
  calculateAllocationPercentage: vi.fn(),
  calculateActualAvailableHours: vi.fn()
}));

// Mock the employee and project data
vi.mock('../lib/employee-data', () => ({
  getCurrentEmployeesSync: vi.fn(),
  employees: [
    {
      id: '1',
      name: 'John Doe',
      role: 'Developer',
      country: 'Canada',
      allocatedHours: 120,
      availableHours: 150,
      vacationDays: 5,
      holidayDays: 2
    }
  ]
}));

vi.mock('../lib/project-data', () => ({
  getProjectsSync: vi.fn(),
  getEmployeeProjectAllocationsWithCleanup: vi.fn(),
  getEmployeeProjectNamesWithCleanup: vi.fn(),
  initializeProjectData: vi.fn()
}));

const mockSettings = {
  buffer: 20,
  canadaHours: 37.5,
  brazilHours: 44
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <SettingsContext.Provider value={mockSettings}>
        {component}
      </SettingsContext.Provider>
    </BrowserRouter>
  );
};

describe('Planner E2E Workflows', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set up default mock implementations
    const { teamMembersApi, projectsApi, projectAllocationsApi, holidaysApi, vacationsApi } = require('../lib/api');
    const { getCurrentEmployeesSync, getProjectsSync } = require('../lib/employee-data');
    const { calculateAvailableHoursForEmployee, calculateAllocationPercentage, calculateActualAvailableHours } = require('../lib/working-hours');
    
    // Mock API responses
    teamMembersApi.getAll.mockResolvedValue([
      {
        id: 1,
        name: 'John Doe',
        role: 'Developer',
        country: 'Canada',
        allocatedHours: 120
      }
    ]);
    
    projectsApi.getAll.mockResolvedValue([
      {
        id: 1,
        name: 'Test Project',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        color: '#ff0000',
        allocatedHours: 1000
      }
    ]);
    
    projectAllocationsApi.getAll.mockResolvedValue([
      {
        id: 1,
        employeeId: '1',
        projectId: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        hoursPerDay: 8,
        status: 'active'
      }
    ]);
    
    holidaysApi.getAll.mockResolvedValue([]);
    vacationsApi.getAll.mockResolvedValue([]);
    
    // Mock data functions
    getCurrentEmployeesSync.mockReturnValue([
      {
        id: '1',
        name: 'John Doe',
        role: 'Developer',
        country: 'Canada',
        allocatedHours: 120,
        availableHours: 150,
        vacationDays: 5,
        holidayDays: 2
      }
    ]);
    
    getProjectsSync.mockReturnValue([
      {
        id: '1',
        name: 'Test Project',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        color: '#ff0000',
        allocatedHours: 1000
      }
    ]);
    
    // Mock working hours calculations
    calculateAvailableHoursForEmployee.mockReturnValue({
      totalHours: 150,
      allocatedHours: 120,
      availableHours: 120,
      bufferHours: 30,
      vacationDays: 5,
      holidayDays: 2,
      utilizationPercentage: 100
    });
    
    calculateAllocationPercentage.mockReturnValue(80);
    calculateActualAvailableHours.mockReturnValue(30);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Team Management Workflow', () => {
    it('should add a new team member successfully', async () => {
      const user = userEvent.setup();
      const { teamMembersApi } = require('../lib/api');
      
      teamMembersApi.create.mockResolvedValue({
        id: 2,
        name: 'Jane Smith',
        role: 'Designer',
        country: 'Brazil',
        allocatedHours: 80
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Team tab
      const teamTab = screen.getByText('Team');
      await user.click(teamTab);
      
      // Click Add Team Member button
      const addButton = screen.getByText('Add Team Member');
      await user.click(addButton);
      
      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i);
      const roleSelect = screen.getByLabelText(/role/i);
      const countrySelect = screen.getByLabelText(/country/i);
      
      await user.type(nameInput, 'Jane Smith');
      await user.selectOptions(roleSelect, 'Designer');
      await user.selectOptions(countrySelect, 'Brazil');
      
      // Submit the form
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(teamMembersApi.create).toHaveBeenCalledWith({
          name: 'Jane Smith',
          role: 'Designer',
          country: 'Brazil',
          allocatedHours: 0
        });
      });
      
      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/Team member created successfully/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields when adding team member', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<Index />);
      
      // Navigate to Team tab
      const teamTab = screen.getByText('Team');
      await user.click(teamTab);
      
      // Click Add Team Member button
      const addButton = screen.getByText('Add Team Member');
      await user.click(addButton);
      
      // Try to submit without filling required fields
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Role is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Country is required/i)).toBeInTheDocument();
      });
    });

    it('should edit an existing team member', async () => {
      const user = userEvent.setup();
      const { teamMembersApi } = require('../lib/api');
      
      teamMembersApi.update.mockResolvedValue({
        id: 1,
        name: 'John Smith',
        role: 'Senior Developer',
        country: 'Canada',
        allocatedHours: 140
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Team tab
      const teamTab = screen.getByText('Team');
      await user.click(teamTab);
      
      // Click edit button on the first team member
      const editButton = screen.getByLabelText(/edit/i);
      await user.click(editButton);
      
      // Update the name
      const nameInput = screen.getByDisplayValue('John Doe');
      await user.clear(nameInput);
      await user.type(nameInput, 'John Smith');
      
      // Submit the form
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(teamMembersApi.update).toHaveBeenCalledWith(1, {
          name: 'John Smith',
          role: 'Developer',
          country: 'Canada',
          allocatedHours: 120
        });
      });
    });

    it('should delete a team member with confirmation', async () => {
      const user = userEvent.setup();
      const { teamMembersApi } = require('../lib/api');
      
      teamMembersApi.delete.mockResolvedValue({});
      
      renderWithProviders(<Index />);
      
      // Navigate to Team tab
      const teamTab = screen.getByText('Team');
      await user.click(teamTab);
      
      // Click delete button on the first team member
      const deleteButton = screen.getByLabelText(/delete/i);
      await user.click(deleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      await user.click(confirmButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(teamMembersApi.delete).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Project Management Workflow', () => {
    it('should add a new project successfully', async () => {
      const user = userEvent.setup();
      const { projectsApi } = require('../lib/api');
      
      projectsApi.create.mockResolvedValue({
        id: 2,
        name: 'New Project',
        startDate: '2024-02-01',
        endDate: '2024-11-30',
        color: '#00ff00',
        allocatedHours: 800
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Projects tab
      const projectsTab = screen.getByText('Projects');
      await user.click(projectsTab);
      
      // Click Add Project button
      const addButton = screen.getByText('Add Project');
      await user.click(addButton);
      
      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      await user.type(nameInput, 'New Project');
      await user.type(startDateInput, '2024-02-01');
      await user.type(endDateInput, '2024-11-30');
      
      // Select a color
      const colorButton = screen.getByLabelText(/color/i);
      await user.click(colorButton);
      const colorOption = screen.getByTitle('#00ff00');
      await user.click(colorOption);
      
      // Submit the form
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(projectsApi.create).toHaveBeenCalledWith({
          name: 'New Project',
          startDate: '2024-02-01',
          endDate: '2024-11-30',
          color: '#00ff00',
          allocatedHours: 0
        });
      });
    });
  });

  describe('Calendar Allocation Workflow', () => {
    it('should allocate a project to an employee via drag and drop', async () => {
      const user = userEvent.setup();
      const { projectAllocationsApi } = require('../lib/api');
      
      projectAllocationsApi.create.mockResolvedValue({
        id: 2,
        employeeId: '1',
        projectId: '1',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        hoursPerDay: 8,
        status: 'active'
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Calendar tab
      const calendarTab = screen.getByText('Calendar');
      await user.click(calendarTab);
      
      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
      
      // Simulate drag and drop
      const projectElement = screen.getByText('Test Project').closest('[draggable="true"]');
      const calendarCell = screen.getByTestId('calendar-cell-2024-01-15');
      
      if (projectElement && calendarCell) {
        fireEvent.dragStart(projectElement);
        fireEvent.drop(calendarCell);
        
        // Verify API was called
        await waitFor(() => {
          expect(projectAllocationsApi.create).toHaveBeenCalledWith({
            employeeId: '1',
            projectId: '1',
            startDate: '2024-01-15',
            endDate: '2024-01-15',
            hoursPerDay: 8,
            status: 'active'
          });
        });
      }
    });

    it('should resize an allocation while respecting working hours', async () => {
      const user = userEvent.setup();
      const { projectAllocationsApi } = require('../lib/api');
      
      projectAllocationsApi.update.mockResolvedValue({
        id: 1,
        employeeId: '1',
        projectId: '1',
        startDate: '2024-01-01',
        endDate: '2024-01-05',
        hoursPerDay: 8,
        status: 'active'
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Calendar tab
      const calendarTab = screen.getByText('Calendar');
      await user.click(calendarTab);
      
      // Wait for allocations to load
      await waitFor(() => {
        expect(screen.getByTestId('allocation-1')).toBeInTheDocument();
      });
      
      // Simulate resize
      const allocationElement = screen.getByTestId('allocation-1');
      const resizeHandle = allocationElement.querySelector('[data-resize-handle="right"]');
      
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle);
        fireEvent.mouseMove(resizeHandle, { clientX: 200 });
        fireEvent.mouseUp(resizeHandle);
        
        // Verify API was called with updated dates
        await waitFor(() => {
          expect(projectAllocationsApi.update).toHaveBeenCalledWith(1, {
            endDate: '2024-01-05',
            hoursPerDay: 8,
            status: 'active'
          });
        });
      }
    });

    it('should prevent over-allocation beyond working hours', async () => {
      const user = userEvent.setup();
      
      // Mock working hours calculation to show over-allocation
      const { calculateAvailableHoursForEmployee } = require('../lib/working-hours');
      calculateAvailableHoursForEmployee.mockReturnValue({
        totalHours: 150,
        allocatedHours: 150, // Already fully allocated
        availableHours: 0,
        bufferHours: 30,
        vacationDays: 5,
        holidayDays: 2,
        utilizationPercentage: 100
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Calendar tab
      const calendarTab = screen.getByText('Calendar');
      await user.click(calendarTab);
      
      // Try to allocate a project to an over-allocated employee
      const projectElement = screen.getByText('Test Project').closest('[draggable="true"]');
      const calendarCell = screen.getByTestId('calendar-cell-2024-01-15');
      
      if (projectElement && calendarCell) {
        fireEvent.dragStart(projectElement);
        fireEvent.drop(calendarCell);
        
        // Verify warning message is shown
        await waitFor(() => {
          expect(screen.getByText(/Employee is over-allocated/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Time Off Management Workflow', () => {
    it('should add a new vacation request', async () => {
      const user = userEvent.setup();
      const { vacationsApi } = require('../lib/api');
      
      vacationsApi.create.mockResolvedValue({
        id: 1,
        employeeId: '1',
        employeeName: 'John Doe',
        startDate: '2024-06-01',
        endDate: '2024-06-05',
        type: 'Vacation',
        notes: 'Summer vacation'
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Time Off tab
      const timeOffTab = screen.getByText('Time Off');
      await user.click(timeOffTab);
      
      // Click Add Vacation button
      const addVacationButton = screen.getByText('Add Vacation');
      await user.click(addVacationButton);
      
      // Fill in the form
      const employeeSelect = screen.getByLabelText(/employee/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const notesInput = screen.getByLabelText(/notes/i);
      
      await user.selectOptions(employeeSelect, '1');
      await user.type(startDateInput, '2024-06-01');
      await user.type(endDateInput, '2024-06-05');
      await user.type(notesInput, 'Summer vacation');
      
      // Submit the form
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(vacationsApi.create).toHaveBeenCalledWith({
          employeeId: '1',
          employeeName: 'John Doe',
          startDate: '2024-06-01',
          endDate: '2024-06-05',
          type: 'Vacation',
          notes: 'Summer vacation'
        });
      });
    });

    it('should add a new holiday', async () => {
      const user = userEvent.setup();
      const { holidaysApi } = require('../lib/api');
      
      holidaysApi.create.mockResolvedValue({
        id: 1,
        name: 'Christmas',
        date: '2024-12-25',
        country: 'Both'
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Time Off tab
      const timeOffTab = screen.getByText('Time Off');
      await user.click(timeOffTab);
      
      // Click Add Holiday button
      const addHolidayButton = screen.getByText('Add Holiday');
      await user.click(addHolidayButton);
      
      // Fill in the form
      const nameInput = screen.getByLabelText(/name/i);
      const dateInput = screen.getByLabelText(/date/i);
      const countrySelect = screen.getByLabelText(/country/i);
      
      await user.type(nameInput, 'Christmas');
      await user.type(dateInput, '2024-12-25');
      await user.selectOptions(countrySelect, 'Both');
      
      // Submit the form
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(holidaysApi.create).toHaveBeenCalledWith({
          name: 'Christmas',
          date: '2024-12-25',
          country: 'Both'
        });
      });
    });
  });

  describe('Settings Management Workflow', () => {
    it('should update working hours settings', async () => {
      const user = userEvent.setup();
      const { settingsApi } = require('../lib/api');
      
      settingsApi.update.mockResolvedValue({
        buffer: '25',
        canadaHours: '40',
        brazilHours: '45'
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Settings tab
      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);
      
      // Update buffer time
      const bufferInput = screen.getByLabelText(/buffer time/i);
      await user.clear(bufferInput);
      await user.type(bufferInput, '25');
      
      // Update Canada hours
      const canadaHoursInput = screen.getByLabelText(/canada hours/i);
      await user.clear(canadaHoursInput);
      await user.type(canadaHoursInput, '40');
      
      // Update Brazil hours
      const brazilHoursInput = screen.getByLabelText(/brazil hours/i);
      await user.clear(brazilHoursInput);
      await user.type(brazilHoursInput, '45');
      
      // Save settings
      const saveButton = screen.getByText('Save Settings');
      await user.click(saveButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(settingsApi.update).toHaveBeenCalledWith({
          buffer: '25',
          canadaHours: '40',
          brazilHours: '45'
        });
      });
    });
  });

  describe('Data Persistence Workflow', () => {
    it('should export all data successfully', async () => {
      const user = userEvent.setup();
      const { dataApi } = require('../lib/api');
      
      dataApi.export.mockResolvedValue({
        teamMembers: [],
        projects: [],
        holidays: [],
        vacations: [],
        projectAllocations: [],
        settings: {}
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Settings tab
      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);
      
      // Click Export button
      const exportButton = screen.getByText('Export Data');
      await user.click(exportButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(dataApi.export).toHaveBeenCalled();
      });
    });

    it('should import data successfully', async () => {
      const user = userEvent.setup();
      const { dataApi } = require('../lib/api');
      
      dataApi.import.mockResolvedValue({
        message: 'Data imported successfully'
      });
      
      renderWithProviders(<Index />);
      
      // Navigate to Settings tab
      const settingsTab = screen.getByText('Settings');
      await user.click(settingsTab);
      
      // Create a mock file
      const file = new File(['{"teamMembers":[]}'], 'test.json', { type: 'application/json' });
      
      // Click Import button and select file
      const importButton = screen.getByText('Import Data');
      await user.click(importButton);
      
      const fileInput = screen.getByLabelText(/choose file/i);
      await user.upload(fileInput, file);
      
      // Confirm import
      const confirmButton = screen.getByText('Import');
      await user.click(confirmButton);
      
      // Verify API was called
      await waitFor(() => {
        expect(dataApi.import).toHaveBeenCalled();
      });
    });
  });
}); 