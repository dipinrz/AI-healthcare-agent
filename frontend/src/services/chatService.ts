import axios from 'axios';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

export interface ChatMessage {
  id: string;
  message: string;
  timestamp: string;
  type: 'user' | 'assistant';
  context?: any;
  actions?: any[];
}

export interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    timestamp: string;
    type: 'assistant';
    context?: any;
    actions?: any[];
  };
  message?: string;
}

export interface ChatHistory {
  success: boolean;
  data: {
    chats: ChatMessage[];
    message: string;
  };
}

class ChatService {
  private getAuthHeaders() {
    // Try different token keys that might be used
    const token = localStorage.getItem('token') || 
                 localStorage.getItem('auth_token') || 
                 localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        buildApiUrl(API_ENDPOINTS.CHAT.SEND_MESSAGE),
        { message },
        { headers: this.getAuthHeaders() }
      );
      return response.data as ChatResponse;
    } catch (error: any) {
      console.error('Chat service error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message'
      );
    }
  }

  async getChatHistory(): Promise<ChatHistory> {
    try {
      const response = await axios.get(
        buildApiUrl(API_ENDPOINTS.CHAT.GET_HISTORY),
        { headers: this.getAuthHeaders() }
      );
      return response.data as ChatHistory;
    } catch (error: any) {
      console.error('Chat history service error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to get chat history'
      );
    }
  }

  // Sample conversation starters for the AI agent
  getSamplePrompts() {
    return [
      {
        category: "Appointment Booking",
        prompts: [
          "I need to book an appointment with Dr. Smith for tomorrow",
          "Book appointment with cardiologist for next week",
          "Schedule me with Dr. Johnson for December 20th at 2pm",
          "I need an emergency appointment today"
        ]
      },
      {
        category: "Availability Check",
        prompts: [
          "What doctors are available this week?",
          "When is Dr. Brown available?",
          "Show me available times for tomorrow",
          "What are the earliest available slots?"
        ]
      },
      {
        category: "Appointment Management",
        prompts: [
          "Cancel my appointment",
          "Reschedule my appointment to next week",
          "I need to change my appointment time",
          "What appointments do I have scheduled?"
        ]
      },
      {
        category: "Follow-up & Routine",
        prompts: [
          "Schedule a follow-up appointment",
          "I need a routine checkup",
          "Book annual physical exam",
          "Schedule preventive care appointment"
        ]
      }
    ];
  }

  // Format messages for better display
  formatMessageForDisplay(message: string): string {
    // Handle numbered lists
    message = message.replace(/(\d+)\.\s/g, '$1. ');
    
    // Handle bullet points
    message = message.replace(/•\s/g, '• ');
    message = message.replace(/-\s/g, '• ');
    
    return message;
  }

  // Extract appointment details from AI response actions
  extractAppointmentDetails(actions: any[]) {
    const appointmentAction = actions.find(action => action.type === 'appointment_booked');
    return appointmentAction?.appointmentDetails || null;
  }

  // Check if message contains appointment-related keywords
  isAppointmentRelated(message: string): boolean {
    const appointmentKeywords = [
      'appointment', 'book', 'schedule', 'reschedule', 'cancel',
      'doctor', 'dr', 'available', 'availability', 'time slot',
      'emergency', 'urgent', 'follow-up', 'checkup'
    ];
    
    const lowerMessage = message.toLowerCase();
    return appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Generate contextual quick replies based on conversation
  getContextualQuickReplies(lastMessage?: ChatMessage): string[] {
    if (!lastMessage || lastMessage.type === 'user') {
      return [
        "Book appointment",
        "Check availability", 
        "Cancel appointment",
        "Emergency booking"
      ];
    }

    const message = lastMessage.message.toLowerCase();
    
    // If AI asked about doctor preference
    if (message.includes('which doctor') || message.includes('doctor would you like')) {
      return [
        "Dr. Smith",
        "Dr. Johnson", 
        "Dr. Brown",
        "Any available doctor"
      ];
    }
    
    // If AI showed available times
    if (message.includes('available times') || message.includes('available slots')) {
      return [
        "First available",
        "Morning slot",
        "Afternoon slot", 
        "Different date"
      ];
    }
    
    // If AI asked about appointment type
    if (message.includes('type of appointment') || message.includes('reason for visit')) {
      return [
        "Consultation",
        "Follow-up",
        "Emergency",
        "Routine checkup"
      ];
    }
    
    // Default quick replies
    return [
      "Yes, continue",
      "No, cancel",
      "Show other options",
      "Start over"
    ];
  }
}

export const chatService = new ChatService();
export default chatService;