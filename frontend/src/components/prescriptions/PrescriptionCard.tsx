import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Medication as MedicationIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalHospital as DoctorIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import prescriptionsService, { type Prescription } from '../../services/prescriptionsService';
import toast from 'react-hot-toast';

interface PrescriptionCardProps {
  prescription: Prescription;
  onUpdate?: () => void;
  showPatientInfo?: boolean;
  showDoctorInfo?: boolean;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onUpdate,
  showPatientInfo = true,
  showDoctorInfo = true,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [discontinueDialog, setDiscontinueDialog] = useState(false);
  const [discontinueReason, setDiscontinueReason] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'discontinued':
        return 'error';
      case 'on_hold':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <MedicationIcon />;
      case 'completed':
        return <CompleteIcon />;
      case 'discontinued':
        return <StopIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const handleDiscontinue = async () => {
    if (!discontinueReason.trim()) {
      toast.error('Please provide a reason for discontinuing');
      return;
    }

    setLoading(true);
    try {
      await prescriptionsService.discontinuePrescription(prescription.id, discontinueReason);
      toast.success('Prescription discontinued successfully');
      setDiscontinueDialog(false);
      setDiscontinueReason('');
      onUpdate?.();
    } catch (error: any) {
      console.error('Error discontinuing prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to discontinue prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await prescriptionsService.completePrescription(prescription.id);
      toast.success('Prescription marked as completed');
      onUpdate?.();
    } catch (error: any) {
      console.error('Error completing prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to complete prescription');
    } finally {
      setLoading(false);
    }
  };

  const totalMedications = prescription.prescriptionItems?.length || 0;

  return (
    <>
      <Card
        elevation={2}
        sx={{
          mb: 2,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
              <MedicationIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>
                Multi-Medication Prescription
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip
                  label={prescription.status.toUpperCase()}
                  color={getStatusColor(prescription.status) as any}
                  size="small"
                  icon={getStatusIcon(prescription.status)}
                />
                <Chip
                  label={`${totalMedications} Medication${totalMedications !== 1 ? 's' : ''}`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Created: {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {prescription.status === 'active' && (
                <>
                  <Tooltip title="Mark as Completed">
                    <IconButton onClick={handleComplete} disabled={loading}>
                      <CompleteIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Discontinue">
                    <IconButton onClick={() => setDiscontinueDialog(true)} disabled={loading}>
                      <StopIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <IconButton onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Patient and Doctor Info */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={3}>
              {showPatientInfo && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Patient:</strong> {prescription.patient.firstName} {prescription.patient.lastName}
                  </Typography>
                </Box>
              )}
              {showDoctorInfo && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DoctorIcon color="action" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Doctor:</strong> Dr. {prescription.doctor.firstName} {prescription.doctor.lastName}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Dates */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ScheduleIcon color="action" fontSize="small" />
            <Typography variant="body2">
              <strong>Duration:</strong> {format(new Date(prescription.startDate), 'MMM dd, yyyy')}
              {prescription.endDate && ` - ${format(new Date(prescription.endDate), 'MMM dd, yyyy')}`}
            </Typography>
          </Box>

          {/* Prescription Notes */}
          {prescription.prescriptionNotes && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Prescription Notes:</strong> {prescription.prescriptionNotes}
              </Typography>
            </Box>
          )}

          {/* Medications Preview */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Medications:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {prescription.prescriptionItems?.slice(0, 3).map((item) => (
                <Chip
                  key={item.id}
                  label={`${item.medication.name} - ${item.dosage}`}
                  variant="outlined"
                  size="small"
                />
              ))}
              {totalMedications > 3 && (
                <Chip
                  label={`+${totalMedications - 3} more`}
                  variant="outlined"
                  size="small"
                  color="primary"
                />
              )}
            </Stack>
          </Box>

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Detailed Medication List
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Medication</strong></TableCell>
                    <TableCell><strong>Dosage</strong></TableCell>
                    <TableCell><strong>Frequency</strong></TableCell>
                    <TableCell><strong>Duration</strong></TableCell>
                    <TableCell><strong>Quantity</strong></TableCell>
                    <TableCell><strong>Refills</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescription.prescriptionItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {item.medication.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.medication.category}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{item.dosage}</TableCell>
                      <TableCell>{item.frequency}</TableCell>
                      <TableCell>{item.duration}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.refills}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Instructions and Notes */}
            {prescription.prescriptionItems?.some(item => item.instructions || item.notes) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Special Instructions:
                </Typography>
                {prescription.prescriptionItems.map((item) => (
                  (item.instructions || item.notes) && (
                    <Box key={item.id} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        <strong>{item.medication.name}:</strong>
                      </Typography>
                      {item.instructions && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                          • Instructions: {item.instructions}
                        </Typography>
                      )}
                      {item.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                          • Notes: {item.notes}
                        </Typography>
                      )}
                    </Box>
                  )
                ))}
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* Discontinue Dialog */}
      <Dialog open={discontinueDialog} onClose={() => setDiscontinueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Discontinue Prescription</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for discontinuing this prescription:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={discontinueReason}
            onChange={(e) => setDiscontinueReason(e.target.value)}
            placeholder="Enter reason for discontinuation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscontinueDialog(false)}>Cancel</Button>
          <Button onClick={handleDiscontinue} color="error" disabled={loading}>
            Discontinue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrescriptionCard;