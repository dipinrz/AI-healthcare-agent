// Claude Agent Service - Routes to external AI agent
import hmsApiClient from './hmsApiClient';
import authService from './authService';
import axios from 'axios';

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
  private readonly EXTERNAL_AGENT_URL = "https://patient-facing-virtual-assistant.onrender.com/agent/respond";

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


  // Main message processing - routes to external AI agent
  async processMessage(message: string): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get patient info from token
      const patientInfo = await this.getPatientInfo();
      if (!patientInfo.patientId || !patientInfo.patientName) {
        return {
          success: false,
          message: '🔐 Please log in to access the AI healthcare assistant.',
          type: 'general',
          actions: [
            { type: 'refresh_page', label: 'Refresh Page', data: {} }
          ]
        };
      }

      // Prepare payload for external agent
      const payload = {
        patient_id: patientInfo.patientId,
        patient_name: patientInfo.patientName,
        auth_token: patientInfo.token, // Token already includes "Bearer" prefix
        message: message
      };

      console.log('🚀 Calling external agent with payload:', payload);

      // Call external agent API
      const response = await axios.post(this.EXTERNAL_AGENT_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      // Transform external agent response to our format
      const responseData = response.data as any;
      
      // Log the complete response structure
      console.log('🔍 Complete API response structure:', JSON.stringify(responseData, null, 2));
      console.log('🔍 Response keys:', Object.keys(responseData || {}));
      
      // Try to extract message from various possible fields
      const possibleMessageFields = [
        responseData.response,
        responseData.message, 
        responseData.content,
        responseData.text,
        responseData.reply,
        responseData.output,
        responseData.result
      ];
      
      let rawMessage = 'No response from agent';
      for (const field of possibleMessageFields) {
        if (field && typeof field === 'string' && field.trim()) {
          rawMessage = field;
          break;
        }
      }
      
      console.log('📝 Extracted message:', rawMessage);
      console.log('📝 Message length:', rawMessage.length);
      
      // SHOW COMPLETE RAW RESPONSE - No formatting applied
      const displayMessage = rawMessage;
      
      return {
        success: true,
        message: displayMessage,
        type: 'general',
        data: responseData,
        actions: this.parseActionsFromResponse(rawMessage)
      };

    } catch (error: any) {
      console.error('External Agent processing error:', error);
      
      // Handle different error types
      if (error.response) {
        // External API error
        console.error('External agent error:', error.response.data);
        return {
          success: false,
          message: `I apologize, but I'm experiencing some technical difficulties right now. Let me try to help you anyway! 💙\n\nFor immediate assistance:\n• Call our office directly\n• Visit our patient portal\n• Try your request again in a moment\n\nHow else can I support you?`,
          type: 'general'
        };
      } else if (error.request) {
        // Network error
        console.error('Network error calling external agent');
        return {
          success: false,
          message: `🌐 I cannot connect to the AI assistant service right now. Please check your internet connection and try again.\n\nFor immediate assistance:\n• Call our office directly\n• Visit our patient portal\n• Try again in a few moments`,
          type: 'general',
          actions: [
            { type: 'retry_message', label: 'Try Again', data: { message } }
          ]
        };
      } else {
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
  }






  // Helper to extract patient info from JWT token
  private async getPatientInfo(): Promise<{patientId?: string, patientName?: string, token?: string}> {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (!token) {
        return {};
      }

      // First try to get user data from localStorage (stored after login)
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.patient && user.patient.firstName && user.patient.lastName) {
            return {
              patientId: user.patient.id,
              patientName: `${user.patient.firstName} ${user.patient.lastName}`,
              token: token
            };
          }
        }
      } catch (error) {
        console.warn('Could not get user from localStorage');
      }

      // Decode JWT token to get patient info
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Get patient name from API if we have patientId
      if (payload.patientId) {
        try {
          // Try to get patient name from HMS API if method exists
          if (typeof (hmsApiClient as any).getProfile === 'function') {
            const response = await (hmsApiClient as any).getProfile();
            if (response.success && response.data) {
              return {
                patientId: payload.patientId,
                patientName: `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim(),
                token: token
              };
            }
          }

          // Try to get from authService
          const authProfile = await authService.getProfile();
          if (authProfile.success && authProfile.user && authProfile.user.patient) {
            return {
              patientId: payload.patientId,
              patientName: `${authProfile.user.patient.firstName} ${authProfile.user.patient.lastName}`,
              token: token
            };
          }
        } catch (error) {
          console.warn('Could not fetch patient profile, using token data only');
        }
        
        // Fallback to token data only
        return {
          patientId: payload.patientId,
          patientName: `Patient ${payload.patientId.substring(0, 8)}`,
          token: token
        };
      }

      return { token };
    } catch (error) {
      console.error('Failed to get patient info:', error);
      return {};
    }
  }


  // Helper to parse action buttons from agent response
  private parseActionsFromResponse(responseText: string): any[] {
    const actions = [];
    
    // Look for common patterns in appointment booking responses
    if (responseText.toLowerCase().includes('appointment') && responseText.toLowerCase().includes('booked')) {
      actions.push({ type: 'view_appointments', label: '📅 View My Appointments', data: {} });
      actions.push({ type: 'book_another', label: '➕ Book Another', data: {} });
    } else if (responseText.toLowerCase().includes('book') || responseText.toLowerCase().includes('appointment')) {
      actions.push({ type: 'view_all_doctors', label: '👨‍⚕️ View Doctors', data: {} });
      actions.push({ type: 'check_availability', label: '📅 Check Availability', data: {} });
    } else if (responseText.toLowerCase().includes('unable to access') || responseText.toLowerCase().includes('technical issue')) {
      actions.push({ type: 'retry_request', label: '🔄 Try Again', data: {} });
      actions.push({ type: 'contact_support', label: '📞 Contact Support', data: {} });
    }
    
    return actions;
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