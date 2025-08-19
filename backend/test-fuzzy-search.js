// Simple test script for fuzzy search endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testFuzzySearch() {
  try {
    console.log('Testing fuzzy search by department...\n');

    // Test cases for fuzzy search
    const testCases = [
      'cardio',      // Should match "Cardiology"
      'neuro',       // Should match "Neurology" 
      'ortho',       // Should match "Orthopedics"
      'pediatric',   // Should match "Pediatrics"
      'derma',       // Should match "Dermatology"
      'psych',       // Should match "Psychiatry"
    ];

    // First, let's try to get a token by logging in
    console.log('Note: This test requires a running server and valid authentication.');
    console.log('Test cases that would be executed:');
    
    testCases.forEach((searchTerm, index) => {
      console.log(`${index + 1}. GET /api/doctors/search/department?q=${searchTerm}`);
    });

    console.log('\nExample cURL commands to test manually:');
    testCases.forEach((searchTerm) => {
      console.log(`curl -X GET "http://localhost:3001/api/doctors/search/department?q=${searchTerm}" \\`);
      console.log(`  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\`);
      console.log(`  -H "Content-Type: application/json"`);
      console.log('');
    });

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testFuzzySearch();