import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Autocomplete,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {Grid} from '@mui/system';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Medication as MedicationIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import medicationsService from '../../services/medicationsService';
import prescriptionsService, { type CreatePrescriptionData, type CreatePrescriptionItemData } from '../../services/prescriptionsService';
import patientsService from '../../services/patientsService';
import toast from 'react-hot-toast';

interface MultiMedicationPrescriptionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  doctorId: string;
}

interface Medication {
  id: string;
  name: string;
  category: string;
  description?: string;
  dosageForm?: string;
  strength?: string;
}

interface MedicationFormData extends CreatePrescriptionItemData {
  medication?: Medication;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const MultiMedicationPrescriptionForm: React.FC<MultiMedicationPrescriptionFormProps> = ({
  open,
  onClose,
  onSuccess,
  patientId,
  doctorId,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  
  const [medicationItems, setMedicationItems] = useState<MedicationFormData[]>([
    {
      medicationId: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      quantity: 1,
      refills: 0,
      notes: '',
    },
  ]);

  useEffect(() => {
    if (open) {
      fetchMedications();
      fetchPatients();
    }
  }, [open]);

  // Separate effect for handling patientId changes
  useEffect(() => {
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.id === patientId);
      setSelectedPatient(patient || null);
    }
  }, [patientId, patients]);

