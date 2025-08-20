// .claude/integrations/example-usage.js
const HMSApiIntegration = require('./hms-api');
const config = require('./config');

// Initialize API client
const hmsApi = new HMSApiIntegration(config.api.baseUrl);

// Example usage for different agents
class HMSExamples {
  
  // Example 1: Appointment Scheduler Agent Usage
  static async appointmentSchedulerExample() {
    try {
      console.log('=== Appointment Scheduler Agent Example ===');
      
      // 1. Login first
      const loginResult = await hmsApi.login('patient@example.com', 'password123');
      console.log('Login successful:', loginResult.success);

      // 2. Get available doctors
      const doctorsResult = await hmsApi.getDoctors();
      console.log('Available doctors:', doctorsResult.data?.length || 0);

      if (doctorsResult.data && doctorsResult.data.length > 0) {
        const doctor = doctorsResult.data[0];
        
        // 3. Check doctor availability
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        
        const availabilityResult = await hmsApi.getDoctorAvailability(doctor.id, dateStr);
        console.log('Available slots:', availabilityResult.data?.length || 0);

        if (availabilityResult.data && availabilityResult.data.length > 0) {
          const slot = availabilityResult.data[0];
          
          // 4. Book appointment
          const appointmentResult = await hmsApi.bookAppointment(
            doctor.id,
            slot.time,
            null,
            {
              reason: 'Regular checkup',
              type: 'consultation',
              duration: 30
            }
          );
          console.log('Appointment booked:', appointmentResult.success);
          return appointmentResult.data;
        }
      }
    } catch (error) {
      console.error('Appointment scheduling error:', error.message);
    }
  }

  // Example 2: Prescription Helper Agent Usage
  static async prescriptionHelperExample() {
    try {
      console.log('=== Prescription Helper Agent Example ===');
      
      // 1. Get patient's current prescriptions
      const prescriptionsResult = await hmsApi.getPrescriptions();
      console.log('Current prescriptions:', prescriptionsResult.data?.length || 0);

      // 2. Search for medications
      const medicationSearchResult = await hmsApi.searchMedications('lisinopril');
      console.log('Medication search results:', medicationSearchResult.data?.length || 0);

      // 3. Get medication information
      const medicationsResult = await hmsApi.getMedications();
      if (medicationsResult.data && medicationsResult.data.length > 0) {
        const medication = medicationsResult.data[0];
        console.log('Medication info:', {
          name: medication.name,
          form: medication.form,
          strength: medication.strength
        });
      }

      // 4. Create prescription (doctor role required)
      // This would typically be done by a doctor
      /*
      const newPrescription = await hmsApi.createPrescription({
        patientId: 'patient-id',
        medicationId: 'medication-id',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        quantity: 30,
        refills: 2,
        startDate: new Date()
      });
      */

    } catch (error) {
      console.error('Prescription helper error:', error.message);
    }
  }

  // Example 3: Patient Assistant Agent Usage
  static async patientAssistantExample() {
    try {
      console.log('=== Patient Assistant Agent Example ===');
      
      // 1. Get patient profile
      const profileResult = await hmsApi.getPatientProfile();
      console.log('Patient profile loaded:', !!profileResult.data);

      // 2. Get comprehensive health history
      const historyResult = await hmsApi.getPatientHistory();
      console.log('Health records loaded:', !!historyResult.data);

      // 3. Get patient summary (custom method)
      const summaryResult = await hmsApi.getPatientSummary();
      if (summaryResult.success) {
        console.log('Patient summary:', {
          hasProfile: !!summaryResult.data.patientInfo,
          recentAppointments: summaryResult.data.recentAppointments.length,
          activePrescriptions: summaryResult.data.activePrescriptions.length,
          chronicConditions: summaryResult.data.chronicConditions.length,
          allergies: summaryResult.data.allergies.length
        });
      }

      // 4. Send chat message for AI assistance
      const chatResult = await hmsApi.sendChatMessage(
        "I'm feeling anxious about my upcoming appointment. Can you help me prepare?"
      );
      console.log('AI chat response received:', !!chatResult.data?.message);

      // 5. Batch get all patient data
      const batchResult = await hmsApi.batchGetPatientData();
      console.log('Batch data loaded:', {
        appointments: batchResult.appointments.length,
        prescriptions: batchResult.prescriptions.length,
        healthRecord: !!batchResult.healthRecord
      });

    } catch (error) {
      console.error('Patient assistant error:', error.message);
    }
  }

  // Example 4: Hospital FAQ Agent Usage
  static async hospitalFaqExample() {
    try {
      console.log('=== Hospital FAQ Agent Example ===');
      
      // 1. Check system health
      const healthResult = await hmsApi.healthCheck();
      console.log('System status:', healthResult.status);

      // 2. Get system status summary
      const statusResult = await hmsApi.getSystemStatus();
      if (statusResult.success) {
        console.log('System summary:', {
          systemHealth: statusResult.data.systemHealth.status,
          availableDoctors: statusResult.data.availableDoctors,
          medicationDatabase: statusResult.data.medicationDatabase,
          lastChecked: statusResult.data.lastChecked
        });
      }

      // 3. Get all doctors for directory
      const allDoctorsResult = await hmsApi.getDoctors();
      console.log('Doctor directory:', allDoctorsResult.data?.length || 0);

      // 4. Get doctors by specialization
      const cardiologyResult = await hmsApi.getDoctors('Cardiology');
      console.log('Cardiology specialists:', cardiologyResult.data?.length || 0);

    } catch (error) {
      console.error('Hospital FAQ error:', error.message);
    }
  }

  // Example 5: Error Handling and Recovery
  static async errorHandlingExample() {
    try {
      console.log('=== Error Handling Example ===');
      
      // Test with invalid endpoint
      try {
        await hmsApi.api.get('/invalid-endpoint');
      } catch (error) {
        console.log('Handled API error:', error.message);
      }

      // Test with invalid authentication
      hmsApi.setAuthToken('invalid-token');
      try {
        await hmsApi.getPatientProfile();
      } catch (error) {
        console.log('Handled auth error:', error.message);
      }

      // Clear token and test
      hmsApi.clearAuthToken();
      try {
        await hmsApi.getAppointments();
      } catch (error) {
        console.log('Handled unauthorized error:', error.message);
      }

    } catch (error) {
      console.error('Error handling example failed:', error.message);
    }
  }

  // Run all examples
  static async runAllExamples() {
    console.log('🏥 HMS API Integration Examples\n');
    
    await this.appointmentSchedulerExample();
    console.log('\n');
    
    await this.prescriptionHelperExample();
    console.log('\n');
    
    await this.patientAssistantExample();
    console.log('\n');
    
    await this.hospitalFaqExample();
    console.log('\n');
    
    await this.errorHandlingExample();
    
    console.log('\n✅ All examples completed!');
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  HMSExamples.runAllExamples().catch(console.error);
}

module.exports = HMSExamples;