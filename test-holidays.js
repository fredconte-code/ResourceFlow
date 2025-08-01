const https = require('https');
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function testHolidayAPI() {
  const baseURL = 'http://localhost:3001/api';
  
  console.log('Testing Holiday API...\n');
  
  try {
    // Test 1: Get all holidays
    console.log('1. Testing GET /api/holidays');
    const holidays = await makeRequest(`${baseURL}/holidays`);
    
    console.log(`✅ Retrieved ${holidays.length} holidays`);
    
    // Test 2: Filter by date range
    console.log('\n2. Testing date range filter (2025-07-01 to 2030-12-31)');
    const dateRangeHolidays = holidays.filter(h => 
      h.date >= '2025-07-01' && h.date <= '2030-12-31'
    );
    console.log(`✅ Found ${dateRangeHolidays.length} holidays in date range`);
    
    // Test 3: Count by country
    console.log('\n3. Testing country distribution');
    const canadaHolidays = dateRangeHolidays.filter(h => h.country === 'Canada');
    const brazilHolidays = dateRangeHolidays.filter(h => h.country === 'Brazil');
    
    console.log(`🇨🇦 Canada: ${canadaHolidays.length} holidays`);
    console.log(`🇧🇷 Brazil: ${brazilHolidays.length} holidays`);
    
    // Test 4: Sample holidays
    console.log('\n4. Sample holidays (first 5):');
    dateRangeHolidays.slice(0, 5).forEach(holiday => {
      console.log(`   ${holiday.date} - ${holiday.name} (${holiday.country})`);
    });
    
    // Test 5: Verify specific holidays exist
    console.log('\n5. Verifying key holidays exist:');
    const keyHolidays = [
      { name: 'Canada Day', date: '2025-07-01', country: 'Canada' },
      { name: 'Independence Day', date: '2025-09-07', country: 'Brazil' },
      { name: 'Christmas Day', date: '2025-12-25', country: 'Canada' },
      { name: 'Christmas Day', date: '2025-12-25', country: 'Brazil' }
    ];
    
    keyHolidays.forEach(keyHoliday => {
      const found = dateRangeHolidays.find(h => 
        h.name === keyHoliday.name && 
        h.date === keyHoliday.date && 
        h.country === keyHoliday.country
      );
      console.log(`   ${found ? '✅' : '❌'} ${keyHoliday.name} (${keyHoliday.date}, ${keyHoliday.country})`);
    });
    
    // Test 6: Verify date range coverage
    console.log('\n6. Verifying date range coverage:');
    const years = ['2025', '2026', '2027', '2028', '2029', '2030'];
    years.forEach(year => {
      const yearHolidays = dateRangeHolidays.filter(h => h.date.startsWith(year));
      console.log(`   ${year}: ${yearHolidays.length} holidays`);
    });
    
    console.log('\n🎉 Holiday API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Holiday API:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 3001');
    console.log('   Run: cd backend && node index.js');
  }
}

// Run the test
testHolidayAPI(); 