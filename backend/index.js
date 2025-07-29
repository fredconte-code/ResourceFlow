const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- SQLite Setup ---
const db = new sqlite3.Database('./resource_scheduler.db');

// Create tables if they don't exist
db.serialize(() => {
  // Team Members table
  db.run(`CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    country TEXT NOT NULL,
    allocatedHours INTEGER DEFAULT 0
  )`);

  // Projects table
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    startDate TEXT,
    endDate TEXT,
    color TEXT DEFAULT '#3b82f6',
    allocatedHours INTEGER DEFAULT 0
  )`);

  // Holidays table
  db.run(`CREATE TABLE IF NOT EXISTS holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    country TEXT NOT NULL
  )`);

  // Vacations table
  db.run(`CREATE TABLE IF NOT EXISTS vacations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    type TEXT DEFAULT 'vacation'
  )`);

  // Project Allocations table
  db.run(`CREATE TABLE IF NOT EXISTS project_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    projectId TEXT NOT NULL,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    hoursPerDay INTEGER DEFAULT 8,
    status TEXT DEFAULT 'active'
  )`);

  // Settings table
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL
  )`);

  // Insert default settings if they don't exist
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('buffer', '10'),
    ('canadaHours', '37.5'),
    ('brazilHours', '44')
  `);
});

// --- API Endpoints ---

// Test endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

// --- Team Members API ---
app.get('/api/team-members', (req, res) => {
  db.all('SELECT * FROM team_members ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/team-members/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM team_members WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Team member not found' });
    res.json(row);
  });
});

app.post('/api/team-members', (req, res) => {
  const { name, role, country, allocatedHours } = req.body;
  if (!name || !name.trim() || !role || !role.trim() || !country) {
    return res.status(400).json({ error: 'Name, role, and country are required' });
  }
  
  const id = Date.now().toString();
  db.run(
    'INSERT INTO team_members (id, name, role, country, allocated_hours) VALUES (?, ?, ?, ?, ?)',
    [id, name, role, country, allocatedHours || 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        id, 
        name, 
        role, 
        country, 
        allocatedHours: allocatedHours || 0 
      });
    }
  );
});

app.put('/api/team-members/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, country, allocatedHours } = req.body;
  
  if (!name || !name.trim() || !role || !role.trim() || !country) {
    return res.status(400).json({ error: 'Name, role, and country are required' });
  }
  
  db.run(
    'UPDATE team_members SET name = ?, role = ?, country = ?, allocated_hours = ? WHERE id = ?',
    [name, role, country, allocatedHours || 0, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Team member not found' });
      res.json({ id, name, role, country, allocatedHours: allocatedHours || 0 });
    }
  );
});

app.delete('/api/team-members/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM team_members WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Team member not found' });
    res.json({ message: 'Team member deleted successfully' });
  });
});

// --- Projects API ---
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Project not found' });
    res.json(row);
  });
});

app.post('/api/projects', (req, res) => {
  const { name, startDate, endDate, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  const id = Date.now().toString();
  db.run(
    'INSERT INTO projects (id, name, start_date, end_date, color) VALUES (?, ?, ?, ?, ?)',
    [id, name, startDate, endDate, color || '#3b82f6'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        id, 
        name, 
        startDate, 
        endDate, 
        color: color || '#3b82f6'
      });
    }
  );
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, startDate, endDate, color } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  db.run(
    'UPDATE projects SET name = ?, start_date = ?, end_date = ?, color = ? WHERE id = ?',
    [name, startDate, endDate, color || '#3b82f6', id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Project not found' });
      res.json({ id, name, startDate, endDate, color: color || '#3b82f6' });
    }
  );
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM projects WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  });
});

// --- Holidays API ---
app.get('/api/holidays', (req, res) => {
  db.all('SELECT * FROM holidays ORDER BY date', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/holidays', (req, res) => {
  const { name, date, country } = req.body;
  if (!name || !date || !country) {
    return res.status(400).json({ error: 'Name, date, and country are required' });
  }
  
  db.run(
    'INSERT INTO holidays (name, date, country) VALUES (?, ?, ?)',
    [name, date, country],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, date, country });
    }
  );
});

app.delete('/api/holidays/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM holidays WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Holiday not found' });
    res.json({ message: 'Holiday deleted successfully' });
  });
});

// --- Vacations API ---
app.get('/api/vacations', (req, res) => {
  db.all('SELECT * FROM vacations ORDER BY start_date', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/vacations', (req, res) => {
  const { employeeId, employeeName, startDate, endDate, type } = req.body;
  if (!employeeId || !employeeName || !startDate || !endDate) {
    return res.status(400).json({ error: 'Employee ID, name, start date, and end date are required' });
  }
  
  const id = Date.now().toString();
  db.run(
    'INSERT INTO vacations (id, employee_id, employee_name, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
    [id, employeeId, employeeName, startDate, endDate],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        id, 
        employeeId, 
        employeeName, 
        startDate, 
        endDate, 
        type: type || 'vacation' 
      });
    }
  );
});

app.delete('/api/vacations/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM vacations WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Vacation not found' });
    res.json({ message: 'Vacation deleted successfully' });
  });
});

// --- Project Allocations API ---
app.get('/api/project-allocations', (req, res) => {
  db.all('SELECT * FROM project_allocations ORDER BY date', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Transform the data to match the expected API format
    const transformedRows = rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      projectId: row.project_id,
      startDate: row.date, // Using date as startDate for compatibility
      endDate: row.date,   // Using date as endDate for compatibility
      hoursPerDay: row.hours || 8,
      status: row.status || 'active'
    }));
    res.json(transformedRows);
  });
});

app.post('/api/project-allocations', (req, res) => {
  const { employeeId, projectId, startDate, endDate, hoursPerDay, status } = req.body;
  if (!employeeId || !projectId || !startDate) {
    return res.status(400).json({ error: 'Employee ID, project ID, and start date are required' });
  }
  
  db.run(
    'INSERT INTO project_allocations (employeeId, projectId, startDate, endDate, hoursPerDay, status) VALUES (?, ?, ?, ?, ?, ?)',
    [employeeId, projectId, startDate, endDate || startDate, hoursPerDay || 8, status || 'active'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ 
        id: this.lastID, 
        employeeId, 
        projectId, 
        startDate, 
        endDate: endDate || startDate,
        hoursPerDay: hoursPerDay || 8, 
        status: status || 'active' 
      });
    }
  );
});

app.put('/api/project-allocations/:id', (req, res) => {
  const { id } = req.params;
  const { employeeId, projectId, startDate, endDate, hoursPerDay, status } = req.body;
  
  db.run(
    'UPDATE project_allocations SET employeeId = ?, projectId = ?, startDate = ?, endDate = ?, hoursPerDay = ?, status = ? WHERE id = ?',
    [employeeId, projectId, startDate, endDate, hoursPerDay || 8, status || 'active', id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Project allocation not found' });
      res.json({ 
        id, 
        employeeId, 
        projectId, 
        startDate, 
        endDate,
        hoursPerDay: hoursPerDay || 8, 
        status: status || 'active' 
      });
    }
  );
});

app.delete('/api/project-allocations/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM project_allocations WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Project allocation not found' });
    res.json({ message: 'Project allocation deleted successfully' });
  });
});

// --- Settings API ---
app.get('/api/settings', (req, res) => {
  db.all('SELECT key, value FROM settings', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  });
});

app.put('/api/settings', (req, res) => {
  const { buffer, canadaHours, brazilHours } = req.body;
  
  const updates = [];
  if (buffer !== undefined) updates.push(['buffer', buffer]);
  if (canadaHours !== undefined) updates.push(['canadaHours', canadaHours]);
  if (brazilHours !== undefined) updates.push(['brazilHours', brazilHours]);
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No settings to update' });
  }
  
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  updates.forEach(([key, value]) => {
    stmt.run(key, value);
  });
  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Settings updated successfully' });
  });
});

// --- Data Export/Import API ---
app.get('/api/export', (req, res) => {
  const data = {};
  
  db.all('SELECT * FROM team_members', [], (err, teamMembers) => {
    if (err) return res.status(500).json({ error: err.message });
    data.teamMembers = teamMembers;
    
    db.all('SELECT * FROM projects', [], (err, projects) => {
      if (err) return res.status(500).json({ error: err.message });
      data.projects = projects;
      
      db.all('SELECT * FROM holidays', [], (err, holidays) => {
        if (err) return res.status(500).json({ error: err.message });
        data.holidays = holidays;
        
        db.all('SELECT * FROM vacations', [], (err, vacations) => {
          if (err) return res.status(500).json({ error: err.message });
          data.vacations = vacations;
          
          db.all('SELECT * FROM project_allocations', [], (err, allocations) => {
            if (err) return res.status(500).json({ error: err.message });
            data.projectAllocations = allocations;
            
            db.all('SELECT key, value FROM settings', [], (err, settings) => {
              if (err) return res.status(500).json({ error: err.message });
              data.settings = {};
              settings.forEach(row => {
                data.settings[row.key] = row.value;
              });
              
              res.json(data);
            });
          });
        });
      });
    });
  });
});

app.post('/api/import', (req, res) => {
  const { teamMembers, projects, holidays, vacations, projectAllocations, settings } = req.body;
  
  // Clear existing data
  db.run('DELETE FROM team_members', [], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.run('DELETE FROM projects', [], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run('DELETE FROM holidays', [], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.run('DELETE FROM vacations', [], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          
          db.run('DELETE FROM project_allocations', [], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Import new data
            const importData = () => {
              // Import team members
              if (teamMembers && teamMembers.length > 0) {
                const stmt = db.prepare('INSERT INTO team_members (name, role, country, allocatedHours) VALUES (?, ?, ?, ?)');
                teamMembers.forEach(member => {
                  stmt.run(member.name, member.role, member.country, member.allocatedHours || 0);
                });
                stmt.finalize();
              }
              
              // Import projects
              if (projects && projects.length > 0) {
                const stmt = db.prepare('INSERT INTO projects (id, name, start_date, end_date, color) VALUES (?, ?, ?, ?, ?)');
                projects.forEach(project => {
                  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                  stmt.run(id, project.name, project.startDate, project.endDate, project.color || '#3b82f6');
                });
                stmt.finalize();
              }
              
              // Import holidays
              if (holidays && holidays.length > 0) {
                const stmt = db.prepare('INSERT INTO holidays (name, date, country) VALUES (?, ?, ?)');
                holidays.forEach(holiday => {
                  stmt.run(holiday.name, holiday.date, holiday.country);
                });
                stmt.finalize();
              }
              
              // Import vacations
              if (vacations && vacations.length > 0) {
                const stmt = db.prepare('INSERT INTO vacations (id, employee_id, employee_name, start_date, end_date) VALUES (?, ?, ?, ?, ?)');
                vacations.forEach(vacation => {
                  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                  stmt.run(id, vacation.employeeId, vacation.employeeName, vacation.startDate, vacation.endDate);
                });
                stmt.finalize();
              }
              
              // Import project allocations
              if (projectAllocations && projectAllocations.length > 0) {
                const stmt = db.prepare('INSERT INTO project_allocations (employeeId, projectId, startDate, endDate, hoursPerDay, status) VALUES (?, ?, ?, ?, ?, ?)');
                projectAllocations.forEach(allocation => {
                  stmt.run(allocation.employeeId, allocation.projectId, allocation.startDate, allocation.endDate, allocation.hoursPerDay || 8, allocation.status || 'active');
                });
                stmt.finalize();
              }
              
              // Import settings
              if (settings) {
                const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
                Object.entries(settings).forEach(([key, value]) => {
                  stmt.run(key, value);
                });
                stmt.finalize();
              }
              
              res.json({ message: 'Data imported successfully' });
            };
            
            importData();
          });
        });
      });
    });
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running at http://127.0.0.1:${PORT}`);
  console.log('API endpoints available:');
  console.log('- GET  /api/hello');
  console.log('- GET  /api/team-members');
  console.log('- POST /api/team-members');
  console.log('- PUT  /api/team-members/:id');
  console.log('- DELETE /api/team-members/:id');
  console.log('- GET  /api/projects');
  console.log('- POST /api/projects');
  console.log('- PUT  /api/projects/:id');
  console.log('- DELETE /api/projects/:id');
  console.log('- GET  /api/holidays');
  console.log('- POST /api/holidays');
  console.log('- DELETE /api/holidays/:id');
  console.log('- GET  /api/vacations');
  console.log('- POST /api/vacations');
  console.log('- DELETE /api/vacations/:id');
  console.log('- GET  /api/project-allocations');
  console.log('- POST /api/project-allocations');
  console.log('- PUT  /api/project-allocations/:id');
  console.log('- DELETE /api/project-allocations/:id');
  console.log('- GET  /api/settings');
  console.log('- PUT  /api/settings');
  console.log('- GET  /api/export');
  console.log('- POST /api/import');
}); 