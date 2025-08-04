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
  Stack,
  Paper,
  LinearProgress,
  Fade,
  Zoom,
  Slide,
  useTheme,
  alpha,
  Backdrop,
} from '@mui/material';
import {
  Medication as MedicationIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  AutoAwesome as SparkleIcon,
  Healing as HealingIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import notificationService from '../../services/notificationService';
import type { MedicationReminder } from '../../services/notificationService';

// Animations
const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(25, 118, 210, 0.8);
  }
  100% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.4);
  }
`;

const floatAnimation = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

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
  progress?: number;
  nextDose?: string;
}

interface ModernPrescriptionManagerProps {
  prescriptions: any[];
  onUpdate?: () => void;
}

const ModernPrescriptionManager: React.FC<ModernPrescriptionManagerProps> = ({ 
  prescriptions,
  onUpdate 
}) => {
  const theme = useTheme();
  const [medications, setMedications] = useState<PrescriptionMedication[]>([]);
  const [reminderDialog, setReminderDialog] = useState<{
    open: boolean;
    medication: PrescriptionMedication | null;
  }>({ open: false, medication: null });
  const [reminderTimes, setReminderTimes] = useState<Date[]>([new Date()]);
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);

  useEffect(() => {
    // Convert prescriptions to medication format with mock progress data
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
          endDate: undefined,
          reminderTimes: getDefaultReminderTimes(med.frequency),
          isActive: prescription.status === 'active',
          progress: Math.floor(Math.random() * 40) + 60, // Mock progress 60-100%
          nextDose: getNextScheduledDose(getDefaultReminderTimes(med.frequency)),
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
      times.push('08:00');
    }
    
    return times;
  };

  const getNextScheduledDose = (times: string[]): string => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      if (timeInMinutes > currentTime) {
        return time;
      }
    }
    
    // If no time today, return first time tomorrow
    return `${times[0]} (tomorrow)`;
  };

  const getPriorityColor = (medication: PrescriptionMedication) => {
    if (!medication.isActive) return 'grey';
    if (medication.frequency.includes('emergency') || medication.frequency.includes('critical')) return 'error';
    if (medication.frequency.includes('daily')) return 'primary';
    return 'secondary';
  };

  const handleSetupReminders = (medication: PrescriptionMedication) => {
    setReminderDialog({ open: true, medication });
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

    const updatedMedications = medications.map(med => 
      med.id === medication.id 
        ? { ...med, reminderTimes: times, nextDose: getNextScheduledDose(times) }
        : med
    );
    setMedications(updatedMedications);

    times.forEach((time, index) => {
      const [hours, minutes] = time.split(':');
      const nextDose = new Date();
      nextDose.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
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
    notificationService.showSuccess(`✨ Smart reminders activated for ${medication.name}`);
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
    <Box
      sx={{
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.05)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.05)} 50%, 
          ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        minHeight: '100vh',
        p: 3,
      }}
    >
      {/* Hero Header */}
      <Fade in={true} timeout={1000}>
        <Paper
          elevation={0}
          sx={{
            background: `linear-gradient(135deg, 
              ${theme.palette.primary.main} 0%, 
              ${theme.palette.secondary.main} 100%)`,
            borderRadius: 4,
            p: 4,
            mb: 4,
            color: 'white',
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
              backgroundSize: '200% 200%',
              animation: `${shimmer} 3s ease-in-out infinite`,
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  mr: 3,
                  width: 64,
                  height: 64,
                  animation: `${floatAnimation} 3s ease-in-out infinite`,
                }}
              >
                <HealingIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  Smart Prescription Manager
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                  AI-powered medication tracking with intelligent reminders
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {medications.length === 0 ? (
        <Zoom in={true} timeout={800}>
          <Card
            elevation={0}
            sx={{
              textAlign: 'center',
              py: 8,
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.info.main, 0.1)} 0%, 
                ${alpha(theme.palette.info.light, 0.05)} 100%)`,
              border: `2px dashed ${alpha(theme.palette.info.main, 0.3)}`,
              borderRadius: 4,
            }}
          >
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.1),
                mx: 'auto',
                mb: 3,
                width: 80,
                height: 80,
              }}
            >
              <MedicationIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />
            </Avatar>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              No Active Prescriptions
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your prescribed medications will appear here with smart tracking and reminders
            </Typography>
            <Button
              variant="contained"
              startIcon={<SparkleIcon />}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Connect with Doctor
            </Button>
          </Card>
        </Zoom>
      ) : (
        <Grid container spacing={3}>
          {medications.map((medication, index) => (
            <Grid item xs={12} md={6} lg={4} key={medication.id}>
              <Fade in={true} timeout={600} style={{ transitionDelay: `${index * 150}ms` }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                      '& .medication-glow': {
                        animation: `${pulseGlow} 2s ease-in-out infinite`,
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '2px',
                      background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                      transition: 'left 0.6s ease-in-out',
                    },
                    '&:hover::before': {
                      left: '100%',
                    },
                  }}
                  onClick={() => setSelectedMedication(selectedMedication === medication.id ? null : medication.id)}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar
                        className="medication-glow"
                        sx={{
                          bgcolor: `${getPriorityColor(medication)}.main`,
                          mr: 2,
                          width: 56,
                          height: 56,
                          boxShadow: `0 4px 20px ${alpha(theme.palette[getPriorityColor(medication) as keyof typeof theme.palette].main as string, 0.3)}`,
                        }}
                      >
                        <MedicationIcon sx={{ fontSize: 28 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mb: 0.5,
                            background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.primary.main})`,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {medication.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {medication.dosage}
                        </Typography>
                      </Box>
                      <Chip
                        icon={medication.isActive ? <CheckIcon /> : <WarningIcon />}
                        label={medication.isActive ? 'Active' : 'Inactive'}
                        color={medication.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          ...(medication.isActive && {
                            background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                            color: 'white',
                          }),
                        }}
                      />
                    </Box>

                    {/* Progress Bar */}
                    {medication.progress && (
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Treatment Progress
                          </Typography>
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                            {medication.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={medication.progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            },
                          }}
                        />
                      </Box>
                    )}

                    <Divider sx={{ my: 2, opacity: 0.6 }} />

                    {/* Details */}
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          📅 Frequency
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medication.frequency}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          📝 Instructions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medication.instructions}
                        </Typography>
                      </Box>

                      {medication.nextDose && (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, 
                              ${alpha(theme.palette.info.main, 0.1)} 0%, 
                              ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TimeIcon sx={{ fontSize: 16, mr: 1, color: 'info.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Next Dose
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="info.main" sx={{ fontWeight: 700 }}>
                            {medication.nextDose}
                          </Typography>
                        </Box>
                      )}

                      {medication.reminderTimes.length > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            ⏰ Reminder Times
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {medication.reminderTimes.map((time, index) => (
                              <Chip
                                key={index}
                                icon={<ScheduleIcon />}
                                label={time}
                                size="small"
                                variant="outlined"
                                sx={{
                                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  borderColor: alpha(theme.palette.primary.main, 0.3),
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Stack>

                    {/* Actions */}
                    <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<NotificationsIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetupReminders(medication);
                        }}
                        disabled={!medication.isActive}
                        sx={{
                          borderRadius: 2,
                          flex: 1,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        Smart Reminders
                      </Button>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestNotification(medication);
                        }}
                        disabled={!medication.isActive}
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                          '&:hover': {
                            bgcolor: alpha(theme.palette.success.main, 0.2),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        <PlayIcon sx={{ color: 'success.main' }} />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Enhanced Reminder Setup Dialog */}
      <Dialog
        open={reminderDialog.open}
        onClose={() => setReminderDialog({ open: false, medication: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <NotificationsIcon sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Smart Reminder Setup
                </Typography>
                {reminderDialog.medication && (
                  <Typography variant="body2" color="text.secondary">
                    {reminderDialog.medication.name} • {reminderDialog.medication.dosage}
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton
              onClick={() => setReminderDialog({ open: false, medication: null })}
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.2),
                },
              }}
            >
              <CloseIcon sx={{ color: 'error.main' }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Alert
            severity="info"
            icon={<SparkleIcon />}
            sx={{
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
              background: `linear-gradient(135deg, 
                ${alpha(theme.palette.info.main, 0.05)} 0%, 
                ${alpha(theme.palette.info.light, 0.02)} 100%)`,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              AI-powered smart reminders will learn your routine and optimize timing for better adherence
            </Typography>
          </Alert>

          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Set Your Reminder Times
          </Typography>
          
          <Stack spacing={3}>
            {reminderTimes.map((time, index) => (
              <Fade in={true} key={index} timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.primary.main, 0.02)} 0%, 
                      ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        width: 40,
                        height: 40,
                      }}
                    >
                      <TimeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    </Avatar>
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
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      InputLabelProps={{ shrink: true }}
                    />
                    {reminderTimes.length > 1 && (
                      <IconButton
                        onClick={() => removeReminderTime(index)}
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.2),
                          },
                        }}
                      >
                        <DeleteIcon sx={{ color: 'error.main' }} />
                      </IconButton>
                    )}
                  </Box>
                </Paper>
              </Fade>
            ))}
          </Stack>

          <Button
            startIcon={<AddIcon />}
            onClick={addReminderTime}
            variant="outlined"
            sx={{
              mt: 3,
              borderRadius: 2,
              borderStyle: 'dashed',
              borderWidth: 2,
              py: 1.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderStyle: 'solid',
              },
            }}
            fullWidth
          >
            Add Another Reminder Time
          </Button>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={() => setReminderDialog({ open: false, medication: null })}
            variant="outlined"
            sx={{ borderRadius: 2, px: 4 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveReminders}
            variant="contained"
            startIcon={<SparkleIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            Activate Smart Reminders
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModernPrescriptionManager;