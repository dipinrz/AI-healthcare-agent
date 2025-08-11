import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Patient } from '../entities/Patient';
import axios from 'axios';

const router = Router();
const patientRepository = AppDataSource.getRepository(Patient);

// External agent configuration
const AGENT_URL = "https://patient-facing-virtual-assistant.onrender.com/agent/respond";

// Protected routes
router.use(authenticateToken);

// AI-powered chat endpoint with external agent integration
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

    // Only handle chat for patients
    if (user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Chat service is only available for patients'
      });
    }

    // Get patient ID and details
    const patientId = user.patientId;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Get patient details for the external agent
    const patient = await patientRepository.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get JWT token from request headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
    }

    // Prepare payload for external agent
    const payload = {
      patient_id: patientId,
      patient_name: `${patient.firstName} ${patient.lastName}`,
      auth_token: authHeader, // Already includes "Bearer " prefix
      message: message
    };

    console.log('Calling external agent with payload:', payload);

    // Call external agent API
    const agentResponse = await axios.post(AGENT_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    // Return the agent's response
    res.json({
      success: true,
      data: {
        message: agentResponse.data.response || agentResponse.data.message || 'No response from agent',
        timestamp: new Date().toISOString(),
        type: 'assistant',
        agent: agentResponse.data.agent || 'Unknown',
        agent_data: agentResponse.data
      }
    });

  } catch (error) {
    console.error('Chat message error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // External API error
      console.error('External agent error:', error.response.data);
      return res.status(500).json({
        success: false,
        message: 'Sorry, I encountered an error processing your message. Please try again.',
        error_details: error.response.data
      });
    } else if (error.request) {
      // Network error
      console.error('Network error calling external agent');
      return res.status(500).json({
        success: false,
        message: 'Sorry, I cannot connect to the assistant service right now. Please try again later.'
      });
    } else {
      // Other error
      return res.status(500).json({
        success: false,
        message: 'Sorry, I encountered an error processing your message. Please try again.'
      });
    }
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