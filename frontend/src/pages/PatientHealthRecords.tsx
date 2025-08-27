import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  Breadcrumbs,
  Link,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Upload as UploadIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import patientService from '../services/patientService';
import notificationService from '../services/notificationService';
import DocumentUploadDialog from '../components/health-records/DocumentUploadDialog';
import HealthRecords from './HealthRecords';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  emergencyContact: string;
  allergies: string[];
  chronicConditions: string[];
}

const PatientHealthRecords: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [currentPatientIndex, setCurrentPatientIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Load patient data and all patients for navigation
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'doctor') {
          setError('Access denied. This page is for doctors only.');
          return;
        }

        if (!patientId) {
          setError('Patient ID is required.');
          return;
        }

        // Load all patients for navigation
        const patientsResponse = await patientService.getPatients({});
        let patientsData: any[] = [];
        
        if (patientsResponse.success && patientsResponse.data) {
          patientsData = Array.isArray(patientsResponse.data) 
            ? patientsResponse.data 
            : [];
        }

        // Transform patients data
        const patients: Patient[] = patientsData.map((p: any) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone || '',
          dateOfBirth: new Date(p.dateOfBirth),
          gender: p.gender || 'Not specified',
          address: p.address || '',
          emergencyContact: p.emergencyContact || '',
          allergies: p.allergies || [],
          chronicConditions: p.chronicConditions || [],
        }));

        setAllPatients(patients);

        // Find current patient
        const currentPatient = patients.find(p => p.id === patientId);
        const currentIndex = patients.findIndex(p => p.id === patientId);

        if (currentPatient) {
          setPatient(currentPatient);
          setCurrentPatientIndex(currentIndex);
        } else {
          // If patient from location state is available, use it
          const statePatient = location.state?.patient;
          if (statePatient) {
            setPatient({
              ...statePatient,
              dateOfBirth: new Date(statePatient.dateOfBirth),
            });
          } else {
            setError('Patient not found.');
          }
        }
      } catch (error) {
        console.error('Failed to load patient data:', error);
        setError('Failed to load patient data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId, location.state]);

  const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleUploadSuccess = () => {
    notificationService.showSuccess('Document uploaded successfully!');
    // The HealthRecords component will handle the reload
  };

  const handleNavigatePatient = (direction: 'prev' | 'next') => {
    if (allPatients.length === 0 || currentPatientIndex === -1) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentPatientIndex > 0 ? currentPatientIndex - 1 : allPatients.length - 1;
    } else {
      newIndex = currentPatientIndex < allPatients.length - 1 ? currentPatientIndex + 1 : 0;
    }

    const newPatient = allPatients[newIndex];
    navigate(`/health-records/${newPatient.id}`, {
      state: { patient: newPatient }
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress size={48} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => navigate('/doctor-dashboard')}>
            Back to Dashboard
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!patient) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="warning">
          Patient data not available. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Breadcrumbs and Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              component="button" 
              variant="inherit" 
              onClick={() => navigate('/doctor-dashboard')}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <BackIcon sx={{ mr: 0.5, fontSize: 20 }} />
              Patient Dashboard
            </Link>
            <Typography color="text.primary">
              {patient.firstName} {patient.lastName}
            </Typography>
          </Breadcrumbs>

          {/* Patient Navigation */}
          {allPatients.length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={() => handleNavigatePatient('prev')}
                size="small"
                title="Previous Patient"
              >
                <PrevIcon />
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {currentPatientIndex + 1} of {allPatients.length}
              </Typography>
              <IconButton 
                onClick={() => handleNavigatePatient('next')}
                size="small"
                title="Next Patient"
              >
                <NextIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Patient Header */}
        <Paper elevation={2} sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.contrastText', color: 'primary.main', mr: 3, width: 64, height: 64, fontSize: '1.5rem' }}>
                {patient.firstName[0]}{patient.lastName[0]}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {patient.firstName} {patient.lastName}
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Age: {calculateAge(patient.dateOfBirth)} years
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Gender: {patient.gender}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {patient.email}
                  </Typography>
                  {patient.phone && (
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {patient.phone}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ 
                color: 'primary.contrastText', 
                borderColor: 'primary.contrastText',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Upload Document
            </Button>
          </Box>
        </Paper>

        {/* Patient Summary Cards */}
        <Grid container spacing={2}>
          {patient.allergies.length > 0 && (
            <Grid size={{xs: 12, md: 6}}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" color="error.main" sx={{ mb: 1, fontWeight: 600 }}>
                    ⚠️ Allergies
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {patient.allergies.map((allergy, index) => (
                      <Chip key={index} label={allergy} color="error" size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {patient.chronicConditions.length > 0 && (
            <Grid size={{xs: 12, md: 6}}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" color="warning.main" sx={{ mb: 1, fontWeight: 600 }}>
                    📋 Chronic Conditions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {patient.chronicConditions.map((condition, index) => (
                      <Chip key={index} label={condition} color="warning" size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Health Records Component */}
        <Box sx={{ 
          '& .MuiContainer-root': { p: 0, maxWidth: 'none' },
          '& .MuiPaper-root:first-of-type': { display: 'none' } // Hide the original header
        }}>
          <HealthRecords />
        </Box>

        {/* Upload Dialog */}
        <DocumentUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          patientId={patient.id}
          onUploadSuccess={handleUploadSuccess}
        />
      </Box>
    </Container>
  );
};

export default PatientHealthRecords;