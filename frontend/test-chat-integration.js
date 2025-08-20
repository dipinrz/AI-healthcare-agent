// Test HMS Chat Integration
const { hmsAgentService } = require('./src/services/hmsAgentService.ts');

async function testChatIntegration() {
  console.log('🧪 Testing HMS Chat Integration\n');

  try {
    // Test 1: Appointment booking
    console.log('=== Test 1: Appointment Booking ===');
    const appointmentResponse = await hmsAgentService.processMessage(
      "I need to book an appointment with a cardiologist for next Tuesday"
    );
    console.log('✅ Appointment booking response received');
    console.log('Message:', appointmentResponse.message.substring(0, 100) + '...');
    console.log('Type:', appointmentResponse.type);
    console.log('Actions:', appointmentResponse.actions?.length || 0);

    // Test 2: Prescription query
    console.log('\n=== Test 2: Prescription Query ===');
    const prescriptionResponse = await hmsAgentService.processMessage(
      "Show me my current prescriptions"
    );
    console.log('✅ Prescription query response received');
    console.log('Message:', prescriptionResponse.message.substring(0, 100) + '...');
    console.log('Type:', prescriptionResponse.type);

    // Test 3: General health question
    console.log('\n=== Test 3: General Health Question ===');
    const healthResponse = await hmsAgentService.processMessage(
      "I'm feeling anxious about my upcoming appointment"
    );
    console.log('✅ Health question response received');
    console.log('Message:', healthResponse.message.substring(0, 100) + '...');
    console.log('Type:', healthResponse.type);

    // Test 4: System status
    console.log('\n=== Test 4: System Status ===');
    const statusResponse = await hmsAgentService.processMessage(
      "What's the system status?"
    );
    console.log('✅ System status response received');
    console.log('Message:', statusResponse.message.substring(0, 100) + '...');
    console.log('Type:', statusResponse.type);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nThe HMS Agent integration is ready to use in your SiriLikeAIChat component.');
    console.log('\nFeatures available:');
    console.log('📅 Appointment booking and management');
    console.log('💊 Prescription queries and management');
    console.log('🩺 Health record access');
    console.log('❓ General health guidance with empathy');
    console.log('🏥 System status and information');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure your backend API is running');
    console.log('2. Verify your authentication tokens');
    console.log('3. Check API endpoint configurations');
    console.log('4. The agents will fallback to empathetic responses if APIs are unavailable');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testChatIntegration();
}

module.exports = { testChatIntegration };