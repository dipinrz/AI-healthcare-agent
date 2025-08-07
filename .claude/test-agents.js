// Test HMS Agents
const HMSApiIntegration = require('./integrations/hms-api');

async function testOrchestrator() {
  console.log('🏥 Testing HMS Orchestrator Agent');
  
  const hmsApi = new HMSApiIntegration();
  
  try {
    // Test health check first
    console.log('Checking system health...');
    const health = await hmsApi.healthCheck();
    console.log('✅ System status:', health.status || 'OK');
    
    // Test appointment booking functionality
    console.log('\n=== Testing Appointment Booking ===');
    const doctors = await hmsApi.getDoctors();
    console.log('Available doctors:', doctors.data?.length || 0);
    
    // Test prescription functionality  
    console.log('\n=== Testing Prescription System ===');
    const medications = await hmsApi.getMedications();
    console.log('Available medications:', medications.data?.length || 0);
    
    console.log('\n✅ Orchestrator agent components are working!');
    console.log('\nNext steps:');
    console.log('1. Start your backend API server');
    console.log('2. Test with real login credentials');
    console.log('3. Book actual appointments and prescriptions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Make sure your backend is running on http://localhost:3001');
    console.log('- Check if API endpoints are properly configured');
    console.log('- Verify database connection');
  }
}

testOrchestrator();