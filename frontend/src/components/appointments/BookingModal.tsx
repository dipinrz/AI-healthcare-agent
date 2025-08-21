import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Autocomplete,
  Card,
  CardContent,
  Avatar,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  LocalHospital as MedicalIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

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
  rating?: number;
}

interface AvailableSlot {
  slotId: number;
  time: Date;
  displayTime: string;
  startTime: Date;
  endTime: Date;
}


interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedDoctorId?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({
  open,
  onClose,
  onSuccess,
  preselectedDoctorId
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [formData, setFormData] = useState({
    reason: '',
    symptoms: '',
    type: 'consultation' as 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup',
    duration: 30
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (open) {
      loadDoctors();
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (preselectedDoctorId && doctors.length > 0) {
      const doctor = doctors.find(d => d.id === preselectedDoctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
      }
    }
  }, [preselectedDoctorId, doctors]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const resetForm = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setFormData({
      reason: '',
      symptoms: '',
      type: 'consultation',
      duration: 30
    });
    setError('');
  };

  const loadDoctors = async () => {
    try {
      const response = await appointmentService.getDoctors();
      if (response.success && response.data) {
        setDoctors(response.data);
      } else {
        setError('Failed to load doctors');
      }
    } catch (error) {
      setError('Failed to load doctors');
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setLoadingSlots(true);
    try {
      // Format date in local timezone to avoid timezone conversion issues
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const response = await appointmentService.getAvailableSlots(selectedDoctor.id, dateStr);
      
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

  const handleNext = () => {
    if (step === 1 && selectedDoctor) {
      setStep(2);
    } else if (step === 2 && selectedDate && selectedSlot) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedSlot || !formData.reason || !user?.patient) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingData = {
        patientId: user.patient.id,
        slotId: selectedSlot.slotId,
        reason: formData.reason,
        symptoms: formData.symptoms || '',
        type: formData.type
      };

      const response = await appointmentService.bookSlotAppointment(bookingData);
      
      if (response.success) {
        onSuccess();
        onClose();
        resetForm();
      } else {
        setError(response.message || 'Failed to book appointment');
      }
    } catch (error) {
      setError('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon />
        Select Doctor
      </Typography>
      
      <Autocomplete
        options={doctors}
        value={selectedDoctor}
        onChange={(_, newValue) => setSelectedDoctor(newValue)}
        getOptionLabel={(doctor) => `Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.specialization}`}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Doctor"
            variant="outlined"
            fullWidth
          />
        )}
        renderOption={(props, doctor) => (
          <Box component="li" {...props}>
            <Card sx={{ width: '100%', mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <MedicalIcon />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doctor.specialization} • {doctor.department}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doctor.qualification}
                    </Typography>
                  </Box>
                  {doctor.rating && (
                    <Chip
                      label={`${doctor.rating}★`}
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      />

      {selectedDoctor && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <MedicalIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                </Typography>
                <Typography variant="body2" color="primary">
                  {selectedDoctor.specialization}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Department:</strong> {selectedDoctor.department}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Qualification:</strong> {selectedDoctor.qualification}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Phone:</strong> {selectedDoctor.phone}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {selectedDoctor.email}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EventIcon />
        Select Date & Time
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{xs: 12, md: 6}}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
        </Grid>
        
        <Grid size={{xs: 12, md: 6}}>
          <FormControl fullWidth>
            <InputLabel>Duration</InputLabel>
            <Select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              label="Duration"
            >
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>60 minutes</MenuItem>
            </Select>
          </FormControl>
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
                <Grid size={{xs: 6, sm: 4, md: 3}} key={index}>
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
    </Box>
  );

  const renderStep3 = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Appointment Details
      </Typography>
      
      <Grid container spacing={2}>
        <Grid size={{xs: 12}}>
          <FormControl fullWidth>
            <InputLabel>Appointment Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              label="Appointment Type"
            >
              <MenuItem value="consultation">Consultation</MenuItem>
              <MenuItem value="follow_up">Follow-up</MenuItem>
              <MenuItem value="routine_checkup">Routine Checkup</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{xs: 12}}>
          <TextField
            fullWidth
            label="Reason for Visit *"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            multiline
            rows={3}
            required
          />
        </Grid>
        
        <Grid size={{xs: 12}}>
          <TextField
            fullWidth
            label="Current Symptoms (Optional)"
            value={formData.symptoms}
            onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>

      {selectedDoctor && selectedSlot && (
        <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Appointment Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2">
                  <strong>Doctor:</strong> Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Specialization:</strong> {selectedDoctor.specialization}
                </Typography>
              </Grid>
              <Grid size={{xs: 12, sm: 6}}>
                <Typography variant="body2">
                  <strong>Date:</strong> {appointmentService.formatAppointmentDate(selectedSlot.time)}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {selectedSlot.displayTime}
                </Typography>
                <Typography variant="body2">
                  <strong>Duration:</strong> {formData.duration} minutes
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // Check if user is a patient
  if (!user || user.role !== 'patient' || !user.patient) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Access Denied</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Only patients can book appointments. Please log in as a patient.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Book New Appointment - Step {step} of 3
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        
        {step > 1 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        
        {step < 3 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={
              (step === 1 && !selectedDoctor) ||
              (step === 2 && (!selectedDate || !selectedSlot))
            }
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.reason}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingModal;