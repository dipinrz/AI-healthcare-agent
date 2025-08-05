import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Stack
} from '@mui/material';
// Note: TimePicker requires @mui/x-date-pickers package
// For now, we'll use a simple time input instead
import {
  Medication as MedicationIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import notificationService from '../../services/notificationService';
import type { MedicationReminder } from '../../services/notificationService';

interface PrescriptionMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  startDate: Date;
  endDate?: Date;
  reminderTimes: string[];
  isActive: boolean;
}

interface PrescriptionManagerProps {
  prescriptions: any[];
  onUpdate?: () => void;
}

const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({ 
  prescriptions
}) => {
  const [medications, setMedications] = useState<PrescriptionMedication[]>([]);
  const [reminderDialog, setReminderDialog] = useState<{
    open: boolean;
    medication: PrescriptionMedication | null;
  }>({ open: false, medication: null });
  const [reminderTimes, setReminderTimes] = useState<Date[]>([new Date()]);

  useEffect(() => {
    // Convert prescriptions to medication format
    const meds: PrescriptionMedication[] = [];
    prescriptions.forEach(prescription => {
      prescription.medications?.forEach((med: any) => {
        meds.push({
          id: `${prescription.id}-${med.id}`,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          instructions: med.instructions,
          startDate: prescription.date,
          endDate: undefined, // Could be calculated from prescription duration
          reminderTimes: getDefaultReminderTimes(med.frequency),
          isActive: prescription.status === 'active'
        });
      });
    });
    setMedications(meds);
  }, [prescriptions]);

  const getDefaultReminderTimes = (frequency: string): string[] => {
    const times: string[] = [];
    const freq = frequency.toLowerCase();
    
    if (freq.includes('once daily') || freq.includes('once a day')) {
      times.push('08:00');
    } else if (freq.includes('twice daily') || freq.includes('twice a day')) {
      times.push('08:00', '20:00');
    } else if (freq.includes('three times') || freq.includes('3 times')) {
      times.push('08:00', '14:00', '20:00');
    } else if (freq.includes('four times') || freq.includes('4 times')) {
      times.push('08:00', '12:00', '16:00', '20:00');
    } else {
      times.push('08:00'); // Default
    }
    
    return times;
  };

  const handleSetupReminders = (medication: PrescriptionMedication) => {
    setReminderDialog({ open: true, medication });
    // Initialize reminder times
    const times = medication.reminderTimes.map(time => {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date;
    });
    setReminderTimes(times);
  };

  const handleSaveReminders = () => {
    if (!reminderDialog.medication) return;

    const medication = reminderDialog.medication;
    const times = reminderTimes.map(time => 
      `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
    );

    // Update medication with new reminder times
    const updatedMedications = medications.map(med => 
      med.id === medication.id 
        ? { ...med, reminderTimes: times }
        : med
    );
    setMedications(updatedMedications);

    // Schedule reminders
    times.forEach((time, index) => {
      const [hours, minutes] = time.split(':');
      const nextDose = new Date();
      nextDose.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (nextDose < new Date()) {
        nextDose.setDate(nextDose.getDate() + 1);
      }

      const reminder: MedicationReminder = {
        id: `${medication.id}-${index}`,
        medicationName: medication.name,
        dosage: medication.dosage,
        time: time,
        nextDose: nextDose
      };

      notificationService.scheduleMedicationReminder(reminder);
    });

    setReminderDialog({ open: false, medication: null });
    notificationService.showSuccess(`✅ Reminders set for ${medication.name}`);
  };

  const handleTestNotification = (medication: PrescriptionMedication) => {
    const reminder: MedicationReminder = {
      id: `test-${medication.id}`,
      medicationName: medication.name,
      dosage: medication.dosage,
      time: 'now',
      nextDose: new Date()
    };
    notificationService.showMedicationReminder(reminder);
  };

  const addReminderTime = () => {
    const newTime = new Date();
    newTime.setHours(8, 0, 0, 0);
    setReminderTimes([...reminderTimes, newTime]);
  };

  const removeReminderTime = (index: number) => {
    setReminderTimes(reminderTimes.filter((_, i) => i !== index));
  };

  const updateReminderTime = (index: number, newTime: Date | null) => {
    if (newTime) {
      const updated = [...reminderTimes];
      updated[index] = newTime;
      setReminderTimes(updated);
    }
  };

  return (
    <Box>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          💊 Prescription Management
        </Typography>

        {medications.length === 0 ? (
          <Alert severity="info">
            No active prescriptions found. Prescriptions from your doctor will appear here.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {medications.map((medication) => (
              <Grid size={{xs: 12, md: 6, lg: 4}} key={medication.id}>
                <Card elevation={2} sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <MedicationIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {medication.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medication.dosage}
                        </Typography>
                      </Box>
                      <Chip 
                        label={medication.isActive ? 'Active' : 'Inactive'}
                        color={medication.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Frequency:</strong> {medication.frequency}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Instructions:</strong> {medication.instructions}
                    </Typography>

                    {medication.reminderTimes.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                          Reminder Times:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {medication.reminderTimes.map((time, index) => (
                            <Chip
                              key={index}
                              icon={<ScheduleIcon />}
                              label={time}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<NotificationsIcon />}
                        onClick={() => handleSetupReminders(medication)}
                        disabled={!medication.isActive}
                      >
                        Set Reminders
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleTestNotification(medication)}
                        disabled={!medication.isActive}
                        title="Test notification"
                      >
                        <PlayIcon />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Reminder Setup Dialog */}
        <Dialog
          open={reminderDialog.open}
          onClose={() => setReminderDialog({ open: false, medication: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 2 }} />
              Set Medication Reminders
            </Box>
            {reminderDialog.medication && (
              <Typography variant="body2" color="text.secondary">
                {reminderDialog.medication.name} - {reminderDialog.medication.dosage}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Set the times when you want to be reminded to take this medication:
              </Typography>
              
              {reminderTimes.map((time, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    label={`Reminder ${index + 1}`}
                    type="time"
                    value={`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newTime = new Date();
                      newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      updateReminderTime(index, newTime);
                    }}
                    size="small"
                    sx={{ minWidth: 150 }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  {reminderTimes.length > 1 && (
                    <IconButton
                      onClick={() => removeReminderTime(index)}
                      sx={{ ml: 1 }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={addReminderTime}
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Add Another Time
              </Button>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  💡 <strong>Tips:</strong>
                  <br />• Notifications will appear 30 seconds before each reminder time
                  <br />• You can test notifications using the play button
                  <br />• Reminders will repeat daily until the prescription ends
                </Typography>
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReminderDialog({ open: false, medication: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveReminders} variant="contained">
              Save Reminders
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default PrescriptionManager;