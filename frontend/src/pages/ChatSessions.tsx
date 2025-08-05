import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Container,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  FormControlLabel,
  Switch,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Alert
} from '@mui/material';
import {
  Chat as MessageCircleIcon,
  Search as SearchIcon,
  Event as CalendarIcon,
  Schedule as ClockIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Star as StarIcon,
  Archive as ArchiveIcon,
  Delete as TrashIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  summary?: string;
  rating?: number;
  tags: string[];
  isArchived: boolean;
  messages: ChatMessage[];
}

const ChatSessions: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDialog, setViewDialog] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSessions: ChatSession[] = [
      {
        id: '1',
        title: 'Headache and Fever Consultation',
        startTime: new Date('2024-02-14T10:30:00'),
        endTime: new Date('2024-02-14T10:45:00'),
        messageCount: 12,
        summary: 'Patient reported headache and mild fever. AI recommended rest, hydration, and monitoring symptoms. Suggested contacting doctor if symptoms worsen.',
        rating: 5,
        tags: ['headache', 'fever', 'symptoms'],
        isArchived: false,
        messages: [
          {
            id: '1',
            content: 'I have a headache and mild fever. What should I do?',
            sender: 'user',
            timestamp: new Date('2024-02-14T10:30:00')
          },
          {
            id: '2',
            content: 'I understand you\'re experiencing a headache and mild fever. Can you tell me more about your symptoms? When did they start and how severe is the fever?',
            sender: 'ai',
            timestamp: new Date('2024-02-14T10:30:30')
          },
          {
            id: '3',
            content: 'The headache started this morning and the fever is around 99.5°F (37.5°C).',
            sender: 'user',
            timestamp: new Date('2024-02-14T10:31:00')
          },
          {
            id: '4',
            content: 'Based on your symptoms, here are some recommendations: 1) Get plenty of rest, 2) Stay hydrated with fluids, 3) Consider over-the-counter pain relievers like acetaminophen or ibuprofen, 4) Monitor your temperature. If your fever rises above 101°F (38.3°C) or symptoms worsen, please contact your healthcare provider.',
            sender: 'ai',
            timestamp: new Date('2024-02-14T10:31:30')
          }
        ]
      },
      {
        id: '2',
        title: 'Medication Side Effects Discussion',
        startTime: new Date('2024-02-12T15:20:00'),
        endTime: new Date('2024-02-12T15:35:00'),
        messageCount: 8,
        summary: 'Patient asked about potential side effects of prescribed medication. AI provided comprehensive information about common and serious side effects.',
        rating: 4,
        tags: ['medication', 'side effects', 'prescription'],
        isArchived: false,
        messages: [
          {
            id: '1',
            content: 'I was prescribed Lisinopril. What are the possible side effects?',
            sender: 'user',
            timestamp: new Date('2024-02-12T15:20:00')
          },
          {
            id: '2',
            content: 'Lisinopril is an ACE inhibitor commonly used to treat high blood pressure. Common side effects include: dry cough, dizziness, headache, and fatigue. Serious but rare side effects include: severe allergic reactions, kidney problems, and extremely low blood pressure. Always consult your doctor if you experience any concerning symptoms.',
            sender: 'ai',
            timestamp: new Date('2024-02-12T15:20:30')
          }
        ]
      },
      {
        id: '3',
        title: 'General Health Check Inquiry',
        startTime: new Date('2024-02-10T09:15:00'),
        endTime: new Date('2024-02-10T09:25:00'),
        messageCount: 6,
        summary: 'Patient inquired about when to schedule regular health checkups. AI provided guidelines for preventive care based on age and health status.',
        rating: 5,
        tags: ['checkup', 'preventive care', 'health screening'],
        isArchived: true,
        messages: [
          {
            id: '1',
            content: 'How often should I have a general health checkup?',
            sender: 'user',
            timestamp: new Date('2024-02-10T09:15:00')
          },
          {
            id: '2',
            content: 'The frequency of health checkups depends on your age and health status. Generally: Ages 18-30: Every 2-3 years if healthy, Ages 30-40: Every 2 years, Ages 40+: Annually. Those with chronic conditions may need more frequent visits. I recommend discussing a personalized schedule with your healthcare provider.',
            sender: 'ai',
            timestamp: new Date('2024-02-10T09:15:30')
          }
        ]
      }
    ];

    setTimeout(() => {
      setSessions(mockSessions);
      setFilteredSessions(mockSessions.filter(session => !session.isArchived));
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = sessions.filter(session => showArchived ? session.isArchived : !session.isArchived);

    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, showArchived]);

  const toggleArchive = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, isArchived: !session.isArchived }
        : session
    ));
  };

  const deleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      setSelectedSession(null);
    }
  };

  const exportSession = (session: ChatSession) => {
    const content = `Chat Session: ${session.title}\nDate: ${session.startTime.toLocaleString()}\nDuration: ${session.endTime ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000) : 'Unknown'} minutes\n\nMessages:\n${session.messages.map(msg => `[${msg.timestamp.toLocaleTimeString()}] ${msg.sender.toUpperCase()}: ${msg.content}`).join('\n')}\n\nSummary: ${session.summary || 'No summary available'}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-session-${session.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openViewDialog = (session: ChatSession) => {
    setSelectedSession(session);
    setViewDialog(true);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Chat Sessions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage your AI health assistant conversations
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                color="primary"
              />
            }
            label="Show Archived"
          />
        </Box>

        {/* Stats */}
        <Grid container spacing={3}>
          <Grid size={{xs: 12, md: 4}}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                    <MessageCircleIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Sessions
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {sessions.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs: 12, md: 4}}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2, width: 56, height: 56 }}>
                    <ArchiveIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Archived
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {sessions.filter(s => s.isArchived).length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs: 12, md: 4}}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#FFA726', mr: 2, width: 56, height: 56 }}>
                    <StarIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Avg Rating
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {sessions.filter(s => s.rating).length > 0 
                        ? (sessions.filter(s => s.rating).reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.filter(s => s.rating).length).toFixed(1)
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Card elevation={2}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Search chat sessions by title, summary, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Box>
          {filteredSessions.length === 0 ? (
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <MessageCircleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  No chat sessions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm 
                    ? 'Try adjusting your search criteria.' 
                    : showArchived 
                      ? 'You don\'t have any archived sessions.' 
                      : 'Start a conversation with the AI health assistant to see sessions here.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredSessions.map((session, index) => (
                <Grid size={{xs: 12, md: 6, lg: 4}} key={session.id}>
                  <Fade in={true} timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                    <Card 
                      elevation={3}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
                            {session.title}
                          </Typography>
                          {session.rating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon sx={{ fontSize: 16, color: '#FFA726' }} />
                              <Typography variant="caption" color="text.secondary">
                                {session.rating}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          <Chip
                            icon={<CalendarIcon />}
                            label={session.startTime.toLocaleDateString()}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<ClockIcon />}
                            label={session.endTime 
                              ? `${Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000)}m`
                              : 'Ongoing'
                            }
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<MessageCircleIcon />}
                            label={`${session.messageCount} msgs`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        {session.summary && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                            {session.summary.length > 120 ? `${session.summary.substring(0, 120)}...` : session.summary}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {session.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size="small"
                              sx={{
                                bgcolor: 'primary.50',
                                color: 'primary.main',
                                fontSize: '0.7rem',
                              }}
                            />
                          ))}
                          {session.tags.length > 3 && (
                            <Chip
                              label={`+${session.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </CardContent>

                      <Divider />

                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                          startIcon={<ViewIcon />}
                          onClick={() => openViewDialog(session)}
                          variant="outlined"
                          size="small"
                        >
                          View
                        </Button>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={() => exportSession(session)}
                            size="small"
                            title="Export session"
                            sx={{ color: 'text.secondary' }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => toggleArchive(session.id)}
                            size="small"
                            title={session.isArchived ? "Unarchive" : "Archive"}
                            sx={{ color: 'text.secondary' }}
                          >
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => deleteSession(session.id)}
                            size="small"
                            title="Delete session"
                            sx={{ color: 'error.main' }}
                          >
                            <TrashIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Card>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* View Session Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedSession && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedSession.title}</Typography>
                  {selectedSession.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <StarIcon sx={{ fontSize: 20, color: '#FFA726' }} />
                      <Typography variant="body2">{selectedSession.rating}/5</Typography>
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {selectedSession.startTime.toLocaleString()}
                  {selectedSession.endTime && (
                    ` • Duration: ${Math.round((selectedSession.endTime.getTime() - selectedSession.startTime.getTime()) / 60000)} minutes`
                  )}
                </Typography>
              </DialogTitle>
              
              <DialogContent dividers>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    maxHeight: 400, 
                    overflow: 'auto', 
                    bgcolor: 'grey.50', 
                    p: 2, 
                    borderRadius: 2 
                  }}
                >
                  <List sx={{ p: 0 }}>
                    {selectedSession.messages.map((message) => (
                      <ListItem 
                        key={message.id}
                        sx={{ 
                          flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                          alignItems: 'flex-start',
                          py: 1
                        }}
                      >
                        <ListItemAvatar sx={{ 
                          minWidth: 48,
                          ml: message.sender === 'user' ? 1 : 0,
                          mr: message.sender === 'user' ? 0 : 1
                        }}>
                          <Avatar sx={{ 
                            bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main',
                            width: 36,
                            height: 36
                          }}>
                            {message.sender === 'user' ? (
                              <UserIcon fontSize="small" />
                            ) : (
                              <BotIcon fontSize="small" />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                            color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                            borderRadius: 2,
                            maxWidth: '70%',
                            ml: message.sender === 'user' ? 'auto' : 0,
                            mr: message.sender === 'user' ? 0 : 'auto',
                          }}
                        >
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5 }}>
                            {message.content}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                {selectedSession.summary && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Session Summary:</strong> {selectedSession.summary}
                    </Typography>
                  </Alert>
                )}
              </DialogContent>
              
              <DialogActions>
                <Button onClick={() => exportSession(selectedSession)} startIcon={<DownloadIcon />}>
                  Export
                </Button>
                <Button onClick={() => setViewDialog(false)}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
};

export default ChatSessions;