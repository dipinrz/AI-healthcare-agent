// HMS Agent Integration Service for SiriLikeAIChat
import hmsApiClient from './hmsApiClient';
import chatService from './chatService';

export interface AgentResponse {
  success: boolean;
  message: string;
  type: 'appointment' | 'prescription' | 'health' | 'general';
  data?: any;
  actions?: Array<{
    type: string;
    label: string;
    data: any;
  }>;
}

export interface AppointmentRequest {
  doctorId?: string;
  doctorName?: string;
  specialization?: string;
  date?: string;
  time?: string;
  type?: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason?: string;
  symptoms?: string;
}

class HMSAgentService {
  private isInitialized: boolean = false;

  constructor() {
    // Initialize will be called when needed
  }

  // Initialize the service with authentication
  async initialize(): Promise<boolean> {
    try {
      // Try to get existing auth token
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (token) {
        hmsApiClient.setAuthToken(token);
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('HMS Agent Service initialization error:', error);
      return false;
    }
  }

  // Process message through HMS agent system
  async processMessage(message: string): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const lowerMessage = message.toLowerCase();
    
    try {
      // Route to appropriate agent based on message content
      if (this.isAppointmentRelated(lowerMessage)) {
        return await this.handleAppointmentRequest(message);
      } else if (this.isPrescriptionRelated(lowerMessage)) {
        return await this.handlePrescriptionRequest(message);
      } else if (this.isHealthRecordRelated(lowerMessage)) {
        return await this.handleHealthRecordRequest(message);
      } else if (this.isSystemInfoRelated(lowerMessage)) {
        return await this.handleSystemInfoRequest(message);
      } else {
        // Fall back to general chat service
        return await this.handleGeneralChat(message);
      }
    } catch (error: any) {
      console.error('HMS Agent processing error:', error);
      
      // Handle authentication errors specifically
      if (error.message === 'authentication_expired' || 
          error.message.includes('Invalid or expired token') ||
          error.message.includes('authentication') ||
          error.message.includes('token')) {
        return {
          success: false,
          message: `🔐 Your session has expired. Please refresh the page and log in again to access all healthcare features.\n\nDon't worry - I'm still here to provide general health support and guidance! How can I help you today? 💙`,
          type: 'general',
          actions: [
            { type: 'refresh_page', label: 'Refresh Page', data: {} }
          ]
        };
      }
      
      return {
        success: false,
        message: `I apologize, but I'm having trouble accessing my healthcare systems right now. ${error.message || 'Please try again in a moment.'} 💙`,
        type: 'general'
      };
    }
  }

  // Handle appointment-related requests
  private async handleAppointmentRequest(message: string): Promise<AgentResponse> {
    const lowerMessage = message.toLowerCase();
    
    try {
      // Check availability request
      if (lowerMessage.includes('available') || lowerMessage.includes('availability')) {
        return await this.handleAvailabilityCheck(message);
      }
      
      // Cancel appointment
      if (lowerMessage.includes('cancel')) {
        return await this.handleAppointmentCancellation(message);
      }
      
      // Reschedule appointment  
      if (lowerMessage.includes('reschedule') || lowerMessage.includes('change')) {
        return await this.handleAppointmentReschedule(message);
      }
      
      // Book new appointment
      if (lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
        return await this.handleAppointmentBooking(message);
      }
      
      // View existing appointments
      if (lowerMessage.includes('my appointments') || lowerMessage.includes('scheduled')) {
        return await this.handleViewAppointments();
      }
      
      // Default to booking flow
      return await this.handleAppointmentBooking(message);
      
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble with the appointment system right now. ${error.message} Please try again or contact support if this continues. 📅`,
        type: 'appointment'
      };
    }
  }

  // Handle appointment booking
  private async handleAppointmentBooking(message: string): Promise<AgentResponse> {
    // Extract appointment details from message
    const appointmentRequest = this.parseAppointmentRequest(message);
    
    // Debug logging
    console.log('🔍 Parsed appointment request:', appointmentRequest);
    console.log('🔍 Original message:', message);
    
    // Get available doctors
    const doctorsResult = await hmsApiClient.getDoctors(appointmentRequest.specialization);
    
    if (!doctorsResult.success || !doctorsResult.data?.length) {
      return {
        success: false,
        message: `I couldn't find any ${appointmentRequest.specialization || 'available'} doctors right now. Let me check our system status and try again. 👨‍⚕️`,
        type: 'appointment'
      };
    }

