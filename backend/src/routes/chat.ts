import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppointmentAIService } from '../services/appointmentAIService';

const router = Router();
const appointmentAI = new AppointmentAIService();

// In-memory session storage (replace with Redis in production)
const conversationSessions = new Map();

// Protected routes
router.use(authenticateToken);

// AI-powered chat endpoint with appointment booking capabilities
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const user = (req as any).user;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Only handle appointment-related queries for patients
    if (user.role !== 'patient') {
      // Fallback to simple responses for non-patients
      const responses = {
        greeting: "Hello! I'm your AI healthcare assistant. How can I help you today?",
        default: "I'm here to help with your healthcare needs. As a healthcare provider, you can use the regular appointment management interface."
      };

      const lowerMessage = message.toLowerCase();
      const response = (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) 
        ? responses.greeting 
        : responses.default;

      return res.json({
        success: true,
        data: {
          message: response,
          timestamp: new Date().toISOString(),
          type: 'assistant'
        }
      });
    }

    // Get patient ID from JWT token
    const patientId = user.patientId;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Get or create conversation session
    const sessionId = `${patientId}_${Date.now()}`;
    let context = conversationSessions.get(patientId) || {};

    // Process message with AI service
    const result = await appointmentAI.processMessage(message, patientId, context);
    
    // Update conversation session
    conversationSessions.set(patientId, result.context);

    // Auto-expire sessions after 30 minutes of inactivity
    setTimeout(() => {
      conversationSessions.delete(patientId);
    }, 30 * 60 * 1000);

    res.json({
      success: true,
      data: {
        message: result.response,
        timestamp: new Date().toISOString(),
        type: 'assistant',
        context: result.context,
        actions: result.actions || []
      }
    });

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error processing your message. Please try again.'
    });
  }
});

// Get chat history (placeholder)
router.get('/history', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      chats: [
        {
          id: '1',
          message: "Hello! I'm your AI healthcare assistant.",
          type: 'assistant',
          timestamp: new Date().toISOString()
        }
      ],
      message: 'Chat history retrieved successfully'
    }
  });
});

export default router;