import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  InputAdornment,
  CircularProgress,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Event as CalendarIcon,
  Schedule as ClockIcon,
  LocationOn as MapPinIcon,
  Add as PlusIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as ClockTimeIcon,
  VideoCall as VideoCallIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import appointmentService from '../services/appointmentService';
import BookingModal from '../components/appointments/BookingModal';
import RescheduleModal from '../components/appointments/RescheduleModal';

// Define interfaces locally to avoid import issues
interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  department: string;
  phone: string;
  email: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface Appointment {
  id: string;
  appointmentDate: Date;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason: string;
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  followUpInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
  patient: Patient;
  doctor: Doctor;
}


const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentService.getAppointments();
      if (response.success && response.data) {
        const appointmentsArray = Array.isArray(response.data) ? response.data : [response.data];
        setAppointments(appointmentsArray);
        setFilteredAppointments(appointmentsArray);
      } else {
        showSnackbar('Failed to load appointments', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    let filtered = appointments;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, filterStatus, searchTerm]);

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return;

    setActionLoading(true);
    try {
      const response = await appointmentService.cancelAppointment(selectedAppointment.id);
      if (response.success) {
        showSnackbar('Appointment cancelled successfully', 'success');
        loadAppointments();
      } else {
        showSnackbar(response.message || 'Failed to cancel appointment', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to cancel appointment', 'error');
    } finally {
      setActionLoading(false);
      setShowCancelDialog(false);
      setSelectedAppointment(null);
    }
  };

  const handleBookingSuccess = () => {
    showSnackbar('Appointment booked successfully!', 'success');
    loadAppointments();
  };

  const handleRescheduleSuccess = () => {
    showSnackbar('Appointment rescheduled successfully!', 'success');
    loadAppointments();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'cancelled':
        return <CancelIcon sx={{ color: 'error.main' }} />;
      case 'scheduled':
        return <ClockTimeIcon sx={{ color: 'primary.main' }} />;
      default:
        return <ClockTimeIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'primary' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'scheduled':
      case 'confirmed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.appointmentDate) > new Date()
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Appointments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your upcoming and past appointments
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={() => setShowBookingModal(true)}
            sx={{ minWidth: 150 }}
          >
            Book Appointment
          </Button>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid size={{xs: 12, md: 4}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <ClockIcon />
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
          
          <Grid size={{xs: 12, md: 4}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <CheckCircleIcon />
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
          
          <Grid size={{xs: 12, md: 4}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <CalendarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {appointments.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Search */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                <FilterIcon color="action" />
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Box>
          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  No appointments found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'You don\'t have any appointments yet.'}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setShowBookingModal(true)}
                >
                  Book Your First Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {getStatusIcon(appointment.status)}
                          <Chip
                            label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            color={getStatusColor(appointment.status)}
                            size="small"
                          />
                          <Chip
                            label={appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1).replace('_', ' ')}
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Grid container spacing={3}>
                          <Grid size={{xs: 12, md: 6}}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                            </Typography>
                            <Typography variant="body1" color="primary" sx={{ fontWeight: 500, mb: 1 }}>
                              {appointment.doctor.specialization}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {appointment.doctor.qualification} • {appointment.doctor.department}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointmentService.formatAppointmentDate(appointment.appointmentDate)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {appointmentService.formatAppointmentTime(appointment.appointmentDate)}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          <Grid size={{xs: 12, md: 6}}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                Reason:
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {appointment.reason}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                              <MapPinIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {appointment.doctor.department}
                              </Typography>
                            </Box>

                            {appointment.notes && (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                  Notes:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.notes}
                                </Typography>
                              </Box>
                            )}
                          </Grid>
                        </Grid>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 120 }}>
                        {appointmentService.canReschedule(appointment) && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleReschedule(appointment)}
                            sx={{ textTransform: 'none' }}
                          >
                            Reschedule
                          </Button>
                        )}
                        {appointmentService.canCancel(appointment) && (
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancelClick(appointment)}
                            sx={{ textTransform: 'none' }}
                          >
                            Cancel
                          </Button>
                        )}
                        {appointment.status === 'scheduled' && appointmentService.isUpcoming(appointment.appointmentDate) && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<VideoCallIcon />}
                            sx={{ textTransform: 'none' }}
                          >
                            Join Call
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Booking Modal */}
        <BookingModal
          open={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />

        {/* Reschedule Modal */}
        <RescheduleModal
          open={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          onSuccess={handleRescheduleSuccess}
          appointment={selectedAppointment}
        />

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel this appointment?
            </Typography>
            {selectedAppointment && (
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  <strong>Doctor:</strong> Dr. {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Date & Time:</strong> {appointmentService.formatAppointmentDateTime(selectedAppointment.appointmentDate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Reason:</strong> {selectedAppointment.reason}
                </Typography>
              </Box>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone. You will need to book a new appointment if you change your mind.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCancelDialog(false)} disabled={actionLoading}>
              Keep Appointment
            </Button>
            <Button
              onClick={handleCancelConfirm}
              variant="contained"
              color="error"
              disabled={actionLoading}
              startIcon={actionLoading && <CircularProgress size={20} />}
            >
              {actionLoading ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Appointments;