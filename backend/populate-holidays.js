const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, 'resourceflow.db');
const db = new sqlite3.Database(dbPath);

// Holiday data structure
const holidays = [
  // Canada National Holidays
  { name: 'Canada Day', date: '2025-07-01', country: 'Canada' },
  { name: 'Labour Day', date: '2025-09-01', country: 'Canada' },
  { name: 'Thanksgiving Day', date: '2025-10-13', country: 'Canada' },
  { name: 'Remembrance Day', date: '2025-11-11', country: 'Canada' },
  { name: 'Christmas Day', date: '2025-12-25', country: 'Canada' },
  { name: 'Boxing Day', date: '2025-12-26', country: 'Canada' },
  
  { name: 'New Year\'s Day', date: '2026-01-01', country: 'Canada' },
  { name: 'Good Friday', date: '2026-04-03', country: 'Canada' },
  { name: 'Easter Monday', date: '2026-04-06', country: 'Canada' },
  { name: 'Victoria Day', date: '2026-05-18', country: 'Canada' },
  { name: 'Canada Day', date: '2026-07-01', country: 'Canada' },
  { name: 'Labour Day', date: '2026-09-07', country: 'Canada' },
  { name: 'Thanksgiving Day', date: '2026-10-12', country: 'Canada' },
  { name: 'Remembrance Day', date: '2026-11-11', country: 'Canada' },
  { name: 'Christmas Day', date: '2026-12-25', country: 'Canada' },
  { name: 'Boxing Day', date: '2026-12-26', country: 'Canada' },
  
  { name: 'New Year\'s Day', date: '2027-01-01', country: 'Canada' },
  { name: 'Good Friday', date: '2027-03-26', country: 'Canada' },
  { name: 'Easter Monday', date: '2027-03-29', country: 'Canada' },
  { name: 'Victoria Day', date: '2027-05-24', country: 'Canada' },
  { name: 'Canada Day', date: '2027-07-01', country: 'Canada' },
  { name: 'Labour Day', date: '2027-09-06', country: 'Canada' },
  { name: 'Thanksgiving Day', date: '2027-10-11', country: 'Canada' },
  { name: 'Remembrance Day', date: '2027-11-11', country: 'Canada' },
  { name: 'Christmas Day', date: '2027-12-25', country: 'Canada' },
  { name: 'Boxing Day', date: '2027-12-26', country: 'Canada' },
  
  { name: 'New Year\'s Day', date: '2028-01-01', country: 'Canada' },
  { name: 'Good Friday', date: '2028-04-14', country: 'Canada' },
  { name: 'Easter Monday', date: '2028-04-17', country: 'Canada' },
  { name: 'Victoria Day', date: '2028-05-22', country: 'Canada' },
  { name: 'Canada Day', date: '2028-07-01', country: 'Canada' },
  { name: 'Labour Day', date: '2028-09-04', country: 'Canada' },
  { name: 'Thanksgiving Day', date: '2028-10-09', country: 'Canada' },
  { name: 'Remembrance Day', date: '2028-11-11', country: 'Canada' },
  { name: 'Christmas Day', date: '2028-12-25', country: 'Canada' },
  { name: 'Boxing Day', date: '2028-12-26', country: 'Canada' },
  
  { name: 'New Year\'s Day', date: '2029-01-01', country: 'Canada' },
  { name: 'Good Friday', date: '2029-03-30', country: 'Canada' },
  { name: 'Easter Monday', date: '2029-04-02', country: 'Canada' },
  { name: 'Victoria Day', date: '2029-05-21', country: 'Canada' },
  { name: 'Canada Day', date: '2029-07-01', country: 'Canada' },
  { name: 'Labour Day', date: '2029-09-03', country: 'Canada' },
  { name: 'Thanksgiving Day', date: '2029-10-08', country: 'Canada' },
  { name: 'Remembrance Day', date: '2029-11-11', country: 'Canada' },
  { name: 'Christmas Day', date: '2029-12-25', country: 'Canada' },
  { name: 'Boxing Day', date: '2029-12-26', country: 'Canada' },
  
  { name: 'New Year\'s Day', date: '2030-01-01', country: 'Canada' },
  { name: 'Good Friday', date: '2030-04-19', country: 'Canada' },
  { name: 'Easter Monday', date: '2030-04-22', country: 'Canada' },
  { name: 'Victoria Day', date: '2030-05-20', country: 'Canada' },
  { name: 'Canada Day', date: '2030-07-01', country: 'Canada' },
  { name: 'Labour Day', date: '2030-09-02', country: 'Canada' },
  { name: 'Thanksgiving Day', date: '2030-10-14', country: 'Canada' },
  { name: 'Remembrance Day', date: '2030-11-11', country: 'Canada' },
  { name: 'Christmas Day', date: '2030-12-25', country: 'Canada' },
  { name: 'Boxing Day', date: '2030-12-26', country: 'Canada' },

  // Quebec Regional Holidays
  { name: 'Saint-Jean-Baptiste Day', date: '2025-06-24', country: 'Canada' },
  { name: 'Saint-Jean-Baptiste Day', date: '2026-06-24', country: 'Canada' },
  { name: 'Saint-Jean-Baptiste Day', date: '2027-06-24', country: 'Canada' },
  { name: 'Saint-Jean-Baptiste Day', date: '2028-06-24', country: 'Canada' },
  { name: 'Saint-Jean-Baptiste Day', date: '2029-06-24', country: 'Canada' },
  { name: 'Saint-Jean-Baptiste Day', date: '2030-06-24', country: 'Canada' },

  // Montreal Municipal Holidays
  { name: 'Montreal Foundation Day', date: '2025-05-17', country: 'Canada' },
  { name: 'Montreal Foundation Day', date: '2026-05-17', country: 'Canada' },
  { name: 'Montreal Foundation Day', date: '2027-05-17', country: 'Canada' },
  { name: 'Montreal Foundation Day', date: '2028-05-17', country: 'Canada' },
  { name: 'Montreal Foundation Day', date: '2029-05-17', country: 'Canada' },
  { name: 'Montreal Foundation Day', date: '2030-05-17', country: 'Canada' },

  // Brazil National Holidays
  { name: 'New Year\'s Day', date: '2025-01-01', country: 'Brazil' },
  { name: 'Tiradentes Day', date: '2025-04-21', country: 'Brazil' },
  { name: 'Labour Day', date: '2025-05-01', country: 'Brazil' },
  { name: 'Independence Day', date: '2025-09-07', country: 'Brazil' },
  { name: 'Our Lady of Aparecida', date: '2025-10-12', country: 'Brazil' },
  { name: 'All Souls\' Day', date: '2025-11-02', country: 'Brazil' },
  { name: 'Proclamation of the Republic', date: '2025-11-15', country: 'Brazil' },
  { name: 'Christmas Day', date: '2025-12-25', country: 'Brazil' },
  
  { name: 'New Year\'s Day', date: '2026-01-01', country: 'Brazil' },
  { name: 'Tiradentes Day', date: '2026-04-21', country: 'Brazil' },
  { name: 'Labour Day', date: '2026-05-01', country: 'Brazil' },
  { name: 'Independence Day', date: '2026-09-07', country: 'Brazil' },
  { name: 'Our Lady of Aparecida', date: '2026-10-12', country: 'Brazil' },
  { name: 'All Souls\' Day', date: '2026-11-02', country: 'Brazil' },
  { name: 'Proclamation of the Republic', date: '2026-11-15', country: 'Brazil' },
  { name: 'Christmas Day', date: '2026-12-25', country: 'Brazil' },
  
  { name: 'New Year\'s Day', date: '2027-01-01', country: 'Brazil' },
  { name: 'Tiradentes Day', date: '2027-04-21', country: 'Brazil' },
  { name: 'Labour Day', date: '2027-05-01', country: 'Brazil' },
  { name: 'Independence Day', date: '2027-09-07', country: 'Brazil' },
  { name: 'Our Lady of Aparecida', date: '2027-10-12', country: 'Brazil' },
  { name: 'All Souls\' Day', date: '2027-11-02', country: 'Brazil' },
  { name: 'Proclamation of the Republic', date: '2027-11-15', country: 'Brazil' },
  { name: 'Christmas Day', date: '2027-12-25', country: 'Brazil' },
  
  { name: 'New Year\'s Day', date: '2028-01-01', country: 'Brazil' },
  { name: 'Tiradentes Day', date: '2028-04-21', country: 'Brazil' },
  { name: 'Labour Day', date: '2028-05-01', country: 'Brazil' },
  { name: 'Independence Day', date: '2028-09-07', country: 'Brazil' },
  { name: 'Our Lady of Aparecida', date: '2028-10-12', country: 'Brazil' },
  { name: 'All Souls\' Day', date: '2028-11-02', country: 'Brazil' },
  { name: 'Proclamation of the Republic', date: '2028-11-15', country: 'Brazil' },
  { name: 'Christmas Day', date: '2028-12-25', country: 'Brazil' },
  
  { name: 'New Year\'s Day', date: '2029-01-01', country: 'Brazil' },
  { name: 'Tiradentes Day', date: '2029-04-21', country: 'Brazil' },
  { name: 'Labour Day', date: '2029-05-01', country: 'Brazil' },
  { name: 'Independence Day', date: '2029-09-07', country: 'Brazil' },
  { name: 'Our Lady of Aparecida', date: '2029-10-12', country: 'Brazil' },
  { name: 'All Souls\' Day', date: '2029-11-02', country: 'Brazil' },
  { name: 'Proclamation of the Republic', date: '2029-11-15', country: 'Brazil' },
  { name: 'Christmas Day', date: '2029-12-25', country: 'Brazil' },
  
  { name: 'New Year\'s Day', date: '2030-01-01', country: 'Brazil' },
  { name: 'Tiradentes Day', date: '2030-04-21', country: 'Brazil' },
  { name: 'Labour Day', date: '2030-05-01', country: 'Brazil' },
  { name: 'Independence Day', date: '2030-09-07', country: 'Brazil' },
  { name: 'Our Lady of Aparecida', date: '2030-10-12', country: 'Brazil' },
  { name: 'All Souls\' Day', date: '2030-11-02', country: 'Brazil' },
  { name: 'Proclamation of the Republic', date: '2030-11-15', country: 'Brazil' },
  { name: 'Christmas Day', date: '2030-12-25', country: 'Brazil' },

  // São Paulo State Holidays
  { name: 'São Paulo Foundation Day', date: '2025-01-25', country: 'Brazil' },
  { name: 'São Paulo Foundation Day', date: '2026-01-25', country: 'Brazil' },
  { name: 'São Paulo Foundation Day', date: '2027-01-25', country: 'Brazil' },
  { name: 'São Paulo Foundation Day', date: '2028-01-25', country: 'Brazil' },
  { name: 'São Paulo Foundation Day', date: '2029-01-25', country: 'Brazil' },
  { name: 'São Paulo Foundation Day', date: '2030-01-25', country: 'Brazil' },

  // Campinas Municipal Holidays
  { name: 'Campinas Foundation Day', date: '2025-07-14', country: 'Brazil' },
  { name: 'Campinas Foundation Day', date: '2026-07-14', country: 'Brazil' },
  { name: 'Campinas Foundation Day', date: '2027-07-14', country: 'Brazil' },
  { name: 'Campinas Foundation Day', date: '2028-07-14', country: 'Brazil' },
  { name: 'Campinas Foundation Day', date: '2029-07-14', country: 'Brazil' },
  { name: 'Campinas Foundation Day', date: '2030-07-14', country: 'Brazil' },

  // Carnival (Brazil) - Variable dates but typically in February
  { name: 'Carnival Monday', date: '2025-03-03', country: 'Brazil' },
  { name: 'Carnival Tuesday', date: '2025-03-04', country: 'Brazil' },
  { name: 'Carnival Monday', date: '2026-02-16', country: 'Brazil' },
  { name: 'Carnival Tuesday', date: '2026-02-17', country: 'Brazil' },
  { name: 'Carnival Monday', date: '2027-02-08', country: 'Brazil' },
  { name: 'Carnival Tuesday', date: '2027-02-09', country: 'Brazil' },
  { name: 'Carnival Monday', date: '2028-02-28', country: 'Brazil' },
  { name: 'Carnival Tuesday', date: '2028-02-29', country: 'Brazil' },
  { name: 'Carnival Monday', date: '2029-02-12', country: 'Brazil' },
  { name: 'Carnival Tuesday', date: '2029-02-13', country: 'Brazil' },
  { name: 'Carnival Monday', date: '2030-02-25', country: 'Brazil' },
  { name: 'Carnival Tuesday', date: '2030-02-26', country: 'Brazil' },

  // Good Friday (Brazil) - Variable dates
  { name: 'Good Friday', date: '2025-04-18', country: 'Brazil' },
  { name: 'Good Friday', date: '2026-04-03', country: 'Brazil' },
  { name: 'Good Friday', date: '2027-03-26', country: 'Brazil' },
  { name: 'Good Friday', date: '2028-04-14', country: 'Brazil' },
  { name: 'Good Friday', date: '2029-03-30', country: 'Brazil' },
  { name: 'Good Friday', date: '2030-04-19', country: 'Brazil' },

  // Corpus Christi (Brazil) - Variable dates
  { name: 'Corpus Christi', date: '2025-06-19', country: 'Brazil' },
  { name: 'Corpus Christi', date: '2026-06-04', country: 'Brazil' },
  { name: 'Corpus Christi', date: '2027-05-27', country: 'Brazil' },
  { name: 'Corpus Christi', date: '2028-06-15', country: 'Brazil' },
  { name: 'Corpus Christi', date: '2029-05-31', country: 'Brazil' },
  { name: 'Corpus Christi', date: '2030-06-20', country: 'Brazil' }
];

