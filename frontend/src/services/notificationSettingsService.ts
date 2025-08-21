import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface NotificationSettings {
  id: string;
  patientId: string;
  notificationsEnabled: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  appointmentConfirmed: boolean;
  appointmentCancelled: boolean;
  appointmentRescheduled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettingsUpdate {
  notificationsEnabled?: boolean;
  reminder24h?: boolean;
  reminder1h?: boolean;
  appointmentConfirmed?: boolean;
  appointmentCancelled?: boolean;
  appointmentRescheduled?: boolean;
}

export interface NotificationSettingsResponse {
  success: boolean;
  message: string;
  data?: NotificationSettings;
}

export interface NotificationStatusResponse {
  success: boolean;
  message: string;
  data?: { enabled: boolean };
}

class NotificationSettingsService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getNotificationSettings(): Promise<NotificationSettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notification-settings`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Get notification settings error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async updateNotificationSettings(settings: NotificationSettingsUpdate): Promise<NotificationSettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notification-settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Update notification settings error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async enableNotifications(): Promise<NotificationSettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notification-settings/enable`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Enable notifications error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async disableNotifications(): Promise<NotificationSettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notification-settings/disable`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Disable notifications error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async checkNotificationStatus(): Promise<NotificationStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notification-settings/status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      return await response.json();
    } catch (error) {
      console.error('Check notification status error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async toggleNotifications(enabled: boolean): Promise<NotificationSettingsResponse> {
    return enabled ? this.enableNotifications() : this.disableNotifications();
  }
}

export const notificationSettingsService = new NotificationSettingsService();
export default notificationSettingsService;