  const fetchMedications = async () => {
    try {
      const response = await medicationsService.getAllMedications();
      setMedications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast.error('Failed to load medications');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientsService.getAllPatients();
      setPatients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const addMedicationItem = () => {
    setMedicationItems([
      ...medicationItems,
      {
        medicationId: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: 1,
        refills: 0,
        notes: '',
      },
    ]);
  };

  const removeMedicationItem = (index: number) => {
    if (medicationItems.length > 1) {
      setMedicationItems(medicationItems.filter((_, i) => i !== index));
    }
  };

  const updateMedicationItem = (index: number, field: keyof MedicationFormData, value: any) => {
    const updated = [...medicationItems];
    updated[index] = { ...updated[index], [field]: value };
    setMedicationItems(updated);
  };

  const handleMedicationSelect = (index: number, medication: Medication | null) => {
    const updated = [...medicationItems];
    updated[index] = {
      ...updated[index],
      medicationId: medication?.id || '',
      medication: medication || undefined,
    };
    setMedicationItems(updated);
  };

  const validateForm = (): boolean => {
    // Check if patient is selected (either via prop or selection)
    const currentPatientId = patientId || selectedPatient?.id;
    if (!currentPatientId) {
      toast.error('Please select a patient');
      return false;
    }

    if (!startDate) {
      toast.error('Start date is required');
      return false;
    }

    if (medicationItems.length === 0) {
      toast.error('At least one medication is required');
      return false;
    }

    for (let i = 0; i < medicationItems.length; i++) {
      const item = medicationItems[i];
      if (!item.medicationId) {
        toast.error(`Please select a medication for item ${i + 1}`);
        return false;
      }
      if (!item.dosage) {
        toast.error(`Please enter dosage for medication ${i + 1}`);
        return false;
      }
      if (!item.frequency) {
        toast.error(`Please enter frequency for medication ${i + 1}`);
        return false;
      }
      if (!item.duration) {
        toast.error(`Please enter duration for medication ${i + 1}`);
        return false;
      }
      if (item.quantity <= 0) {
        toast.error(`Please enter a valid quantity for medication ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const currentPatientId = patientId || selectedPatient?.id;
      const prescriptionData: CreatePrescriptionData = {
        patientId: currentPatientId!,
        doctorId,
        startDate,
        endDate: endDate || undefined,
        prescriptionNotes: prescriptionNotes || undefined,
        medications: medicationItems.map(item => ({
          medicationId: item.medicationId,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          quantity: item.quantity,
          refills: item.refills,
          notes: item.notes,
        })),
      };

      await prescriptionsService.createPrescription(prescriptionData);
      
      toast.success(`🎉 Multi-medication prescription created successfully!`);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPrescriptionNotes('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setSelectedPatient(null);
    setMedicationItems([
      {
        medicationId: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        quantity: 1,
        refills: 0,
        notes: '',
      },
    ]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MedicationIcon color="primary" />
        <Typography variant="h6">Create Multi-Medication Prescription</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Create a comprehensive prescription with multiple medications, each with individual dosing instructions.
          </Alert>

          {/* Patient Selection - only show if no patientId provided */}
          {!patientId && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{xs:12}}>
                <Autocomplete
                  value={selectedPatient}
                  onChange={(_, value) => setSelectedPatient(value)}
                  options={patients}
                  getOptionLabel={(patient) => `${patient.firstName} ${patient.lastName} (${patient.email})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Patient *"
                      placeholder="Search for patient..."
                      required
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">
                          {option.firstName} {option.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email} • {option.phone}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
            </Grid>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{xs:12,md:6}}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{xs:12,md:6}}>
              <TextField
                fullWidth
                label="End Date (Optional)"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid  size={{xs:12}}>
              <TextField
                fullWidth
                label="Prescription Notes"
                multiline
                rows={2}
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                placeholder="General instructions for the entire prescription..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicationIcon />
              Medications ({medicationItems.length})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={addMedicationItem}
              variant="outlined"
              size="small"
            >
              Add Medication
            </Button>
          </Box>

          <Stack spacing={2}>
            {medicationItems.map((item, index) => (
              <Paper
                key={index}
                elevation={2}
                sx={{
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`Medication ${index + 1}`}
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  {medicationItems.length > 1 && (
                    <IconButton
                      onClick={() => removeMedicationItem(index)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{xs:12}}>
                    <Autocomplete
                      value={item.medication || null}
                      onChange={(_, value) => handleMedicationSelect(index, value)}
                      options={medications}
                      getOptionLabel={(option) => `${option.name} (${option.category})`}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Medication"
                          placeholder="Search for medication..."
                          required
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body1">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.category}
                              {option.strength && ` • ${option.strength}`}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>

                  <Grid size={{xs:12,md:4}} >
                    <TextField
                      fullWidth
                      label="Dosage"
                      value={item.dosage}
                      onChange={(e) => updateMedicationItem(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg, 1 tablet"
                      required
                    />
                  </Grid>

                  <Grid size={{xs:12,md:4}} >
                    <TextField
                      fullWidth
                      label="Frequency"
                      value={item.frequency}
                      onChange={(e) => updateMedicationItem(index, 'frequency', e.target.value)}
                      placeholder="e.g., twice daily, every 8 hours"
                      required
                    />
                  </Grid>

                  <Grid size={{xs:12,md:4}} >
                    <TextField
                      fullWidth
                      label="Duration"
                      value={item.duration}
                      onChange={(e) => updateMedicationItem(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days, 2 weeks"
                      required
                    />
                  </Grid>

                  <Grid size={{xs:12,md:6}} >
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateMedicationItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 1 }}
                      required
                    />
                  </Grid>

                  <Grid size={{xs:12,md:6}} >
                    <TextField
                      fullWidth
                      label="Refills"
                      type="number"
                      value={item.refills}
                      onChange={(e) => updateMedicationItem(index, 'refills', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  <Grid size={{xs:12}} >
                    <TextField
                      fullWidth
                      label="Instructions"
                      value={item.instructions}
                      onChange={(e) => updateMedicationItem(index, 'instructions', e.target.value)}
                      placeholder="Special instructions for this medication..."
                      multiline
                      rows={2}
                    />
                  </Grid>

                  <Grid size={{xs:12}} >
                    <TextField
                      fullWidth
                      label="Notes"
                      value={item.notes}
                      onChange={(e) => updateMedicationItem(index, 'notes', e.target.value)}
                      placeholder="Additional notes for this medication..."
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Prescription'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MultiMedicationPrescriptionForm;