    const doctors = doctorsResult.data;
    
    // If specific doctor requested, find them
    let selectedDoctor = null;
    if (appointmentRequest.doctorName) {
      selectedDoctor = doctors.find(d => 
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(appointmentRequest.doctorName!.toLowerCase()) ||
        d.specialization.toLowerCase().includes(appointmentRequest.doctorName!.toLowerCase())
      );
    } else {
      selectedDoctor = doctors[0]; // First available doctor
    }
    
    if (!selectedDoctor) {
      return {
        success: true,
        message: `I found ${doctors.length} available doctors for you:\n\n${doctors.slice(0, 3).map((d, i) => 
          `${i + 1}. Dr. ${d.firstName} ${d.lastName} - ${d.specialization}\n   📍 ${d.department} | 🎓 ${d.experience} years experience`
        ).join('\n\n')}\n\nWhich doctor would you prefer? Just tell me the number or name! 👨‍⚕️`,
        type: 'appointment',
        actions: doctors.slice(0, 3).map(d => ({
          type: 'select_doctor',
          label: `Dr. ${d.firstName} ${d.lastName}`,
          data: { doctorId: d.id, doctorName: `${d.firstName} ${d.lastName}` }
        }))
      };
    }

    // Check doctor availability
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = appointmentRequest.date || tomorrow.toISOString().split('T')[0];
    
    const availabilityResult = await hmsApiClient.getDoctorAvailability(selectedDoctor.id, dateStr);
    
