import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  Container,
  Chip,
  Button,
  Grid,
  Fade,
  CircularProgress,
  Alert,
  Slide,
  Zoom,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as UserIcon,
  AutoAwesome as SparkleIcon,
  MedicalServices as MedicalIcon,
  Psychology as PsychologyIcon,
  Favorite as HeartIcon,
  LocalPharmacy as PharmacyIcon,
  Lightbulb as LightbulbIcon,
  Support as SupportIcon,
  Healing as HealingIcon,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import chatService from '../../services/chatService';

// Advanced animations
const breathingAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
`;

const waveAnimation = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
`;

const floatingParticles = keyframes`
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(180deg);
    opacity: 0;
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(25, 118, 210, 0.6);
  }
  100% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.3);
  }
`;

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'care' | 'diagnostic';
  emotion?: 'supportive' | 'encouraging' | 'empathetic' | 'reassuring';
}

const SiriLikeAIChat: React.FC = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Aura, your personal AI healthcare companion. I can help you book appointments, check doctor availability, manage your existing appointments, and provide caring support for your health needs. How can I assist you today? 💙',
      isBot: true,
      timestamp: new Date(),
      type: 'care',
      emotion: 'supportive',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { 
      text: "Book an appointment", 
      icon: <MedicalIcon />, 
      color: 'primary',
      emotion: 'supportive'
    },
    { 
      text: "Check doctor availability", 
      icon: <UserIcon />, 
      color: 'info',
      emotion: 'supportive'
    },
    { 
      text: "I'm feeling anxious", 
      icon: <PsychologyIcon />, 
      color: 'secondary',
      emotion: 'empathetic'
    },
    { 
      text: "Check my symptoms", 
      icon: <MedicalIcon />, 
      color: 'warning',
      emotion: 'reassuring'
    },
    { 
      text: "Heart health tips", 
      icon: <HeartIcon />, 
      color: 'error',
      emotion: 'encouraging'
    },
    { 
      text: "Medication guidance", 
      icon: <PharmacyIcon />, 
      color: 'success',
      emotion: 'supportive'
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getEmpatheticResponse = (messageText: string, emotion: string) => {
    const responses = {
      anxiety: {
        supportive: "I understand you're feeling anxious, and that's completely okay. Let's work through this together. Here are some gentle breathing techniques that can help calm your mind: Try the 4-7-8 technique - inhale for 4 counts, hold for 7, exhale for 8. Remember, you're not alone in this journey. 🤗",
        empathetic: "I can sense you're going through a difficult time with anxiety. Your feelings are valid, and it takes courage to reach out. Would you like to talk about what's triggering these feelings, or would you prefer some immediate calming strategies? I'm here to support you every step of the way. 💜"
      },
      symptoms: {
        reassuring: "Thank you for trusting me with your health concerns. I want to help you understand your symptoms better. Please describe what you're experiencing - I'll listen carefully and provide guidance. Remember, seeking help shows strength and self-care. 🌟",
        supportive: "I'm here to help you navigate your symptoms with care and understanding. Let's explore this together step by step. What specific symptoms are you noticing? I'll provide you with helpful information while encouraging you to consult with healthcare professionals when needed. 💚"
      },
      heart: {
        encouraging: "Taking care of your heart health shows how much you value yourself - that's wonderful! 💖 Here are some heart-loving tips: eat colorful fruits and vegetables, take peaceful walks, practice gratitude, stay hydrated, and get quality sleep. Small, consistent steps create lasting change. You've got this!",
        supportive: "Your heart health is so important, and I'm glad you're prioritizing it. Let's create a gentle, sustainable approach: focus on foods that nourish you, find joyful ways to move your body, manage stress with kindness to yourself, and celebrate small victories. Your heart deserves this care. ❤️"
      },
      medication: {
        supportive: "Medication questions can feel overwhelming, but you're being responsible by seeking information. I'm here to provide clear, helpful guidance. What specific concerns do you have about your medications? Together, we can ensure you feel confident and informed about your treatment. 🌈",
        reassuring: "It's natural to have questions about medications - seeking clarity shows you're taking an active role in your health. I'll help you understand your medications better and remind you that your healthcare team is always there to support you. What would you like to know? 💙"
      }
    };

    const lowerText = messageText.toLowerCase();
    if (lowerText.includes('anxious') || lowerText.includes('anxiety') || lowerText.includes('stress')) {
      return responses.anxiety[emotion as keyof typeof responses.anxiety] || responses.anxiety.supportive;
    } else if (lowerText.includes('symptom') || lowerText.includes('pain') || lowerText.includes('sick')) {
      return responses.symptoms[emotion as keyof typeof responses.symptoms] || responses.symptoms.reassuring;
    } else if (lowerText.includes('heart') || lowerText.includes('cardiovascular')) {
      return responses.heart[emotion as keyof typeof responses.heart] || responses.heart.encouraging;
    } else if (lowerText.includes('medication') || lowerText.includes('drug') || lowerText.includes('prescription')) {
      return responses.medication[emotion as keyof typeof responses.medication] || responses.medication.supportive;
    }

    return "Thank you for sharing with me. Your health and wellbeing matter deeply. I'm here to provide caring, personalized guidance for all your health questions. What specific area would you like support with today? 🌸";
  };

  const handleSendMessage = async (messageText?: string, emotion: string = 'supportive') => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    setShowQuickActions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Check if this looks like an appointment booking request
    const lowerText = textToSend.toLowerCase();
    const isAppointmentRelated = 
      lowerText.includes('book') || lowerText.includes('appointment') || 
      lowerText.includes('schedule') || lowerText.includes('doctor') ||
      lowerText.includes('available') || lowerText.includes('cancel') ||
      lowerText.includes('reschedule');

    try {

      if (isAppointmentRelated) {
        // Use the chat service for appointment booking
        const data = await chatService.sendMessage(textToSend);
        
        if (data.success) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: chatService.formatMessageForDisplay(data.data.message),
            isBot: true,
            timestamp: new Date(),
            type: 'care',
            emotion: 'supportive',
          };
          setMessages(prev => [...prev, botMessage]);

          // If appointment was successfully booked, show a success message
          if (data.data.actions && data.data.actions.some((action: any) => action.type === 'appointment_booked')) {
            const appointmentDetails = chatService.extractAppointmentDetails(data.data.actions);
            if (appointmentDetails) {
              const successMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: `🎉 Great news! Your appointment has been confirmed:\n\n📅 Date: ${appointmentDetails.date}\n⏰ Time: ${appointmentDetails.time}\n👨‍⚕️ Doctor: ${appointmentDetails.doctor}\n📋 Type: ${appointmentDetails.type}\n\nYou'll receive a confirmation email shortly. Is there anything else I can help you with?`,
                isBot: true,
                timestamp: new Date(),
                type: 'care',
                emotion: 'encouraging',
              };
              setTimeout(() => {
                setMessages(prev => [...prev, successMessage]);
              }, 1000);
            }
          }
        } else {
          throw new Error(data.message || 'Failed to get response');
        }
      } else {
        // Use empathetic responses for general health queries
        setTimeout(() => {
          const response = getEmpatheticResponse(textToSend, emotion);
          
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response,
            isBot: true,
            timestamp: new Date(),
            type: 'care',
            emotion: emotion as any,
          };
          setMessages(prev => [...prev, botMessage]);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = "I apologize, but I'm having trouble connecting to my appointment system right now. Please try again in a moment. 💙";
      
      // Provide more specific error messages
      if (error.message.includes('authentication') || error.message.includes('token')) {
        errorMessage = "It looks like your session has expired. Please refresh the page and log in again to continue booking appointments. 🔐";
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = "I'm having trouble connecting to the server. Please check your internet connection and try again. 🌐";
      } else if (isAppointmentRelated) {
        errorMessage = "I'm temporarily unable to access the appointment system. You can try again in a moment, or contact our support team for immediate assistance. In the meantime, I'm here for general health guidance! 💙";
      }
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        isBot: true,
        timestamp: new Date(),
        type: 'care',
        emotion: 'empathetic',
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: any) => {
    handleSendMessage(action.text, action.emotion);
  };

  const getActionColor = (colorName: string) => {
    switch(colorName) {
      case 'primary': return theme.palette.primary;
      case 'secondary': return theme.palette.secondary;
      case 'error': return theme.palette.error;
      case 'success': return theme.palette.success;
      case 'warning': return theme.palette.warning;
      case 'info': return theme.palette.info;
      default: return theme.palette.primary;
    }
  };

  const getMessageBackground = (message: Message) => {
    if (!message.isBot) {
      return `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;
    }
    
    switch (message.emotion) {
      case 'empathetic':
        return `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`;
      case 'encouraging':
        return `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`;
      case 'reassuring':
        return `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`;
      default:
        return `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`;
    }
  };

  const getAvatarColor = (emotion?: string) => {
    switch (emotion) {
      case 'empathetic': return theme.palette.secondary.main;
      case 'encouraging': return theme.palette.success.main;
      case 'reassuring': return theme.palette.info.main;
      default: return theme.palette.primary.main;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.03)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.05)} 25%,
          ${alpha(theme.palette.info.main, 0.03)} 50%,
          ${alpha(theme.palette.success.main, 0.03)} 75%,
          ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        backgroundSize: '400% 400%',
        animation: `${gradientShift} 15s ease infinite`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(25, 118, 210, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(156, 39, 176, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            animation: `${floatingParticles} ${8 + i * 2}s linear infinite`,
            left: `${10 + i * 15}%`,
            animationDelay: `${i * 2}s`,
            opacity: 0.6,
          }}
        />
      ))}

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
        {/* AI Assistant Header */}
        <Fade in={true} timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 6,
              p: 4,
              mb: 3,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                animation: `${gradientShift} 3s ease-in-out infinite`,
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  animation: `${breathingAnimation} 4s ease-in-out infinite`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: -10,
                    left: -10,
                    right: -10,
                    bottom: -10,
                    borderRadius: '50%',
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    animation: `${waveAnimation} 3s ease-in-out infinite`,
                  },
                }}
              >
                <HealingIcon sx={{ fontSize: 40 }} />
              </Avatar>
              
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                Aura Health Assistant
              </Typography>
              
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 400,
                  mb: 3,
                  maxWidth: 600,
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                Your intelligent healthcare assistant for booking appointments, managing schedules, 
                and providing compassionate support for all your health needs
              </Typography>

              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                <Chip
                  icon={<SparkleIcon />}
                  label="AI-Powered"
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'transform 0.2s',
                  }}
                />
                <Chip
                  icon={<HeartIcon />}
                  label="Empathetic Care"
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'transform 0.2s',
                  }}
                />
                <Chip
                  icon={<SupportIcon />}
                  label="24/7 Support"
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                    color: 'white',
                    fontWeight: 600,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'transform 0.2s',
                  }}
                />
              </Stack>
            </Box>
          </Paper>
        </Fade>

        {/* Quick Actions */}
        {showQuickActions && (
          <Fade in={true} timeout={800}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: 3,
                mb: 3,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                  textAlign: 'center',
                  color: theme.palette.text.primary,
                }}
              >
                How can I support you today? 💙
              </Typography>
              
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid size={{xs: 12, sm: 6, md: 4}} key={index}>
                    <Zoom in={true} timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={action.icon}
                        onClick={() => handleQuickAction(action)}
                        sx={{
                          py: 2,
                          px: 3,
                          borderRadius: 3,
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          fontWeight: 600,
                          border: `2px solid ${alpha(getActionColor(action.color).main, 0.3)}`,
                          background: `linear-gradient(135deg, 
                            ${alpha(getActionColor(action.color).main, 0.05)} 0%, 
                            ${alpha(getActionColor(action.color).light, 0.02)} 100%)`,
                          '&:hover': {
                            transform: 'translateY(-4px) scale(1.02)',
                            border: `2px solid ${getActionColor(action.color).main}`,
                            background: `linear-gradient(135deg, 
                              ${alpha(getActionColor(action.color).main, 0.1)} 0%, 
                              ${alpha(getActionColor(action.color).light, 0.05)} 100%)`,
                            boxShadow: `0 8px 25px ${alpha(getActionColor(action.color).main, 0.25)}`,
                          },
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {action.text}
                      </Button>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        )}

        {/* Chat Container */}
        <Paper
          elevation={0}
          sx={{
            height: 'calc(100vh - 400px)',
            minHeight: 500,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.divider, 0.1),
                borderRadius: 10,
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.3),
                borderRadius: 10,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.5),
                },
              },
            }}
          >
            {messages.map((message, index) => (
              <Slide
                in={true}
                key={message.id}
                direction={message.isBot ? 'right' : 'left'}
                timeout={600}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                    alignItems: 'flex-end',
                    gap: 2,
                    mb: 1,
                  }}
                >
                  {message.isBot && (
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(message.emotion),
                        width: 48,
                        height: 48,
                        animation: `${pulseGlow} 3s ease-in-out infinite`,
                        boxShadow: `0 4px 20px ${alpha(getAvatarColor(message.emotion), 0.4)}`,
                      }}
                    >
                      <HealingIcon />
                    </Avatar>
                  )}
                  
                  <Paper
                    elevation={0}
                    sx={{
                      maxWidth: { xs: '85%', sm: '75%', md: '65%' },
                      background: getMessageBackground(message),
                      color: message.isBot ? theme.palette.text.primary : 'white',
                      borderRadius: 4,
                      px: 3,
                      py: 2,
                      border: message.isBot 
                        ? `1px solid ${alpha(getAvatarColor(message.emotion), 0.2)}` 
                        : 'none',
                      borderBottomLeftRadius: message.isBot ? 1 : 4,
                      borderBottomRightRadius: message.isBot ? 4 : 1,
                      position: 'relative',
                      '&::before': message.isBot ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                        borderRadius: 'inherit',
                        opacity: 0,
                        transition: 'opacity 0.3s',
                      } : {},
                      '&:hover::before': {
                        opacity: 1,
                      },
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        lineHeight: 1.7,
                        mb: 1,
                        fontWeight: message.isBot ? 400 : 500,
                      }}
                    >
                      {message.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Paper>

                  {!message.isBot && (
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.secondary.main,
                        width: 48,
                        height: 48,
                        boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.3)}`,
                      }}
                    >
                      <UserIcon />
                    </Avatar>
                  )}
                </Box>
              </Slide>
            ))}

            {isLoading && (
              <Slide in={true} direction="right" timeout={400}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 48,
                      height: 48,
                      animation: `${breathingAnimation} 2s ease-in-out infinite`,
                    }}
                  >
                    <HealingIcon />
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                      borderRadius: 4,
                      px: 3,
                      py: 2,
                      borderBottomLeftRadius: 1,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={16} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      Aura is thinking with care...
                    </Typography>
                  </Paper>
                </Box>
              </Slide>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Alert
              severity="info"
              icon={<LightbulbIcon />}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                background: `linear-gradient(135deg, 
                  ${alpha(theme.palette.info.main, 0.05)} 0%, 
                  ${alpha(theme.palette.info.light, 0.02)} 100%)`,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                💙 <strong>Caring Reminder:</strong> I provide supportive health information with empathy. 
                For urgent medical concerns, please contact your healthcare provider immediately.
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Share what's on your mind... I'm here to listen and help with care 💙"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 1)',
                      border: `2px solid ${theme.palette.primary.main}`,
                      boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '1rem',
                    lineHeight: 1.6,
                  },
                }}
              />
              
              <IconButton
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                sx={{
                  width: 56,
                  height: 56,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  color: 'white',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'scale(1.1) translateY(-2px)',
                    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.5)}`,
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.grey[400], 0.5),
                    color: alpha(theme.palette.grey[600], 0.7),
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <SendIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </Box>
            
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 2, 
                display: 'block', 
                textAlign: 'center',
                fontWeight: 500,
                opacity: 0.8,
              }}
            >
              Press Enter to send • Shift+Enter for new line • Powered by Empathetic AI Technology 💙
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SiriLikeAIChat;