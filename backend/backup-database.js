const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'resourceflow.db');
const db = new sqlite3.Database(dbPath);

// Backup directory
const backupDir = path.join(__dirname, 'database-backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

console.log('🔄 Starting database backup...');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Function to export table data
function exportTable(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        console.error(`❌ Error exporting ${tableName}:`, err.message);
        reject(err);
      } else {
        console.log(`✅ Exported ${tableName}: ${rows.length} records`);
        resolve(rows);
      }
    });
  });
}

// Function to create backup
async function createBackup() {
  try {
    console.log('📊 Exporting database tables...\n');
    
    // Export all tables
    const [teamMembers, projects, holidays, vacations, allocations, settings] = await Promise.all([
      exportTable('team_members'),
      exportTable('projects'),
      exportTable('holidays'),
      exportTable('vacations'),
      exportTable('project_allocations'),
      exportTable('settings')
    ]);
    
    // Create backup object
    const backup = {
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0',
        description: 'ResourceFlow Database Backup'
      },
      data: {
        teamMembers,
        projects,
        holidays,
        vacations,
        projectAllocations: allocations,
        settings
      },
      summary: {
        teamMembers: teamMembers.length,
        projects: projects.length,
        holidays: holidays.length,
        vacations: vacations.length,
        projectAllocations: allocations.length,
        settings: settings.length
      }
    };
    
    // Save to file
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log('\n🎉 Backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log('\n📈 Data Summary:');
    console.log(`   👥 Team Members: ${backup.summary.teamMembers}`);
    console.log(`   📋 Projects: ${backup.summary.projects}`);
    console.log(`   🎉 Holidays: ${backup.summary.holidays}`);
    console.log(`   🏖️  Vacations: ${backup.summary.vacations}`);
    console.log(`   🔗 Allocations: ${backup.summary.projectAllocations}`);
    console.log(`   ⚙️  Settings: ${backup.summary.settings}`);
    
    // Also create a latest backup
    const latestBackupFile = path.join(backupDir, 'latest-backup.json');
    fs.writeFileSync(latestBackupFile, JSON.stringify(backup, null, 2));
    console.log(`📄 Latest backup: ${latestBackupFile}`);
    
    return backup;
    
  } catch (error) {
    console.error('💥 Error creating backup:', error);
    throw error;
  }
}

// Function to restore from backup
async function restoreFromBackup(backupFile) {
  try {
    console.log(`🔄 Restoring from backup: ${backupFile}`);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    const { data } = backupData;
    
    // Clear existing data
    const tables = ['team_members', 'projects', 'holidays', 'vacations', 'project_allocations'];
    for (const table of tables) {
      await new Promise((resolve, reject) => {
        db.run(`DELETE FROM ${table}`, [], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    // Restore data
    console.log('📥 Restoring data...');
    
    // Restore team members
    if (data.teamMembers && data.teamMembers.length > 0) {
      const stmt = db.prepare('INSERT INTO team_members (name, role, country, allocated_hours) VALUES (?, ?, ?, ?)');
      data.teamMembers.forEach(member => {
        stmt.run(member.name, member.role, member.country, member.allocated_hours);
      });
      stmt.finalize();
      console.log(`✅ Restored ${data.teamMembers.length} team members`);
    }
    
    // Restore projects
    if (data.projects && data.projects.length > 0) {
      const stmt = db.prepare('INSERT INTO projects (name, start_date, end_date, color, status) VALUES (?, ?, ?, ?, ?)');
      data.projects.forEach(project => {
        stmt.run(project.name, project.start_date, project.end_date, project.color, project.status);
      });
      stmt.finalize();
      console.log(`✅ Restored ${data.projects.length} projects`);
    }
    
    // Restore holidays
    if (data.holidays && data.holidays.length > 0) {
      const stmt = db.prepare('INSERT INTO holidays (name, date, country) VALUES (?, ?, ?)');
      data.holidays.forEach(holiday => {
        stmt.run(holiday.name, holiday.date, holiday.country);
      });
      stmt.finalize();
      console.log(`✅ Restored ${data.holidays.length} holidays`);
    }
    
    // Restore vacations
    if (data.vacations && data.vacations.length > 0) {
      const stmt = db.prepare('INSERT INTO vacations (employee_id, employee_name, start_date, end_date, type) VALUES (?, ?, ?, ?, ?)');
      data.vacations.forEach(vacation => {
        stmt.run(vacation.employee_id, vacation.employee_name, vacation.start_date, vacation.end_date, vacation.type);
      });
      stmt.finalize();
      console.log(`✅ Restored ${data.vacations.length} vacations`);
    }
    
    // Restore allocations
    if (data.projectAllocations && data.projectAllocations.length > 0) {
      const stmt = db.prepare('INSERT INTO project_allocations (employee_id, project_id, start_date, end_date, hours_per_day, status) VALUES (?, ?, ?, ?, ?, ?)');
      data.projectAllocations.forEach(allocation => {
        stmt.run(allocation.employee_id, allocation.project_id, allocation.start_date, allocation.end_date, allocation.hours_per_day, allocation.status);
      });
      stmt.finalize();
      console.log(`✅ Restored ${data.projectAllocations.length} allocations`);
    }
    
    console.log('🎉 Database restoration completed!');
    
  } catch (error) {
    console.error('💥 Error restoring backup:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === 'restore' && args[1]) {
      await restoreFromBackup(args[1]);
    } else {
      await createBackup();
    }
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
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

// Show usage if no arguments
if (process.argv.length < 3) {
  console.log('📖 Usage:');
  console.log('  node backup-database.js                    # Create backup');
  console.log('  node backup-database.js restore <file>     # Restore from backup');
  console.log('');
  console.log('📁 Backups will be saved to: database-backups/');
  process.exit(0);
}

// Run the script
main(); 