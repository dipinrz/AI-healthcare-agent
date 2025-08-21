import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  CircularProgress,
  Divider,
  Button,
  Stack,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsOff as NotificationOffIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Update as UpdateIcon,
  BugReport as TestIcon,
  PlayArrow as SendIcon
} from '@mui/icons-material';
import notificationSettingsService, { 
  type NotificationSettings
} from '../../services/notificationSettingsService';
import testNotificationService from '../../services/testNotificationService';
import toast from 'react-hot-toast';

interface NotificationSettingsProps {
  onSettingsChange?: (enabled: boolean) => void;
}

const NotificationSettingsComponent: React.FC<NotificationSettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [testMenuAnchor, setTestMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await notificationSettingsService.getNotificationSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        setError(response.message || 'Failed to load notification settings');
      }
    } catch (error) {
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const response = await notificationSettingsService.toggleNotifications(enabled);
      if (response.success && response.data) {
        setSettings(response.data);
        onSettingsChange?.(enabled);
        
        if (enabled) {
          toast.success('Appointment reminder notifications enabled!', {
            icon: '🔔',
            duration: 3000,
          });
        } else {
          toast.success('Appointment reminder notifications disabled', {
            icon: '🔕',
            duration: 3000,
          });
        }
      } else {
        toast.error(response.message || 'Failed to update notification settings');
      }
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSettings = async (updatedSettings: Partial<NotificationSettings>) => {
    if (!settings || !settings.notificationsEnabled) return;

    setUpdating(true);
    try {
      const response = await notificationSettingsService.updateNotificationSettings(updatedSettings);
      if (response.success && response.data) {
        setSettings(response.data);
        toast.success('Notification preferences updated!');
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendTestNotification = async (type: string, typeName: string) => {
    setTestMenuAnchor(null);
    setUpdating(true);
    
    try {
      let result;
      
      switch (type) {
        case 'reminder_24h':
          result = await testNotificationService.sendReminderTest('24');
          break;
        case 'reminder_1h':
          result = await testNotificationService.sendReminderTest('1');
          break;
        case 'confirmed':
          result = await testNotificationService.sendAppointmentConfirmedTest();
          break;
        case 'cancelled':
          result = await testNotificationService.sendAppointmentCancelledTest();
          break;
        case 'rescheduled':
          result = await testNotificationService.sendAppointmentRescheduledTest();
          break;
        default:
          result = await testNotificationService.sendGeneralTest();
      }

      if (result.success) {
        if (result.data?.sent) {
          toast.success(`🧪 Test ${typeName} notification sent!`, {
            duration: 4000,
          });
        } else {
          toast(`ℹ️ Test notification blocked - ${result.message}`, {
            duration: 5000,
          });
        }
      } else {
        toast.error(`Failed to send test notification: ${result.message}`);
      }
    } catch (error) {
      toast.error('Failed to send test notification');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button onClick={loadSettings} variant="outlined" fullWidth>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Unable to load notification settings
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {settings.notificationsEnabled ? (
            <NotificationIcon color="primary" sx={{ mr: 2 }} />
          ) : (
            <NotificationOffIcon color="disabled" sx={{ mr: 2 }} />
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Appointment Reminder Notifications
          </Typography>
          <Chip 
            label={settings.notificationsEnabled ? "Enabled" : "Disabled"}
            color={settings.notificationsEnabled ? "success" : "default"}
            size="small"
          />
          {settings.notificationsEnabled && (
            <IconButton
              onClick={(e) => setTestMenuAnchor(e.currentTarget)}
              disabled={updating}
              color="primary"
              size="small"
              title="Send test notification"
            >
              <TestIcon />
            </IconButton>
          )}
        </Box>

        {/* Main Toggle */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notificationsEnabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                disabled={updating}
                size="medium"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Enable Appointment Reminders
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get notified about upcoming appointments and changes
                </Typography>
              </Box>
            }
          />
        </Box>

        {settings.notificationsEnabled && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Notification Types
            </Typography>

            <Stack spacing={2}>
              {/* Time-based Reminders */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Advance Reminders
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.reminder24h}
                      onChange={(e) => handleUpdateSettings({ reminder24h: e.target.checked })}
                      disabled={updating}
                      size="small"
                    />
                  }
                  label="24 hours before appointment"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.reminder1h}
                      onChange={(e) => handleUpdateSettings({ reminder1h: e.target.checked })}
                      disabled={updating}
                      size="small"
                    />
                  }
                  label="1 hour before appointment"
                />
              </Box>

              {/* Status Change Notifications */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Appointment Status Changes
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appointmentConfirmed}
                      onChange={(e) => handleUpdateSettings({ appointmentConfirmed: e.target.checked })}
                      disabled={updating}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckIcon sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
                      Appointment confirmed
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appointmentRescheduled}
                      onChange={(e) => handleUpdateSettings({ appointmentRescheduled: e.target.checked })}
                      disabled={updating}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <UpdateIcon sx={{ fontSize: 16, mr: 0.5, color: 'info.main' }} />
                      Appointment rescheduled
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appointmentCancelled}
                      onChange={(e) => handleUpdateSettings({ appointmentCancelled: e.target.checked })}
                      disabled={updating}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CancelIcon sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
                      Appointment cancelled
                    </Box>
                  }
                />
              </Box>
            </Stack>
          </>
        )}

        {!settings.notificationsEnabled && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Enable notifications to receive appointment reminders and stay updated about your healthcare appointments.
          </Alert>
        )}

        {updating && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Test Notification Menu */}
        <Menu
          anchorEl={testMenuAnchor}
          open={Boolean(testMenuAnchor)}
          onClose={() => setTestMenuAnchor(null)}
        >
          <MenuItem onClick={() => handleSendTestNotification('general', 'General')}>
            <ListItemIcon>
              <SendIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>General Test</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleSendTestNotification('reminder_24h', '24h Reminder')}>
            <ListItemIcon>
              <ScheduleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>24 Hour Reminder</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleSendTestNotification('reminder_1h', '1h Reminder')}>
            <ListItemIcon>
              <ScheduleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>1 Hour Reminder</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleSendTestNotification('confirmed', 'Confirmed')}>
            <ListItemIcon>
              <CheckIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Appointment Confirmed</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleSendTestNotification('cancelled', 'Cancelled')}>
            <ListItemIcon>
              <CancelIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Appointment Cancelled</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleSendTestNotification('rescheduled', 'Rescheduled')}>
            <ListItemIcon>
              <UpdateIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Appointment Rescheduled</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsComponent;