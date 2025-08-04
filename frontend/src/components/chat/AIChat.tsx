import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  Divider,
  Container,
  Chip,
  Card,
  CardContent,
  Button,
  Grid,
  Fade,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as UserIcon,
  SmartToy as BotIcon,
  AutoAwesome as SparkleIcon,
  MedicalServices as MedicalIcon,
  Psychology as PsychologyIcon,
  Favorite as HeartIcon,
  LocalPharmacy as PharmacyIcon,
} from '@mui/icons-material';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI healthcare assistant. I can help you with medical questions, symptoms, medication information, and general health guidance. How can I assist you today?',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    { text: "What are common symptoms of flu?", icon: <MedicalIcon /> },
    { text: "How to manage stress?", icon: <PsychologyIcon /> },
    { text: "Heart-healthy diet tips", icon: <HeartIcon /> },
    { text: "Medication side effects", icon: <PharmacyIcon /> },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate API call to chat service
      setTimeout(() => {
        const responses = {
          'flu': 'Common flu symptoms include fever, chills, muscle aches, cough, congestion, runny nose, headaches, and fatigue. If symptoms worsen or persist, please consult with a healthcare provider.',
          'stress': 'To manage stress: practice deep breathing, regular exercise, maintain a healthy sleep schedule, try meditation or mindfulness, stay connected with loved ones, and consider professional help if needed.',
          'heart': 'For heart health: eat plenty of fruits and vegetables, choose whole grains, limit saturated fats, include omega-3 rich foods like fish, reduce sodium intake, and stay hydrated.',
          'medication': 'Common medication side effects vary by drug type. Always read medication labels, take as prescribed, and report any unusual symptoms to your doctor. Never stop medications abruptly without medical advice.',
        };

        let response = 'Thank you for your question. Based on your inquiry, I recommend consulting with a healthcare professional for personalized advice. Is there anything specific about your symptoms or condition you\'d like to discuss?';

        const lowerText = textToSend.toLowerCase();
        if (lowerText.includes('flu') || lowerText.includes('symptom')) {
          response = responses.flu;
        } else if (lowerText.includes('stress') || lowerText.includes('anxiety')) {
          response = responses.stress;
        } else if (lowerText.includes('heart') || lowerText.includes('diet')) {
          response = responses.heart;
        } else if (lowerText.includes('medication') || lowerText.includes('drug') || lowerText.includes('side effect')) {
          response = responses.medication;
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Chat error:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <Container maxWidth="lg" sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', py: 3 }}>
      {/* Header */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                <BotIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  AI Healthcare Assistant
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Get instant medical guidance and health information
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                icon={<SparkleIcon />}
                label="AI Powered"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<MedicalIcon />}
                label="Medical Assistant"
                variant="outlined"
                color="secondary"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Questions - Show only when no messages or just initial message */}
      {messages.length <= 1 && (
        <Fade in={true}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Questions
              </Typography>
              <Grid container spacing={2}>
                {quickQuestions.map((question, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={question.icon}
                      onClick={() => handleQuickQuestion(question.text)}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: 'primary.50',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      {question.text}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Chat Container */}
      <Paper
        elevation={4}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 3,
          bgcolor: 'background.paper',
        }}
      >
        {/* Messages List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            bgcolor: 'grey.50',
          }}
        >
          {messages.map((message, index) => (
            <Fade in={true} key={message.id} timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: message.isBot ? 'flex-start' : 'flex-end',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                {message.isBot && (
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <BotIcon />
                  </Avatar>
                )}
                
                <Box
                  sx={{
                    maxWidth: { xs: '85%', sm: '75%', md: '65%' },
                    bgcolor: message.isBot ? 'background.paper' : 'primary.main',
                    color: message.isBot ? 'text.primary' : 'primary.contrastText',
                    borderRadius: 3,
                    px: 3,
                    py: 2,
                    boxShadow: message.isBot ? 2 : 4,
                    borderBottomLeftRadius: message.isBot ? 1 : 3,
                    borderBottomRightRadius: message.isBot ? 3 : 1,
                    border: message.isBot ? '1px solid' : 'none',
                    borderColor: message.isBot ? 'grey.200' : 'transparent',
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.6, mb: 1 }}>
                    {message.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      opacity: 0.8,
                      fontSize: '0.75rem',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>

                {!message.isBot && (
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                    <UserIcon />
                  </Avatar>
                )}
              </Box>
            </Fade>
          ))}

          {isLoading && (
            <Fade in={true}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <BotIcon />
                </Avatar>
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    px: 3,
                    py: 2,
                    boxShadow: 2,
                    borderBottomLeftRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <CircularProgress size={16} />
                  <Typography variant="body1" color="text.secondary">
                    AI is thinking...
                  </Typography>
                </Box>
              </Box>
            </Fade>
          )}

          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Input Area */}
        <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Disclaimer:</strong> This AI assistant provides general health information only. 
              Always consult healthcare professionals for medical advice.
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask me about symptoms, medications, health tips, or any medical questions..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'grey.50',
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'background.paper',
                  },
                },
              }}
            />
            <IconButton
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  bgcolor: 'grey.300',
                },
                width: 56,
                height: 56,
                transition: 'all 0.2s',
              }}
            >
              <SendIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', textAlign: 'center' }}>
            Press Enter to send • Shift+Enter for new line • Powered by AI Healthcare Technology
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIChat;