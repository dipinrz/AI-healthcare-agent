import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Avatar,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Alert,
  Stack,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  LocalHospital as MedicalIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Filter as FilterIcon,
  Add as AddIcon,
  Assignment as RecordsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import patientService from '../services/patientService';
import { authService } from '../services/authService';

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
  lastVisit?: Date;
  nextAppointment?: Date;
  documentsCount?: number;
  vitalsCount?: number;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDetailsDialog, setPatientDetailsDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'upcoming'>('all');
  const [error, setError] = useState('');

  // Load patients data
  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setError('');
      
      try {
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'doctor') {
          setError('Access denied. This dashboard is for doctors only.');
          return;
        }

        // Get all patients
        const patientsResponse = await patientService.getPatients({});
        
        if (patientsResponse.success && patientsResponse.data) {
          const patientsData: any[] = Array.isArray(patientsResponse.data) 
            ? patientsResponse.data 
            : [];

          // Transform patient data without making individual health record calls
          const enhancedPatients: Patient[] = patientsData.map((patient: any) => ({
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            phone: patient.phone || '',
            dateOfBirth: new Date(patient.dateOfBirth),
            gender: patient.gender || 'Not specified',
            address: patient.address || '',
            emergencyContact: patient.emergencyContact || '',
            allergies: patient.allergies || [],
            chronicConditions: patient.chronicConditions || [],
            documentsCount: 0, // Will be loaded on-demand
            vitalsCount: 0, // Will be loaded on-demand
          }));

          setPatients(enhancedPatients);
          setFilteredPatients(enhancedPatients);
        } else {
          setError(patientsResponse.message || 'Failed to load patients');
        }
      } catch (error) {
        console.error('Failed to load patients:', error);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Filter patients based on search term and filter
  useEffect(() => {
    let filtered = patients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
    }

    // Apply category filter
    switch (filterBy) {
      case 'recent':
        // Show patients with recent activity (documents or vitals)
        filtered = filtered.filter(patient => 
          (patient.documentsCount || 0) > 0 || (patient.vitalsCount || 0) > 0
        );
        break;
      case 'upcoming':
        // Show patients with upcoming appointments (placeholder logic)
        filtered = filtered.filter(patient => patient.nextAppointment);
        break;
      default:
        // Show all patients
        break;
    }

    setFilteredPatients(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, filterBy, patients]);

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handleViewHealthRecords = (patient: Patient) => {
    navigate(`/health-records/${patient.id}`, {
      state: { patient }
    });
  };

  const handlePatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientDetailsDialog(true);
  };

  const handleClosePatientDetails = () => {
    setSelectedPatient(null);
    setPatientDetailsDialog(false);
  };

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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography>Loading patients...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.contrastText', color: 'primary.main', mr: 3, width: 56, height: 56 }}>
                <MedicalIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Patient Management
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Manage and view your patients' health records
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ 
                  color: 'primary.contrastText', 
                  borderColor: 'primary.contrastText',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Add Patient
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Patients
                    </Typography>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {patients.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <RecordsIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Active Records
                    </Typography>
                    <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {patients.filter(p => (p.documentsCount || 0) > 0).length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <CalendarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Upcoming
                    </Typography>
                    <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                      {patients.filter(p => p.nextAppointment).length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <UploadIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Total Documents
                    </Typography>
                    <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                      {patients.reduce((total, p) => total + (p.documentsCount || 0), 0)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{xs: 12, md: 6}}>
              <TextField
                fullWidth
                placeholder="Search patients by name, email, or phone..."
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
            </Grid>
            <Grid size={{xs: 12, md: 3}}>
              <FormControl fullWidth>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  label="Filter"
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="all">All Patients</MenuItem>
                  <MenuItem value="recent">Recent Activity</MenuItem>
                  <MenuItem value="upcoming">Upcoming Appointments</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{xs: 12, md: 3}}>
              <Typography variant="body2" color="text.secondary">
                Showing {currentPatients.length} of {filteredPatients.length} patients
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Patients Table */}
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Age/Gender</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Health Records</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Conditions</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPatients.map((patient) => (
                  <TableRow key={patient.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {patient.firstName[0]}{patient.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {patient.firstName} {patient.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {patient.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {calculateAge(patient.dateOfBirth)} years
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.gender}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {patient.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2">{patient.phone}</Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">{patient.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={`${patient.documentsCount || 0} docs`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`${patient.vitalsCount || 0} vitals`} 
                          size="small" 
                          color="secondary" 
                          variant="outlined"
                        />
                      </Stack>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {patient.allergies.slice(0, 2).map((allergy, index) => (
                          <Chip key={index} label={allergy} size="small" color="error" variant="outlined" />
                        ))}
                        {patient.allergies.length > 2 && (
                          <Chip label={`+${patient.allergies.length - 2}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handlePatientDetails(patient)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleViewHealthRecords(patient)}
                          title="View Health Records"
                        >
                          <RecordsIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </Paper>

        {/* Patient Details Dialog */}
        <Dialog open={patientDetailsDialog} onClose={handleClosePatientDetails} maxWidth="md" fullWidth>
          {selectedPatient && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Patient Details
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid size={{xs: 12, md: 6}}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Personal Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2"><strong>Age:</strong> {calculateAge(selectedPatient.dateOfBirth)} years</Typography>
                      <Typography variant="body2"><strong>Gender:</strong> {selectedPatient.gender}</Typography>
                      <Typography variant="body2"><strong>Date of Birth:</strong> {selectedPatient.dateOfBirth.toLocaleDateString()}</Typography>
                    </Box>
                    
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Contact Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2"><strong>Email:</strong> {selectedPatient.email}</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedPatient.phone || 'Not provided'}</Typography>
                      <Typography variant="body2"><strong>Address:</strong> {selectedPatient.address || 'Not provided'}</Typography>
                      <Typography variant="body2"><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact || 'Not provided'}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid size={{xs: 12, md: 6}}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Health Records Summary
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2"><strong>Documents:</strong> {selectedPatient.documentsCount || 0}</Typography>
                      <Typography variant="body2"><strong>Vital Signs Records:</strong> {selectedPatient.vitalsCount || 0}</Typography>
                    </Box>
                    
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Medical Conditions
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Allergies:</strong></Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {selectedPatient.allergies.length > 0 ? (
                          selectedPatient.allergies.map((allergy, index) => (
                            <Chip key={index} label={allergy} size="small" color="error" />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">No known allergies</Typography>
                        )}
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Chronic Conditions:</strong></Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedPatient.chronicConditions.length > 0 ? (
                          selectedPatient.chronicConditions.map((condition, index) => (
                            <Chip key={index} label={condition} size="small" color="warning" />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">No chronic conditions</Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClosePatientDetails}>Close</Button>
                <Button 
                  variant="contained" 
                  startIcon={<RecordsIcon />}
                  onClick={() => {
                    handleClosePatientDetails();
                    handleViewHealthRecords(selectedPatient);
                  }}
                >
                  View Health Records
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Floating Action Button */}
        <Fab 
          color="primary" 
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => navigate('/health-records')}
        >
          <RecordsIcon />
        </Fab>
      </Box>
    </Container>
  );
};

export default DoctorDashboard;