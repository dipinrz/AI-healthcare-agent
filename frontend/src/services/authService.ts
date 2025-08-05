import { API_ENDPOINTS, buildApiUrl } from '../config/api';

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    specialization: string;
    qualification: string;
    experience: number;
    department: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  role?: 'patient' | 'doctor';
  specialization?: string;
  qualification?: string;
  experience?: number;
  department?: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result: AuthResponse = await response.json();

      if (result.success && result.data) {
        this.token = result.data.token;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const result: AuthResponse = await response.json();

      if (result.success && result.data) {
        this.token = result.data.token;
        localStorage.setItem('auth_token', this.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(buildApiUrl(API_ENDPOINTS.AUTH.LOGOUT), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  async getProfile(): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      if (!this.token) {
        return { success: false, message: 'No authentication token' };
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.PROFILE), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
        return { success: true, user: result.data.user };
      }

      return { success: false, message: result.message };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: 'Network error' };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.token) {
        return { success: false, message: 'No authentication token' };
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async resetPasswordRequest(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD_REQUEST), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('Reset password request error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async verifyToken(): Promise<boolean> {
    try {
      if (!this.token) {
        return false;
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.AUTH.VERIFY), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  isPatient(): boolean {
    return this.hasRole('patient');
  }

  isDoctor(): boolean {
    return this.hasRole('doctor');
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }
}

export const authService = new AuthService();
export default authService;