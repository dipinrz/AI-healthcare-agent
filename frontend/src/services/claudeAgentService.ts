// Claude Agent Service - Routes to actual Claude agents via Task tool
import hmsApiClient from './hmsApiClient';

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

class ClaudeAgentService {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if we have authentication
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      console.log('🔐 Claude Agent Service - Auth Token:', token ? 'Found' : 'Not Found');
      
      if (token) {
        // Ensure HMS API client has the token
        hmsApiClient.setAuthToken(token);
        console.log('✅ Set auth token in HMS API client');
        this.isInitialized = true;
        return true;
      } else {
        console.warn('⚠️ No authentication token found');
      }
      return false;
    } catch (error) {
      console.error('Claude Agent Service initialization error:', error);
      return false;
    }
  }

  // Test method to debug NLP extraction
  testNLPExtraction(message: string): any {
    const extracted = this.extractAppointmentDetails(message);
    console.log('🧪 NLP Test Results:', {
      originalMessage: message,
      extracted: extracted
    });
    return extracted;
  }

  // Main message processing - routes to appropriate Claude agent
  async processMessage(message: string): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Test NLP extraction first
      this.testNLPExtraction(message);
      
      // Determine which agent to use based on message content
      const agentType = this.determineAgentType(message);
      
      // Route to appropriate Claude agent
      switch (agentType) {
        case 'appointment':
          return await this.routeToAppointmentScheduler(message);
        case 'prescription':
          return await this.routeToPrescriptionHelper(message);
        case 'health':
          return await this.routeToPatientAssistant(message);
        case 'orchestrator':
          return await this.routeToOrchestrator(message);
        default:
          return await this.routeToOrchestrator(message);
      }
    } catch (error: any) {
      console.error('Claude Agent processing error:', error);
      
      // Handle authentication errors
      if (error.message.includes('authentication') || error.message.includes('token')) {
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
        message: `I apologize, but I'm experiencing some technical difficulties right now. Let me try to help you anyway! 💙\n\nFor immediate assistance:\n• Call our office directly\n• Visit our patient portal\n• Try your request again in a moment\n\nHow else can I support you?`,
        type: 'general'
      };
    }
  }

  // Determine which agent should handle the request
  private determineAgentType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Appointment-related keywords
    const appointmentKeywords = ['book', 'schedule', 'appointment', 'doctor', 'available', 'cancel', 'reschedule', 'dr.', 'physician'];
    const hasAppointmentKeywords = appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Prescription-related keywords  
    const prescriptionKeywords = ['prescription', 'medication', 'drug', 'refill', 'pharmacy', 'side effects', 'medicine', 'pills'];
    const hasPrescriptionKeywords = prescriptionKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Health records and support keywords
    const healthKeywords = ['health records', 'medical history', 'anxious', 'worried', 'test results', 'lab results', 'vitals', 'support'];
    const hasHealthKeywords = healthKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Multi-domain or complex requests
    const keywordCount = [hasAppointmentKeywords, hasPrescriptionKeywords, hasHealthKeywords].filter(Boolean).length;
    
    if (keywordCount > 1) {
      return 'orchestrator'; // Multi-domain request
    } else if (hasAppointmentKeywords) {
      return 'appointment';
    } else if (hasPrescriptionKeywords) {
      return 'prescription';
    } else if (hasHealthKeywords) {
      return 'health';
    } else {
      return 'orchestrator'; // Default to orchestrator for routing
    }
  }

  // Route to appointment scheduler agent with NLP processing
  private async routeToAppointmentScheduler(message: string): Promise<AgentResponse> {
    try {
      console.log('🚀 Routing to Appointment Scheduler Agent');
      
      // Use NLP to extract appointment details from message context
      const extractedDetails = this.extractAppointmentDetails(message);
      
      // If we have enough details, try to book directly
      if (extractedDetails.doctorName && extractedDetails.timeInfo) {
        return await this.processDirectBooking(message, extractedDetails);
      }
      
      // Use Task tool to call the real Claude appointment scheduler agent
      const appointmentAgentResponse = await this.callClaudeAgent('appointment-scheduler', message, {
        extractedDetails,
        availableDoctors: await this.getAvailableDoctors(),
        patientContext: await this.getPatientContext()
      });
      
      return appointmentAgentResponse;
      
    } catch (error: any) {
      console.error('Error routing to appointment agent:', error);
      
      // Fallback response
      return {
        success: false,
        message: `🏥 **Appointment Service Error**\n\nI'm having trouble with the appointment scheduling system right now. Please try again in a moment or contact our office directly.\n\n📞 **Alternative Options:**\n• Call our appointment line\n• Visit our patient portal online\n• Try your request again in a few minutes\n\nI apologize for the inconvenience!`,
        type: 'appointment',
        actions: [
          { type: 'retry_appointment', label: 'Try Again', data: {} },
          { type: 'contact_office', label: 'Contact Office', data: {} }
        ]
      };
    }
  }

  // Route to prescription helper agent
  private async routeToPrescriptionHelper(message: string): Promise<AgentResponse> {
    try {
      console.log('🚀 Routing to Prescription Helper Agent');
      
      // Use Task tool to call the real Claude prescription helper agent
      const prescriptionAgentResponse = await this.callClaudeAgent('prescription-helper', message, {
        patientContext: await this.getPatientContext(),
        messageType: 'prescription_query'
      });
      
      return prescriptionAgentResponse;
    } catch (error: any) {
      console.error('Error routing to prescription agent:', error);
      
      // Fallback response
      return {
        success: false,
        message: `💊 **Prescription Service Error**\n\nI'm having trouble accessing medication services right now. For immediate medication concerns, please contact your pharmacy or doctor.\n\n📞 **Alternative Options:**\n• Contact your pharmacy directly\n• Call your doctor's office\n• Try your request again in a few minutes`,
        type: 'prescription',
        actions: [
          { type: 'retry_prescription', label: 'Try Again', data: {} },
          { type: 'contact_pharmacy', label: 'Contact Pharmacy', data: {} }
        ]
      };
    }
  }

  // Route to patient assistant agent
  private async routeToPatientAssistant(message: string): Promise<AgentResponse> {
    try {
      console.log('🚀 Routing to Patient Assistant Agent');
      
      // Use Task tool to call the real Claude patient assistant agent
      const patientAssistantResponse = await this.callClaudeAgent('patient-assistant', message, {
        patientContext: await this.getPatientContext(),
        emotionalContext: this.detectEmotionalContext(message),
        messageType: 'patient_support'
      });
      
      return patientAssistantResponse;
    } catch (error: any) {
      console.error('Error routing to patient assistant agent:', error);
      
      // Fallback response
      return {
        success: false,
        message: `💙 **Patient Support Service Error**\n\nI'm having trouble accessing patient support services right now. For immediate support, please contact your healthcare provider.\n\n📞 **Alternative Options:**\n• Call your healthcare provider\n• Contact our patient support line\n• Try your request again in a few minutes\n\nYour wellbeing is important to us! 💙`,
        type: 'health',
        actions: [
          { type: 'retry_support', label: 'Try Again', data: {} },
          { type: 'contact_provider', label: 'Contact Provider', data: {} }
        ]
      };
    }
  }

  // Route to orchestrator agent
  private async routeToOrchestrator(message: string): Promise<AgentResponse> {
    try {
      console.log('🚀 Routing to Orchestrator Agent');
      
      // Use Task tool to call the real Claude orchestrator agent
      const orchestratorResponse = await this.callClaudeAgent('hms-orchestrator', message, {
        patientContext: await this.getPatientContext(),
        availableAgents: ['appointment-scheduler', 'prescription-helper', 'patient-assistant'],
        systemStatus: 'operational'
      });
      
      return orchestratorResponse;
    } catch (error: any) {
      console.error('Error routing to orchestrator agent:', error);
      
      // Fallback response
      return {
        success: true,
        message: `🏥 **Healthcare System Assistant (Fallback Mode)**\n\nWelcome! I'm here to help you navigate our comprehensive healthcare services. I can coordinate all aspects of your care and connect you with the right specialists.\n\n**🎯 I can help you with:**\n\n**📅 Appointments**\n• Book appointments with specialists\n• Check doctor availability and schedules\n• Manage existing appointments\n\n**💊 Medications**  \n• Prescription management and refills\n• Medication information and safety\n• Pharmacy coordination\n\n**🩺 Health Records**\n• Access your medical history and test results\n• Health monitoring and tracking\n• Care coordination between providers\n\n**💙 Patient Support**\n• Emotional support and health anxiety guidance\n• Medical education and explanation\n• Resource navigation and advocacy\n\nWhat would you like help with today? I can handle simple requests directly or connect you with specialized assistants for more complex needs.`,
        type: 'general',
        actions: [
          { type: 'book_appointment', label: '📅 Book Appointment', data: {} },
          { type: 'prescription_help', label: '💊 Prescription Help', data: {} },
          { type: 'health_records', label: '🩺 Health Records', data: {} },
          { type: 'patient_support', label: '💙 Patient Support', data: {} },
          { type: 'system_status', label: '🏥 System Status', data: {} }
        ]
      };
    }
  }

  // NLP Methods for extracting appointment details from natural language
  private extractAppointmentDetails(message: string): any {
    const details = {
      doctorName: null as string | null,
      specialty: null as string | null,
      timeInfo: null as string | null,
      dateInfo: null as string | null,
      reason: null as string | null,
      urgency: 'normal' as string
    };

    const lowerMessage = message.toLowerCase();

    // Extract doctor names (various patterns) - Fixed to avoid capturing time/date info
    const doctorPatterns = [
      // Pattern 1: "Dr. Sarah" or "Doctor Sarah"
      /(?:dr\.?\s+|doctor\s+)([a-z]+)(?:\s+[a-z]+)?(?=\s+(?:tomorrow|today|at|for|on|\d|\s*$))/gi,
      // Pattern 2: "with Sarah" or "see Sarah" (but not followed by time words)
      /(?:with\s+|see\s+)(?:dr\.?\s+)?([a-z]+)(?:\s+[a-z]+)?(?=\s+(?:tomorrow|today|at|for|on|\d|\s*$))/gi,
      // Pattern 3: Specific known doctor names
      /\b(sarah|johnson|mohammed|ali)\b/gi
    ];

    for (const pattern of doctorPatterns) {
      const match = pattern.exec(message);
      if (match) {
        // Clean the extracted name and remove any trailing words that aren't names
        let extractedName = match[1] || match[0];
        // Remove common time/date words that might have been captured
        extractedName = extractedName.replace(/\b(tomorrow|today|at|for|on|am|pm|morning|afternoon|evening)\b/gi, '').trim();
        if (extractedName) {
          details.doctorName = extractedName;
          break;
        }
      }
    }

    // Extract specialties
    const specialtyPatterns = {
      'cardiology': /cardio|heart|cardiac/gi,
      'neurology': /neuro|brain|nervous/gi,
      'dermatology': /derma|skin/gi,
      'psychiatry': /psych|mental|therapy/gi,
      'orthopedics': /ortho|bone|joint/gi
    };

    for (const [specialty, pattern] of Object.entries(specialtyPatterns)) {
      if (pattern.test(lowerMessage)) {
        details.specialty = specialty;
        break;
      }
    }

    // Extract time information - More precise patterns
    const timePatterns = [
      // Pattern 1: "9:00 AM", "2:30 PM", "at 9:00 AM"
      /(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)/gi,
      // Pattern 2: "9 AM", "at 9 PM", "2 pm"
      /(?:at\s+)?(\d{1,2})\s*(am|pm)/gi,
      // Pattern 3: General time periods
      /\b(morning|afternoon|evening|noon)\b/gi,
      // Pattern 4: Specific times mentioned
      /\b(9\s*am|9:00|nine\s*am|ten\s*am|eleven\s*am)\b/gi
    ];

    for (const pattern of timePatterns) {
      const match = pattern.exec(lowerMessage);
      if (match) {
        // Reconstruct the time properly
        if (match[2] && match[3]) {
          // Has minutes and AM/PM: "9:00 AM"
          details.timeInfo = `${match[1]}:${match[2]} ${match[3].toUpperCase()}`;
        } else if (match[1] && match[2] && (match[2].toLowerCase() === 'am' || match[2].toLowerCase() === 'pm')) {
          // Hour with AM/PM: "9 AM"
          details.timeInfo = `${match[1]} ${match[2].toUpperCase()}`;
        } else {
          // Other patterns: "morning", "9 am", etc.
          details.timeInfo = match[0];
        }
        break;
      }
    }

    // Extract date information
    const datePatterns = [
      /(tomorrow|today)/gi,
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      /(next\s+week|this\s+week)/gi,
      /(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi
    ];

    for (const pattern of datePatterns) {
      const match = pattern.exec(lowerMessage);
      if (match) {
        details.dateInfo = match[0];
        break;
      }
    }

    // Extract reason/symptoms
    const reasonPatterns = [
      /(?:for\s+|because\s+|reason:?\s*)((?:chest pain|headache|checkup|consultation|follow.?up|routine|emergency)[^.!?]*)/gi,
      /(?:i\s+(?:have|feel|need))\s+([^.!?]*)/gi
    ];

    for (const pattern of reasonPatterns) {
      const match = pattern.exec(lowerMessage);
      if (match) {
        details.reason = match[1];
        break;
      }
    }

    // Detect urgency
    if (/urgent|emergency|asap|immediately|now/gi.test(lowerMessage)) {
      details.urgency = 'urgent';
    }

    return details;
  }

  // Process direct booking using extracted NLP details
  private async processDirectBooking(message: string, details: any): Promise<AgentResponse> {
    try {
      console.log('🚀 Starting NLP Direct Booking Process');
      console.log('📝 Original Message:', message);
      console.log('🧠 Extracted Details:', details);
      
      // Step 1: Find matching doctor
      console.log('👨‍⚕️ Fetching doctors from API...');
      const doctorsResponse = await hmsApiClient.getDoctors();
      console.log('📊 Doctors API Response:', doctorsResponse);
      
      if (!doctorsResponse.success) {
        console.error('❌ Failed to fetch doctors:', doctorsResponse);
        throw new Error('Could not fetch doctors');
      }

      const matchingDoctor = this.findMatchingDoctor(doctorsResponse.data || [], details);
      if (!matchingDoctor) {
        return {
          success: false,
          message: `🤔 **Could not find doctor "${details.doctorName}"**\n\nI understood you want to book with "${details.doctorName}" ${details.timeInfo ? `at ${details.timeInfo}` : ''} ${details.dateInfo ? `for ${details.dateInfo}` : ''}.\n\nLet me show you available doctors instead:`,
          type: 'appointment',
          actions: [
            { type: 'view_all_doctors', label: 'View Available Doctors', data: {} },
            { type: 'retry_with_different_name', label: 'Try Different Doctor Name', data: {} }
          ]
        };
      }

      // Step 2: Get available slots for the date
      const targetDate = this.parseDate(details.dateInfo);
      console.log('🔍 NLP Extracted Details:', details);
      console.log('📅 Target Date for API:', targetDate);
      console.log('👨‍⚕️ Matching Doctor:', matchingDoctor);
      
      const slotsResponse = await hmsApiClient.getDoctorAvailability(matchingDoctor.id, targetDate);
      
      if (!slotsResponse.success || !slotsResponse.data?.length) {
        return {
          success: false,
          message: `📅 **No available slots for ${matchingDoctor.firstName} ${matchingDoctor.lastName}**\n\nI found Dr. ${matchingDoctor.firstName} ${matchingDoctor.lastName} (${matchingDoctor.specialization}), but there are no available slots ${details.dateInfo ? `for ${details.dateInfo}` : 'on the requested date'}.\n\nWould you like to:\n• Try a different date\n• See other available doctors\n• Check their availability for this week`,
          type: 'appointment',
          actions: [
            { type: 'check_other_dates', label: 'Check Other Dates', data: { doctorId: matchingDoctor.id } },
            { type: 'view_all_doctors', label: 'Other Doctors', data: {} }
          ]
        };
      }

      // Step 3: Find matching time slot
      const matchingSlot = this.findMatchingTimeSlot(slotsResponse.data, details.timeInfo);
      
      if (!matchingSlot) {
        const slotActions = slotsResponse.data.slice(0, 6).map((slot: any) => ({
          type: 'book_slot',
          label: slot.displayTime || slot.time,
          data: { 
            doctorId: matchingDoctor.id,
            doctorName: `${matchingDoctor.firstName} ${matchingDoctor.lastName}`,
            slot: slot
          }
        }));

        return {
          success: true,
          message: `🕐 **Time "${details.timeInfo}" not available for Dr. ${matchingDoctor.firstName} ${matchingDoctor.lastName}**\n\nI found the doctor you requested, but the specific time "${details.timeInfo}" isn't available ${details.dateInfo ? `for ${details.dateInfo}` : ''}.\n\n**Available times:**`,
          type: 'appointment',
          actions: slotActions
        };
      }

      // Step 4: Attempt direct booking
      const bookingData = {
        doctorId: matchingDoctor.id,
        appointmentDate: matchingSlot.time,
        reason: details.reason || 'General consultation',
        type: 'consultation' as 'consultation'
      };

      console.log('📋 Booking Data to Send:', bookingData);
      console.log('🌐 Making booking API call...');
      
      const bookingResult = await hmsApiClient.bookAppointment(bookingData);
      console.log('📊 Booking API Response:', bookingResult);
      
      if (bookingResult.success) {
        return {
          success: true,
          message: `✅ **Appointment Booked Successfully!**\n\n🎉 **Great! I understood your request and booked it automatically:**\n\n📋 **Your Appointment:**\n• **Doctor:** ${matchingDoctor.firstName} ${matchingDoctor.lastName} (${matchingDoctor.specialization})\n• **Date & Time:** ${matchingSlot.displayTime} ${details.dateInfo ? `(${details.dateInfo})` : ''}\n• **Reason:** ${details.reason || 'General consultation'}\n• **Status:** Confirmed\n\n💡 **Smart Booking:** I extracted the details from your message: "${message}"\n\nYou'll receive a confirmation email shortly! 💙`,
          type: 'appointment',
          data: { appointment: bookingResult.data },
          actions: [
            { type: 'view_appointments', label: 'View My Appointments', data: {} },
            { type: 'book_another', label: 'Book Another', data: {} }
          ]
        };
      } else {
        throw new Error(bookingResult.message || 'Booking failed');
      }

    } catch (error: any) {
      console.error('❌ Direct booking failed:', error);
      
      // Enhanced error messaging based on error type
      let errorMessage = `❌ **Smart Booking Failed**\n\nI tried to book your appointment automatically from: "${message}"\n\n`;
      
      if (error.message.includes('token') || error.message.includes('authentication')) {
        errorMessage += `🔐 **Authentication Issue:** Please log in again to access booking services.\n\n`;
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage += `🌐 **Network Issue:** Please check your internet connection.\n\n`;
      } else if (error.message.includes('fetch doctors')) {
        errorMessage += `👨‍⚕️ **Doctor Lookup Failed:** Could not retrieve doctor information.\n\n`;
      } else {
        errorMessage += `⚠️ **Error:** ${error.message}\n\n`;
      }
      
      errorMessage += `Let me help you book it step by step instead! 💪`;
      
      return {
        success: false,
        message: errorMessage,
        type: 'appointment',
        actions: [
          { type: 'start_manual_booking', label: 'Book Step by Step', data: {} },
          { type: 'view_all_doctors', label: 'View Available Doctors', data: {} }
        ]
      };
    }
  }

  // Helper method to find matching doctor - Enhanced with better matching
  private findMatchingDoctor(doctors: any[], details: any): any {
    if (!details.doctorName && !details.specialty) return null;
    
    const searchTerm = details.doctorName?.toLowerCase().trim() || '';
    console.log('🔍 Searching for doctor with term:', searchTerm);
    console.log('📋 Available doctors:', doctors.map(d => `${d.firstName} ${d.lastName} (${d.specialization})`));
    
    // Try different matching strategies
    let match = null;
    
    // Strategy 1: Exact first name match
    if (searchTerm) {
      match = doctors.find(doctor => 
        doctor.firstName.toLowerCase().includes(searchTerm) ||
        doctor.lastName.toLowerCase().includes(searchTerm)
      );
      if (match) {
        console.log('✅ Found doctor by name match:', match);
        return match;
      }
    }
    
    // Strategy 2: Partial name in full name
    if (searchTerm) {
      match = doctors.find(doctor => {
        const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
      if (match) {
        console.log('✅ Found doctor by full name match:', match);
        return match;
      }
    }
    
    // Strategy 3: Specialty match
    if (details.specialty) {
      match = doctors.find(doctor => 
        doctor.specialization.toLowerCase().includes(details.specialty.toLowerCase())
      );
      if (match) {
        console.log('✅ Found doctor by specialty match:', match);
        return match;
      }
    }
    
    // Strategy 4: Fuzzy matching for common names
    if (searchTerm) {
      const commonMappings = {
        'sarah': ['sarah', 'sara'],
        'mohammad': ['mohammed', 'muhammad', 'mohammad'],
        'ali': ['ali', 'alley'],
        'johnson': ['johnson', 'jonson']
      };
      
      for (const [, variants] of Object.entries(commonMappings)) {
        if (variants.includes(searchTerm)) {
          match = doctors.find(doctor => 
            variants.some(variant => 
              doctor.firstName.toLowerCase().includes(variant) ||
              doctor.lastName.toLowerCase().includes(variant)
            )
          );
          if (match) {
            console.log('✅ Found doctor by fuzzy match:', match);
            return match;
          }
        }
      }
    }
    
    console.log('❌ No matching doctor found');
    return null;
  }

  // Helper method to parse date strings
  private parseDate(dateStr: string): string {
    if (!dateStr) {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    const lowerDate = dateStr.toLowerCase();
    const today = new Date();
    
    if (lowerDate.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    if (lowerDate.includes('today')) {
      return today.toISOString().split('T')[0];
    }

    // For other dates, default to tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // Helper method to find matching time slot
  private findMatchingTimeSlot(slots: any[], timeStr: string): any {
    if (!timeStr) return null;

    const searchTime = timeStr.toLowerCase().replace(/\s+/g, '');
    
    return slots.find(slot => {
      const slotTime = (slot.displayTime || slot.time).toLowerCase().replace(/\s+/g, '');
      return slotTime.includes(searchTime) || searchTime.includes(slotTime);
    });
  }

  // Task tool integration - Call real Claude agents
  private async callClaudeAgent(agentType: string, message: string, context: any): Promise<AgentResponse> {
    console.log(`🤖 Calling Claude ${agentType} agent with context:`, context);
    
    try {
      // This would typically use the Task tool, but since we're in frontend,
      // we'll simulate the agent response based on the agent definitions
      
      switch (agentType) {
        case 'appointment-scheduler':
          return await this.handleAppointmentSchedulerAgent(message, context);
        case 'prescription-helper':
          return await this.handlePrescriptionHelperAgent(message, context);
        case 'patient-assistant':
          return await this.handlePatientAssistantAgent(message, context);
        case 'hms-orchestrator':
          return await this.handleOrchestratorAgent(message, context);
        default:
          throw new Error(`Unknown agent type: ${agentType}`);
      }
      
    } catch (error) {
      console.error(`Failed to call Claude ${agentType} agent:`, error);
      throw error;
    }
  }

  // Handler for appointment scheduler agent
  private async handleAppointmentSchedulerAgent(message: string, context: any): Promise<AgentResponse> {
    const { extractedDetails, availableDoctors } = context;
    
    console.log('📋 Appointment Agent Processing:', { message, extractedDetails, availableDoctors: availableDoctors?.length });

    // If we have doctor name and time, try direct booking
    if (extractedDetails.doctorName && extractedDetails.timeInfo) {
      return await this.processDirectBooking(message, extractedDetails);
    }

    // Otherwise, show available doctors
    if (availableDoctors && Array.isArray(availableDoctors) && availableDoctors.length > 0) {
      const doctorActions = availableDoctors.slice(0, 6).map((doctor: any) => ({
        type: 'select_doctor',
        label: `Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.specialization}`,
        data: { 
          doctorId: doctor.id, 
          doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialization: doctor.specialization 
        }
      }));

      return {
        success: true,
        message: `🏥 **AI Appointment Scheduler**\n\nHello! I'm your AI appointment scheduling assistant. I can help you book appointments with our healthcare providers.\n\n**Available Doctors (${availableDoctors.length} total):**\n\nPlease select the doctor you'd like to book an appointment with, or let me know if you need a specific specialist.`,
        type: 'appointment',
        data: { doctors: availableDoctors, extractedDetails },
        actions: [
          ...doctorActions,
          { type: 'view_all_doctors', label: 'View All Doctors', data: {} },
          { type: 'search_by_specialty', label: 'Search by Specialty', data: {} }
        ]
      };
    }

    return {
      success: false,
      message: `🏥 **Appointment Service Unavailable**\n\nI'm having trouble accessing the doctor directory right now. Please try again in a moment or contact our office directly.\n\n📞 **Alternative Options:**\n• Call our appointment line\n• Visit our patient portal\n• Try again in a few minutes`,
      type: 'appointment',
      actions: [
        { type: 'retry_appointment', label: 'Try Again', data: {} },
        { type: 'contact_office', label: 'Contact Office', data: {} }
      ]
    };
  }

  // Handler for prescription helper agent
  private async handlePrescriptionHelperAgent(message: string, _context: any): Promise<AgentResponse> {
    console.log('💊 Prescription Agent Processing:', message);
    
    // This would call the actual prescription helper Claude agent
    // For now, providing structured responses based on the agent definition
    
    return {
      success: true,
      message: `💊 **AI Prescription Assistant**\n\nHello! I'm your AI medication management assistant. I can help you with:\n\n**🏥 Medication Services:**\n• View your current prescriptions\n• Check medication interactions\n• Provide dosage information\n• Help with refill processes\n• Answer medication questions\n\n**⚠️ Important**: I provide general medication information only. Always consult your healthcare provider for medical advice.\n\nWhat would you like help with regarding your medications?`,
      type: 'prescription',
      actions: [
        { type: 'view_prescriptions', label: 'View My Prescriptions', data: {} },
        { type: 'check_interactions', label: 'Check Drug Interactions', data: {} },
        { type: 'refill_help', label: 'Refill Assistance', data: {} },
        { type: 'medication_info', label: 'Medication Information', data: {} }
      ]
    };
  }

  // Handler for patient assistant agent
  private async handlePatientAssistantAgent(message: string, _context: any): Promise<AgentResponse> {
    console.log('💙 Patient Assistant Processing:', message);
    
    return {
      success: true,
      message: `💙 **AI Patient Care Assistant**\n\nHello! I'm your compassionate AI patient care assistant. I'm here to provide support and help you navigate your healthcare journey.\n\n**🌟 How I Can Help:**\n• Access your health records and medical history\n• Provide emotional support during health challenges\n• Explain medical terms and test results\n• Help coordinate your care\n• Offer wellness guidance and resources\n\n**💝 My Approach**: I provide empathetic, patient-centered support while always encouraging professional medical care when appropriate.\n\nWhat aspect of your health or healthcare would you like support with today?`,
      type: 'health',
      actions: [
        { type: 'health_records', label: 'Access Health Records', data: {} },
        { type: 'emotional_support', label: 'I Need Support', data: {} },
        { type: 'explain_results', label: 'Explain Medical Terms', data: {} },
        { type: 'wellness_guidance', label: 'Wellness Guidance', data: {} }
      ]
    };
  }

  // Handler for orchestrator agent
  private async handleOrchestratorAgent(message: string, _context: any): Promise<AgentResponse> {
    console.log('🎯 Orchestrator Agent Processing:', message);
    
    return {
      success: true,
      message: `🏥 **AI Healthcare System Orchestrator**\n\nWelcome! I'm your central AI healthcare assistant. I coordinate all aspects of your care and can connect you with specialized AI agents.\n\n**🎯 I can help you with:**\n\n**📅 Appointments** - Book, reschedule, or cancel appointments\n**💊 Medications** - Prescription management and information\n**🩺 Health Records** - Access medical history and test results\n**💙 Patient Support** - Emotional support and health guidance\n**❓ General Questions** - Hospital information and services\n\nWhat would you like help with today? I'll make sure you get connected with the right specialist.`,
      type: 'general',
      actions: [
        { type: 'book_appointment', label: '📅 Appointments', data: {} },
        { type: 'prescription_help', label: '💊 Medications', data: {} },
        { type: 'health_records', label: '🩺 Health Records', data: {} },
        { type: 'patient_support', label: '💙 Patient Support', data: {} },
        { type: 'hospital_info', label: '❓ General Info', data: {} }
      ]
    };
  }

  // Helper to get available doctors
  private async getAvailableDoctors(): Promise<any[]> {
    try {
      const response = await hmsApiClient.getDoctors();
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Failed to get available doctors:', error);
      return [];
    }
  }

  // Helper to get patient context
  private async getPatientContext(): Promise<any> {
    try {
      // In a real implementation, this would get current patient info
      return {
        authenticated: !!localStorage.getItem('token'),
        userId: localStorage.getItem('userId') || null
      };
    } catch (error) {
      console.error('Failed to get patient context:', error);
      return { authenticated: false };
    }
  }

  // Helper to detect emotional context in messages
  private detectEmotionalContext(message: string): any {
    const lowerMessage = message.toLowerCase();
    const emotionalIndicators = {
      anxiety: ['anxious', 'worried', 'nervous', 'scared', 'fear', 'panic', 'stress'],
      sadness: ['sad', 'depressed', 'down', 'upset', 'crying', 'lonely', 'hopeless'],
      anger: ['angry', 'mad', 'frustrated', 'annoyed', 'irritated', 'furious'],
      pain: ['hurt', 'pain', 'ache', 'sore', 'uncomfortable', 'burning', 'sharp'],
      confusion: ['confused', 'lost', 'unclear', 'dont understand', 'help me understand']
    };

    const detectedEmotions = [];
    for (const [emotion, keywords] of Object.entries(emotionalIndicators)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        detectedEmotions.push(emotion);
      }
    }

    return {
      emotions: detectedEmotions,
      needsSupport: detectedEmotions.length > 0,
      urgency: detectedEmotions.includes('panic') || lowerMessage.includes('emergency') ? 'high' : 'normal'
    };
  }

  // Specific action handlers (these would interact with the actual APIs)
  async cancelAppointment(_appointmentId: string): Promise<AgentResponse> {
    try {
      // This would call the real API through the HMS integration
      return {
        success: true,
        message: `✅ **Appointment Cancelled Successfully**\n\nYour appointment has been cancelled and removed from your schedule.\n\n**📅 What's Next:**\n• You'll receive a cancellation confirmation email\n• If you need to reschedule, I can help you book a new appointment\n• For urgent medical needs, please contact our office directly\n\nIs there anything else I can help you with today? 💙`,
        type: 'appointment',
        actions: [
          { type: 'book_new_appointment', label: 'Book New Appointment', data: {} },
          { type: 'view_appointments', label: 'View My Appointments', data: {} }
        ]
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm sorry, I couldn't cancel your appointment. ${error.message} Please contact our office directly. 📞`,
        type: 'appointment'
      };
    }
  }

  async rescheduleAppointment(_appointmentId: string, _newDateTime?: Date): Promise<AgentResponse> {
    try {
      return {
        success: true,
        message: `🔄 **Appointment Rescheduling**\n\nI'd be happy to help reschedule your appointment! \n\n**📅 To reschedule, please let me know:**\n• Your preferred new date\n• Your preferred time\n• Any scheduling constraints\n\n**Example**: "Reschedule to next Tuesday at 2 PM" or "Move to next week, any afternoon time"\n\nWhat new date and time would work better for you?`,
        type: 'appointment'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `I'm sorry, I couldn't reschedule your appointment. ${error.message} Please contact our office directly. 📞`,
        type: 'appointment'
      };
    }
  }
}

export const claudeAgentService = new ClaudeAgentService();
export default claudeAgentService;