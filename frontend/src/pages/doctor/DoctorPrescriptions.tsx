import React, { useState, useEffect } from 'react';
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
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Snackbar,
  List,
  ListItem
} from '@mui/material';
import {
  LocalPharmacy as PillIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Person as UserIcon,
  Schedule as ClockIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import medicationsService from '../../services/medicationsService';
import patientsService from '../../services/patientsService';
import { authService } from '../../services/authService';
import EnvChecker from '../../components/debug/EnvChecker';

interface Medication {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  form: string;
  strength: string;
  category: string;
  description: string;
  indications: string[];
  contraindications: string[];
  sideEffects: string[];
  interactions: string[];
  warnings: string[];
  dosageInfo: {
    adult: string;
    pediatric?: string;
    elderly?: string;
  };
  manufacturer: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Prescription {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
  status: 'active' | 'completed' | 'discontinued' | 'on_hold';
  startDate: Date;
  endDate?: Date;
  notes: string;
  createdAt: Date;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  medication: {
    id: string;
    name: string;
    genericName: string;
    brandName: string;
    form: string;
    strength: string;
  };
}

const DoctorPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialog, setAddDialog] = useState<{
    open: boolean;
    selectedPatient: Patient | null;
    selectedMedication: Medication | null;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    quantity: number;
    refills: number;
    notes: string;
  }>({
    open: false,
    selectedPatient: null,
    selectedMedication: null,
    dosage: '',
    frequency: 'Once daily',
    duration: '',
    instructions: '',
    quantity: 1,
    refills: 0,
    notes: ''
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [medicationDetailsDialog, setMedicationDetailsDialog] = useState<{
    open: boolean;
    medication: Medication | null;
  }>({ open: false, medication: null });

  const user = authService.getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load prescriptions, medications, and patients in parallel
      const [prescriptionsResponse, medicationsResponse, patientsResponse] = await Promise.all([
        medicationsService.getAllPrescriptions(),
        medicationsService.getAllMedications(),
        patientsService.getAllPatients()
      ]);

      if (prescriptionsResponse.success && prescriptionsResponse.data) {
        const prescriptionsArray = Array.isArray(prescriptionsResponse.data) 
          ? prescriptionsResponse.data 
          : [prescriptionsResponse.data];
        setPrescriptions(prescriptionsArray.map((prescription: any) => ({
          ...prescription,
          startDate: new Date(prescription.startDate),
          endDate: prescription.endDate ? new Date(prescription.endDate) : undefined,
          createdAt: new Date(prescription.createdAt),
        })));
      }

      if (medicationsResponse.success && medicationsResponse.data) {
        const medicationsArray = Array.isArray(medicationsResponse.data) 
          ? medicationsResponse.data 
          : [medicationsResponse.data];
        setMedications(medicationsArray);
      }

      if (patientsResponse.success && patientsResponse.data) {
        const patientsArray = Array.isArray(patientsResponse.data) 
          ? patientsResponse.data 
          : [patientsResponse.data];
        setPatients(patientsArray);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showSnackbar('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddPrescription = async () => {
    if (!addDialog.selectedPatient || !addDialog.selectedMedication) {
      showSnackbar('Please select both patient and medication', 'error');
      return;
    }

    if (!addDialog.dosage || !addDialog.frequency || !addDialog.duration) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    try {
      const prescriptionData = {
        patientId: addDialog.selectedPatient.id,
        medicationId: addDialog.selectedMedication.id,
        dosage: addDialog.dosage,
        frequency: addDialog.frequency,
        duration: addDialog.duration,
        instructions: addDialog.instructions,
        quantity: addDialog.quantity,
        refills: addDialog.refills,
        notes: addDialog.notes,
        startDate: new Date()
      };

      const response = await medicationsService.createPrescription(prescriptionData);
      
      if (response.success) {
        showSnackbar('Prescription created successfully', 'success');
        setAddDialog({
          open: false,
          selectedPatient: null,
          selectedMedication: null,
          dosage: '',
          frequency: 'Once daily',
          duration: '',
          instructions: '',
          quantity: 1,
          refills: 0,
          notes: ''
        });
        loadData(); // Reload prescriptions
      } else {
        showSnackbar(response.message || 'Failed to create prescription', 'error');
      }
    } catch (error) {
      console.error('Create prescription error:', error);
      showSnackbar('Failed to create prescription', 'error');
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'discontinued': return 'error';
      case 'on_hold': return 'warning';
      default: return 'info';
    }
  };

  const filteredPrescriptions = prescriptions.filter(prescription =>
    searchTerm === '' || 
    prescription.medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.medication.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const frequencyOptions = [
    'Once daily',
    'Twice daily', 
    'Three times daily',
    'Four times daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime'
  ];

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
        {/* Environment Checker (Development Only) */}
        <EnvChecker />
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Prescriptions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage patient prescriptions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(prev => ({ ...prev, open: true }))}
            sx={{ minWidth: 200 }}
          >
            Add Prescription
          </Button>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PillIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Prescriptions
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {prescriptions.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <ClockIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Active
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {prescriptions.filter(p => p.status === 'active').length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <UserIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Patients
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {new Set(prescriptions.map(p => p.patient.id)).size}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Card>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Search by medication or patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {/* Prescriptions List */}
        <Box>
          {filteredPrescriptions.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <PillIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  No prescriptions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Start by adding a prescription for a patient.'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredPrescriptions.map((prescription) => (
                <Card key={prescription.id} sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                            color={getStatusColor(prescription.status)}
                            size="small"
                          />
                        </Box>

                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {prescription.medication.brandName || prescription.medication.name}
                            </Typography>
                            <Typography variant="body1" color="primary" sx={{ fontWeight: 500, mb: 1 }}>
                              {prescription.medication.form} • {prescription.medication.strength}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Dosage: {prescription.dosage}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  Frequency: {prescription.frequency}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Patient: {prescription.patient.firstName} {prescription.patient.lastName}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                Duration: {prescription.duration}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                Quantity: {prescription.quantity} • Refills: {prescription.refills}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Started: {prescription.startDate.toLocaleDateString()}
                              </Typography>
                            </Box>

                            {prescription.instructions && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                  Instructions:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {prescription.instructions}
                                </Typography>
                              </Box>
                            )}

                            {prescription.notes && (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                  Notes:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {prescription.notes}
                                </Typography>
                              </Box>
                            )}
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Add Prescription Dialog */}
        <Dialog
          open={addDialog.open}
          onClose={() => setAddDialog(prev => ({ ...prev, open: false }))}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add New Prescription</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={patients}
                    getOptionLabel={(patient) => `${patient.firstName} ${patient.lastName} (${patient.email})`}
                    value={addDialog.selectedPatient}
                    onChange={(event, value) => setAddDialog(prev => ({ ...prev, selectedPatient: value }))}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Select Patient" 
                        required 
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            minWidth: '300px', // Increased width
                          }
                        }}
                      />
                    )}
                    sx={{
                      '& .MuiAutocomplete-inputRoot': {
                        minWidth: '300px', // Increased width for autocomplete
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Autocomplete
                      options={medications}
                      getOptionLabel={(medication) => `${medication.name} (${medication.form} ${medication.strength})`}
                      value={addDialog.selectedMedication}
                      onChange={(event, value) => setAddDialog(prev => ({ ...prev, selectedMedication: value }))}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Select Medication" 
                          required 
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              minWidth: '350px', // Increased width
                            }
                          }}
                        />
                      )}
                      sx={{ 
                        flex: 1,
                        '& .MuiAutocomplete-inputRoot': {
                          minWidth: '350px', // Increased width for autocomplete
                        }
                      }}
                    />
                    {addDialog.selectedMedication && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={() => setMedicationDetailsDialog({ open: true, medication: addDialog.selectedMedication })}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        Details
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Dosage"
                    value={addDialog.dosage}
                    onChange={(e) => setAddDialog(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={addDialog.frequency}
                      onChange={(e) => setAddDialog(prev => ({ ...prev, frequency: e.target.value }))}
                      label="Frequency"
                    >
                      {frequencyOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Duration"
                    value={addDialog.duration}
                    onChange={(e) => setAddDialog(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g., 7 days"
                    required
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={addDialog.quantity}
                    onChange={(e) => setAddDialog(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    required
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Refills"
                    type="number"
                    value={addDialog.refills}
                    onChange={(e) => setAddDialog(prev => ({ ...prev, refills: parseInt(e.target.value) || 0 }))}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Instructions"
                multiline
                rows={2}
                value={addDialog.instructions}
                onChange={(e) => setAddDialog(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="e.g., Take with food"
                fullWidth
              />

              <TextField
                label="Notes"
                multiline
                rows={2}
                value={addDialog.notes}
                onChange={(e) => setAddDialog(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button onClick={handleAddPrescription} variant="contained">
              Add Prescription
            </Button>
          </DialogActions>
        </Dialog>

        {/* Medication Details Dialog */}
        <Dialog
          open={medicationDetailsDialog.open}
          onClose={() => setMedicationDetailsDialog({ open: false, medication: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PillIcon color="primary" />
              <Box>
                <Typography variant="h6">
                  {medicationDetailsDialog.medication?.brandName || medicationDetailsDialog.medication?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {medicationDetailsDialog.medication?.genericName} • {medicationDetailsDialog.medication?.form} {medicationDetailsDialog.medication?.strength}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {medicationDetailsDialog.medication && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                {/* Basic Information */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon color="primary" />
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Category:</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {medicationDetailsDialog.medication.category}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Manufacturer:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.manufacturer}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Description:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.description}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Indications */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon color="success" />
                      Indications
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {medicationDetailsDialog.medication.indications.map((indication, index) => (
                        <Chip
                          key={index}
                          label={indication}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Dosage Information */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PillIcon color="primary" />
                      Dosage Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Adult Dose:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.dosageInfo.adult}
                        </Typography>
                      </Grid>
                      {medicationDetailsDialog.medication.dosageInfo.pediatric && (
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>Pediatric Dose:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {medicationDetailsDialog.medication.dosageInfo.pediatric}
                          </Typography>
                        </Grid>
                      )}
                      {medicationDetailsDialog.medication.dosageInfo.elderly && (
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>Elderly Dose:</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {medicationDetailsDialog.medication.dosageInfo.elderly}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Side Effects */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" />
                      Side Effects
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {medicationDetailsDialog.medication.sideEffects.map((sideEffect, index) => (
                        <Chip
                          key={index}
                          label={sideEffect}
                          color="warning"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Contraindications */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="error" />
                      Contraindications
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {medicationDetailsDialog.medication.contraindications.map((contraindication, index) => (
                        <Chip
                          key={index}
                          label={contraindication}
                          color="error"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Drug Interactions */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="info" />
                      Drug Interactions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {medicationDetailsDialog.medication.interactions.map((interaction, index) => (
                        <Chip
                          key={index}
                          label={interaction}
                          color="info"
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                {/* Warnings */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="error" />
                      Important Warnings
                    </Typography>
                    <List dense>
                      {medicationDetailsDialog.medication.warnings.map((warning, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <Typography variant="body2">• {warning}</Typography>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMedicationDetailsDialog({ open: false, medication: null })}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
            severity={snackbar.severity} 
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default DoctorPrescriptions;