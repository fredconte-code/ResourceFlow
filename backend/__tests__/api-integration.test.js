const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Import the app (you'll need to export it from index.js)
let app;
let db;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Set up test database
    const testDbPath = path.join(__dirname, '../test_resource_scheduler.db');
    db = new sqlite3.Database(testDbPath);
    
    // Create test tables
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS team_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          country TEXT NOT NULL,
          allocated_hours INTEGER DEFAULT 0
        )`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          start_date TEXT,
          end_date TEXT,
          color TEXT DEFAULT '#3b82f6',
          allocated_hours INTEGER DEFAULT 0
        )`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE TABLE IF NOT EXISTS holidays (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          date TEXT NOT NULL,
          country TEXT NOT NULL
        )`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE TABLE IF NOT EXISTS vacations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id TEXT NOT NULL,
          employee_name TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          type TEXT DEFAULT 'vacation'
        )`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE TABLE IF NOT EXISTS project_allocations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          hours_per_day INTEGER DEFAULT 8,
          status TEXT DEFAULT 'active'
        )`, (err) => {
          if (err) reject(err);
        });

        db.run(`CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL
        )`, (err) => {
          if (err) reject(err);
        });

        // Insert default settings
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
          ('buffer', '20'),
          ('canadaHours', '37.5'),
          ('brazilHours', '44')
        `, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    });

    // Import and start the app with test database
    const express = require('express');
    const cors = require('cors');
    
    app = express();
    app.use(cors());
    app.use(express.json());
    
    // Override the database connection for testing
    app.locals.db = db;
    
    // Add routes (you'll need to extract these from index.js)
    require('../index.js')(app, db);
  });

  afterAll(async () => {
    // Clean up test database
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error('Error closing database:', err);
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM project_allocations', (err) => {
          if (err) reject(err);
        });
        db.run('DELETE FROM vacations', (err) => {
          if (err) reject(err);
        });
        db.run('DELETE FROM holidays', (err) => {
          if (err) reject(err);
        });
        db.run('DELETE FROM projects', (err) => {
          if (err) reject(err);
        });
        db.run('DELETE FROM team_members', (err) => {
          if (err) reject(err);
        });
        db.run('DELETE FROM settings', (err) => {
          if (err) reject(err);
        });
        
        // Re-insert default settings
        db.run(`INSERT INTO settings (key, value) VALUES 
          ('buffer', '20'),
          ('canadaHours', '37.5'),
          ('brazilHours', '44')
        `, (err) => {
          if (err) reject(err);
          resolve();
        });
      });
    });
  });

  describe('Team Members API', () => {
    it('should create, read, update, and delete team members', async () => {
      const teamMember = {
        name: 'John Doe',
        role: 'Developer',
        country: 'Canada',
        allocatedHours: 120
      };

      // Create
      const createResponse = await request(app)
        .post('/api/team-members')
        .send(teamMember)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.name).toBe(teamMember.name);
      expect(createResponse.body.role).toBe(teamMember.role);
      expect(createResponse.body.country).toBe(teamMember.country);
      expect(createResponse.body.allocated_hours).toBe(teamMember.allocatedHours);

      const teamMemberId = createResponse.body.id;

      // Read
      const getResponse = await request(app)
        .get(`/api/team-members/${teamMemberId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(teamMemberId);
      expect(getResponse.body.name).toBe(teamMember.name);

      // Update
      const updatedTeamMember = {
        name: 'John Smith',
        role: 'Senior Developer',
        country: 'Canada',
        allocatedHours: 140
      };

      const updateResponse = await request(app)
        .put(`/api/team-members/${teamMemberId}`)
        .send(updatedTeamMember)
        .expect(200);

      expect(updateResponse.body.name).toBe(updatedTeamMember.name);
      expect(updateResponse.body.role).toBe(updatedTeamMember.role);
      expect(updateResponse.body.allocated_hours).toBe(updatedTeamMember.allocatedHours);

      // Delete
      await request(app)
        .delete(`/api/team-members/${teamMemberId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/team-members/${teamMemberId}`)
        .expect(404);
    });

    it('should validate required fields', async () => {
      const invalidTeamMember = {
        name: '',
        role: 'Developer',
        country: 'Canada'
      };

      await request(app)
        .post('/api/team-members')
        .send(invalidTeamMember)
        .expect(400);
    });

    it('should handle invalid country values', async () => {
      const invalidTeamMember = {
        name: 'John Doe',
        role: 'Developer',
        country: 'InvalidCountry',
        allocatedHours: 120
      };

      await request(app)
        .post('/api/team-members')
        .send(invalidTeamMember)
        .expect(400);
    });
  });

  describe('Projects API', () => {
    it('should create, read, update, and delete projects', async () => {
      const project = {
        name: 'Test Project',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        color: '#ff0000',
        allocatedHours: 1000
      };

      // Create
      const createResponse = await request(app)
        .post('/api/projects')
        .send(project)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.name).toBe(project.name);
      expect(createResponse.body.start_date).toBe(project.startDate);
      expect(createResponse.body.end_date).toBe(project.endDate);
      expect(createResponse.body.color).toBe(project.color);
      expect(createResponse.body.allocated_hours).toBe(project.allocatedHours);

      const projectId = createResponse.body.id;

      // Read
      const getResponse = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(projectId);
      expect(getResponse.body.name).toBe(project.name);

      // Update
      const updatedProject = {
        name: 'Updated Test Project',
        allocatedHours: 1200
      };

      const updateResponse = await request(app)
        .put(`/api/projects/${projectId}`)
        .send(updatedProject)
        .expect(200);

      expect(updateResponse.body.name).toBe(updatedProject.name);
      expect(updateResponse.body.allocated_hours).toBe(updatedProject.allocatedHours);

      // Delete
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(404);
    });
  });

  describe('Project Allocations API', () => {
    let teamMemberId;
    let projectId;

    beforeEach(async () => {
      // Create test team member and project
      const teamMemberResponse = await request(app)
        .post('/api/team-members')
        .send({
          name: 'Test Employee',
          role: 'Developer',
          country: 'Canada',
          allocatedHours: 120
        });

      teamMemberId = teamMemberResponse.body.id;

      const projectResponse = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          color: '#ff0000',
          allocatedHours: 1000
        });

      projectId = projectResponse.body.id;
    });

    it('should create, read, update, and delete project allocations', async () => {
      const allocation = {
        employeeId: teamMemberId.toString(),
        projectId: projectId.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        hoursPerDay: 8,
        status: 'active'
      };

      // Create
      const createResponse = await request(app)
        .post('/api/project-allocations')
        .send(allocation)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.employee_id).toBe(allocation.employeeId);
      expect(createResponse.body.project_id).toBe(allocation.projectId);
      expect(createResponse.body.start_date).toBe(allocation.startDate);
      expect(createResponse.body.end_date).toBe(allocation.endDate);
      expect(createResponse.body.hours_per_day).toBe(allocation.hoursPerDay);
      expect(createResponse.body.status).toBe(allocation.status);

      const allocationId = createResponse.body.id;

      // Read
      const getResponse = await request(app)
        .get(`/api/project-allocations/${allocationId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(allocationId);
      expect(getResponse.body.employee_id).toBe(allocation.employeeId);

      // Update
      const updatedAllocation = {
        hoursPerDay: 6,
        status: 'inactive'
      };

      const updateResponse = await request(app)
        .put(`/api/project-allocations/${allocationId}`)
        .send(updatedAllocation)
        .expect(200);

      expect(updateResponse.body.hours_per_day).toBe(updatedAllocation.hoursPerDay);
      expect(updateResponse.body.status).toBe(updatedAllocation.status);

      // Delete
      await request(app)
        .delete(`/api/project-allocations/${allocationId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/project-allocations/${allocationId}`)
        .expect(404);
    });

    it('should validate foreign key constraints', async () => {
      const invalidAllocation = {
        employeeId: '999999', // Non-existent employee
        projectId: projectId.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        hoursPerDay: 8
      };

      await request(app)
        .post('/api/project-allocations')
        .send(invalidAllocation)
        .expect(400);
    });
  });

  describe('Holidays API', () => {
    it('should create, read, and delete holidays', async () => {
      const holiday = {
        name: 'Christmas',
        date: '2024-12-25',
        country: 'Both'
      };

      // Create
      const createResponse = await request(app)
        .post('/api/holidays')
        .send(holiday)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.name).toBe(holiday.name);
      expect(createResponse.body.date).toBe(holiday.date);
      expect(createResponse.body.country).toBe(holiday.country);

      const holidayId = createResponse.body.id;

      // Read
      const getResponse = await request(app)
        .get(`/api/holidays/${holidayId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(holidayId);
      expect(getResponse.body.name).toBe(holiday.name);

      // Delete
      await request(app)
        .delete(`/api/holidays/${holidayId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/holidays/${holidayId}`)
        .expect(404);
    });
  });

  describe('Vacations API', () => {
    let teamMemberId;

    beforeEach(async () => {
      // Create test team member
      const teamMemberResponse = await request(app)
        .post('/api/team-members')
        .send({
          name: 'Test Employee',
          role: 'Developer',
          country: 'Canada',
          allocatedHours: 120
        });

      teamMemberId = teamMemberResponse.body.id;
    });

    it('should create, read, and delete vacations', async () => {
      const vacation = {
        employeeId: teamMemberId.toString(),
        employeeName: 'Test Employee',
        startDate: '2024-06-01',
        endDate: '2024-06-05',
        type: 'Vacation',
        notes: 'Summer vacation'
      };

      // Create
      const createResponse = await request(app)
        .post('/api/vacations')
        .send(vacation)
        .expect(201);

      expect(createResponse.body).toHaveProperty('id');
      expect(createResponse.body.employee_id).toBe(vacation.employeeId);
      expect(createResponse.body.employee_name).toBe(vacation.employeeName);
      expect(createResponse.body.start_date).toBe(vacation.startDate);
      expect(createResponse.body.end_date).toBe(vacation.endDate);
      expect(createResponse.body.type).toBe(vacation.type);

      const vacationId = createResponse.body.id;

      // Read
      const getResponse = await request(app)
        .get(`/api/vacations/${vacationId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(vacationId);
      expect(getResponse.body.employee_name).toBe(vacation.employeeName);

      // Delete
      await request(app)
        .delete(`/api/vacations/${vacationId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/vacations/${vacationId}`)
        .expect(404);
    });
  });

  describe('Settings API', () => {
    it('should get and update settings', async () => {
      // Get current settings
      const getResponse = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(getResponse.body).toHaveProperty('buffer');
      expect(getResponse.body).toHaveProperty('canadaHours');
      expect(getResponse.body).toHaveProperty('brazilHours');

      // Update settings
      const updatedSettings = {
        buffer: '25',
        canadaHours: '40',
        brazilHours: '45'
      };

      const updateResponse = await request(app)
        .put('/api/settings')
        .send(updatedSettings)
        .expect(200);

      expect(updateResponse.body.buffer).toBe(updatedSettings.buffer);
      expect(updateResponse.body.canadaHours).toBe(updatedSettings.canadaHours);
      expect(updateResponse.body.brazilHours).toBe(updatedSettings.brazilHours);
    });
  });

  describe('Export/Import API', () => {
    let teamMemberId;
    let projectId;

    beforeEach(async () => {
      // Create test data
      const teamMemberResponse = await request(app)
        .post('/api/team-members')
        .send({
          name: 'Test Employee',
          role: 'Developer',
          country: 'Canada',
          allocatedHours: 120
        });

      teamMemberId = teamMemberResponse.body.id;

      const projectResponse = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          color: '#ff0000',
          allocatedHours: 1000
        });

      projectId = projectResponse.body.id;

      await request(app)
        .post('/api/holidays')
        .send({
          name: 'Christmas',
          date: '2024-12-25',
          country: 'Both'
        });

      await request(app)
        .post('/api/vacations')
        .send({
          employeeId: teamMemberId.toString(),
          employeeName: 'Test Employee',
          startDate: '2024-06-01',
          endDate: '2024-06-05',
          type: 'Vacation'
        });
    });

    it('should export all data', async () => {
      const exportResponse = await request(app)
        .get('/api/export')
        .expect(200);

      expect(exportResponse.body).toHaveProperty('teamMembers');
      expect(exportResponse.body).toHaveProperty('projects');
      expect(exportResponse.body).toHaveProperty('holidays');
      expect(exportResponse.body).toHaveProperty('vacations');
      expect(exportResponse.body).toHaveProperty('projectAllocations');
      expect(exportResponse.body).toHaveProperty('settings');

      expect(exportResponse.body.teamMembers).toHaveLength(1);
      expect(exportResponse.body.projects).toHaveLength(1);
      expect(exportResponse.body.holidays).toHaveLength(1);
      expect(exportResponse.body.vacations).toHaveLength(1);
    });

    it('should import data successfully', async () => {
      const importData = {
        teamMembers: [
          {
            name: 'Imported Employee',
            role: 'Designer',
            country: 'Brazil',
            allocatedHours: 100
          }
        ],
        projects: [
          {
            name: 'Imported Project',
            startDate: '2024-02-01',
            endDate: '2024-11-30',
            color: '#00ff00',
            allocatedHours: 800
          }
        ],
        holidays: [
          {
            name: 'Imported Holiday',
            date: '2024-07-04',
            country: 'Both'
          }
        ],
        vacations: [
          {
            employeeId: '1',
            employeeName: 'Imported Employee',
            startDate: '2024-07-01',
            endDate: '2024-07-03',
            type: 'Vacation'
          }
        ],
        projectAllocations: [
          {
            employeeId: '1',
            projectId: '1',
            startDate: '2024-02-01',
            endDate: '2024-02-28',
            hoursPerDay: 8,
            status: 'active'
          }
        ],
        settings: {
          buffer: '15',
          canadaHours: '35',
          brazilHours: '42'
        }
      };

      const importResponse = await request(app)
        .post('/api/import')
        .send(importData)
        .expect(200);

      expect(importResponse.body).toHaveProperty('message');
      expect(importResponse.body.message).toContain('successfully');

      // Verify imported data
      const teamMembersResponse = await request(app)
        .get('/api/team-members')
        .expect(200);

      expect(teamMembersResponse.body).toHaveLength(2); // Original + imported

      const projectsResponse = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(projectsResponse.body).toHaveLength(2); // Original + imported
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain referential integrity when deleting team members', async () => {
      // Create team member and project allocation
      const teamMemberResponse = await request(app)
        .post('/api/team-members')
        .send({
          name: 'Test Employee',
          role: 'Developer',
          country: 'Canada',
          allocatedHours: 120
        });

      const teamMemberId = teamMemberResponse.body.id;

      const projectResponse = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          color: '#ff0000',
          allocatedHours: 1000
        });

      const projectId = projectResponse.body.id;

      await request(app)
        .post('/api/project-allocations')
        .send({
          employeeId: teamMemberId.toString(),
          projectId: projectId.toString(),
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          hoursPerDay: 8
        });

      // Delete team member
      await request(app)
        .delete(`/api/team-members/${teamMemberId}`)
        .expect(200);

      // Verify project allocations are cleaned up
      const allocationsResponse = await request(app)
        .get('/api/project-allocations')
        .expect(200);

      expect(allocationsResponse.body).toHaveLength(0);
    });

    it('should maintain referential integrity when deleting projects', async () => {
      // Create team member and project allocation
      const teamMemberResponse = await request(app)
        .post('/api/team-members')
        .send({
          name: 'Test Employee',
          role: 'Developer',
          country: 'Canada',
          allocatedHours: 120
        });

      const teamMemberId = teamMemberResponse.body.id;

      const projectResponse = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          color: '#ff0000',
          allocatedHours: 1000
        });

      const projectId = projectResponse.body.id;

      await request(app)
        .post('/api/project-allocations')
        .send({
          employeeId: teamMemberId.toString(),
          projectId: projectId.toString(),
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          hoursPerDay: 8
        });

      // Delete project
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .expect(200);

      // Verify project allocations are cleaned up
      const allocationsResponse = await request(app)
        .get('/api/project-allocations')
        .expect(200);

      expect(allocationsResponse.body).toHaveLength(0);
    });
  });
}); 