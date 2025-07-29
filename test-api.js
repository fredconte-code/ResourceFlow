const API_BASE_URL = 'http://127.0.0.1:3001/api';

// Test API helper function
async function testApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Testing ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Success:', data);
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Test functions
async function testHello() {
  console.log('\n=== Testing Hello Endpoint ===');
  await testApi('/hello');
}

async function testTeamMembers() {
  console.log('\n=== Testing Team Members API ===');
  
  // Test GET all team members
  console.log('\n1. Getting all team members...');
  const members = await testApi('/team-members');
  
  // Test POST new team member
  console.log('\n2. Creating a new team member...');
  const newMember = await testApi('/team-members', {
    method: 'POST',
    body: JSON.stringify({
      name: 'John Doe',
      role: 'Developer',
      country: 'Canada',
      allocatedHours: 40
    })
  });
  
  // Test PUT update team member
  console.log('\n3. Updating team member...');
  const updatedMember = await testApi(`/team-members/${newMember.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'John Doe Updated',
      role: 'Senior Developer',
      country: 'Canada',
      allocatedHours: 45
    })
  });
  
  // Test DELETE team member
  console.log('\n4. Deleting team member...');
  await testApi(`/team-members/${newMember.id}`, {
    method: 'DELETE'
  });
}

async function testProjects() {
  console.log('\n=== Testing Projects API ===');
  
  // Test GET all projects
  console.log('\n1. Getting all projects...');
  const projects = await testApi('/projects');
  
  // Test POST new project
  console.log('\n2. Creating a new project...');
  const newProject = await testApi('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Project',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      color: '#3b82f6',
      allocatedHours: 100
    })
  });
  
  // Test PUT update project
  console.log('\n3. Updating project...');
  const updatedProject = await testApi(`/projects/${newProject.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Updated Test Project',
      startDate: '2024-02-01',
      endDate: '2024-11-30',
      color: '#10b981',
      allocatedHours: 120
    })
  });
  
  // Test DELETE project
  console.log('\n4. Deleting project...');
  await testApi(`/projects/${newProject.id}`, {
    method: 'DELETE'
  });
}

async function testSettings() {
  console.log('\n=== Testing Settings API ===');
  
  // Test GET settings
  console.log('\n1. Getting settings...');
  const settings = await testApi('/settings');
  
  // Test PUT update settings
  console.log('\n2. Updating settings...');
  const updatedSettings = await testApi('/settings', {
    method: 'PUT',
    body: JSON.stringify({
      buffer: 15,
      canadaHours: 40,
      brazilHours: 44
    })
  });
}

async function testDataExport() {
  console.log('\n=== Testing Data Export/Import API ===');
  
  // Test GET export
  console.log('\n1. Exporting data...');
  const exportedData = await testApi('/export');
  console.log('Exported data structure:', Object.keys(exportedData));
  
  // Test POST import (with the same data)
  console.log('\n2. Importing data...');
  const importResult = await testApi('/import', {
    method: 'POST',
    body: JSON.stringify(exportedData)
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  try {
    await testHello();
    await testTeamMembers();
    await testProjects();
    await testSettings();
    await testDataExport();
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}

module.exports = { runTests }; 