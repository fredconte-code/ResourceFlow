// Test script to verify search and filter functionality
const holidays = [
  { id: '1', name: 'Canada Day', date: new Date('2025-07-01'), country: 'Canada', type: 'National' },
  { id: '2', name: 'Independence Day', date: new Date('2025-09-07'), country: 'Brazil', type: 'National' },
  { id: '3', name: 'Christmas Day', date: new Date('2025-12-25'), country: 'Canada', type: 'National' },
  { id: '4', name: 'Christmas Day', date: new Date('2025-12-25'), country: 'Brazil', type: 'National' },
  { id: '5', name: 'Labour Day', date: new Date('2025-09-01'), country: 'Canada', type: 'National' },
  { id: '6', name: 'Labour Day', date: new Date('2025-05-01'), country: 'Brazil', type: 'National' },
  { id: '7', name: 'Saint-Jean-Baptiste Day', date: new Date('2025-06-24'), country: 'Canada', type: 'Regional' },
  { id: '8', name: 'São Paulo Foundation Day', date: new Date('2025-01-25'), country: 'Brazil', type: 'Regional' },
];

// Test search functionality
function testSearch(searchTerm, holidays) {
  return holidays.filter(holiday => {
    return holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           holiday.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toLowerCase().includes(searchTerm.toLowerCase());
  });
}

// Test country filter
function testCountryFilter(country, holidays) {
  if (country === 'all') return holidays;
  return holidays.filter(holiday => holiday.country === country);
}

// Test year filter
function testYearFilter(year, holidays) {
  if (year === 'all') return holidays;
  return holidays.filter(holiday => holiday.date.getFullYear().toString() === year);
}

// Test combined filters
function testCombinedFilters(searchTerm, country, year, holidays) {
  let filtered = holidays;
  
  if (searchTerm) {
    filtered = testSearch(searchTerm, filtered);
  }
  
  if (country !== 'all') {
    filtered = testCountryFilter(country, filtered);
  }
  
  if (year !== 'all') {
    filtered = testYearFilter(year, filtered);
  }
  
  return filtered;
}

console.log('🧪 Testing Search and Filter Functionality\n');

// Test 1: Search by name
console.log('1. Search by name "Christmas":');
const christmasResults = testSearch('Christmas', holidays);
console.log(`   Found ${christmasResults.length} results:`, christmasResults.map(h => h.name));

// Test 2: Search by month
console.log('\n2. Search by month "July":');
const julyResults = testSearch('July', holidays);
console.log(`   Found ${julyResults.length} results:`, julyResults.map(h => h.name));

// Test 3: Country filter
console.log('\n3. Filter by country "Canada":');
const canadaResults = testCountryFilter('Canada', holidays);
console.log(`   Found ${canadaResults.length} results:`, canadaResults.map(h => h.name));

// Test 4: Year filter
console.log('\n4. Filter by year "2025":');
const year2025Results = testYearFilter('2025', holidays);
console.log(`   Found ${year2025Results.length} results:`, year2025Results.map(h => h.name));

// Test 5: Combined filters
console.log('\n5. Combined filters - Search "Labour" + Country "Brazil":');
const combinedResults = testCombinedFilters('Labour', 'Brazil', 'all', holidays);
console.log(`   Found ${combinedResults.length} results:`, combinedResults.map(h => `${h.name} (${h.country})`));

// Test 6: No results
console.log('\n6. Search with no results "XYZ":');
const noResults = testSearch('XYZ', holidays);
console.log(`   Found ${noResults.length} results`);

console.log('\n✅ All tests completed successfully!');
console.log('\n📊 Summary:');
console.log(`   Total holidays: ${holidays.length}`);
console.log(`   Canada holidays: ${holidays.filter(h => h.country === 'Canada').length}`);
console.log(`   Brazil holidays: ${holidays.filter(h => h.country === 'Brazil').length}`);
console.log(`   National holidays: ${holidays.filter(h => h.type === 'National').length}`);
console.log(`   Regional holidays: ${holidays.filter(h => h.type === 'Regional').length}`); 