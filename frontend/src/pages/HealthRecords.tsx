import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Container,
  Grid,
  Chip,
  Avatar,
  Tabs,
  Tab,
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
  Badge,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  Description as FileTextIcon,
  Timeline as ActivityIcon,
  Favorite as HeartIcon,
  Visibility as EyeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Add as PlusIcon,
  Search as SearchIcon,
  LocalHospital as MedicalIcon,
  Event as CalendarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Medication as PillIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import patientService from '../services/patientService';
import { authService } from '../services/authService';
import healthRecordsService from '../services/healthRecordsService';
import PrescriptionManager from '../components/prescriptions/PrescriptionManager';
import notificationService from '../services/notificationService';

interface VitalSigns {
  id: string;
  date: Date;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  notes?: string;
}

interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  date: Date;
  orderedBy: string;
  notes?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'lab_result' | 'imaging' | 'prescription' | 'report' | 'other';
  uploadDate: Date;
  size: string;
  url?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  refillsRemaining?: number;
}

interface Prescription {
  id: string;
  date: Date;
  doctorId: string;
  doctorName: string;
  medications: Medication[];
  diagnosis: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface Appointment {
  id: string;
  date: Date;
  time: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  type: 'consultation' | 'follow-up' | 'check-up' | 'procedure';
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  location: string;
}

interface HealthRecord {
  id: string;
  patientId: string;
  vitals: VitalSigns[];
  labResults: LabResult[];
  documents: Document[];
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: {
    name: string;
    relationship: string;
    phone: string;
  }[];
  prescriptions: Prescription[];
  appointments: Appointment[];
}

const HealthRecords: React.FC = () => {
  const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'labs' | 'appointments' | 'prescriptions' | 'documents' | 'profile'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  // Load patient data and related information
  useEffect(() => {
    const loadPatientData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const user = authService.getCurrentUser();
        if (!user) {
          setError('User not authenticated');
          return;
        }

        // Get current patient's profile
        let currentPatientId = null;
        if (user.role === 'patient') {
          // For patients, we need to get their patient profile by email
          const patientsResponse = await patientService.getPatients({ search: user.email });
          if (patientsResponse.success && patientsResponse.data && Array.isArray(patientsResponse.data) && patientsResponse.data.length > 0) {
            currentPatientId = patientsResponse.data[0].id;
          }
        }

        // Load appointments, prescriptions, and health records if we have patient ID
        if (currentPatientId) {
          const [appointmentsResponse, prescriptionsResponse, healthRecordResponse] = await Promise.all([
            patientService.getPatientAppointments(currentPatientId),
            patientService.getPatientPrescriptions(currentPatientId),
            healthRecordsService.getHealthRecord(currentPatientId)
          ]);

          if (appointmentsResponse.success) {
            setPatientAppointments(appointmentsResponse.data || []);
          }

          if (prescriptionsResponse.success) {
            setPatientPrescriptions(prescriptionsResponse.data || []);
          }

          // If health records API returns data, use it instead of mock data
          if (healthRecordResponse.success && healthRecordResponse.data) {
            const realHealthRecord: HealthRecord = {
              id: '1',
              patientId: currentPatientId,
              vitals: healthRecordResponse.data.vitalSigns.map(vs => ({
                id: vs.id,
                date: vs.recordedDate,
                bloodPressure: vs.systolicBP && vs.diastolicBP ? {
                  systolic: vs.systolicBP,
                  diastolic: vs.diastolicBP
                } : undefined,
                heartRate: vs.heartRate,
                temperature: vs.temperature,
                weight: vs.weight,
                height: vs.height,
                oxygenSaturation: vs.oxygenSaturation,
                notes: vs.notes
              })),
              labResults: healthRecordResponse.data.labResults.map(lr => ({
                id: lr.id,
                testName: lr.testName,
                value: lr.value,
                unit: lr.unit,
                referenceRange: lr.referenceRange || 'N/A',
                status: lr.status === 'abnormal' || lr.status === 'pending' ? 'normal' : lr.status,
                date: lr.testDate,
                orderedBy: lr.orderedBy ? `${lr.orderedBy.firstName} ${lr.orderedBy.lastName}` : 'Unknown',
                notes: lr.notes
              })),
              documents: healthRecordResponse.data.documents.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: (doc.type as 'prescription' | 'lab_result' | 'imaging' | 'report' | 'other') || 'other',
                date: doc.documentDate,
                doctor: doc.createdBy ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}` : 'Unknown',
                url: `/api/documents/${doc.id}`,
                uploadDate: doc.documentDate,
                size: '0 KB'
              })),
              prescriptions: patientPrescriptions.length > 0 ? patientPrescriptions.map(p => ({
                id: p.id,
                date: p.prescribedDate || new Date(),
                doctorId: p.doctor?.id || 'unknown',
                doctorName: p.doctor ? `${p.doctor.firstName} ${p.doctor.lastName}` : 'Unknown Doctor',
                medications: [
                  {
                    id: p.medication?.id || p.id,
                    name: p.medication?.name || 'Unknown Medication',
                    dosage: p.dosage || 'As prescribed',
                    frequency: p.frequency || 'As directed',
                    instructions: p.instructions || 'Take as directed by physician',
                    sideEffects: p.medication?.sideEffects || [],
                    category: p.medication?.category || 'Medication',
                    startDate: p.startDate || new Date(),
                    prescribedBy: p.doctor ? `${p.doctor.firstName} ${p.doctor.lastName}` : 'Unknown Doctor'
                  }
                ],
                diagnosis: p.diagnosis || 'Not specified',
                notes: p.notes || '',
                status: p.status || 'active'
              })) : [
                {
                  id: '1',
                  date: new Date('2024-02-10'),
                  doctorId: 'doc-1',
                  doctorName: 'Dr. Sarah Johnson',
                  medications: [
                    {
                      id: '1',
                      name: 'Lisinopril',
                      dosage: '10mg',
                      frequency: 'Once daily',
                      instructions: 'Take with or without food, preferably at the same time each day',
                      sideEffects: ['Dizziness', 'Dry cough', 'Headache'],
                      category: 'ACE Inhibitor',
                      startDate: new Date('2024-02-10'),
                      prescribedBy: 'Dr. Sarah Johnson'
                    }
                  ],
                  diagnosis: 'Hypertension',
                  notes: 'Monitor blood pressure regularly. Return in 3 months for follow-up.',
                  status: 'active'
                }
              ],
              appointments: patientAppointments.length > 0 ? patientAppointments.map(a => ({
                id: a.id,
                date: a.appointmentDate,
                time: new Date(a.appointmentDate).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                }),
                doctorId: a.doctor?.id || 'unknown',
                doctorName: a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}` : 'Unknown Doctor',
                type: a.type?.replace('_', ' ') || 'Consultation',
                status: a.status || 'scheduled',
                reason: a.reason || 'Medical consultation',
                specialty: a.doctor?.specialization || 'General Medicine',
                location: a.location || 'Main Clinic'
              })) : [
                {
                  id: '1',
                  date: new Date('2024-03-15'),
                  time: '10:00 AM',
                  doctorId: 'doc-1',
                  doctorName: 'Dr. Sarah Johnson',
                  type: 'Follow-up',
                  status: 'scheduled',
                  reason: 'Blood pressure check and medication review',
                  specialty: 'Cardiology',
                  location: 'Main Clinic'
                }
              ],
              allergies: [],
              chronicConditions: [],
              emergencyContacts: []
            };

            setHealthRecord(realHealthRecord);
            setLoading(false);
            return;
          }
        }

        // Create health record with real patient data where available
        const mockHealthRecord: HealthRecord = {
          id: '1',
          patientId: currentPatientId || 'current-user',
      vitals: [
        {
          id: '1',
          date: new Date('2024-02-14'),
          bloodPressure: { systolic: 120, diastolic: 80 },
          heartRate: 72,
          temperature: 98.6,
          weight: 165,
          oxygenSaturation: 98,
          notes: 'Routine checkup - all vitals normal'
        },
        {
          id: '2',
          date: new Date('2024-01-15'),
          bloodPressure: { systolic: 118, diastolic: 78 },
          heartRate: 68,
          temperature: 98.4,
          weight: 167,
          oxygenSaturation: 99
        },
        {
          id: '3',
          date: new Date('2023-12-10'),
          bloodPressure: { systolic: 122, diastolic: 82 },
          heartRate: 74,
          temperature: 98.8,
          weight: 169,
          oxygenSaturation: 97,
          height: 70
        }
      ],
      labResults: [
        {
          id: '1',
          testName: 'Total Cholesterol',
          value: '185',
          unit: 'mg/dL',
          referenceRange: '<200',
          status: 'normal',
          date: new Date('2024-02-10'),
          orderedBy: 'Dr. Sarah Johnson',
          notes: 'Good cholesterol levels, continue current diet'
        },
        {
          id: '2',
          testName: 'Blood Glucose',
          value: '95',
          unit: 'mg/dL',
          referenceRange: '70-100',
          status: 'normal',
          date: new Date('2024-02-10'),
          orderedBy: 'Dr. Sarah Johnson'
        },
        {
          id: '3',
          testName: 'Hemoglobin A1C',
          value: '5.2',
          unit: '%',
          referenceRange: '<5.7',
          status: 'normal',
          date: new Date('2024-02-10'),
          orderedBy: 'Dr. Sarah Johnson'
        },
        {
          id: '4',
          testName: 'Vitamin D',
          value: '28',
          unit: 'ng/mL',
          referenceRange: '30-100',
          status: 'low',
          date: new Date('2024-01-20'),
          orderedBy: 'Dr. Michael Chen',
          notes: 'Vitamin D deficiency - prescribed supplement'
        }
      ],
      documents: [
        {
          id: '1',
          name: 'Annual Physical Report 2024',
          type: 'report',
          uploadDate: new Date('2024-02-14'),
          size: '2.1 MB'
        },
        {
          id: '2',
          name: 'Chest X-Ray Results',
          type: 'imaging',
          uploadDate: new Date('2024-01-25'),
          size: '5.3 MB'
        },
        {
          id: '3',
          name: 'Blood Panel Results',
          type: 'lab_result',
          uploadDate: new Date('2024-02-10'),
          size: '0.8 MB'
        },
        {
          id: '4',
          name: 'Prescription - Lisinopril',
          type: 'prescription',
          uploadDate: new Date('2024-01-15'),
          size: '0.3 MB'
        }
      ],
      allergies: ['Penicillin', 'Shellfish', 'Pollen'],
      chronicConditions: ['Hypertension', 'Pre-diabetes'],
      emergencyContacts: [
        {
          name: 'John Doe',
          relationship: 'Spouse',
          phone: '+1-555-0123'
        },
        {
          name: 'Jane Smith',
          relationship: 'Sister',
          phone: '+1-555-0456'
        }
      ],
      prescriptions: [
        {
          id: '1',
          date: new Date('2024-02-10'),
          doctorId: 'dr1',
          doctorName: 'Dr. Sarah Johnson',
          diagnosis: 'Hypertension Management',
          status: 'active',
          notes: 'Monitor blood pressure regularly',
          medications: [
            {
              id: 'med1',
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              instructions: 'Take with food in the morning',
              startDate: new Date('2024-02-10'),
              prescribedBy: 'Dr. Sarah Johnson',
              refillsRemaining: 3
            },
            {
              id: 'med2',
              name: 'Amlodipine',
              dosage: '5mg',
              frequency: 'Once daily',
              instructions: 'Take at bedtime',
              startDate: new Date('2024-02-10'),
              prescribedBy: 'Dr. Sarah Johnson',
              refillsRemaining: 2
            }
          ]
        },
        {
          id: '2',
          date: new Date('2024-01-20'),
          doctorId: 'dr2',
          doctorName: 'Dr. Michael Chen',
          diagnosis: 'Vitamin D Deficiency',
          status: 'completed',
          notes: 'Follow-up in 3 months to recheck levels',
          medications: [
            {
              id: 'med3',
              name: 'Vitamin D3',
              dosage: '2000 IU',
              frequency: 'Once daily',
              instructions: 'Take with largest meal',
              startDate: new Date('2024-01-20'),
              endDate: new Date('2024-04-20'),
              prescribedBy: 'Dr. Michael Chen',
              refillsRemaining: 0
            }
          ]
        }
      ],
      appointments: [
        {
          id: '1',
          date: new Date('2024-03-15'),
          time: '10:30 AM',
          doctorId: 'dr1',
          doctorName: 'Dr. Sarah Johnson',
          specialty: 'Cardiology',
          type: 'follow-up',
          status: 'scheduled',
          reason: 'Blood pressure follow-up',
          location: 'Main Clinic - Room 205',
          notes: 'Bring blood pressure log'
        },
        {
          id: '2',
          date: new Date('2024-02-14'),
          time: '2:00 PM',
          doctorId: 'dr1',
          doctorName: 'Dr. Sarah Johnson',
          specialty: 'Internal Medicine',
          type: 'check-up',
          status: 'completed',
          reason: 'Annual physical examination',
          location: 'Main Clinic - Room 201',
          notes: 'Physical completed, lab work ordered'
        },
        {
          id: '3',
          date: new Date('2024-01-20'),
          time: '11:00 AM',
          doctorId: 'dr2',
          doctorName: 'Dr. Michael Chen',
          specialty: 'Endocrinology',
          type: 'consultation',
          status: 'completed',
          reason: 'Vitamin D deficiency consultation',
          location: 'Specialty Clinic - Room 105'
        }
      ]
    };

        setHealthRecord(mockHealthRecord);
      } catch (error) {
        console.error('Failed to load patient data:', error);
        setError('Failed to load patient data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'high':
        return 'warning';
      case 'low':
        return 'info';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPrescriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue as any);
  };

  const openPrescriptionDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setPrescriptionDialog(true);
  };

  const closePrescriptionDialog = () => {
    setSelectedPrescription(null);
    setPrescriptionDialog(false);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'lab_result':
        return <ActivityIcon sx={{ fontSize: 20, color: '#3B82F6' }} />;
      case 'imaging':
        return <EyeIcon sx={{ fontSize: 20, color: '#8B5CF6' }} />;
      case 'prescription':
        return <FileTextIcon sx={{ fontSize: 20, color: '#10B981' }} />;
      case 'report':
        return <FileTextIcon sx={{ fontSize: 20, color: '#F59E0B' }} />;
      default:
        return <FileTextIcon sx={{ fontSize: 20, color: '#6B7280' }} />;
    }
  };

  if (loading || !healthRecord) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 400, gap: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <CircularProgress size={48} />
          )}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.contrastText', color: 'primary.main', mr: 3, width: 56, height: 56 }}>
                <MedicalIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Health Records
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Comprehensive view of your medical history and health data
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                sx={{ 
                  color: 'primary.contrastText', 
                  borderColor: 'primary.contrastText',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Upload Document
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{ 
                  bgcolor: 'primary.contrastText', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                Export Records
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Tab Navigation */}
        <Paper elevation={2}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<MedicalIcon />} 
              label="Overview" 
              value="overview" 
              sx={{ minHeight: 72, fontWeight: 600 }}
            />
            <Tab 
              icon={<HeartIcon />} 
              label="Vital Signs" 
              value="vitals" 
              sx={{ minHeight: 72, fontWeight: 600 }}
            />
            <Tab 
              icon={<ActivityIcon />} 
              label="Lab Results" 
              value="labs" 
              sx={{ minHeight: 72, fontWeight: 600 }}
            />
            <Tab 
              icon={<CalendarIcon />} 
              label="Appointments" 
              value="appointments" 
              sx={{ minHeight: 72, fontWeight: 600 }}
            />
            <Tab 
              icon={<PillIcon />} 
              label="Prescriptions" 
              value="prescriptions" 
              sx={{ minHeight: 72, fontWeight: 600 }}
            />
            <Tab 
              icon={<FileTextIcon />} 
              label="Documents" 
              value="documents" 
              sx={{ minHeight: 72, fontWeight: 600 }}
            />
            <Tab 
              icon={<PersonIcon />} 
              label="Profile" 
              value="profile" 
              sx={{ minHeight: 72, fontWeight: 600 }}
            />
          </Tabs>
        </Paper>

        {/* Search */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search health records, appointments, prescriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Paper>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <Grid container spacing={3}>
            {/* Health Summary Cards */}
            <Grid size={{xs: 12, md: 3}}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <HeartIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Recent Vitals
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {healthRecord.vitals[0]?.date.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2">
                    BP: {healthRecord.vitals[0]?.bloodPressure ? `${healthRecord.vitals[0].bloodPressure.systolic}/${healthRecord.vitals[0].bloodPressure.diastolic}` : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    HR: {healthRecord.vitals[0]?.heartRate || 'N/A'} bpm
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs: 12, md: 3}}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <CalendarIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Next Appointment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {healthRecord.appointments.find(a => a.status === 'scheduled')?.date.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2">
                    {healthRecord.appointments.find(a => a.status === 'scheduled')?.doctorName}
                  </Typography>
                  <Typography variant="body2">
                    {healthRecord.appointments.find(a => a.status === 'scheduled')?.reason}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs: 12, md: 3}}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <PillIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Active Medications
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {healthRecord.prescriptions.filter(p => p.status === 'active').length} prescriptions
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2">
                    {healthRecord.prescriptions.filter(p => p.status === 'active')
                      .flatMap(p => p.medications).length} medications
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{xs: 12, md: 3}}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                      <WarningIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Allergies
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {healthRecord.allergies.length} known allergies
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {healthRecord.allergies.slice(0, 2).map((allergy, index) => (
                      <Chip key={index} label={allergy} size="small" color="error" />
                    ))}
                    {healthRecord.allergies.length > 2 && (
                      <Chip label={`+${healthRecord.allergies.length - 2}`} size="small" variant="outlined" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activity */}
            <Grid size={{xs: 12, md: 8}}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Recent Activity
                  </Typography>
                  <Stack spacing={2}>
                    {healthRecord.appointments.slice(0, 3).map((appointment) => (
                      <Box key={appointment.id} sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Avatar sx={{ bgcolor: getAppointmentStatusColor(appointment.status) + '.main', mr: 2 }}>
                          <CalendarIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {appointment.reason}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.doctorName} • {appointment.date.toLocaleDateString()} at {appointment.time}
                          </Typography>
                        </Box>
                        <Chip 
                          label={appointment.status} 
                          color={getAppointmentStatusColor(appointment.status) as any} 
                          size="small" 
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Health Alerts */}
            <Grid size={{xs: 12, md: 4}}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Health Alerts
                  </Typography>
                  <Stack spacing={2}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        Next appointment in 5 days
                      </Typography>
                    </Alert>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        Medication refill due soon
                      </Typography>
                    </Alert>
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      <Typography variant="body2">
                        All lab results within normal range
                      </Typography>
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Demo Notification Buttons */}
            <Grid size={{xs: 12}}>
              <Card elevation={2} sx={{ bgcolor: 'primary.50', border: '1px dashed', borderColor: 'primary.main' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                    🔔 Notification System Demo
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Test the medication reminder and follow-up appointment notification system:
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => notificationService.showDemoMedicationReminder()}
                      startIcon={<PillIcon />}
                    >
                      Test Medication Reminder
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => notificationService.showDemoFollowUpReminder()}
                      startIcon={<CalendarIcon />}
                    >
                      Test Follow-up Reminder
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => notificationService.showSuccess('✅ Success notification test!')}
                      color="success"
                    >
                      Test Success
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => notificationService.showError('❌ Error notification test!')}
                      color="error"
                    >
                      Test Error
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 'vitals' && (
          <Grid container spacing={3}>
            {/* Vital Signs Chart */}
            <Grid size={{xs: 12}}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Vital Signs Trends
                  </Typography>
                  <Box sx={{ height: 300, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      Interactive charts would be displayed here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Vital Signs Records */}
            <Grid size={{xs: 12}}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Recent Vital Signs
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Blood Pressure</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Heart Rate</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Temperature</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Weight</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>O2 Sat</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {healthRecord.vitals.map((vital) => (
                          <TableRow key={vital.id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                            <TableCell sx={{ fontWeight: 500 }}>
                              {vital.date.toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {vital.bloodPressure ? `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}` : '-'}
                            </TableCell>
                            <TableCell>
                              {vital.heartRate ? `${vital.heartRate} bpm` : '-'}
                            </TableCell>
                            <TableCell>
                              {vital.temperature ? `${vital.temperature}°F` : '-'}
                            </TableCell>
                            <TableCell>
                              {vital.weight ? `${vital.weight} lbs` : '-'}
                            </TableCell>
                            <TableCell>
                              {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '-'}
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" color="primary">
                                <EyeIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="secondary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 'labs' && (
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Laboratory Results
              </Typography>
              <Stack spacing={3}>
                {healthRecord.labResults.map((result) => (
                  <Card key={result.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {result.testName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ordered by {result.orderedBy} • {result.date.toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip 
                        label={result.status.toUpperCase()} 
                        color={getStatusColor(result.status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Grid container spacing={3} sx={{ mb: 2 }}>
                      <Grid size={{xs: 12, md: 4}}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Result:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {result.value} {result.unit}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12, md: 4}}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Reference Range:
                        </Typography>
                        <Typography variant="body1">
                          {result.referenceRange}
                        </Typography>
                      </Grid>
                      <Grid size={{xs: 12, md: 4}}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Status:
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 600,
                            color: getStatusColor(result.status) === 'success' ? 'success.main' :
                                   getStatusColor(result.status) === 'warning' ? 'warning.main' :
                                   getStatusColor(result.status) === 'info' ? 'info.main' :
                                   getStatusColor(result.status) === 'error' ? 'error.main' : 'text.primary'
                          }}
                        >
                          {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {result.notes && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Notes:</strong> {result.notes}
                        </Typography>
                      </Alert>
                    )}
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {activeTab === 'appointments' && (
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Doctor Appointments
                </Typography>
                <Button variant="contained" startIcon={<PlusIcon />}>
                  Book Appointment
                </Button>
              </Box>
              <Stack spacing={2}>
                {healthRecord.appointments.map((appointment) => (
                  <Card key={appointment.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: getAppointmentStatusColor(appointment.status) + '.main', mr: 2 }}>
                          <CalendarIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {appointment.reason}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.doctorName} • {appointment.specialty}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={appointment.status} 
                        color={getAppointmentStatusColor(appointment.status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {appointment.date.toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {appointment.time}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {appointment.location}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <Chip 
                          label={appointment.type} 
                          size="small" 
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                    
                    {appointment.notes && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Notes:</strong> {appointment.notes}
                        </Typography>
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button size="small" variant="outlined" startIcon={<EyeIcon />}>
                        View Details
                      </Button>
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button size="small" variant="outlined" startIcon={<EditIcon />}>
                            Reschedule
                          </Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />}>
                            Cancel
                          </Button>
                        </>
                      )}
                    </Box>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {activeTab === 'prescriptions' && (
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Prescriptions & Medications
                </Typography>
                <Button variant="contained" startIcon={<PlusIcon />}>
                  Add Medication
                </Button>
              </Box>
              <Stack spacing={3}>
                {healthRecord.prescriptions.map((prescription) => (
                  <Card key={prescription.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: getPrescriptionStatusColor(prescription.status) + '.main', mr: 2 }}>
                          <PillIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {prescription.diagnosis}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Prescribed by {prescription.doctorName} • {prescription.date.toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={prescription.status} 
                        color={getPrescriptionStatusColor(prescription.status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                      Medications ({prescription.medications.length}):
                    </Typography>
                    
                    <Stack spacing={2}>
                      {prescription.medications.map((medication) => (
                        <Paper key={medication.id} variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{xs: 12, sm: 3}}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {medication.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {medication.dosage}
                              </Typography>
                            </Grid>
                            <Grid size={{xs: 12, sm: 3}}>
                              <Typography variant="body2" color="text.secondary">
                                Frequency:
                              </Typography>
                              <Typography variant="body2">
                                {medication.frequency}
                              </Typography>
                            </Grid>
                            <Grid size={{xs: 12, sm: 4}}>
                              <Typography variant="body2" color="text.secondary">
                                Instructions:
                              </Typography>
                              <Typography variant="body2">
                                {medication.instructions}
                              </Typography>
                            </Grid>
                            <Grid size={{xs: 12, sm: 2}}>
                              {medication.refillsRemaining !== undefined && (
                                <Badge badgeContent={medication.refillsRemaining} color="primary">
                                  <Chip label="Refills" size="small" variant="outlined" />
                                </Badge>
                              )}
                            </Grid>
                          </Grid>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Start: {medication.startDate.toLocaleDateString()}
                              {medication.endDate && ` • End: ${medication.endDate.toLocaleDateString()}`}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                    
                    {prescription.notes && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Notes:</strong> {prescription.notes}
                        </Typography>
                      </Alert>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<EyeIcon />}
                        onClick={() => openPrescriptionDialog(prescription)}
                      >
                        View Details
                      </Button>
                      <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>
                        Download
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Stack>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Prescription Manager for reminders and notifications */}
              <PrescriptionManager 
                prescriptions={healthRecord.prescriptions}
                onUpdate={() => {
                  // Reload health record data if needed
                  notificationService.showSuccess('Prescription reminders updated!');
                }}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'documents' && (
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Medical Documents
                </Typography>
                <Button variant="contained" startIcon={<UploadIcon />}>
                  Upload Document
                </Button>
              </Box>
              <Grid container spacing={3}>
                {healthRecord.documents.map((document) => (
                  <Grid size={{xs: 12, sm: 6, md: 4}} key={document.id}>
                    <Card variant="outlined" sx={{ height: '100%', '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.3s' }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          {getDocumentIcon(document.type)}
                          <Box sx={{ flex: 1, ml: 2, minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                              {document.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {document.uploadDate.toLocaleDateString()} • {document.size}
                            </Typography>
                            <Chip 
                              label={document.type.replace('_', ' ').toUpperCase()} 
                              size="small" 
                              sx={{ mt: 1 }}
                              color={
                                document.type === 'lab_result' ? 'primary' :
                                document.type === 'imaging' ? 'secondary' :
                                document.type === 'prescription' ? 'success' :
                                document.type === 'report' ? 'warning' : 'default'
                              }
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                          <Button 
                            variant="contained" 
                            size="small" 
                            sx={{ flex: 1 }}
                            startIcon={<EyeIcon />}
                          >
                            View
                          </Button>
                          <IconButton size="small" color="primary">
                            <DownloadIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {activeTab === 'profile' && (
          <Grid container spacing={3}>
            {/* Allergies */}
            <Grid size={{xs: 12, md: 6}}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Allergies
                    </Typography>
                    <IconButton color="primary" size="small">
                      <PlusIcon />
                    </IconButton>
                  </Box>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {healthRecord.allergies.map((allergy, index) => (
                      <Chip 
                        key={index} 
                        label={allergy} 
                        color="error" 
                        variant="outlined"
                        onDelete={() => {}}
                        deleteIcon={<DeleteIcon />}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Chronic Conditions */}
            <Grid size={{xs: 12, md: 6}}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Chronic Conditions
                    </Typography>
                    <IconButton color="primary" size="small">
                      <PlusIcon />
                    </IconButton>
                  </Box>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {healthRecord.chronicConditions.map((condition, index) => (
                      <Chip 
                        key={index} 
                        label={condition} 
                        color="warning" 
                        variant="outlined"
                        onDelete={() => {}}
                        deleteIcon={<DeleteIcon />}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Emergency Contacts */}
            <Grid size={{xs: 12}}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Emergency Contacts
                    </Typography>
                    <Button variant="outlined" startIcon={<PlusIcon />}>
                      Add Contact
                    </Button>
                  </Box>
                  <Grid container spacing={3}>
                    {healthRecord.emergencyContacts.map((contact, index) => (
                      <Grid size={{xs: 12, sm: 6, md: 4}} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                <PersonIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {contact.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {contact.relationship}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                                {contact.phone}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Prescription Details Dialog */}
        <Dialog open={prescriptionDialog} onClose={closePrescriptionDialog} maxWidth="md" fullWidth>
          {selectedPrescription && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedPrescription.diagnosis}</Typography>
                  <Chip 
                    label={selectedPrescription.status} 
                    color={getPrescriptionStatusColor(selectedPrescription.status) as any}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Prescribed by {selectedPrescription.doctorName} on {selectedPrescription.date.toLocaleDateString()}
                </Typography>
              </DialogTitle>
              <DialogContent dividers>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Medications:
                </Typography>
                <Stack spacing={2}>
                  {selectedPrescription.medications.map((medication) => (
                    <Paper key={medication.id} variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 6}}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {medication.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {medication.dosage} - {medication.frequency}
                          </Typography>
                        </Grid>
                        <Grid size={{xs: 12, sm: 6}}>
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            {medication.instructions}
                          </Typography>
                          {medication.refillsRemaining !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              Refills remaining: {medication.refillsRemaining}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
                {selectedPrescription.notes && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Notes:</strong> {selectedPrescription.notes}
                    </Typography>
                  </Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={closePrescriptionDialog}>Close</Button>
                <Button variant="contained" startIcon={<DownloadIcon />}>
                  Download
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Floating Action Button */}
        <Fab 
          color="primary" 
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => {}}
        >
          <PlusIcon />
        </Fab>
      </Box>
    </Container>
  );
};

export default HealthRecords;