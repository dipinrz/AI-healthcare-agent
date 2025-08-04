import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Event as EventIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import appointmentService from '../../services/appointmentService';

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

interface AvailableSlot {
  time: Date;
  displayTime: string;
}

interface RescheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  open,
  onClose,
  onSuccess,
  appointment
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && appointment) {
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
      setError('');
    }
  }, [open, appointment]);

  useEffect(() => {
    if (appointment && selectedDate) {
      loadAvailableSlots();
    }
  }, [appointment, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!appointment || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await appointmentService.getAvailableSlots(appointment.doctor.id, dateStr);
      
      if (response.success && response.data) {
        setAvailableSlots(response.data);
        setSelectedSlot(null);
      } else {
        setError('Failed to load available slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      setError('Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!appointment || !selectedSlot) {
      setError('Please select a new date and time');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await appointmentService.rescheduleAppointment(
        appointment.id,
        selectedSlot.time
      );
      
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to reschedule appointment');
      }
    } catch (error) {
      setError('Failed to reschedule appointment');
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Reschedule Appointment
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Appointment Info */}
        <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Current Appointment
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Doctor:</strong> Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Specialization:</strong> {appointment.doctor.specialization}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Current Date:</strong> {appointmentService.formatAppointmentDate(appointment.appointmentDate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Current Time:</strong> {appointmentService.formatAppointmentTime(appointment.appointmentDate)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon />
          Select New Date & Time
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select New Date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                minDate={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        {selectedDate && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon />
              Available Time Slots
            </Typography>
            
            {loadingSlots ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress />
              </Box>
            ) : availableSlots.length > 0 ? (
              <Grid container spacing={1}>
                {availableSlots.map((slot, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Button
                      variant={selectedSlot?.time.getTime() === slot.time.getTime() ? 'contained' : 'outlined'}
                      onClick={() => setSelectedSlot(slot)}
                      fullWidth
                      sx={{ textTransform: 'none' }}
                    >
                      {slot.displayTime}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                No available slots for this date. Please select a different date.
              </Alert>
            )}
          </Box>
        )}

        {selectedSlot && (
          <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                New Appointment Time
              </Typography>
              <Typography variant="body1">
                {appointmentService.formatAppointmentDateTime(selectedSlot.time)}
              </Typography>
            </CardContent>
          </Card>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        
        <Button
          onClick={handleReschedule}
          variant="contained"
          disabled={loading || !selectedSlot}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Rescheduling...' : 'Reschedule Appointment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RescheduleModal;