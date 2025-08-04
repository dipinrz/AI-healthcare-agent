import { Router, Request, Response } from 'express';
import { AuthService, RegisterData, LoginData } from '../services/authService';
import { UserRole } from '../entities/User';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const authService = new AuthService();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName, phone, dateOfBirth, gender, specialization, qualification, experience, department } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, firstName, lastName, phone'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const registerData: RegisterData = {
      email,
      password,
      role: role || UserRole.PATIENT,
      firstName,
      lastName,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      specialization,
      qualification,
      experience,
      department
    };

    const result = await authService.register(registerData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const loginData: LoginData = { email, password };
    const result = await authService.login(loginData);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'User not found'
    });
  }
});

// Change password endpoint
router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const result = await authService.changePassword(req.user!.userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password change failed'
    });
  }
});

// Password reset request
router.post('/reset-password-request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await authService.resetPassword(email);

    res.json({
      success: true,
      message: result.message,
      // In production, don't return the token - send it via email instead
      resetToken: result.resetToken
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password reset request failed'
    });
  }
});

// Password reset confirmation
router.post('/reset-password-confirm', async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const result = await authService.confirmPasswordReset(resetToken, newPassword);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Password reset failed'
    });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.user!.userId,
      role: req.user!.role
    }
  });
});

export default router;