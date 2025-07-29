const API_BASE_URL = 'http://127.0.0.1:3001/api';

async function testImport() {
  console.log('🧪 Testing Import Functionality...\n');
  
  const testData = {
    teamMembers: [{
      name: 'Import Test User',
      role: 'Developer',
      country: 'Canada',
      allocatedHours: 40
    }],
    projects: [{
      name: 'Import Test Project',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      color: '#ff0000'
    }],
    holidays: [{
      name: 'Import Test Holiday',
      date: '2024-12-25',
      country: 'Both'
    }],
    vacations: [{
      employeeId: 'import-1',
      employeeName: 'Import Test User',
      startDate: '2024-07-01',
      endDate: '2024-07-15',
      type: 'vacation'
    }],
    projectAllocations: [{
      employeeId: 'import-1',
      projectId: 'import-1',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      hoursPerDay: 8,
      status: 'active'
    }],
    settings: {
      buffer: "15",
      canadaHours: "40",
      brazilHours: "44"
    }
  };

  try {
    console.log('📤 Sending import data...');
    const response = await fetch(`${API_BASE_URL}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Import successful!');
      console.log('📊 Result:', result);
      
      // Test export to verify data was imported
      console.log('\n📥 Testing export...');
      const exportResponse = await fetch(`${API_BASE_URL}/export`);
      const exportData = await exportResponse.json();
      
      if (exportResponse.ok) {
        console.log('✅ Export successful!');
        console.log('📊 Imported data count:');
        console.log(`   Team Members: ${exportData.teamMembers.length}`);
        console.log(`   Projects: ${exportData.projects.length}`);
        console.log(`   Holidays: ${exportData.holidays.length}`);
        console.log(`   Vacations: ${exportData.vacations.length}`);
        console.log(`   Project Allocations: ${exportData.projectAllocations.length}`);
        console.log(`   Settings: ${Object.keys(exportData.settings).length}`);
      } else {
        console.log('❌ Export failed:', exportData);
      }
    } else {
      console.log('❌ Import failed:', result);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Start the test
testImport(); 