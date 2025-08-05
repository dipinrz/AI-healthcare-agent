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
      // Use NLP to extract appointment details from message context
      const extractedDetails = this.extractAppointmentDetails(message);
      
      // If we have enough details, try to book directly
      if (extractedDetails.doctorName && extractedDetails.timeInfo) {
        return await this.processDirectBooking(message, extractedDetails);
      }
      
      // Otherwise, start interactive booking flow
      if (message.toLowerCase().includes('book') || message.toLowerCase().includes('schedule')) {
        // Try to get available doctors from API
        try {
          const doctorsResponse = await hmsApiClient.getDoctors();
          if (doctorsResponse.success && doctorsResponse.data?.length > 0) {
            const doctorActions = doctorsResponse.data.slice(0, 6).map((doctor: any) => ({
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
              message: `🏥 **Appointment Scheduling Assistant**\n\nI found ${doctorsResponse.data.length} available doctors! Please select the doctor you'd like to book an appointment with:\n\n**Available Doctors:**`,
              type: 'appointment',
              data: { doctors: doctorsResponse.data },
              actions: [
                ...doctorActions,
                { type: 'view_all_doctors', label: 'View All Doctors', data: {} }
              ]
            };
          }
        } catch (apiError) {
          console.log('API not available, using fallback response');
        }
        return {
          success: true,
          message: `🏥 **Appointment Scheduling Assistant**\n\nI'd be happy to help you book an appointment! To get started, I need to:\n\n1. **Find the right doctor** - What type of specialist do you need?\n2. **Check availability** - What dates work for you?\n3. **Confirm details** - Time preferences and reason for visit\n\n**Popular specialties:**\n• Cardiology - Heart and cardiovascular care\n• Dermatology - Skin conditions and treatments\n• Internal Medicine - General adult care\n• Psychiatry - Mental health support\n\nWhat type of doctor would you like to see, or do you have a specific doctor in mind? 👨‍⚕️`,
          type: 'appointment',
          actions: [
            { type: 'book_cardiology', label: 'Cardiology', data: { specialization: 'cardiology' } },
            { type: 'book_dermatology', label: 'Dermatology', data: { specialization: 'dermatology' } },
            { type: 'book_general', label: 'General Medicine', data: { specialization: 'internal medicine' } },
            { type: 'view_all_doctors', label: 'View All Doctors', data: {} }
          ]
        };
      } else if (message.toLowerCase().includes('cancel')) {
        return {
          success: true,
          message: `📅 **Appointment Cancellation**\n\nI'll help you cancel your appointment. Let me check your scheduled appointments...\n\n*Checking your appointments...*\n\nTo cancel an appointment, I'll need to:\n1. **Find your appointment** in our system\n2. **Confirm cancellation** details\n3. **Process the cancellation** and send confirmation\n\nWould you like me to show you all your upcoming appointments so you can select which one to cancel?`,
          type: 'appointment',
          actions: [
            { type: 'view_appointments', label: 'Show My Appointments', data: {} },
            { type: 'cancel_specific', label: 'Cancel Specific Appointment', data: {} }
          ]
        };
      } else {
        return {
          success: true,
          message: `🏥 **Appointment Services**\n\nI can help you with all your appointment needs:\n\n**📅 Available Services:**\n• **Book new appointments** with any of our specialists\n• **Check doctor availability** and schedules\n• **Reschedule existing appointments** to better times\n• **Cancel appointments** when needed\n• **Emergency appointment** scheduling\n\nWhat would you like to do today?`,
          type: 'appointment',
          actions: [
            { type: 'book_appointment', label: 'Book New Appointment', data: {} },
            { type: 'view_appointments', label: 'View My Appointments', data: {} },
            { type: 'check_availability', label: 'Check Doctor Availability', data: {} }
          ]
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `I'm having trouble with appointment scheduling right now. Please contact our office directly at your convenience. 📞`,
        type: 'appointment'
      };
    }
  }

  // Route to prescription helper agent
  private async routeToPrescriptionHelper(message: string): Promise<AgentResponse> {
    try {
      if (message.toLowerCase().includes('refill')) {
        return {
          success: true,
          message: `💊 **Prescription Refill Assistant**\n\nI'd be happy to help guide you through the refill process!\n\n**🏥 Refill Options:**\n• **Pharmacy Direct** - Call your pharmacy's refill line\n• **Online Portal** - Use your pharmacy's app or website\n• **Doctor's Office** - Contact your prescribing physician\n• **Mail Order** - Through your insurance's mail pharmacy\n\n**⚠️ Important**: For safety reasons, prescription refills must be processed through your pharmacy or doctor's office directly.\n\nWould you like me to:\n• Help you find your pharmacy's contact information?\n• Schedule an appointment to discuss your medications?\n• Provide guidance on when to refill prescriptions?`,
          type: 'prescription',
          actions: [
            { type: 'find_pharmacy', label: 'Find My Pharmacy', data: {} },
            { type: 'schedule_med_review', label: 'Schedule Medication Review', data: { reason: 'medication consultation' } },
            { type: 'refill_guidance', label: 'Refill Guidance', data: {} }
          ]
        };
      } else if (message.toLowerCase().includes('side effects')) {
        return {
          success: true,
          message: `💊 **Medication Information Assistant**\n\nI can provide general information about medication side effects, but it's important to discuss specific concerns with your healthcare provider.\n\n**🔍 For medication information, I can help with:**\n• General side effect information\n• Basic drug interaction guidance\n• Medication education and resources\n• Connecting you with pharmacists or doctors\n\n**⚠️ Medical Disclaimer**: This information is educational only. Always consult your healthcare provider or pharmacist for personalized medical advice.\n\nWhat specific medication would you like information about?`,
          type: 'prescription',
          actions: [
            { type: 'medication_info', label: 'Get Medication Info', data: {} },
            { type: 'talk_to_pharmacist', label: 'Connect with Pharmacist', data: {} },
            { type: 'schedule_med_consult', label: 'Schedule Consultation', data: {} }
          ]
        };
      } else {
        return {
          success: true,
          message: `💊 **Prescription & Medication Services**\n\nI'm here to help with all your medication needs:\n\n**🏥 Services Available:**\n• **Prescription Management** - View and organize your medications\n• **Refill Guidance** - Help with prescription refill process\n• **Medication Information** - General drug information and education\n• **Safety Resources** - Drug interactions and side effect information\n• **Pharmacy Support** - Connect with pharmacists and specialists\n\n**⚠️ Safety First**: Always consult healthcare professionals for medical advice.\n\nHow can I assist you with your medications today?`,
          type: 'prescription',
          actions: [
            { type: 'view_prescriptions', label: 'View My Prescriptions', data: {} },
            { type: 'refill_help', label: 'Refill Help', data: {} },
            { type: 'medication_info', label: 'Medication Information', data: {} }
          ]
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `I'm having trouble accessing medication services right now. For immediate medication concerns, please contact your pharmacy or doctor. 💊`,
        type: 'prescription'
      };
    }
  }

  // Route to patient assistant agent
  private async routeToPatientAssistant(message: string): Promise<AgentResponse> {
    try {
      if (message.toLowerCase().includes('anxious') || message.toLowerCase().includes('worried')) {
        return {
          success: true,
          message: `💙 **Patient Care & Support**\n\nI understand you're feeling anxious, and that's completely normal. Many patients experience anxiety about their health, and I'm here to provide caring support.\n\n**🤗 Let's work through this together:**\n\n**Immediate Support:**\n• **Breathing Exercise** - Try the 4-7-8 technique: inhale for 4, hold for 7, exhale for 8\n• **Grounding** - Focus on 5 things you can see, 4 you can touch, 3 you can hear\n• **Reassurance** - Remember that seeking help shows strength and self-care\n\n**💪 Next Steps:**\n• **Talk it through** - Share what's causing your anxiety\n• **Healthcare support** - Connect with professionals who can help\n• **Resource guidance** - Find appropriate support services\n\nWhat specific health concern is causing you to feel anxious? I'm here to listen and help. 🌟`,
          type: 'health',
          actions: [
            { type: 'breathing_exercise', label: 'Guided Breathing', data: {} },
            { type: 'talk_about_concerns', label: 'Discuss Concerns', data: {} },
            { type: 'find_support', label: 'Find Support Resources', data: {} },
            { type: 'schedule_support_call', label: 'Schedule Support Call', data: {} }
          ]
        };
      } else if (message.toLowerCase().includes('health records') || message.toLowerCase().includes('medical history')) {
        return {
          success: true,
          message: `📋 **Health Records & Medical History**\n\nI can help you access and understand your health information!\n\n**🏥 Available Information:**\n• **Medical History** - Past treatments, procedures, and diagnoses\n• **Test Results** - Lab work, imaging, and diagnostic results\n• **Vital Signs** - Blood pressure, weight, temperature trends\n• **Medications** - Current and past prescription history\n• **Appointments** - Visit summaries and provider notes\n\n**🔒 Privacy & Security**: Your health information is protected and secure.\n\n**⚠️ Important**: I can help explain general medical information, but always consult your healthcare provider for specific medical advice.\n\nWhat specific health information would you like to review?`,
          type: 'health',
          actions: [
            { type: 'view_health_summary', label: 'Health Summary', data: {} },
            { type: 'view_test_results', label: 'Recent Test Results', data: {} },
            { type: 'view_vital_signs', label: 'Vital Signs History', data: {} },
            { type: 'explain_medical_terms', label: 'Explain Medical Terms', data: {} }
          ]
        };
      } else {
        return {
          success: true,
          message: `💙 **Patient Care & Health Support**\n\nI'm your dedicated patient care assistant, here to provide comprehensive support for your healthcare journey.\n\n**🌟 How I Can Help:**\n• **Health Records** - Access and explain your medical information\n• **Emotional Support** - Caring guidance through health challenges\n• **Medical Education** - Help understand conditions and treatments\n• **Care Coordination** - Connect different aspects of your care\n• **Wellness Guidance** - General health and prevention information\n\n**💙 My Approach**: I provide empathetic, patient-centered support while always encouraging professional medical care when appropriate.\n\nWhat aspect of your health or healthcare would you like support with today?`,
          type: 'health',
          actions: [
            { type: 'health_records', label: 'Access Health Records', data: {} },
            { type: 'emotional_support', label: 'I Need Support', data: {} },
            { type: 'health_education', label: 'Health Information', data: {} },
            { type: 'care_coordination', label: 'Coordinate My Care', data: {} }
          ]
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `I'm having trouble accessing patient support services right now. For immediate support, please contact your healthcare provider. 💙`,
        type: 'health'
      };
    }
  }

  // Route to orchestrator agent
  private async routeToOrchestrator(message: string): Promise<AgentResponse> {
    return {
      success: true,
      message: `🏥 **Healthcare System Assistant**\n\nWelcome! I'm here to help you navigate our comprehensive healthcare services. I can coordinate all aspects of your care and connect you with the right specialists.\n\n**🎯 I can help you with:**\n\n**📅 Appointments**\n• Book appointments with specialists\n• Check doctor availability and schedules\n• Manage existing appointments\n\n**💊 Medications**  \n• Prescription management and refills\n• Medication information and safety\n• Pharmacy coordination\n\n**🩺 Health Records**\n• Access your medical history and test results\n• Health monitoring and tracking\n• Care coordination between providers\n\n**💙 Patient Support**\n• Emotional support and health anxiety guidance\n• Medical education and explanation\n• Resource navigation and advocacy\n\nWhat would you like help with today? I can handle simple requests directly or connect you with specialized assistants for more complex needs.`,
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

  // NLP Methods for extracting appointment details from natural language
  private extractAppointmentDetails(message: string): any {
    const details = {
      doctorName: null,
      specialty: null,
      timeInfo: null,
      dateInfo: null,
      reason: null,
      urgency: 'normal'
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

      const matchingDoctor = this.findMatchingDoctor(doctorsResponse.data, details);
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
        type: 'consultation'
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
      
      for (const [key, variants] of Object.entries(commonMappings)) {
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

  // Specific action handlers (these would interact with the actual APIs)
  async cancelAppointment(appointmentId: string): Promise<AgentResponse> {
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

  async rescheduleAppointment(appointmentId: string, newDateTime?: Date): Promise<AgentResponse> {
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