import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tab,
  Tabs,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper,
  Stack,
  IconButton
} from '@mui/material';
import {
  Event as CalendarIcon,
  Person as UserIcon,
  AccessTime as ClockIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  MedicalServices as MedicalIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import appointmentService from '../../services/appointmentService';
import type { Appointment } from '../../services/appointmentService';
import { authService } from '../../services/authService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appointments-tabpanel-${index}`}
      aria-labelledby={`appointments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Using the Appointment interface from the service

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updateDialog, setUpdateDialog] = useState<{
    open: boolean;
    appointment: Appointment | null;
    status: string;
    notes: string;
    diagnosis: string;
    treatment: string;
    followUpInstructions: string;
  }>({
    open: false,
    appointment: null,
    status: '',
    notes: '',
    diagnosis: '',
    treatment: '',
    followUpInstructions: ''
  });
  const [error, setError] = useState<string>('');

  const user = authService.getCurrentUser();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appointmentService.getAppointments();
      if (response.success && response.data) {
        const appointmentsArray = Array.isArray(response.data) ? response.data : [response.data];
        setAppointments(appointmentsArray);
      } else {
        setError(response.message || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!updateDialog.appointment) return;

    try {
      const updateData: any = {
        notes: updateDialog.notes
      };

      // Add diagnosis, treatment, and follow-up instructions if provided
      if (updateDialog.diagnosis.trim()) {
        updateData.diagnosis = updateDialog.diagnosis;
      }
      if (updateDialog.treatment.trim()) {
        updateData.treatment = updateDialog.treatment;
      }
      if (updateDialog.followUpInstructions.trim()) {
        updateData.followUpInstructions = updateDialog.followUpInstructions;
      }

      let response;
      
      // If marking as completed, use the complete appointment endpoint
      if (updateDialog.status === 'completed') {
        response = await appointmentService.completeAppointment(
          updateDialog.appointment.id,
          {
            diagnosis: updateDialog.diagnosis,
            treatment: updateDialog.treatment,
            followUpInstructions: updateDialog.followUpInstructions,
            notes: updateDialog.notes
          }
        );
      } else if (updateDialog.status === 'cancelled') {
        response = await appointmentService.cancelAppointment(updateDialog.appointment.id);
      } else {
        response = await appointmentService.updateAppointment(
          updateDialog.appointment.id,
          updateData
        );
      }

      if (response.success) {
        loadAppointments();
        setUpdateDialog({ 
          open: false, 
          appointment: null, 
          status: '', 
          notes: '', 
          diagnosis: '', 
          treatment: '', 
          followUpInstructions: '' 
        });
      } else {
        setError(response.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
      setError('Network error. Please try again.');
    }
  };

  const openUpdateDialog = (appointment: Appointment) => {
    setUpdateDialog({
      open: true,
      appointment,
      status: appointment.status,
      notes: appointment.notes || '',
      diagnosis: appointment.diagnosis || '',
      treatment: appointment.treatment || '',
      followUpInstructions: appointment.followUpInstructions || ''
    });
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' => {
    switch (status) {
      case 'completed': return 'success';
      case 'scheduled': return 'primary';
      case 'confirmed': return 'info';
      case 'cancelled': return 'error';
      case 'no_show': return 'warning';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckIcon sx={{ color: 'success.main' }} />;
      case 'scheduled': return <ScheduleIcon sx={{ color: 'primary.main' }} />;
      case 'confirmed': return <ScheduleIcon sx={{ color: 'info.main' }} />;
      case 'cancelled': return <CancelIcon sx={{ color: 'error.main' }} />;
      case 'no_show': return <CancelIcon sx={{ color: 'warning.main' }} />;
      default: return <ScheduleIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate.toDateString() === today.toDateString();
  });

  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate > today;
  });

  const pastAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.appointmentDate);
    return aptDate < today;
  });

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
        <Paper elevation={2} sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.contrastText', color: 'primary.main', mr: 3, width: 56, height: 56 }}>
                <MedicalIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  My Appointments
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Manage your patient appointments and consultations
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton
                onClick={loadAppointments}
                sx={{ 
                  color: 'primary.contrastText', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
                    <CalendarIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Today's Appointments
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {todayAppointments.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2, width: 56, height: 56 }}>
                    <ScheduleIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {upcomingAppointments.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2, width: 56, height: 56 }}>
                    <CheckIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {appointments.filter(apt => apt.status === 'completed').length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2, width: 56, height: 56 }}>
                    <UserIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Patients
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {new Set(appointments.map(apt => apt.patient.id)).size}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Appointments Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label={`Today (${todayAppointments.length})`} />
              <Tab label={`Upcoming (${upcomingAppointments.length})`} />
              <Tab label={`Past (${pastAppointments.length})`} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {todayAppointments.length === 0 ? (
              <Alert severity="info">No appointments scheduled for today.</Alert>
            ) : (
              <List>
                {todayAppointments.map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        {getStatusIcon(appointment.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </Typography>
                            <Chip
                              label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              color={getStatusColor(appointment.status)}
                              size="small"
                            />
                            <Chip
                              label={appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1).replace('_', ' ')}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointmentService.formatAppointmentTime(new Date(appointment.appointmentDate))}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.patient.phone}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.patient.email}
                                </Typography>
                              </Box>
                            </Box>
                            {appointment.reason && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Reason:</strong> {appointment.reason}
                              </Typography>
                            )}
                            {appointment.symptoms && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Symptoms:</strong> {appointment.symptoms}
                              </Typography>
                            )}
                            {appointment.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Notes:</strong> {appointment.notes}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => openUpdateDialog(appointment)}
                              >
                                Manage
                              </Button>
                              {appointment.status === 'scheduled' && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    const dialog = {
                                      open: true,
                                      appointment,
                                      status: 'completed',
                                      notes: appointment.notes || '',
                                      diagnosis: appointment.diagnosis || '',
                                      treatment: appointment.treatment || '',
                                      followUpInstructions: appointment.followUpInstructions || ''
                                    };
                                    setUpdateDialog(dialog);
                                  }}
                                >
                                  Complete
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < todayAppointments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {upcomingAppointments.length === 0 ? (
              <Alert severity="info">No upcoming appointments.</Alert>
            ) : (
              <List>
                {upcomingAppointments.map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        {getStatusIcon(appointment.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </Typography>
                            <Chip
                              label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              color={getStatusColor(appointment.status)}
                              size="small"
                            />
                            <Chip
                              label={appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointmentService.formatAppointmentDate(new Date(appointment.appointmentDate))}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointmentService.formatAppointmentTime(new Date(appointment.appointmentDate))}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.patient.phone}
                                </Typography>
                              </Box>
                            </Box>
                            {appointment.reason && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Reason:</strong> {appointment.reason}
                              </Typography>
                            )}
                            {appointment.symptoms && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Symptoms:</strong> {appointment.symptoms}
                              </Typography>
                            )}
                            {appointment.notes && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Notes:</strong> {appointment.notes}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => openUpdateDialog(appointment)}
                              >
                                Manage
                              </Button>
                              {appointment.status === 'scheduled' && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    const dialog = {
                                      open: true,
                                      appointment,
                                      status: 'completed',
                                      notes: appointment.notes || '',
                                      diagnosis: appointment.diagnosis || '',
                                      treatment: appointment.treatment || '',
                                      followUpInstructions: appointment.followUpInstructions || ''
                                    };
                                    setUpdateDialog(dialog);
                                  }}
                                >
                                  Complete
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < upcomingAppointments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {pastAppointments.length === 0 ? (
              <Alert severity="info">No past appointments.</Alert>
            ) : (
              <List>
                {pastAppointments.slice(0, 10).map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        {getStatusIcon(appointment.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h6">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </Typography>
                            <Chip
                              label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              color={getStatusColor(appointment.status)}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointmentService.formatAppointmentDate(new Date(appointment.appointmentDate))}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointmentService.formatAppointmentTime(new Date(appointment.appointmentDate))}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.patient.phone}
                                </Typography>
                              </Box>
                            </Box>
                            {appointment.notes && (
                              <Typography variant="body2" color="text.secondary">
                                Notes: {appointment.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(pastAppointments.length, 10) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>
        </Card>

        {/* Update Status Dialog */}
        <Dialog
          open={updateDialog.open}
          onClose={() => setUpdateDialog({ 
            open: false, 
            appointment: null, 
            status: '', 
            notes: '', 
            diagnosis: '', 
            treatment: '', 
            followUpInstructions: '' 
          })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MedicalIcon />
              <Box>
                <Typography variant="h6">Manage Appointment</Typography>
                {updateDialog.appointment && (
                  <Typography variant="body2" color="text.secondary">
                    {updateDialog.appointment.patient.firstName} {updateDialog.appointment.patient.lastName} • {appointmentService.formatAppointmentDateTime(new Date(updateDialog.appointment.appointmentDate))}
                  </Typography>
                )}
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={updateDialog.status}
                    onChange={(e) => setUpdateDialog(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="no_show">No Show</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Duration: {updateDialog.appointment?.duration || 30} minutes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {updateDialog.appointment?.type?.replace('_', ' ')?.toUpperCase() || 'N/A'}
                </Typography>
              </Grid>

              {updateDialog.appointment?.reason && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Reason for visit:</strong> {updateDialog.appointment.reason}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {updateDialog.appointment?.symptoms && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Reported symptoms:</strong> {updateDialog.appointment.symptoms}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  label="Diagnosis"
                  multiline
                  rows={2}
                  fullWidth
                  value={updateDialog.diagnosis}
                  onChange={(e) => setUpdateDialog(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis if appointment is completed..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Treatment Plan"
                  multiline
                  rows={2}
                  fullWidth
                  value={updateDialog.treatment}
                  onChange={(e) => setUpdateDialog(prev => ({ ...prev, treatment: e.target.value }))}
                  placeholder="Enter treatment plan or prescribed medications..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Follow-up Instructions"
                  multiline
                  rows={2}
                  fullWidth
                  value={updateDialog.followUpInstructions}
                  onChange={(e) => setUpdateDialog(prev => ({ ...prev, followUpInstructions: e.target.value }))}
                  placeholder="Enter follow-up instructions for the patient..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Additional Notes"
                  multiline
                  rows={3}
                  fullWidth
                  value={updateDialog.notes}
                  onChange={(e) => setUpdateDialog(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes about this appointment..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setUpdateDialog({ 
                open: false, 
                appointment: null, 
                status: '', 
                notes: '', 
                diagnosis: '', 
                treatment: '', 
                followUpInstructions: '' 
              })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAppointment} 
              variant="contained"
              disabled={!updateDialog.status}
            >
              {updateDialog.status === 'completed' ? 'Complete Appointment' : 'Update Appointment'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DoctorAppointments;