    if (!availabilityResult.success || !availabilityResult.data?.length) {
      return {
        success: true,
        message: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName} doesn't have any available slots on ${dateStr}. Let me show you their next available times:\n\n🗓️ Would you like me to check different dates or suggest alternative doctors?`,
        type: 'appointment',
        actions: [
          { type: 'check_different_date', label: 'Check Different Date', data: { doctorId: selectedDoctor.id } },
          { type: 'suggest_other_doctors', label: 'Show Other Doctors', data: { specialization: selectedDoctor.specialization } }
        ]
      };
    }

    const allAvailableSlots = availabilityResult.data;
    
    // If time specified, try to book directly
    if (appointmentRequest.time) {
      const normalizeTime = (time: string) => {
        return time.toLowerCase().replace(/\s+/g, '').replace(/\./, ':');
      };
      
      const requestedTime = normalizeTime(appointmentRequest.time);
      console.log('🔍 Looking for time:', requestedTime);
      console.log('🔍 Available slots:', allAvailableSlots.map(s => ({
        displayTime: s.displayTime,
        normalized: normalizeTime(s.displayTime)
      })));
      
      const requestedSlot = allAvailableSlots.find(slot => {
        const slotTime = normalizeTime(slot.displayTime);
        const matches = slotTime === requestedTime || 
                       slotTime.includes(requestedTime) ||
                       requestedTime.includes(slotTime);
        
        if (matches) {
          console.log('🎯 Found matching slot:', slot);
        }
        return matches;
      });
      
      if (requestedSlot) {
        console.log('✅ Attempting to book slot:', requestedSlot);
        return await this.bookAppointmentSlot(selectedDoctor, requestedSlot, appointmentRequest);
      } else {
        console.log('❌ No matching slot found for:', requestedTime);
      }
    }
    
    // Show available slots (limit to 4 for display)
    const availableSlots = allAvailableSlots.slice(0, 4);
    
    // Show available slots
    return {
      success: true,
      message: `Great! Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName} (${selectedDoctor.specialization}) has these available times on ${dateStr}:\n\n${availableSlots.map((slot, i) => 
        `${i + 1}. ${slot.displayTime}`
      ).join('\n')}\n\nWhich time works best for you? 🕐`,
      type: 'appointment',
      data: { doctorId: selectedDoctor.id, doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`, availableSlots },
      actions: availableSlots.map((slot, _i) => ({
        type: 'book_slot',
        label: slot.displayTime,
        data: { doctorId: selectedDoctor.id, slot, appointmentRequest }
      }))
    };
  }

  // Book a specific appointment slot
  private async bookAppointmentSlot(doctor: any, slot: any, request: AppointmentRequest): Promise<AgentResponse> {
    try {
      const appointmentData = {
        doctorId: doctor.id,
        appointmentDate: slot.time,
        type: request.type || 'consultation',
        reason: request.reason || 'Medical consultation',
        symptoms: request.symptoms
      };

      const result = await hmsApiClient.bookAppointment({
        doctorId: appointmentData.doctorId,
        appointmentDate: appointmentData.appointmentDate,
        type: appointmentData.type,
        reason: appointmentData.reason,
        symptoms: appointmentData.symptoms
      });

      if (result.success) {
        return {
          success: true,
          message: `🎉 Excellent! Your appointment is confirmed:\n\n📅 Date: ${new Date(slot.time).toLocaleDateString()}\n⏰ Time: ${slot.displayTime}\n👨‍⚕️ Doctor: Dr. ${doctor.firstName} ${doctor.lastName}\n🏥 Department: ${doctor.department}\n📋 Type: ${appointmentData.type}\n📝 Reason: ${appointmentData.reason}\n\nYou'll receive a confirmation email shortly. Is there anything else I can help you with? 💙`,
          type: 'appointment',
          data: { appointmentDetails: result.data },
          actions: [
            { type: 'view_appointment', label: 'View Details', data: result.data },
            { type: 'book_another', label: 'Book Another', data: {} }
          ]
        };
      } else {
        throw new Error(result.message || 'Booking failed');
      }
    } catch (error: any) {
      return {
        success: false,
        message: `I'm sorry, there was an issue booking your appointment: ${error.message}. The time slot might have been taken by someone else. Would you like me to show you other available times? 😔`,
        type: 'appointment'
      };
    }
  }

  // Handle availability checking
  private async handleAvailabilityCheck(_message: string): Promise<AgentResponse> {
    try {
      const doctorsResult = await hmsApiClient.getDoctors();
      
      if (!doctorsResult.success) {
        throw new Error('Could not fetch doctor information');
      }

      const doctors = doctorsResult.data || [];
      const availableDoctors = doctors.slice(0, 5);

      return {
        success: true,
        message: `Here are our available doctors:\n\n${availableDoctors.map((d, _i) => 
          `👨‍⚕️ Dr. ${d.firstName} ${d.lastName}\n   🏥 ${d.specialization} - ${d.department}\n   🎓 ${d.experience} years experience\n`
        ).join('\n')}\nWould you like to check availability for any specific doctor or book an appointment? 📅`,
        type: 'appointment',
        data: { doctors: availableDoctors },
        actions: availableDoctors.slice(0, 3).map(d => ({
          type: 'check_doctor_availability',
          label: `Check Dr. ${d.lastName}'s availability`,
          data: { doctorId: d.id }
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble checking doctor availability right now. ${error.message} Please try again in a moment. 👨‍⚕️`,
        type: 'appointment'
      };
    }
  }

  // Handle prescription-related requests  
  private async handlePrescriptionRequest(message: string): Promise<AgentResponse> {
    const lowerMessage = message.toLowerCase();
    
    try {
      if (lowerMessage.includes('refill') || lowerMessage.includes('renewal')) {
        return await this.handlePrescriptionRefill(message);
      }
      
      if (lowerMessage.includes('side effects') || lowerMessage.includes('interactions')) {
        return await this.handleMedicationInfo(message);
      }
      
      if (lowerMessage.includes('my medication') || lowerMessage.includes('prescription')) {
        return await this.handleViewPrescriptions();
      }
      
      // Default medication search
      return await this.handleMedicationSearch(message);
      
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble accessing the medication system. ${error.message} For immediate medication concerns, please contact your pharmacy or doctor. 💊`,
        type: 'prescription'
      };
    }
  }

  // Handle prescription viewing
  private async handleViewPrescriptions(): Promise<AgentResponse> {
    try {
      const prescriptionsResult = await hmsApiClient.getPrescriptions();
      
      if (!prescriptionsResult.success || !prescriptionsResult.data?.length) {
        return {
          success: true,
          message: `I don't see any active prescriptions in your account right now. If you believe this is an error, please contact your doctor or pharmacy. 💊\n\nWould you like me to help you:\n• Search for medication information\n• Find pharmacy locations\n• Schedule an appointment to discuss medications`,
          type: 'prescription',
          actions: [
            { type: 'medication_search', label: 'Search Medications', data: {} },
            { type: 'book_appointment', label: 'Schedule Appointment', data: { reason: 'medication consultation' } }
          ]
        };
      }

      const prescriptions = prescriptionsResult.data;
      const activePrescriptions = prescriptions.filter(p => p.status === 'active');

      return {
        success: true,
        message: `Here are your current prescriptions:\n\n${activePrescriptions.map((p, _i) => 
          `💊 ${p.medication.name} (${p.medication.brandName})\n   📋 ${p.dosage} - ${p.frequency}\n   📅 ${p.refills} refills remaining\n   🏥 Prescribed: ${new Date(p.startDate).toLocaleDateString()}\n`
        ).join('\n')}\nIs there anything specific you'd like to know about your medications? 🤔`,
        type: 'prescription',
        data: { prescriptions: activePrescriptions },
        actions: [
          { type: 'refill_prescription', label: 'Request Refill', data: {} },
          { type: 'medication_info', label: 'Get Medication Info', data: {} },
          { type: 'side_effects', label: 'Check Side Effects', data: {} }
        ]
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I couldn't retrieve your prescription information right now. ${error.message} Please contact your pharmacy directly if you need immediate assistance. 💊`,
        type: 'prescription'
      };
    }
  }

  // Handle health record requests
  private async handleHealthRecordRequest(_message: string): Promise<AgentResponse> {
    try {
      const healthRecordResult = await hmsApiClient.getPatientHistory();
      
      if (!healthRecordResult.success) {
        return {
          success: false,
          message: `I'm unable to access your health records right now. For your privacy and security, please contact your healthcare provider directly to review your medical information. 🏥`,
          type: 'health'
        };
      }

      healthRecordResult.data;
      const summary = await hmsApiClient.getPatientSummary();

      if (summary.success && summary.data) {
        return {
          success: true,
          message: `Here's a summary of your health information:\n\n🩺 Recent Appointments: ${summary.data.recentAppointments.length}\n💊 Active Prescriptions: ${summary.data.activePrescriptions.length}\n🔬 Recent Vitals: ${summary.data.recentVitals.length} recorded\n⚠️ Allergies: ${summary.data.allergies.length}\n📋 Chronic Conditions: ${summary.data.chronicConditions.length}\n\nWhat specific information would you like to know more about? 📊`,
          type: 'health',
          data: { healthSummary: summary.data },
          actions: [
            { type: 'view_vitals', label: 'View Recent Vitals', data: {} },
            { type: 'view_lab_results', label: 'View Lab Results', data: {} },
            { type: 'view_allergies', label: 'View Allergies', data: {} },
            { type: 'view_conditions', label: 'View Conditions', data: {} }
          ]
        };
      }

      return {
        success: true,
        message: `I can help you access your health records. What specific information are you looking for?\n\n• Recent test results\n• Vital signs history\n• Appointment summaries\n• Medication history\n• Allergy information\n\nPlease let me know what you'd like to review! 📋`,
        type: 'health'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble accessing your health records. ${error.message} For security reasons, please contact your healthcare provider directly. 🔒`,
        type: 'health'
      };
    }
  }

  // Handle system info requests
  private async handleSystemInfoRequest(_message: string): Promise<AgentResponse> {
    try {
      const systemStatus = await hmsApiClient.getSystemStatus();
      
      if (systemStatus.success) {
        return {
          success: true,
          message: `🏥 **System Status**: All systems operational\n👨‍⚕️ **Available Doctors**: ${systemStatus.data.availableDoctors}\n💊 **Medication Database**: ${systemStatus.data.medicationDatabase} entries\n🕐 **Last Updated**: ${new Date(systemStatus.data.lastChecked).toLocaleString()}\n\nEverything is running smoothly! How can I help you today? 💙`,
          type: 'general',
          data: { systemStatus: systemStatus.data }
        };
      }
      
      return {
        success: true,
        message: `I'm checking our system status for you... Most services are operational, but I may be experiencing some connectivity issues. How can I assist you today? 💙`,
        type: 'general'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble checking system status right now. ${error.message} Our core services should still be available. How can I help you? 🏥`,
        type: 'general'
      };
    }
  }

  // Handle general chat (fallback)
  private async handleGeneralChat(message: string): Promise<AgentResponse> {
    try {
      // Try to use existing chat service
      const chatResponse = await chatService.sendMessage(message);
      
      if (chatResponse.success) {
        return {
          success: true,
          message: chatResponse.data.message,
          type: 'general',
          data: chatResponse.data
        };
      }
      
      // Fallback empathetic response
      return {
        success: true,
        message: `Thank you for sharing that with me. I'm here to help with your healthcare needs with care and understanding. I can assist you with:\n\n📅 **Appointment booking** - Schedule with doctors\n💊 **Prescription management** - View and refill medications\n🩺 **Health records** - Access your medical information  \n❓ **General health questions** - Get supportive guidance\n\nWhat would you like help with today? 💙`,
        type: 'general',
        actions: [
          { type: 'book_appointment', label: 'Book Appointment', data: {} },
          { type: 'view_prescriptions', label: 'View Prescriptions', data: {} },
          { type: 'health_records', label: 'Health Records', data: {} },
          { type: 'system_status', label: 'System Status', data: {} }
        ]
      };
    } catch (error: any) {
      return {
        success: true,
        message: `I understand you'd like to chat, and I'm here for you! While I'm having a small technical hiccup, I can still help you with healthcare tasks like booking appointments, checking prescriptions, or accessing your health information. What can I do for you today? 💙`,
        type: 'general'
      };
    }
  }

  // Utility methods
  private isAppointmentRelated(message: string): boolean {
    const keywords = ['appointment', 'book', 'schedule', 'reschedule', 'cancel', 'doctor', 'dr', 'available', 'availability', 'emergency', 'urgent', 'checkup'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isPrescriptionRelated(message: string): boolean {
    const keywords = ['prescription', 'medication', 'drug', 'medicine', 'refill', 'pharmacy', 'side effects', 'dosage', 'pill'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isHealthRecordRelated(message: string): boolean {
    const keywords = ['health record', 'medical history', 'lab results', 'test results', 'vitals', 'blood pressure', 'allergies', 'conditions'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private isSystemInfoRelated(message: string): boolean {
    const keywords = ['system status', 'available doctors', 'system info', 'help', 'what can you do', 'capabilities'];
    return keywords.some(keyword => message.includes(keyword));
  }

  private parseAppointmentRequest(message: string): AppointmentRequest {
    const request: AppointmentRequest = {};
    const lowerMessage = message.toLowerCase();
    
    // Extract doctor name
    const doctorMatch = lowerMessage.match(/dr\.?\s+(\w+)/i) || lowerMessage.match(/doctor\s+(\w+)/i);
    if (doctorMatch) {
      request.doctorName = doctorMatch[1];
    }
    
    // Extract specialization
    const specializations = ['cardiology', 'dermatology', 'neurology', 'psychiatry', 'pediatric', 'orthopedic', 'general'];
    for (const spec of specializations) {
      if (lowerMessage.includes(spec)) {
        request.specialization = spec;
        break;
      }
    }
    
    // Extract appointment type
    if (lowerMessage.includes('emergency')) request.type = 'emergency';
    else if (lowerMessage.includes('follow up') || lowerMessage.includes('followup')) request.type = 'follow_up';
    else if (lowerMessage.includes('checkup') || lowerMessage.includes('routine')) request.type = 'routine_checkup';
    else request.type = 'consultation';
    
    // Extract time
    const timeMatches = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,  // 9:00 AM, 2:30 PM
      /(\d{1,2})\s*(am|pm)/i,          // 9 AM, 2 PM
      /at\s+(\d{1,2}):(\d{2})/i,       // at 9:00
      /at\s+(\d{1,2})\s*(am|pm)/i      // at 9 AM
    ];
    
    for (const timeRegex of timeMatches) {
      const timeMatch = lowerMessage.match(timeRegex);
      if (timeMatch) {
        request.time = timeMatch[0].replace('at ', '').trim();
        break;
      }
    }
    
    // Extract date
    if (lowerMessage.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      request.date = tomorrow.toISOString().split('T')[0];
    } else if (lowerMessage.includes('today')) {
      request.date = new Date().toISOString().split('T')[0];
    }
    
    // Extract reason/symptoms
    if (lowerMessage.includes('for ')) {
      const reasonMatch = lowerMessage.match(/for\s+(.+?)(?:\s+(?:on|at|with|tomorrow|next|this)|\s*$)/);
      if (reasonMatch) {
        request.reason = reasonMatch[1].trim();
      }
    }
    
    return request;
  }

  // Handle actual appointment cancellation
  async cancelAppointment(appointmentId: string): Promise<AgentResponse> {
    try {
      const result = await hmsApiClient.cancelAppointment(appointmentId);
      
      if (result.success) {
        return {
          success: true,
          message: `✅ Your appointment has been successfully cancelled.\n\nIf you need to book a new appointment, just let me know! I'm here to help. 💙`,
          type: 'appointment',
          actions: [
            { type: 'book_appointment', label: 'Book New Appointment', data: {} },
            { type: 'view_appointments', label: 'View My Appointments', data: {} }
          ]
        };
      } else {
        throw new Error(result.message || 'Cancellation failed');
      }
    } catch (error: any) {
      return {
        success: false,
        message: `I'm sorry, I couldn't cancel your appointment. ${error.message} Please contact our office directly at your earliest convenience. 📞`,
        type: 'appointment'
      };
    }
  }

  // Handle actual appointment rescheduling  
  async rescheduleAppointment(appointmentId: string, newDateTime?: Date): Promise<AgentResponse> {
    try {
      if (newDateTime) {
        const result = await hmsApiClient.rescheduleAppointment(appointmentId, newDateTime);
        
        if (result.success) {
          return {
            success: true,
            message: `🎉 Your appointment has been successfully rescheduled!\n\n📅 New Date: ${new Date(newDateTime).toLocaleDateString()}\n⏰ New Time: ${new Date(newDateTime).toLocaleTimeString()}\n\nYou'll receive a confirmation email shortly. Is there anything else I can help you with? 💙`,
            type: 'appointment',
            data: { appointmentDetails: result.data }
          };
        } else {
          throw new Error(result.message || 'Rescheduling failed');
        }
      } else {
        return {
          success: true,
          message: `I'd be happy to reschedule your appointment! What new date and time would you prefer?\n\nFor example, you can say:\n• "Reschedule to tomorrow at 2 PM"\n• "Move it to next Friday at 10 AM"\n• "Change it to August 10th at 3:30 PM"\n\nWhat works best for you? 📅`,
          type: 'appointment'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `I'm sorry, I couldn't reschedule your appointment. ${error.message} Please contact our office directly to reschedule. 📞`,
        type: 'appointment'
      };
    }
  }

  // Additional helper methods for specific handlers
  private async handlePrescriptionRefill(_message: string): Promise<AgentResponse> {
    return {
      success: true,
      message: `I'd be happy to help you with prescription refills! However, for security reasons, refill requests need to be processed through your pharmacy or doctor's office directly.\n\n📞 **Quick Options:**\n• Call your pharmacy directly\n• Use your pharmacy's mobile app\n• Contact your doctor's office\n• Schedule an appointment for medication review\n\nWould you like me to help you schedule an appointment to discuss your medications? 💊`,
      type: 'prescription',
      actions: [
        { type: 'book_appointment', label: 'Schedule Medication Review', data: { reason: 'medication consultation' } }
      ]
    };
  }

  private async handleMedicationInfo(message: string): Promise<AgentResponse> {
    // Extract medication name from message
    const medicationName = this.extractMedicationName(message);
    
    if (medicationName) {
      try {
        const searchResult = await hmsApiClient.searchMedications(medicationName);
        if (searchResult.success && searchResult.data?.length) {
          const medication = searchResult.data[0];
          return {
            success: true,
            message: `Here's information about ${medication.name}:\n\n💊 **Generic Name**: ${medication.genericName || 'N/A'}\n🏷️ **Brand Name**: ${medication.brandName || 'N/A'}\n📋 **Form**: ${medication.form || 'N/A'}\n⚖️ **Strength**: ${medication.strength || 'N/A'}\n\n⚠️ **Important**: Always consult your doctor or pharmacist for complete medication information, side effects, and interactions. Would you like me to schedule an appointment for medication consultation? 👨‍⚕️`,
            type: 'prescription',
            data: { medication },
            actions: [
              { type: 'book_appointment', label: 'Medication Consultation', data: { reason: 'discuss medication' } }
            ]
          };
        }
      } catch (error) {
        // Continue to general response
      }
    }
    
    return {
      success: true,
      message: `For detailed medication information, side effects, and drug interactions, I recommend:\n\n👨‍⚕️ **Consult your doctor** - Most accurate for your specific situation\n💊 **Ask your pharmacist** - Expert advice on medications\n📱 **Check FDA resources** - Official drug information\n📞 **Call poison control** - For emergencies: 1-800-222-1222\n\nWould you like me to schedule an appointment with your doctor to discuss your medications? 💙`,
      type: 'prescription',
      actions: [
        { type: 'book_appointment', label: 'Schedule Medication Review', data: { reason: 'medication consultation' } }
      ]
    };
  }

  private async handleMedicationSearch(message: string): Promise<AgentResponse> {
    const medicationName = this.extractMedicationName(message);
    
    if (!medicationName) {
      return {
        success: true,
        message: `I can help you search for medication information! What specific medication would you like to know about? Please provide the name of the medication. 💊`,
        type: 'prescription'
      };
    }
    
    try {
      const searchResult = await hmsApiClient.searchMedications(medicationName);
      
      if (searchResult.success && searchResult.data?.length) {
        const medications = searchResult.data.slice(0, 5);
        return {
          success: true,
          message: `I found these medications matching "${medicationName}":\n\n${medications.map((med, _i) => 
            `${_i + 1}. **${med.name}** ${med.brandName ? `(${med.brandName})` : ''}\n   Form: ${med.form || 'N/A'} | Strength: ${med.strength || 'N/A'}`
          ).join('\n\n')}\n\n⚠️ **Remember**: Always consult healthcare professionals for medication advice. Would you like more details about any of these? 👨‍⚕️`,
          type: 'prescription',
          data: { searchResults: medications },
          actions: medications.slice(0, 3).map(med => ({
            type: 'medication_details',
            label: `Details: ${med.name}`,
            data: { medicationId: med.id }
          }))
        };
      } else {
        return {
          success: true,
          message: `I couldn't find "${medicationName}" in our medication database. This might be because:\n\n• The spelling might be different\n• It might be a brand name vs generic name\n• It might not be in our current database\n\n💡 **Suggestions:**\n• Try a different spelling\n• Try the generic or brand name\n• Consult your pharmacist or doctor\n\nWould you like to try searching for a different medication? 🔍`,
          type: 'prescription'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble searching the medication database right now. ${error.message} Please consult your pharmacist or doctor for medication information. 💊`,
        type: 'prescription'
      };
    }
  }

  private async handleAppointmentCancellation(_message: string): Promise<AgentResponse> {
    try {
      const appointmentsResult = await hmsApiClient.getAppointments();
      
      if (!appointmentsResult.success || !appointmentsResult.data?.length) {
        return {
          success: true,
          message: `I don't see any upcoming appointments to cancel. If you have an appointment that's not showing up, please contact our office directly at your earliest convenience. 📅\n\nWould you like me to help you with anything else? 💙`,
          type: 'appointment'
        };
      }

      const upcomingAppointments = appointmentsResult.data
        .filter(apt => new Date(apt.appointmentDate) > new Date() && apt.status === 'scheduled')
        .slice(0, 5);

      if (!upcomingAppointments.length) {
        return {
          success: true,
          message: `I don't see any upcoming appointments that can be cancelled. All your appointments may have already passed or been cancelled. 📅\n\nIf you need to schedule a new appointment, just let me know! 💙`,
          type: 'appointment'
        };
      }

      return {
        success: true,
        message: `Here are your upcoming appointments that can be cancelled:\n\n${upcomingAppointments.map((apt, _i) => 
          `${_i + 1}. **${new Date(apt.appointmentDate).toLocaleDateString()}** at ${new Date(apt.appointmentDate).toLocaleTimeString()}\n   👨‍⚕️ Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}\n   📋 Type: ${apt.type}\n   📝 Reason: ${apt.reason}`
        ).join('\n\n')}\n\nWhich appointment would you like to cancel? Please tell me the number. ❌`,
        type: 'appointment',
        data: { appointments: upcomingAppointments },
        actions: upcomingAppointments.map((apt, _i) => ({
          type: 'cancel_appointment',
          label: `Cancel #${_i + 1}`,
          data: { appointmentId: apt.id, appointmentInfo: apt }
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble accessing your appointment information. ${error.message} Please contact our office directly to cancel your appointment. 📞`,
        type: 'appointment'
      };
    }
  }

  private async handleAppointmentReschedule(_message: string): Promise<AgentResponse> {
    try {
      const appointmentsResult = await hmsApiClient.getAppointments();
      
      if (!appointmentsResult.success || !appointmentsResult.data?.length) {
        return {
          success: true,
          message: `I don't see any appointments to reschedule. If you have an appointment that's not showing up, please contact our office directly. 📅\n\nWould you like me to help you book a new appointment instead? 💙`,
          type: 'appointment',
          actions: [
            { type: 'book_appointment', label: 'Book New Appointment', data: {} }
          ]
        };
      }

      const upcomingAppointments = appointmentsResult.data
        .filter(apt => new Date(apt.appointmentDate) > new Date() && apt.status === 'scheduled')
        .slice(0, 5);

      if (!upcomingAppointments.length) {
        return {
          success: true,
          message: `I don't see any upcoming appointments that can be rescheduled. All your appointments may have already passed or been cancelled. 📅\n\nWould you like to book a new appointment? 💙`,
          type: 'appointment',
          actions: [
            { type: 'book_appointment', label: 'Book New Appointment', data: {} }
          ]
        };
      }

      return {
        success: true,
        message: `Here are your upcoming appointments that can be rescheduled:\n\n${upcomingAppointments.map((apt, _i) => 
          `${_i + 1}. **${new Date(apt.appointmentDate).toLocaleDateString()}** at ${new Date(apt.appointmentDate).toLocaleTimeString()}\n   👨‍⚕️ Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}\n   📋 Type: ${apt.type}\n   📝 Reason: ${apt.reason}`
        ).join('\n\n')}\n\nWhich appointment would you like to reschedule? Please tell me the number. 🔄`,
        type: 'appointment',
        data: { appointments: upcomingAppointments },
        actions: upcomingAppointments.map((apt, _i) => ({
          type: 'reschedule_appointment',
          label: `Reschedule #${_i + 1}`,
          data: { appointmentId: apt.id, appointmentInfo: apt }
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble accessing your appointment information. ${error.message} Please contact our office directly to reschedule your appointment. 📞`,
        type: 'appointment'
      };
    }
  }

  private async handleViewAppointments(): Promise<AgentResponse> {
    try {
      const appointmentsResult = await hmsApiClient.getAppointments();
      
      if (!appointmentsResult.success || !appointmentsResult.data?.length) {
        return {
          success: true,
          message: `You don't have any appointments scheduled right now. Would you like me to help you book an appointment? 📅\n\nI can help you find available doctors and schedule at your preferred time! 💙`,
          type: 'appointment',
          actions: [
            { type: 'book_appointment', label: 'Book New Appointment', data: {} }
          ]
        };
      }

      const appointments = appointmentsResult.data;
      const upcoming = appointments.filter(apt => new Date(apt.appointmentDate) > new Date());
      const past = appointments.filter(apt => new Date(apt.appointmentDate) <= new Date());

      let message = '';
      
      if (upcoming.length > 0) {
        message += `**📅 Upcoming Appointments:**\n\n${upcoming.slice(0, 5).map(apt => 
          `• **${new Date(apt.appointmentDate).toLocaleDateString()}** at ${new Date(apt.appointmentDate).toLocaleTimeString()}\n  👨‍⚕️ Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} - ${apt.doctor.specialization}\n  📋 ${apt.type} | Status: ${apt.status}\n  📝 ${apt.reason}`
        ).join('\n\n')}\n\n`;
      }
      
      if (past.length > 0) {
        message += `**📋 Recent Past Appointments:**\n\n${past.slice(0, 3).map(apt => 
          `• **${new Date(apt.appointmentDate).toLocaleDateString()}** - Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}\n  Status: ${apt.status} | Type: ${apt.type}`
        ).join('\n\n')}`;
      }

      return {
        success: true,
        message: message || 'No appointments found.',
        type: 'appointment',
        data: { upcoming, past },
        actions: upcoming.length > 0 ? [
          { type: 'reschedule_appointment', label: 'Reschedule', data: {} },
          { type: 'cancel_appointment', label: 'Cancel', data: {} },
          { type: 'book_another', label: 'Book Another', data: {} }
        ] : [
          { type: 'book_appointment', label: 'Book Appointment', data: {} }
        ]
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm having trouble retrieving your appointments. ${error.message} Please contact our office for appointment information. 📞`,
        type: 'appointment'
      };
    }
  }

  private extractMedicationName(message: string): string | null {
    // Remove common words and extract potential medication name
    const words = message.toLowerCase().split(' ');
    const stopWords = ['about', 'for', 'side', 'effects', 'of', 'the', 'is', 'what', 'are', 'my', 'medication', 'drug', 'medicine', 'prescription'];
    
    const medicationWords = words.filter(word => 
      word.length > 2 && 
      !stopWords.includes(word) && 
      /^[a-zA-Z]+$/.test(word)
    );
    
    return medicationWords.length > 0 ? medicationWords[0] : null;
  }
}

export const hmsAgentService = new HMSAgentService();
export default hmsAgentService;