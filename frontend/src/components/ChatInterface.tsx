import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Container,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Favorite as HeartIcon,
  Event as CalendarIcon,
  LocalPharmacy as PillIcon,
  Help as HelpIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

interface Message {
  id: string;
  type: 'user' | 'agent';
  message: string;
  timestamp: Date;
  agentType?: string;
}

interface ChatInterfaceProps {
  user: any;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      message: `Hello ${user?.firstName || 'there'}! I'm your AI Health Assistant. I can help you with appointments, medication questions, general health FAQs, and provide emotional support. How can I assist you today?`,
      timestamp: new Date(),
      agentType: 'orchestrator'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case 'appointment':
        return <CalendarIcon sx={{ fontSize: 16 }} />;
      case 'medication':
        return <PillIcon sx={{ fontSize: 16 }} />;
      case 'faq':
        return <HelpIcon sx={{ fontSize: 16 }} />;
      case 'emotional_support':
        return <HeartIcon sx={{ fontSize: 16 }} />;
      case 'escalation':
        return <PhoneIcon sx={{ fontSize: 16 }} />;
      default:
        return <BotIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getAgentName = (agentType?: string) => {
    switch (agentType) {
      case 'appointment':
        return 'Appointment Agent';
      case 'medication':
        return 'Medication Agent';
      case 'faq':
        return 'FAQ Agent';
      case 'emotional_support':
        return 'Support Agent';
      case 'escalation':
        return 'Care Coordinator';
      default:
        return 'AI Assistant';
    }
  };

  const simulateAgentResponse = (userMessage: string): { message: string; agentType: string } => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Appointment related
    if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
      return {
        message: "I'd be happy to help you with appointments! I can help you book new appointments, reschedule existing ones, or check your upcoming appointments. Based on your medical history, I see you've previously consulted with Dr. Sarah Johnson (Cardiology) and Dr. Michael Chen (General Medicine). Would you like to schedule with one of them or see a different specialist?",
        agentType: 'appointment'
      };
    }
    
    // Medication related
    if (lowerMessage.includes('medication') || lowerMessage.includes('pill') || lowerMessage.includes('drug') || lowerMessage.includes('prescription')) {
      return {
        message: "I can help you with medication-related questions! I have access to your current prescriptions and can provide information about side effects, interactions, and proper usage. Your current medications include Lisinopril, Metformin, Atorvastatin, and Vitamin D3. What specific information would you like to know?",
        agentType: 'medication'
      };
    }
    
    // Emotional support
    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('scared') || lowerMessage.includes('depressed') || lowerMessage.includes('sad')) {
      return {
        message: "I understand you're going through a difficult time, and I'm here to support you. It's completely normal to feel anxious or worried about health concerns. Would you like to talk about what's specifically bothering you? I can also provide some coping strategies and relaxation techniques that many patients find helpful.",
        agentType: 'emotional_support'
      };
    }
    
    // FAQ related
    if (lowerMessage.includes('hours') || lowerMessage.includes('contact') || lowerMessage.includes('policy') || lowerMessage.includes('insurance') || lowerMessage.includes('visit')) {
      return {
        message: "I can help answer questions about hospital policies and general information. Our visiting hours are 8 AM to 8 PM daily. We accept most major insurance plans. For billing questions, you can contact our billing department at (555) 123-4567. Is there something specific you'd like to know about our services or policies?",
        agentType: 'faq'
      };
    }
    
    // Default orchestrator response
    return {
      message: "Thank you for your message! I'm here to help with various aspects of your healthcare. I can assist with:\n\n• Booking and managing appointments\n• Medication questions and information\n• General hospital policies and FAQs\n• Emotional support and coping strategies\n• Connecting you with the right healthcare professionals\n\nWhat would you like help with today?",
      agentType: 'orchestrator'
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const response = simulateAgentResponse(inputMessage);
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        message: response.message,
        timestamp: new Date(),
        agentType: response.agentType
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Book Appointment', message: 'I would like to book an appointment' },
    { label: 'Medication Info', message: 'Can you tell me about my medications?' },
    { label: 'Visiting Hours', message: 'What are the hospital visiting hours?' },
    { label: 'Emergency Contact', message: 'I need emergency contact information' }
  ];

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      {/* Chat Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <BotIcon sx={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" component="h2">
              AI Health Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Online • HIPAA Compliant
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: 'success.main',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Connected
          </Typography>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <Paper
              sx={{
                maxWidth: { xs: 280, sm: 400, md: 500 },
                p: 2,
                bgcolor: message.type === 'user' ? 'primary.main' : 'background.paper',
                color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                boxShadow: 1
              }}
            >
              {message.type === 'agent' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', width: 20, height: 20 }}>
                    {getAgentIcon(message.agentType)}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {getAgentName(message.agentType)}
                  </Typography>
                </Box>
              )}
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  color: message.type === 'user' ? 'primary.contrastText' : 'text.primary'
                }}
              >
                {message.message}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 1,
                  color: message.type === 'user' ? 'primary.contrastText' : 'text.secondary',
                  opacity: 0.7
                }}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
          </Box>
        ))}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Paper sx={{ p: 2, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} color="primary" />
                <Typography variant="body2" color="text.secondary">
                  AI is typing...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        <Box ref={messagesEndRef} />
      </Box>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Quick actions:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickActions.map((action, index) => (
              <Chip
                key={index}
                label={action.label}
                onClick={() => setInputMessage(action.message)}
                variant="outlined"
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            variant="outlined"
            size="small"
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            color="primary"
            sx={{ p: 1 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          This AI assistant is for informational purposes only and doesn't replace professional medical advice.
        </Typography>
      </Box>
    </Paper>
  );
};

// Add CSS animation for pulse effect
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

export default ChatInterface;