// Function to insert holidays
function insertHolidays() {
  console.log('Starting holiday population...');
  
  // First, clear existing holidays in the date range
  const clearQuery = `
    DELETE FROM holidays 
    WHERE date >= '2025-07-01' AND date <= '2030-12-31'
  `;
  
  db.run(clearQuery, [], function(err) {
    if (err) {
      console.error('Error clearing existing holidays:', err.message);
      return;
    }
    console.log(`Cleared ${this.changes} existing holidays in the date range.`);
    
    // Insert new holidays
    const insertQuery = 'INSERT INTO holidays (name, date, country) VALUES (?, ?, ?)';
    let insertedCount = 0;
    let errorCount = 0;
    
    holidays.forEach((holiday, index) => {
      db.run(insertQuery, [holiday.name, holiday.date, holiday.country], function(err) {
        if (err) {
          console.error(`Error inserting holiday ${holiday.name} (${holiday.date}):`, err.message);
          errorCount++;
        } else {
          insertedCount++;
        }
        
        // Check if this is the last holiday
        if (index === holidays.length - 1) {
          console.log(`\nHoliday population completed!`);
          console.log(`✅ Successfully inserted: ${insertedCount} holidays`);
          console.log(`❌ Errors: ${errorCount} holidays`);
          console.log(`\nTotal holidays added:`);
          console.log(`🇨🇦 Canada: ${holidays.filter(h => h.country === 'Canada').length}`);
          console.log(`🇧🇷 Brazil: ${holidays.filter(h => h.country === 'Brazil').length}`);
          console.log(`\nDate range: July 1, 2025 - December 31, 2030`);
          
          // Close database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            } else {
              console.log('Database connection closed.');
            }
          });
        }
      });
    });
  });
}

// Run the script
insertHolidays(); 