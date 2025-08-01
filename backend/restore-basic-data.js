const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'resourceflow.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starting basic data restoration...');

// Sample team members data
const teamMembers = [
  {
    name: 'Frederico Conte',
    role: 'Project Manager',
    country: 'Brazil',
    allocatedHours: 40
  },
  {
    name: 'John Smith',
    role: 'Senior Developer',
    country: 'Canada',
    allocatedHours: 37.5
  },
  {
    name: 'Maria Silva',
    role: 'Frontend Developer',
    country: 'Brazil',
    allocatedHours: 44
  },
  {
    name: 'David Johnson',
    role: 'Backend Developer',
    country: 'Canada',
    allocatedHours: 37.5
  },
  {
    name: 'Ana Costa',
    role: 'UI/UX Designer',
    country: 'Brazil',
    allocatedHours: 44
  }
];

// Sample projects data
const projects = [
  {
    name: 'ResourceFlow Platform',
    startDate: '2024-12-01',
    endDate: '2025-06-30',
    color: '#3b82f6',
    status: 'active'
  },
  {
    name: 'Mobile App Development',
    startDate: '2025-01-15',
    endDate: '2025-08-15',
    color: '#10b981',
    status: 'active'
  },
  {
    name: 'API Integration',
    startDate: '2025-02-01',
    endDate: '2025-05-31',
    color: '#f59e0b',
    status: 'active'
  },
  {
    name: 'Database Optimization',
    startDate: '2025-03-01',
    endDate: '2025-04-30',
    color: '#ef4444',
    status: 'active'
  }
];

// Function to insert team members
function insertTeamMembers() {
  return new Promise((resolve, reject) => {
    console.log('👥 Adding team members...');
    
    const stmt = db.prepare('INSERT INTO team_members (name, role, country, allocated_hours) VALUES (?, ?, ?, ?)');
    let inserted = 0;
    let errors = 0;
    
    teamMembers.forEach((member, index) => {
      stmt.run(member.name, member.role, member.country, member.allocatedHours, function(err) {
        if (err) {
          console.error(`❌ Error inserting team member ${member.name}:`, err.message);
          errors++;
        } else {
          inserted++;
          console.log(`✅ Added team member: ${member.name} (${member.role})`);
        }
        
        if (index === teamMembers.length - 1) {
          stmt.finalize();
          console.log(`📊 Team members: ${inserted} added, ${errors} errors\n`);
          resolve({ inserted, errors });
        }
      });
    });
  });
}

// Function to insert projects
function insertProjects() {
  return new Promise((resolve, reject) => {
    console.log('📋 Adding projects...');
    
    const stmt = db.prepare('INSERT INTO projects (name, start_date, end_date, color, status) VALUES (?, ?, ?, ?, ?)');
    let inserted = 0;
    let errors = 0;
    
    projects.forEach((project, index) => {
      stmt.run(project.name, project.startDate, project.endDate, project.color, project.status, function(err) {
        if (err) {
          console.error(`❌ Error inserting project ${project.name}:`, err.message);
          errors++;
        } else {
          inserted++;
          console.log(`✅ Added project: ${project.name}`);
        }
        
        if (index === projects.length - 1) {
          stmt.finalize();
          console.log(`📊 Projects: ${inserted} added, ${errors} errors\n`);
          resolve({ inserted, errors });
        }
      });
    });
  });
}

// Function to add some sample allocations
function insertSampleAllocations() {
  return new Promise((resolve, reject) => {
    console.log('🔗 Adding sample project allocations...');
    
    // Get team members and projects IDs
    db.all('SELECT id, name FROM team_members', [], (err, members) => {
      if (err) {
        console.error('❌ Error fetching team members:', err.message);
        resolve({ inserted: 0, errors: 1 });
        return;
      }
      
      db.all('SELECT id, name FROM projects', [], (err, projs) => {
        if (err) {
          console.error('❌ Error fetching projects:', err.message);
          resolve({ inserted: 0, errors: 1 });
          return;
        }
        
        if (members.length === 0 || projs.length === 0) {
          console.log('⚠️  No team members or projects found, skipping allocations');
          resolve({ inserted: 0, errors: 0 });
          return;
        }
        
        const stmt = db.prepare('INSERT INTO project_allocations (employee_id, project_id, start_date, end_date, hours_per_day) VALUES (?, ?, ?, ?, ?)');
        let inserted = 0;
        let errors = 0;
        let allocationCount = 0;
        
        // Create some sample allocations
        members.forEach((member, memberIndex) => {
          const projectIndex = memberIndex % projs.length;
          const project = projs[projectIndex];
          
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + (memberIndex * 7)); // Stagger start dates
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 90); // 3 months duration
          
          stmt.run(
            member.id,
            project.id,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            8.0,
            function(err) {
              if (err) {
                console.error(`❌ Error inserting allocation for ${member.name} on ${project.name}:`, err.message);
                errors++;
              } else {
                inserted++;
                console.log(`✅ Allocated ${member.name} to ${project.name}`);
              }
              
              allocationCount++;
              if (allocationCount === members.length) {
                stmt.finalize();
                console.log(`📊 Allocations: ${inserted} added, ${errors} errors\n`);
                resolve({ inserted, errors });
              }
            }
          );
        });
      });
    });
  });
}

// Main execution
async function restoreData() {
  try {
    console.log('🚀 Starting data restoration process...\n');
    
    // Insert team members
    const teamResult = await insertTeamMembers();
    
    // Insert projects
    const projectResult = await insertProjects();
    
    // Insert sample allocations
    const allocationResult = await insertSampleAllocations();
    
    // Summary
    console.log('🎉 Data restoration completed!');
    console.log('📈 Summary:');
    console.log(`   👥 Team Members: ${teamResult.inserted} added`);
    console.log(`   📋 Projects: ${projectResult.inserted} added`);
    console.log(`   🔗 Allocations: ${allocationResult.inserted} added`);
    console.log(`   ❌ Total Errors: ${teamResult.errors + projectResult.errors + allocationResult.errors}`);
    
  } catch (error) {
    console.error('💥 Error during data restoration:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('🔒 Database connection closed.');
      }
    });
  }
}

// Run the restoration
restoreData(); 