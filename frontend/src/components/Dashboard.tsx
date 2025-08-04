import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Container,
  Paper,
  Divider,
  Grid
} from '@mui/material';
import {
  Event as CalendarIcon,
  Chat as MessageIcon,
  LocalPharmacy as PillIcon,
  Description as FileTextIcon,
  Schedule as ClockIcon,
  Warning as AlertIcon,
  CheckCircle as CheckIcon,
  People as UsersIcon
} from '@mui/icons-material';

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const quickStats = [
    {
      title: 'Upcoming Appointments',
      value: '2',
      icon: CalendarIcon,
      color: 'primary.main'
    },
    {
      title: 'Active Medications',
      value: '4',
      icon: PillIcon,
      color: 'secondary.main'
    },
    {
      title: 'Chat Sessions',
      value: '12',
      icon: MessageIcon,
      color: 'info.main'
    },
    {
      title: 'Health Records',
      value: '8',
      icon: FileTextIcon,
      color: 'success.main'
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      date: '2025-07-30',
      time: '10:00 AM',
      type: 'Follow-up',
      status: 'confirmed'
    },
    {
      id: 2,
      doctor: 'Dr. Michael Chen',
      specialty: 'General Medicine',
      date: '2025-08-02',
      time: '2:30 PM',
      type: 'Consultation',
      status: 'scheduled'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'chat',
      message: 'Asked about medication side effects',
      time: '2 hours ago',
      icon: MessageIcon
    },
    {
      id: 2,
      type: 'appointment',
      message: 'Appointment scheduled with Dr. Johnson',
      time: '1 day ago',
      icon: CalendarIcon
    },
    {
      id: 3,
      type: 'medication',
      message: 'Prescription updated for Lisinopril',
      time: '3 days ago',
      icon: PillIcon
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Welcome Header */}
        <Paper
          sx={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #0D9488 100%)',
            color: 'white',
            p: 4,
            borderRadius: 2
          }}
        >
          <Typography variant="h4" component="h1" color='white' sx={{ fontWeight: 'bold', mb: 2 }}>
            Welcome back, {user?.firstName || 'Patient'}!
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }} color='white'>
            Your AI Health Assistant is here to help you manage your healthcare journey.
          </Typography>
        </Paper>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}  key={index}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                          {stat.value}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>
                        <Icon />
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          {/* Upcoming Appointments */}
          <Grid size={12}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2">
                        Upcoming Appointments
                      </Typography>
                    </Box>
                    <Button
                      component={Link}
                      to="/appointments"
                      size="small"
                      sx={{ textTransform: 'none' }}
                    >
                      View All
                    </Button>
                  </Box>
                </Box>
                <Box sx={{ p: 3 }}>
                  <List sx={{ p: 0 }}>
                    {upcomingAppointments.map((appointment) => (
                      <ListItem
                        key={appointment.id}
                        sx={{
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          mb: 2,
                          '&:last-child': { mb: 0 }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <UsersIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={appointment.doctor}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {appointment.specialty}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.date} at {appointment.time}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            label={appointment.status}
                            size="small"
                            color={appointment.status === 'confirmed' ? 'success' : 'info'}
                            sx={{ mb: 0.5 }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {appointment.type}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities */}
          <Grid size={12}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ClockIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6" component="h2">
                      Recent Activities
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 3 }}>
                  <List sx={{ p: 0 }}>
                    {recentActivities.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <ListItem key={activity.id} sx={{ px: 0, py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'grey.100', color: 'text.secondary', width: 32, height: 32 }}>
                              <Icon sx={{ fontSize: 16 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {activity.message}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" component="h2">
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Get instant help with common healthcare needs
              </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Button
                    component={Link}
                    to="/chat"
                    variant="outlined"
                    fullWidth
                    sx={{
                      p: 2,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      height: 'auto'
                    }}
                  >
                    <MessageIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" component="div">
                        Chat with AI Assistant
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Get answers to your health questions
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      p: 2,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      height: 'auto'
                    }}
                  >
                    <CalendarIcon sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" component="div">
                        Book Appointment
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Schedule with your doctor
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      p: 2,
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      height: 'auto'
                    }}
                  >
                    <PillIcon sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" component="div">
                        View Medications
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Check your prescriptions
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Health Tips */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AlertIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6" component="h2">
                  Today's Health Tips
                </Typography>
              </Box>
            </Box>
            <Box sx={{ p: 3 }}>
              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'transparent', color: 'success.main', width: 24, height: 24 }}>
                      <CheckIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        Remember to take your morning medications with breakfast
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'transparent', color: 'success.main', width: 24, height: 24 }}>
                      <CheckIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        Stay hydrated - aim for at least 8 glasses of water today
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'transparent', color: 'success.main', width: 24, height: 24 }}>
                      <CheckIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        Your next appointment is in 2 days - prepare any questions you have
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;