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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  LocalPharmacy as PillIcon,
  Schedule as ClockIcon,
  Warning as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Event as CalendarIcon,
  Person as UserIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Medication as MedicationIcon
} from '@mui/icons-material';
import prescriptionsService from '../services/prescriptionsService';
import medicationsService from '../services/medicationsService';
import ModernPrescriptionManager from '../components/prescriptions/ModernPrescriptionManager';

interface DetailedMedication {
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

interface PrescriptionItem {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills: number;
  notes?: string;
  medication: {
    id: string;
    name: string;
    genericName: string;
    brandName: string;
    form: string;
    strength: string;
    category?: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Prescription {
  id: string;
  prescriptionNotes?: string;
  status: 'active' | 'completed' | 'discontinued' | 'on_hold';
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  prescriptionItems: PrescriptionItem[];
}

const Medications: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [medicationDetailsDialog, setMedicationDetailsDialog] = useState<{
    open: boolean;
    medication: DetailedMedication | null;
    loading: boolean;
  }>({
    open: false,
    medication: null,
    loading: false
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

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    let filtered = prescriptions;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(prescription => 
        prescription.prescriptionItems.some(item =>
          item.medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.medication.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.medication.brandName.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        prescription.doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, filterStatus, searchTerm]);

  const loadPrescriptions = async () => {
    setLoading(true);
    console.log('Loading prescriptions...');
    try {
      const response = await prescriptionsService.getAllPrescriptions();
      console.log('Prescriptions API response:', response);
      
      if ((response as any).success && (response as any).data) {
        const prescriptionsArray = Array.isArray((response as any).data) ? (response as any).data : [(response as any).data];
        console.log('Loaded prescriptions:', prescriptionsArray);
        setPrescriptions(prescriptionsArray);
        setFilteredPrescriptions(prescriptionsArray);
        
        if (prescriptionsArray.length === 0) {
          console.log('No prescriptions found for current user');
        }
      } else {
        console.error('Failed to load prescriptions:', (response as any).message);
        showSnackbar(`Failed to load prescriptions: ${(response as any).message || 'Please try again'}`, 'error');
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      showSnackbar('Network error while loading prescriptions', 'error');
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

  const handleViewMedicationDetails = async (medicationId: string) => {
    console.log('Fetching medication details for ID:', medicationId);
    setMedicationDetailsDialog({
      open: true,
      medication: null,
      loading: true
    });

    try {
      const response = await medicationsService.getMedicationById(medicationId);
      console.log('Medication details response:', response);
      
      if (response.success && response.data) {
        const medication = Array.isArray(response.data) ? response.data[0] : response.data;
        console.log('Processed medication data:', medication);
        
        // Ensure all required fields are present with defaults
        const detailedMedication: DetailedMedication = {
          id: medication.id || '',
          name: medication.name || '',
          genericName: medication.genericName || '',
          brandName: medication.brandName || medication.genericName || medication.name || '',
          form: medication.form || '',
          strength: medication.strength || '',
          category: medication.category || '',
          description: medication.description || 'No description available',
          indications: medication.indications || [],
          contraindications: medication.contraindications || [],
          sideEffects: medication.sideEffects || [],
          interactions: medication.interactions || [],
          warnings: medication.warnings || [],
          dosageInfo: medication.dosageInfo || { adult: 'Consult healthcare provider' },
          manufacturer: medication.manufacturer || 'Unknown'
        };
        
        setMedicationDetailsDialog({
          open: true,
          medication: detailedMedication,
          loading: false
        });
      } else {
        console.error('Failed to fetch medication details:', response.message);
        showSnackbar(`Failed to load medication details: ${response.message || 'Unknown error'}`, 'error');
        setMedicationDetailsDialog({ open: false, medication: null, loading: false });
      }
    } catch (error) {
      console.error('Error fetching medication details:', error);
      showSnackbar('Network error while loading medication details', 'error');
      setMedicationDetailsDialog({ open: false, medication: null, loading: false });
    }
  };

  const handleCloseMedicationDetails = () => {
    setMedicationDetailsDialog({ open: false, medication: null, loading: false });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'completed':
        return <CheckCircleIcon sx={{ color: 'info.main' }} />;
      case 'discontinued':
        return <AlertTriangleIcon sx={{ color: 'error.main' }} />;
      case 'on_hold':
        return <ClockIcon sx={{ color: 'warning.main' }} />;
      default:
        return <ClockIcon sx={{ color: 'grey.500' }} />;
    }
  };

  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const completedPrescriptions = prescriptions.filter(p => p.status === 'completed');

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
              Medications
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View your current and past prescriptions
            </Typography>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid size={{xs: 12, md: 4}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PillIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Active
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {activePrescriptions.length}
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
                      {completedPrescriptions.length}
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
                      {prescriptions.length}
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
                placeholder="Search medications or doctors..."
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
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="discontinued">Discontinued</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Medications List */}
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 2, width: 64, height: 64 }}>
                <PillIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ mb: 2 }}>
                No Medications Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {prescriptions.length === 0 
                  ? "You don't have any prescriptions yet. Visit a doctor to get your first prescription."
                  : "No medications match your current filters. Try adjusting your search criteria."
                }
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredPrescriptions.map((prescription) => (
              <Grid size={{xs: 12, lg: 6}} key={prescription.id}>
                <Card sx={{ 
                  height: '100%', 
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  }
                }}>
                  <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mt: 0.5 }}>
                        <PillIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          Multi-Medication Prescription
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {prescription.prescriptionItems.length} medications
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(prescription.status)}
                        <Chip 
                          label={prescription.status.replace('_', ' ').toUpperCase()} 
                          size="small"
                          color={
                            prescription.status === 'active' ? 'success' :
                            prescription.status === 'completed' ? 'info' :
                            prescription.status === 'discontinued' ? 'error' : 'warning'
                          }
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Medications List */}
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                      {prescription.prescriptionItems.map((item, index) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                              {item.medication.name}
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<InfoIcon />}
                              onClick={() => handleViewMedicationDetails(item.medication.id)}
                              sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                              Details
                            </Button>
                          </Box>
                          
                          {item.medication.brandName && item.medication.brandName !== item.medication.name && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                              Brand: {item.medication.brandName}
                            </Typography>
                          )}
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
                            {item.medication.form} • {item.medication.strength}
                          </Typography>

                          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              <strong>Dosage:</strong> {item.dosage}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              <strong>Frequency:</strong> {item.frequency}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              <strong>Duration:</strong> {item.duration}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              <strong>Quantity:</strong> {item.quantity}
                            </Typography>
                          </Box>

                          {item.instructions && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                              Instructions: {item.instructions}
                            </Typography>
                          )}

                          {index < prescription.prescriptionItems.length - 1 && (
                            <Divider sx={{ mt: 2 }} />
                          )}
                        </Box>
                      ))}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Prescription Info */}
                    <List dense sx={{ py: 0 }}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <UserIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Prescribed by"
                          secondary={`Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName} (${prescription.doctor.specialization})`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>

                      {prescription.prescriptionNotes && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <InfoIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Prescription Notes"
                            secondary={prescription.prescriptionNotes}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      )}
                    </List>

                    {/* Action Buttons */}
                    {prescription.status === 'active' && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          sx={{ flex: 1 }}
                        >
                          Mark All Taken
                        </Button>
                      </Box>
                    )}

                    {/* Additional Info */}
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Started: {new Date(prescription.startDate).toLocaleDateString()}
                        {prescription.endDate && (
                          <> • Ends: {new Date(prescription.endDate).toLocaleDateString()}</>
                        )}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Modern Prescription Manager */}
        <ModernPrescriptionManager 
          prescriptions={prescriptions}
          onUpdate={loadPrescriptions}
        />

        {/* Medication Details Dialog */}
        <Dialog
          open={medicationDetailsDialog.open}
          onClose={handleCloseMedicationDetails}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { maxHeight: '90vh' }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MedicationIcon color="primary" />
                <Typography variant="h6">
                  Medication Details
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseMedicationDetails}
                sx={{ color: 'grey.500' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            {medicationDetailsDialog.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : medicationDetailsDialog.medication ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Basic Information */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Brand Name:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.brandName}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Generic Name:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.genericName}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Form:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.form}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Strength:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.strength}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Category:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.category}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6}}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Manufacturer:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.manufacturer}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12}}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          Description:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {medicationDetailsDialog.medication.description}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Indications */}
                {medicationDetailsDialog.medication.indications && medicationDetailsDialog.medication.indications.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
                        Indications (What it treats)
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
                )}

                {/* Dosage Information */}
                {medicationDetailsDialog.medication.dosageInfo && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: 'info.main' }}>
                        Dosage Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 4}}>
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            Adult:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {medicationDetailsDialog.medication.dosageInfo.adult}
                          </Typography>
                        </Grid>
                        {medicationDetailsDialog.medication.dosageInfo.pediatric && (
                          <Grid size={{xs: 12, sm: 4}}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              Pediatric:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {medicationDetailsDialog.medication.dosageInfo.pediatric}
                            </Typography>
                          </Grid>
                        )}
                        {medicationDetailsDialog.medication.dosageInfo.elderly && (
                          <Grid size={{xs: 12, sm: 4}}>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              Elderly:
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {medicationDetailsDialog.medication.dosageInfo.elderly}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Side Effects */}
                {medicationDetailsDialog.medication.sideEffects && medicationDetailsDialog.medication.sideEffects.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: 'warning.main' }}>
                        Possible Side Effects
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
                )}

                {/* Contraindications */}
                {medicationDetailsDialog.medication.contraindications && medicationDetailsDialog.medication.contraindications.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                        Contraindications (When NOT to use)
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
                )}

                {/* Drug Interactions */}
                {medicationDetailsDialog.medication.interactions && medicationDetailsDialog.medication.interactions.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                        Drug Interactions
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {medicationDetailsDialog.medication.interactions.map((interaction, index) => (
                          <Chip
                            key={index}
                            label={interaction}
                            color="secondary"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Warnings */}
                {medicationDetailsDialog.medication.warnings && medicationDetailsDialog.medication.warnings.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
                        Important Warnings
                      </Typography>
                      <List dense>
                        {medicationDetailsDialog.medication.warnings.map((warning, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <AlertTriangleIcon sx={{ fontSize: 18, color: 'error.main' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" color="text.secondary">
                                  {warning}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}

                {/* Important Notice */}
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Important:</strong> This information is for educational purposes only. 
                    Always consult with your healthcare provider or pharmacist for medical advice 
                    specific to your condition and before making any changes to your medication regimen.
                  </Typography>
                </Alert>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Unable to load medication details.
              </Typography>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseMedicationDetails} variant="contained">
              Close
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

export default Medications;