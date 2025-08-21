import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface TestNotificationRequest {
  type?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  targetPatientId?: string;
}

export interface TestNotificationResponse {
  success: boolean;
  message: string;
  data?: {
    sent: boolean;
    patientId: string;
    notificationType: string;
    customData: any;
  };
}

export interface NotificationType {
  type: string;
  name: string;
  description: string;
  example: string;
}

export interface NotificationTypesResponse {
  success: boolean;
  message: string;
  data?: {
    types: NotificationType[];
  };
}

class TestNotificationService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async sendTestNotification(request: TestNotificationRequest = {}): Promise<TestNotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/test-notifications/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      return await response.json();
    } catch (error) {
      console.error('Send test notification error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getNotificationTypes(): Promise<NotificationTypesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/test-notifications/types`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Get notification types error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async testAllNotificationSettings(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/test-notifications/test-settings`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Test notification settings error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Quick test methods for different notification types
  async sendReminderTest(hours: '24' | '1'): Promise<TestNotificationResponse> {
    return this.sendTestNotification({
      type: `reminder_${hours}h`,
      doctorName: 'Dr. Johnson',
      appointmentDate: hours === '24' ? 'Tomorrow' : 'Today',
      appointmentTime: '2:00 PM'
    });
  }

  async sendAppointmentConfirmedTest(): Promise<TestNotificationResponse> {
    return this.sendTestNotification({
      type: 'confirmed',
      doctorName: 'Dr. Martinez',
      appointmentDate: 'December 25th',
      appointmentTime: '10:30 AM'
    });
  }

  async sendAppointmentCancelledTest(): Promise<TestNotificationResponse> {
    return this.sendTestNotification({
      type: 'cancelled',
      doctorName: 'Dr. Wilson',
      appointmentDate: 'December 24th',
      appointmentTime: '3:15 PM'
    });
  }

  async sendAppointmentRescheduledTest(): Promise<TestNotificationResponse> {
    return this.sendTestNotification({
      type: 'rescheduled',
      doctorName: 'Dr. Brown',
      appointmentDate: 'December 26th',
      appointmentTime: '11:00 AM'
    });
  }

  async sendGeneralTest(): Promise<TestNotificationResponse> {
    return this.sendTestNotification({
      type: 'general'
    });
  }
}

export const testNotificationService = new TestNotificationService();
export default testNotificationService;